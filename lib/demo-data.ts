// Datos de demostración para cuando Supabase no está configurado

export const demoContents = [
  {
    id: 'demo-1',
    title: 'Bienvenido a Synapse',
    content: 'Esta es una nota de demostración. En modo demo, puedes explorar la interfaz y ver cómo funciona Synapse.',
    content_type: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hasSummary: true,
    is_pinned: true,
    tags: ['demo', 'bienvenida']
  },
  {
    id: 'demo-2',
    title: 'Características de IA',
    content: 'Synapse incluye análisis inteligente, resúmenes automáticos, y conexiones entre conceptos.',
    content_type: 'text',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    hasSummary: false,
    is_pinned: false,
    tags: ['ia', 'características']
  },
  {
    id: 'demo-3',
    title: 'Organización de Notas',
    content: 'Organiza tus notas en carpetas, usa etiquetas, y encuentra información rápidamente con búsqueda semántica.',
    content_type: 'text',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    hasSummary: true,
    is_pinned: false,
    tags: ['organización', 'búsqueda']
  }
]

export const demoFolders = [
  {
    id: 'demo-folder-1',
    name: 'Inbox',
    color: '#f59e0b',
    parent_id: null
  },
  {
    id: 'demo-folder-2',
    name: 'Ideas',
    color: '#8b5cf6',
    parent_id: null
  },
  {
    id: 'demo-folder-3',
    name: 'Proyectos',
    color: '#3b82f6',
    parent_id: null
  },
  {
    id: 'demo-folder-4',
    name: 'Aprendizaje',
    color: '#10b981',
    parent_id: null
  }
]

export const demoStats = {
  totalNotes: 3,
  totalFolders: 4,
  recentActivity: 2,
  aiProcessed: 2
}
