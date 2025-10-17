-- =====================================================
-- Esquema de Sincronización con Google Calendar
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA DE CONFIGURACIÓN DE SINCRONIZACIÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_sync_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_calendar_id VARCHAR(255), -- ID del calendario de Google seleccionado
    auto_sync_enabled BOOLEAN DEFAULT FALSE, -- Sincronización automática de tareas
    sync_completed_tasks BOOLEAN DEFAULT FALSE, -- Incluir tareas completadas
    default_calendar_id VARCHAR(255), -- Calendario por defecto para nuevos eventos
    last_sync_at TIMESTAMP WITH TIME ZONE, -- Última sincronización
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para un solo registro por usuario
    CONSTRAINT calendar_sync_settings_user_unique UNIQUE(user_id)
);

-- Índices para calendar_sync_settings
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_user_id ON calendar_sync_settings(user_id);

-- =====================================================
-- 2. TABLA DE MAPEO TAREAS-EVENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS task_calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    calendar_id VARCHAR(255) NOT NULL, -- ID del calendario de Google
    google_event_id VARCHAR(255) NOT NULL, -- ID del evento en Google Calendar
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT task_calendar_events_unique UNIQUE(task_id, google_event_id)
);

-- Índices para task_calendar_events
CREATE INDEX IF NOT EXISTS idx_task_calendar_events_task_id ON task_calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_calendar_events_google_event_id ON task_calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_task_calendar_events_calendar_id ON task_calendar_events(calendar_id);

-- =====================================================
-- 3. AGREGAR COLUMNA A TABLA TASKS
-- =====================================================

-- Agregar columna opcional para referencia directa al evento de Google
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);

-- Índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);

-- =====================================================
-- 4. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calendar_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_calendar_sync_settings_updated_at 
    BEFORE UPDATE ON calendar_sync_settings
    FOR EACH ROW EXECUTE FUNCTION update_calendar_sync_updated_at();

CREATE TRIGGER update_task_calendar_events_updated_at 
    BEFORE UPDATE ON task_calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_calendar_sync_updated_at();

-- =====================================================
-- 5. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas para calendar_sync_settings
CREATE POLICY "Users can view their own calendar sync settings" ON calendar_sync_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar sync settings" ON calendar_sync_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar sync settings" ON calendar_sync_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar sync settings" ON calendar_sync_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para task_calendar_events
CREATE POLICY "Users can view task_calendar_events for their tasks" ON task_calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_calendar_events.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task_calendar_events for their tasks" ON task_calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_calendar_events.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update task_calendar_events for their tasks" ON task_calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_calendar_events.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task_calendar_events for their tasks" ON task_calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_calendar_events.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. FUNCIONES UTILITARIAS
-- =====================================================

-- Función para obtener configuración de sincronización del usuario
CREATE OR REPLACE FUNCTION get_user_calendar_sync_settings(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    google_calendar_id VARCHAR(255),
    auto_sync_enabled BOOLEAN,
    sync_completed_tasks BOOLEAN,
    default_calendar_id VARCHAR(255),
    last_sync_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        css.id,
        css.google_calendar_id,
        css.auto_sync_enabled,
        css.sync_completed_tasks,
        css.default_calendar_id,
        css.last_sync_at
    FROM calendar_sync_settings css
    WHERE css.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener eventos de Google Calendar vinculados a tareas
CREATE OR REPLACE FUNCTION get_task_google_events(task_uuid UUID)
RETURNS TABLE (
    id UUID,
    google_event_id VARCHAR(255),
    calendar_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tce.id,
        tce.google_event_id,
        tce.calendar_id,
        tce.last_synced_at
    FROM task_calendar_events tce
    WHERE tce.task_id = task_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener tareas que necesitan sincronización
CREATE OR REPLACE FUNCTION get_tasks_needing_sync(user_uuid UUID)
RETURNS TABLE (
    task_id UUID,
    title TEXT,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(10),
    status VARCHAR(20),
    google_event_id VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status,
        t.google_event_id
    FROM tasks t
    WHERE t.user_id = user_uuid
    AND t.due_date IS NOT NULL
    AND t.status != 'cancelled'
    AND (t.google_event_id IS NULL OR t.google_event_id = '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. DATOS INICIALES
-- =====================================================

-- No se insertan datos iniciales, se crearán automáticamente cuando el usuario configure la sincronización

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
