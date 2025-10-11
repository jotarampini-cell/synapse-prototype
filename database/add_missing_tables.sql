-- =====================================================
-- AGREGAR TABLAS FALTANTES PARA SYNAPSE
-- =====================================================
-- Este script solo agrega las tablas que faltan sin tocar
-- los elementos existentes (triggers, políticas, etc.)

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS FALTANTES
-- =====================================================

-- Tabla de fuentes de información
CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    file_path TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('url', 'file', 'voice')),
    extracted_content TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tareas extraídas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_time TEXT,
    dependencies UUID[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de planes de acción
CREATE TABLE IF NOT EXISTS action_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB,
    estimated_total_time TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'paused')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    status TEXT CHECK (status IN ('active', 'completed', 'paused', 'archived')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación notas-proyectos
CREATE TABLE IF NOT EXISTS project_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, content_id)
);

-- Tabla de relación tareas-proyectos
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, task_id)
);

-- Tabla de conexiones entre notas
CREATE TABLE IF NOT EXISTS note_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    source_note_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    target_note_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    connection_type TEXT CHECK (connection_type IN ('similar', 'related', 'dependency', 'reference')) DEFAULT 'related',
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_note_id, target_note_id)
);

-- Tabla de feedback de IA
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    feedback_type TEXT CHECK (feedback_type IN ('suggestion', 'analysis', 'connection', 'tag', 'folder')) NOT NULL,
    feedback_data JSONB,
    is_positive BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conversaciones con IA
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    messages JSONB,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de onboarding completado
CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    completed_steps JSONB DEFAULT '[]',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA LAS NUEVAS TABLAS
-- =====================================================

-- Índices para sources
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_content_type ON sources(content_type);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_content_id ON tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Índices para action_plans
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_content_id ON action_plans(content_id);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Índices para project_notes
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_content_id ON project_notes(content_id);

-- Índices para project_tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON project_tasks(task_id);

-- Índices para note_connections
CREATE INDEX IF NOT EXISTS idx_note_connections_user_id ON note_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_note_connections_source ON note_connections(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_connections_target ON note_connections(target_note_id);

-- Índices para ai_feedback
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_content_id ON ai_feedback(content_id);

-- Índices para ai_conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_content_id ON ai_conversations(content_id);

-- =====================================================
-- ROW LEVEL SECURITY PARA NUEVAS TABLAS
-- =====================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA NUEVAS TABLAS
-- =====================================================

-- Políticas para sources
CREATE POLICY "Users can view own sources" ON sources
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sources" ON sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sources" ON sources
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sources" ON sources
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para action_plans
CREATE POLICY "Users can view own action_plans" ON action_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action_plans" ON action_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action_plans" ON action_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action_plans" ON action_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para project_notes
CREATE POLICY "Users can view own project_notes" ON project_notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid())
    );
CREATE POLICY "Users can insert own project_notes" ON project_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid())
    );
CREATE POLICY "Users can delete own project_notes" ON project_notes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid())
    );

-- Políticas para project_tasks
CREATE POLICY "Users can view own project_tasks" ON project_tasks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
    );
CREATE POLICY "Users can insert own project_tasks" ON project_tasks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
    );
CREATE POLICY "Users can delete own project_tasks" ON project_tasks
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
    );

-- Políticas para note_connections
CREATE POLICY "Users can view own note_connections" ON note_connections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own note_connections" ON note_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own note_connections" ON note_connections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own note_connections" ON note_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ai_feedback
CREATE POLICY "Users can view own ai_feedback" ON ai_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para ai_conversations
CREATE POLICY "Users can view own ai_conversations" ON ai_conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_conversations" ON ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_conversations" ON ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_conversations" ON ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_onboarding
CREATE POLICY "Users can view own onboarding" ON user_onboarding
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES ADICIONALES
-- =====================================================

-- Función para obtener estadísticas de tareas
CREATE OR REPLACE FUNCTION get_task_stats(user_id UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    pending_tasks BIGINT,
    high_priority_tasks BIGINT,
    overdue_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks,
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks
    FROM tasks
    WHERE tasks.user_id = get_task_stats.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MENSAJE DE COMPLETADO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TABLAS FALTANTES AGREGADAS EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Se han agregado las siguientes tablas:';
    RAISE NOTICE '- sources (fuentes de información)';
    RAISE NOTICE '- tasks (tareas extraídas)';
    RAISE NOTICE '- action_plans (planes de acción)';
    RAISE NOTICE '- projects (proyectos)';
    RAISE NOTICE '- project_notes (relación notas-proyectos)';
    RAISE NOTICE '- project_tasks (relación tareas-proyectos)';
    RAISE NOTICE '- note_connections (conexiones entre notas)';
    RAISE NOTICE '- ai_feedback (feedback de IA)';
    RAISE NOTICE '- ai_conversations (conversaciones con IA)';
    RAISE NOTICE '- user_onboarding (estado de onboarding)';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas las tablas incluyen:';
    RAISE NOTICE '- Índices optimizados';
    RAISE NOTICE '- Row Level Security habilitado';
    RAISE NOTICE '- Políticas de seguridad configuradas';
    RAISE NOTICE '=====================================================';
END $$;
