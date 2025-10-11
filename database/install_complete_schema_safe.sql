-- =====================================================
-- INSTALACIÓN SEGURA DEL ESQUEMA DE SYNAPSE
-- =====================================================
-- Este script instala todas las tablas, funciones, triggers y políticas
-- necesarias para que Synapse funcione completamente.
-- Maneja elementos existentes de forma segura.

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    interests TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de carpetas
CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contenidos/notas
CREATE TABLE IF NOT EXISTS contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'url', 'file', 'voice')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding VECTOR(768),
    file_url TEXT,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL
);

-- Tabla de análisis de IA
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    summary TEXT,
    extracted_tasks JSONB,
    key_concepts JSONB,
    connections JSONB,
    analysis_type VARCHAR(50) DEFAULT 'manual',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

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
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_embedding ON contents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_contents_folder_id ON contents(folder_id);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_content_id ON ai_analyses(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_content_type ON sources(content_type);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_content_id ON tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_content_id ON action_plans(content_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_content_id ON project_notes(content_id);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON project_tasks(task_id);

CREATE INDEX IF NOT EXISTS idx_note_connections_user_id ON note_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_note_connections_source ON note_connections(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_connections_target ON note_connections(target_note_id);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_content_id ON ai_feedback(content_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_content_id ON ai_conversations(content_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS (MANEJO SEGURO)
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar triggers existentes antes de recrearlos
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
DROP TRIGGER IF EXISTS update_ai_analyses_updated_at ON ai_analyses;
DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_action_plans_updated_at ON action_plans;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;

-- Crear triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente antes de recrearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para crear carpetas predeterminadas
CREATE OR REPLACE FUNCTION create_default_folders()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO folders (user_id, name, color) VALUES
    (NEW.id, 'Inbox', '#F59E0B'),
    (NEW.id, 'Ideas', '#8B5CF6'),
    (NEW.id, 'Proyectos', '#3B82F6'),
    (NEW.id, 'Aprendizaje', '#10B981'),
    (NEW.id, 'Tareas', '#F97316'),
    (NEW.id, 'Reuniones', '#06B6D4'),
    (NEW.id, 'Personal', '#EC4899'),
    (NEW.id, 'Archivo', '#6B7280');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente antes de recrearlo
DROP TRIGGER IF EXISTS create_default_folders_trigger ON profiles;

-- Trigger para crear carpetas predeterminadas
CREATE TRIGGER create_default_folders_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_folders();

-- Función para buscar notas relacionadas
CREATE OR REPLACE FUNCTION find_related_notes(note_id UUID, user_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity DECIMAL,
    connection_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.content,
        (1 - (c.embedding <=> (SELECT embedding FROM contents WHERE id = note_id))) as similarity,
        nc.connection_type
    FROM contents c
    LEFT JOIN note_connections nc ON (nc.source_note_id = note_id AND nc.target_note_id = c.id)
    WHERE c.user_id = find_related_notes.user_id
    AND c.id != note_id
    AND c.embedding IS NOT NULL
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
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
-- POLÍTICAS RLS (MANEJO SEGURO)
-- =====================================================

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para contents
DROP POLICY IF EXISTS "Users can view own contents" ON contents;
DROP POLICY IF EXISTS "Users can insert own contents" ON contents;
DROP POLICY IF EXISTS "Users can update own contents" ON contents;
DROP POLICY IF EXISTS "Users can delete own contents" ON contents;

CREATE POLICY "Users can view own contents" ON contents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contents" ON contents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contents" ON contents
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contents" ON contents
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para folders
DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;

CREATE POLICY "Users can view own folders" ON folders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ai_analyses
DROP POLICY IF EXISTS "Users can view own ai_analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can insert own ai_analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can update own ai_analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can delete own ai_analyses" ON ai_analyses;

CREATE POLICY "Users can view own ai_analyses" ON ai_analyses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_analyses" ON ai_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_analyses" ON ai_analyses
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_analyses" ON ai_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sources
DROP POLICY IF EXISTS "Users can view own sources" ON sources;
DROP POLICY IF EXISTS "Users can insert own sources" ON sources;
DROP POLICY IF EXISTS "Users can update own sources" ON sources;
DROP POLICY IF EXISTS "Users can delete own sources" ON sources;

CREATE POLICY "Users can view own sources" ON sources
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sources" ON sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sources" ON sources
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sources" ON sources
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para action_plans
DROP POLICY IF EXISTS "Users can view own action_plans" ON action_plans;
DROP POLICY IF EXISTS "Users can insert own action_plans" ON action_plans;
DROP POLICY IF EXISTS "Users can update own action_plans" ON action_plans;
DROP POLICY IF EXISTS "Users can delete own action_plans" ON action_plans;

CREATE POLICY "Users can view own action_plans" ON action_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action_plans" ON action_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action_plans" ON action_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action_plans" ON action_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para project_notes
DROP POLICY IF EXISTS "Users can view own project_notes" ON project_notes;
DROP POLICY IF EXISTS "Users can insert own project_notes" ON project_notes;
DROP POLICY IF EXISTS "Users can delete own project_notes" ON project_notes;

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
DROP POLICY IF EXISTS "Users can view own project_tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can insert own project_tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete own project_tasks" ON project_tasks;

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
DROP POLICY IF EXISTS "Users can view own note_connections" ON note_connections;
DROP POLICY IF EXISTS "Users can insert own note_connections" ON note_connections;
DROP POLICY IF EXISTS "Users can update own note_connections" ON note_connections;
DROP POLICY IF EXISTS "Users can delete own note_connections" ON note_connections;

CREATE POLICY "Users can view own note_connections" ON note_connections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own note_connections" ON note_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own note_connections" ON note_connections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own note_connections" ON note_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ai_feedback
DROP POLICY IF EXISTS "Users can view own ai_feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Users can insert own ai_feedback" ON ai_feedback;

CREATE POLICY "Users can view own ai_feedback" ON ai_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para ai_conversations
DROP POLICY IF EXISTS "Users can view own ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can insert own ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can update own ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can delete own ai_conversations" ON ai_conversations;

CREATE POLICY "Users can view own ai_conversations" ON ai_conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_conversations" ON ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_conversations" ON ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_conversations" ON ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_onboarding
DROP POLICY IF EXISTS "Users can view own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding;

CREATE POLICY "Users can view own onboarding" ON user_onboarding
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de usuario
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    p.id as user_id,
    COUNT(DISTINCT c.id) as total_notes,
    COUNT(DISTINCT f.id) as total_folders,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT pr.id) as total_projects,
    COUNT(DISTINCT s.id) as total_sources,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks
FROM profiles p
LEFT JOIN contents c ON p.id = c.user_id
LEFT JOIN folders f ON p.id = f.user_id
LEFT JOIN tasks t ON p.id = t.user_id
LEFT JOIN projects pr ON p.id = pr.user_id
LEFT JOIN sources s ON p.id = s.user_id
GROUP BY p.id;

-- Vista para notas con análisis
CREATE OR REPLACE VIEW notes_with_analysis AS
SELECT 
    c.*,
    aa.summary,
    aa.extracted_tasks,
    aa.key_concepts,
    aa.confidence_score,
    f.name as folder_name,
    f.color as folder_color
FROM contents c
LEFT JOIN ai_analyses aa ON c.id = aa.content_id
LEFT JOIN folders f ON c.folder_id = f.id;

-- =====================================================
-- MENSAJE DE COMPLETADO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ESQUEMA DE SYNAPSE INSTALADO EXITOSAMENTE (VERSIÓN SEGURA)';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas las tablas, funciones, triggers y políticas';
    RAISE NOTICE 'han sido creadas/actualizadas correctamente.';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Elementos manejados de forma segura:';
    RAISE NOTICE '- Triggers existentes eliminados y recreados';
    RAISE NOTICE '- Políticas existentes eliminadas y recreadas';
    RAISE NOTICE '- Funciones actualizadas con CREATE OR REPLACE';
    RAISE NOTICE '- Tablas creadas solo si no existen';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Verificar la instalación con verify_complete_setup.sql';
    RAISE NOTICE '2. Configurar las variables de entorno';
    RAISE NOTICE '3. Iniciar la aplicación';
    RAISE NOTICE '=====================================================';
END $$;
