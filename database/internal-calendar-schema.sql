-- =====================================================
-- Esquema de Calendario Interno
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA DE EVENTOS DEL CALENDARIO INTERNO
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#3b82f6',
    reminder_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT calendar_events_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT calendar_events_end_after_start CHECK (end_time > start_time)
);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date_range ON calendar_events(user_id, start_time, end_time);

-- =====================================================
-- 2. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();

-- =====================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas para calendar_events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. FUNCIONES UTILITARIAS
-- =====================================================

-- Función para obtener eventos del usuario en un rango de fechas
CREATE OR REPLACE FUNCTION get_user_calendar_events(
    user_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN,
    color VARCHAR(7),
    reminder_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.location,
        ce.start_time,
        ce.end_time,
        ce.all_day,
        ce.color,
        ce.reminder_minutes
    FROM calendar_events ce
    WHERE ce.user_id = user_uuid
    AND ce.start_time >= start_date
    AND ce.start_time <= end_date
    ORDER BY ce.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener tareas con fecha de vencimiento en un rango
CREATE OR REPLACE FUNCTION get_user_tasks_with_due_date(
    user_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(10),
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status
    FROM tasks t
    WHERE t.user_id = user_uuid
    AND t.due_date IS NOT NULL
    AND t.due_date >= start_date
    AND t.due_date <= end_date
    AND t.status != 'completed'
    ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
