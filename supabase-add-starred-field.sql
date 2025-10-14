-- Migración para añadir campo is_starred a la tabla tasks
-- Ejecutar en Supabase SQL Editor

-- Añadir campo is_starred a tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Índice para búsqueda rápida de destacadas
CREATE INDEX IF NOT EXISTS idx_tasks_starred ON tasks(user_id, is_starred) WHERE is_starred = true;

-- Comentario para documentar el cambio
COMMENT ON COLUMN tasks.is_starred IS 'Indica si la tarea está marcada como destacada por el usuario';


