-- =====================================================
-- Esquema de Carpetas Anidadas y Análisis de IA Expandido
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- 1. TABLA DE CARPETAS (FOLDERS)
-- =====================================================

CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Color hex para la carpeta
    icon VARCHAR(50) DEFAULT 'folder', -- Nombre del icono de Lucide
    position INTEGER DEFAULT 0, -- Orden de visualización
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT folders_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT folders_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT folders_no_self_parent CHECK (id != parent_id)
);

-- Índices para carpetas
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_parent ON folders(user_id, parent_id);

-- =====================================================
-- 2. TABLA DE ETIQUETAS/TAGS
-- =====================================================

CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6b7280', -- Color hex para la etiqueta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tags_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT tags_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Índices para tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_unique_per_user ON tags(user_id, LOWER(name));

-- =====================================================
-- 3. TABLA DE RELACIÓN NOTAS-TAGS
-- =====================================================

CREATE TABLE IF NOT EXISTS note_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    CONSTRAINT note_tags_unique UNIQUE(content_id, tag_id)
);

-- Índices para note_tags
CREATE INDEX IF NOT EXISTS idx_note_tags_content_id ON note_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- =====================================================
-- 4. ACTUALIZAR TABLA DE CONTENIDOS
-- =====================================================

-- Agregar columnas a la tabla contents existente
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0; -- en minutos

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_contents_folder_id ON contents(folder_id);
CREATE INDEX IF NOT EXISTS idx_contents_is_pinned ON contents(is_pinned);
CREATE INDEX IF NOT EXISTS idx_contents_is_archived ON contents(is_archived);
CREATE INDEX IF NOT EXISTS idx_contents_user_folder ON contents(user_id, folder_id);

-- =====================================================
-- 5. TABLA DE ANÁLISIS DE IA EXPANDIDO
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    summary TEXT,
    mind_map JSONB, -- Estructura jerárquica de conceptos
    related_topics TEXT[], -- Array de temas relacionados
    extracted_tasks JSONB, -- Tareas extraídas del contenido
    key_concepts TEXT[], -- Conceptos clave
    sentiment VARCHAR(20), -- Positivo, Negativo, Neutral
    confidence_score DECIMAL(3,2), -- 0.00 a 1.00
    analysis_type VARCHAR(50) DEFAULT 'full', -- full, summary, mind_map, tasks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ai_analysis_confidence_range CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    CONSTRAINT ai_analysis_sentiment_valid CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed'))
);

-- Índices para ai_analysis
CREATE INDEX IF NOT EXISTS idx_ai_analysis_content_id ON ai_analysis(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);

-- =====================================================
-- 6. TABLA DE TEMPLATES DE NOTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS note_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Template con placeholders
    is_system BOOLEAN DEFAULT FALSE, -- Templates del sistema vs personalizados
    category VARCHAR(50) DEFAULT 'general', -- reunión, idea, aprendizaje, tarea
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT note_templates_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT note_templates_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Índices para note_templates
CREATE INDEX IF NOT EXISTS idx_note_templates_user_id ON note_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_note_templates_category ON note_templates(category);
CREATE INDEX IF NOT EXISTS idx_note_templates_is_system ON note_templates(is_system);

-- =====================================================
-- 7. FUNCIONES Y TRIGGERS
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
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analysis_updated_at BEFORE UPDATE ON ai_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_templates_updated_at BEFORE UPDATE ON note_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular word_count y reading_time
CREATE OR REPLACE FUNCTION calculate_content_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular word_count (aproximado)
    NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
    
    -- Calcular reading_time (palabras por minuto promedio: 200)
    NEW.reading_time = GREATEST(1, CEIL(NEW.word_count::DECIMAL / 200));
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular métricas de contenido
CREATE TRIGGER calculate_content_metrics_trigger BEFORE INSERT OR UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION calculate_content_metrics();

-- =====================================================
-- 8. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para folders
CREATE POLICY "Users can view their own folders" ON folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tags
CREATE POLICY "Users can view their own tags" ON tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para note_tags
CREATE POLICY "Users can view note_tags for their content" ON note_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = note_tags.content_id 
            AND contents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create note_tags for their content" ON note_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = note_tags.content_id 
            AND contents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete note_tags for their content" ON note_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = note_tags.content_id 
            AND contents.user_id = auth.uid()
        )
    );

-- Políticas para ai_analysis
CREATE POLICY "Users can view ai_analysis for their content" ON ai_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = ai_analysis.content_id 
            AND contents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create ai_analysis for their content" ON ai_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = ai_analysis.content_id 
            AND contents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ai_analysis for their content" ON ai_analysis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contents 
            WHERE contents.id = ai_analysis.content_id 
            AND contents.user_id = auth.uid()
        )
    );

-- Políticas para note_templates
CREATE POLICY "Users can view their own templates and system templates" ON note_templates
    FOR SELECT USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY "Users can create their own templates" ON note_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update their own templates" ON note_templates
    FOR UPDATE USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own templates" ON note_templates
    FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- =====================================================
-- 9. DATOS INICIALES (TEMPLATES DEL SISTEMA)
-- =====================================================

-- Insertar templates del sistema
INSERT INTO note_templates (user_id, name, description, content, is_system, category) VALUES
-- Template de Reunión
('00000000-0000-0000-0000-000000000000', 'Reunión', 'Template para notas de reuniones', 
'# Reunión: {{titulo}}

**Fecha:** {{fecha}}
**Participantes:** {{participantes}}

## Agenda
- [ ] Punto 1
- [ ] Punto 2
- [ ] Punto 3

## Notas
{{notas}}

## Acciones
- [ ] {{accion1}} - Asignado a: {{responsable1}}
- [ ] {{accion2}} - Asignado a: {{responsable2}}

## Próximos pasos
{{proximos_pasos}}', true, 'reunion'),

-- Template de Idea Rápida
('00000000-0000-0000-0000-000000000000', 'Idea Rápida', 'Template para capturar ideas rápidamente', 
'# {{titulo}}

**Categoría:** {{categoria}}
**Fecha:** {{fecha}}

## Descripción
{{descripcion}}

## Contexto
{{contexto}}

## Acciones relacionadas
- [ ] {{accion1}}
- [ ] {{accion2}}

## Recursos
- {{recurso1}}
- {{recurso2}}', true, 'idea'),

-- Template de Aprendizaje
('00000000-0000-0000-0000-000000000000', 'Aprendizaje', 'Template para notas de estudio y aprendizaje', 
'# {{tema}}

**Fuente:** {{fuente}}
**Fecha:** {{fecha}}
**Tipo:** {{tipo_aprendizaje}}

## Conceptos Clave
- {{concepto1}}
- {{concepto2}}
- {{concepto3}}

## Resumen
{{resumen}}

## Recursos
- {{recurso1}}
- {{recurso2}}

## Reflexión
{{reflexion}}

## Próximos pasos
- [ ] {{paso1}}
- [ ] {{paso2}}', true, 'aprendizaje'),

-- Template de Tarea/Proyecto
('00000000-0000-0000-0000-000000000000', 'Tarea/Proyecto', 'Template para gestión de tareas y proyectos', 
'# {{titulo}}

**Estado:** {{estado}}
**Prioridad:** {{prioridad}}
**Deadline:** {{deadline}}

## Objetivo
{{objetivo}}

## Pasos
- [ ] {{paso1}}
- [ ] {{paso2}}
- [ ] {{paso3}}

## Notas
{{notas}}

## Recursos necesarios
- {{recurso1}}
- {{recurso2}}

## Dependencias
- {{dependencia1}}
- {{dependencia2}}', true, 'tarea');

-- =====================================================
-- 10. FUNCIONES UTILITARIAS
-- =====================================================

-- Función para obtener el árbol completo de carpetas de un usuario
CREATE OR REPLACE FUNCTION get_folder_tree(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    parent_id UUID,
    color VARCHAR(7),
    icon VARCHAR(50),
    position INTEGER,
    level INTEGER,
    path TEXT,
    note_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE folder_hierarchy AS (
        -- Caso base: carpetas raíz (sin parent_id)
        SELECT 
            f.id,
            f.name,
            f.parent_id,
            f.color,
            f.icon,
            f.position,
            0 as level,
            f.name as path,
            COALESCE(note_counts.count, 0) as note_count
        FROM folders f
        LEFT JOIN (
            SELECT folder_id, COUNT(*) as count
            FROM contents
            WHERE user_id = user_uuid AND folder_id IS NOT NULL
            GROUP BY folder_id
        ) note_counts ON f.id = note_counts.folder_id
        WHERE f.user_id = user_uuid AND f.parent_id IS NULL
        
        UNION ALL
        
        -- Caso recursivo: carpetas hijas
        SELECT 
            f.id,
            f.name,
            f.parent_id,
            f.color,
            f.icon,
            f.position,
            fh.level + 1,
            fh.path || ' > ' || f.name,
            COALESCE(note_counts.count, 0) as note_count
        FROM folders f
        JOIN folder_hierarchy fh ON f.parent_id = fh.id
        LEFT JOIN (
            SELECT folder_id, COUNT(*) as count
            FROM contents
            WHERE user_id = user_uuid AND folder_id IS NOT NULL
            GROUP BY folder_id
        ) note_counts ON f.id = note_counts.folder_id
        WHERE f.user_id = user_uuid
    )
    SELECT * FROM folder_hierarchy
    ORDER BY level, position, name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_contents BIGINT,
    total_folders BIGINT,
    total_tags BIGINT,
    total_ai_analyses BIGINT,
    recent_growth BIGINT,
    total_words BIGINT,
    total_reading_time BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM contents WHERE user_id = user_uuid) as total_contents,
        (SELECT COUNT(*) FROM folders WHERE user_id = user_uuid) as total_folders,
        (SELECT COUNT(*) FROM tags WHERE user_id = user_uuid) as total_tags,
        (SELECT COUNT(*) FROM ai_analysis aa 
         JOIN contents c ON aa.content_id = c.id 
         WHERE c.user_id = user_uuid) as total_ai_analyses,
        (SELECT COUNT(*) FROM contents 
         WHERE user_id = user_uuid 
         AND created_at >= NOW() - INTERVAL '7 days') as recent_growth,
        (SELECT COALESCE(SUM(word_count), 0) FROM contents WHERE user_id = user_uuid) as total_words,
        (SELECT COALESCE(SUM(reading_time), 0) FROM contents WHERE user_id = user_uuid) as total_reading_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
