-- Habilitar extensión pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de perfiles de usuario (extendida de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    interests TEXT[],
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
    embedding VECTOR(768), -- para búsqueda semántica
    file_url TEXT
);

-- Tabla de resúmenes generados por IA
CREATE TABLE IF NOT EXISTS summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    key_concepts TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conexiones entre conceptos
CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    source_concept TEXT NOT NULL,
    target_concept TEXT NOT NULL,
    strength FLOAT NOT NULL CHECK (strength >= 0 AND strength <= 1),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de nodos del grafo
CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('concept', 'field', 'technique', 'application')),
    color TEXT NOT NULL,
    position JSONB, -- {x, y}
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_embedding ON contents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_summaries_content_id ON summaries(content_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_user_id ON graph_nodes(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para contents
CREATE POLICY "Users can view own contents" ON contents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contents" ON contents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contents" ON contents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contents" ON contents
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para summaries
CREATE POLICY "Users can view summaries of own contents" ON summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = summaries.content_id 
            AND contents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert summaries for own contents" ON summaries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = summaries.content_id 
            AND contents.user_id = auth.uid()
        )
    );

-- Políticas RLS para connections
CREATE POLICY "Users can view own connections" ON connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON connections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para graph_nodes
CREATE POLICY "Users can view own graph nodes" ON graph_nodes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph nodes" ON graph_nodes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph nodes" ON graph_nodes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph nodes" ON graph_nodes
    FOR DELETE USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ESQUEMA DE CALENDARIO INTERNO
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de eventos del calendario interno
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


