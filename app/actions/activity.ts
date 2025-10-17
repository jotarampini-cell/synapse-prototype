'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRecentActivity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, activities: [] }
  }
  
  try {
    // Obtener últimas notas/contenidos
    const { data: contents, error: contentsError } = await supabase
      .from('contents')
      .select('id, title, type, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)
    
    // Obtener últimas tareas
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, created_at, completed_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Combinar y ordenar por fecha
    const activities = [
      ...(contents || []).map(c => ({
        id: c.id,
        type: c.type || 'note',
        title: c.title,
        timestamp: c.updated_at,
        action: 'actualizado'
      })),
      ...(tasks || []).map(t => ({
        id: t.id,
        type: 'task',
        title: t.title,
        timestamp: t.completed_at || t.created_at,
        action: t.status === 'completed' ? 'completado' : 'creado'
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8) // Mostrar últimas 8 actividades
    
    return { success: true, activities }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, activities: [] }
  }
}



