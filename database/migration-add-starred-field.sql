-- =====================================================
-- MIGRACIÓN: Añadir campo is_starred a tabla tasks
-- =====================================================
-- Fecha: 2024-01-XX
-- Descripción: Añade funcionalidad de tareas destacadas
-- =====================================================

-- 1. Añadir campo is_starred a la tabla tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- 2. Crear índice para búsqueda rápida de tareas destacadas
CREATE INDEX IF NOT EXISTS idx_tasks_starred 
ON tasks(user_id, is_starred) 
WHERE is_starred = true;

-- 3. Añadir comentario para documentar el campo
COMMENT ON COLUMN tasks.is_starred IS 'Indica si la tarea está marcada como destacada por el usuario';

-- 4. Verificar que la migración se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'is_starred';

-- 5. Verificar que el índice se creó correctamente
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'tasks' 
AND indexname = 'idx_tasks_starred';

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- =====================================================
-- 1. Copia este archivo completo
-- 2. Ve a tu proyecto de Supabase
-- 3. Abre el SQL Editor
-- 4. Pega el contenido completo
-- 5. Ejecuta la migración
-- 6. Verifica que no hay errores
-- =====================================================

-- =====================================================
-- ROLLBACK (si necesitas revertir):
-- =====================================================
-- DROP INDEX IF EXISTS idx_tasks_starred;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS is_starred;
-- =====================================================



