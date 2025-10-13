-- =====================================================
-- Esquema de Sistema de Tareas Estilo Google Tasks
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA DE LISTAS DE TAREAS (TASK_LISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Color hex para la lista
    icon VARCHAR(50) DEFAULT 'list', -- Nombre del icono de Lucide
    "position" INTEGER DEFAULT 0, -- Orden de visualización
    is_default BOOLEAN DEFAULT FALSE, -- Lista por defecto del usuario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT task_lists_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT task_lists_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Índices para task_lists
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_user_position ON task_lists(user_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_lists_user_default ON task_lists(user_id) WHERE is_default = true;

-- =====================================================
-- 2. ACTUALIZAR TABLA DE TAREAS (TASKS)
-- =====================================================

-- Agregar nuevas columnas a la tabla tasks existente
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_list_position ON tasks(user_id, list_id, "position");
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- =====================================================
-- 3. TABLA DE RELACIÓN TAREAS-CONTENIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS task_contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT task_contents_unique UNIQUE(task_id, content_id)
);

-- Índices para task_contents
CREATE INDEX IF NOT EXISTS idx_task_contents_task_id ON task_contents(task_id);
CREATE INDEX IF NOT EXISTS idx_task_contents_content_id ON task_contents(content_id);

-- =====================================================
-- 4. TABLA DE RELACIÓN TAREAS-PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS task_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT task_projects_unique UNIQUE(task_id, project_id)
);

-- Índices para task_projects
CREATE INDEX IF NOT EXISTS idx_task_projects_task_id ON task_projects(task_id);
CREATE INDEX IF NOT EXISTS idx_task_projects_project_id ON task_projects(project_id);

-- =====================================================
-- 5. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_task_lists_updated_at BEFORE UPDATE ON task_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar completed_at cuando se marca como completada
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se marca como completada y no tiene completed_at, agregarlo
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Si se desmarca como completada, limpiar completed_at
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar completed_at
CREATE TRIGGER update_task_completion_trigger BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_completion();

-- Función para crear lista por defecto al crear usuario
CREATE OR REPLACE FUNCTION create_default_task_list()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO task_lists (user_id, name, description, is_default)
    VALUES (NEW.id, 'Mis tareas', 'Lista de tareas por defecto', true);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear lista por defecto (se ejecutará cuando se cree un perfil)
CREATE OR REPLACE FUNCTION create_default_task_list_for_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO task_lists (user_id, name, description, is_default)
    VALUES (NEW.id, 'Mis tareas', 'Lista de tareas por defecto', true);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_default_task_list_trigger 
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_task_list_for_profile();

-- =====================================================
-- 6. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;

-- Políticas para task_lists
CREATE POLICY "Users can view their own task lists" ON task_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task lists" ON task_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task lists" ON task_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task lists" ON task_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para task_contents
CREATE POLICY "Users can view task_contents for their tasks" ON task_contents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_contents.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task_contents for their tasks" ON task_contents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_contents.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task_contents for their tasks" ON task_contents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_contents.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Políticas para task_projects
CREATE POLICY "Users can view task_projects for their tasks" ON task_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_projects.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task_projects for their tasks" ON task_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_projects.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task_projects for their tasks" ON task_projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_projects.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- =====================================================
-- 7. FUNCIONES UTILITARIAS
-- =====================================================

-- Función para obtener estadísticas de tareas por lista
CREATE OR REPLACE FUNCTION get_task_list_stats(list_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    pending_tasks BIGINT,
    overdue_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as pending_tasks,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_tasks
    FROM tasks
    WHERE list_id = list_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener tareas con subtareas
CREATE OR REPLACE FUNCTION get_tasks_with_subtasks(list_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    priority VARCHAR(10),
    status VARCHAR(20),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_time TEXT,
    "position" INTEGER,
    parent_task_id UUID,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE task_hierarchy AS (
        -- Tareas principales (sin parent)
        SELECT 
            t.id,
            t.title,
            t.description,
            t.priority,
            t.status,
            t.due_date,
            t.estimated_time,
            t."position",
            t.parent_task_id,
            t.notes,
            t.completed_at,
            t.created_at,
            t.updated_at,
            0 as level
        FROM tasks t
        WHERE t.list_id = list_uuid AND t.parent_task_id IS NULL
        
        UNION ALL
        
        -- Subtareas
        SELECT 
            t.id,
            t.title,
            t.description,
            t.priority,
            t.status,
            t.due_date,
            t.estimated_time,
            t."position",
            t.parent_task_id,
            t.notes,
            t.completed_at,
            t.created_at,
            t.updated_at,
            th.level + 1
        FROM tasks t
        JOIN task_hierarchy th ON t.parent_task_id = th.id
        WHERE t.list_id = list_uuid
    )
    SELECT * FROM task_hierarchy
    ORDER BY level, "position", created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. DATOS INICIALES (LISTAS PREDEFINIDAS)
-- =====================================================

-- Insertar listas predefinidas del sistema (se crearán automáticamente para cada usuario)
-- Estas se crean dinámicamente cuando se crea el perfil del usuario

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
