-- =====================================================
-- SCRIPT DE VERIFICACIÓN COMPLETA DE SYNAPSE
-- =====================================================

-- Verificar que todas las extensiones estén habilitadas
SELECT 
    'Extensiones' as categoria,
    extname as nombre,
    'Habilitada' as estado
FROM pg_extension 
WHERE extname IN ('vector', 'uuid-ossp')
UNION ALL
SELECT 
    'Extensiones' as categoria,
    'vector' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
         THEN 'Habilitada' 
         ELSE 'FALTANTE' 
    END as estado
UNION ALL
SELECT 
    'Extensiones' as categoria,
    'uuid-ossp' as nombre,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') 
         THEN 'Habilitada' 
         ELSE 'FALTANTE' 
    END as estado;

-- Verificar que todas las tablas existan
SELECT 
    'Tablas' as categoria,
    table_name as nombre,
    'Existe' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles',
    'contents', 
    'folders',
    'ai_analyses',
    'sources',
    'tasks',
    'action_plans',
    'projects',
    'project_notes',
    'project_tasks',
    'note_connections',
    'ai_feedback',
    'ai_conversations',
    'user_onboarding'
)
ORDER BY table_name;

-- Verificar que todas las tablas tengan RLS habilitado
SELECT 
    'RLS' as categoria,
    schemaname||'.'||tablename as nombre,
    CASE WHEN rowsecurity THEN 'Habilitado' ELSE 'DESHABILITADO' END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles',
    'contents', 
    'folders',
    'ai_analyses',
    'sources',
    'tasks',
    'action_plans',
    'projects',
    'project_notes',
    'project_tasks',
    'note_connections',
    'ai_feedback',
    'ai_conversations',
    'user_onboarding'
)
ORDER BY tablename;

-- Verificar que existan las políticas RLS
SELECT 
    'Políticas RLS' as categoria,
    schemaname||'.'||tablename||'.'||policyname as nombre,
    'Existe' as estado
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar que existan los índices importantes
SELECT 
    'Índices' as categoria,
    schemaname||'.'||tablename||'.'||indexname as nombre,
    'Existe' as estado
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar que existan las funciones
SELECT 
    'Funciones' as categoria,
    routine_name as nombre,
    'Existe' as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'handle_new_user',
    'create_default_folders',
    'find_related_notes',
    'get_task_stats'
)
ORDER BY routine_name;

-- Verificar que existan los triggers
SELECT 
    'Triggers' as categoria,
    trigger_name as nombre,
    event_object_table as tabla,
    'Existe' as estado
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar que existan las vistas
SELECT 
    'Vistas' as categoria,
    table_name as nombre,
    'Existe' as estado
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('user_stats', 'notes_with_analysis')
ORDER BY table_name;

-- Verificar estructura de tabla contents (la más importante)
SELECT 
    'Estructura Contents' as categoria,
    column_name as nombre,
    data_type as tipo,
    is_nullable as nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contents'
ORDER BY ordinal_position;

-- Verificar que la columna embedding tenga el tipo correcto
SELECT 
    'Embedding' as categoria,
    column_name as nombre,
    data_type as tipo,
    CASE 
        WHEN data_type = 'USER-DEFINED' AND udt_name = 'vector' 
        THEN 'Correcto' 
        ELSE 'INCORRECTO' 
    END as estado
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contents' 
AND column_name = 'embedding';

-- Contar registros en cada tabla (para verificar que no estén vacías si hay datos)
SELECT 
    'Conteo' as categoria,
    'contents' as nombre,
    COUNT(*)::text as estado
FROM contents
UNION ALL
SELECT 
    'Conteo' as categoria,
    'profiles' as nombre,
    COUNT(*)::text as estado
FROM profiles
UNION ALL
SELECT 
    'Conteo' as categoria,
    'folders' as nombre,
    COUNT(*)::text as estado
FROM folders
UNION ALL
SELECT 
    'Conteo' as categoria,
    'ai_analyses' as nombre,
    COUNT(*)::text as estado
FROM ai_analyses
UNION ALL
SELECT 
    'Conteo' as categoria,
    'sources' as nombre,
    COUNT(*)::text as estado
FROM sources
UNION ALL
SELECT 
    'Conteo' as categoria,
    'tasks' as nombre,
    COUNT(*)::text as estado
FROM tasks
UNION ALL
SELECT 
    'Conteo' as categoria,
    'action_plans' as nombre,
    COUNT(*)::text as estado
FROM action_plans
UNION ALL
SELECT 
    'Conteo' as categoria,
    'projects' as nombre,
    COUNT(*)::text as estado
FROM projects;

-- Verificar permisos de usuario autenticado
SELECT 
    'Permisos' as categoria,
    'auth.uid()' as nombre,
    CASE WHEN auth.uid() IS NOT NULL THEN 'Funcionando' ELSE 'No autenticado' END as estado;

-- Resumen final
SELECT 
    'RESUMEN' as categoria,
    'Verificación completa' as nombre,
    'Completada' as estado;
