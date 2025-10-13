"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface TaskList {
	id: string
	name: string
	description?: string
	color: string
	icon: string
	"position": number
	is_default: boolean
	created_at: string
	updated_at: string
}

export interface Task {
	id: string
	title: string
	description?: string
	priority: 'high' | 'medium' | 'low'
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
	due_date?: string
	estimated_time?: string
	dependencies: string[]
	tags: string[]
	content_id?: string
	list_id?: string
	parent_task_id?: string
	"position": number
	notes?: string
	completed_at?: string
	created_at: string
	updated_at: string
}

export interface TaskWithContent extends Task {
	content?: {
		id: string
		title: string
		content_type: string
	}
	subtasks?: Task[]
}

export interface TaskListWithStats extends TaskList {
	total_tasks: number
	completed_tasks: number
	pending_tasks: number
	overdue_tasks: number
}

export async function createTask(data: {
	title: string
	description?: string
	priority?: 'high' | 'medium' | 'low'
	due_date?: string
	estimated_time?: string
	dependencies?: string[]
	tags?: string[]
	content_id?: string
	list_id?: string
	parent_task_id?: string
	notes?: string
}): Promise<{ success: boolean; task?: Task; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener la lista por defecto si no se especifica
		let listId = data.list_id
		if (!listId) {
			// Intentar obtener la lista por defecto
			const { data: defaultList, error: listError } = await supabase
				.from('task_lists')
				.select('id')
				.eq('user_id', user.id)
				.eq('is_default', true)
				.single()
			
			if (defaultList) {
				listId = defaultList.id
			} else if (listError && listError.code === 'PGRST204') {
				// La tabla no existe, crear una lista por defecto
				const { data: newDefaultList, error: createError } = await supabase
					.from('task_lists')
					.insert({
						user_id: user.id,
						name: 'Mis tareas',
						description: 'Lista de tareas por defecto',
						color: '#3b82f6',
						icon: 'list',
						"position": 0,
						is_default: true
					})
					.select('id')
					.single()
				
				if (newDefaultList) {
					listId = newDefaultList.id
				} else {
					console.error('Error creating default list:', createError)
					return { success: false, error: "No se pudo crear lista por defecto" }
				}
			} else {
				// Obtener cualquier lista del usuario
				const { data: anyList } = await supabase
					.from('task_lists')
					.select('id')
					.eq('user_id', user.id)
					.limit(1)
					.single()
				
				if (anyList) {
					listId = anyList.id
				} else {
					return { success: false, error: "No hay listas de tareas disponibles" }
				}
			}
		}

		// Obtener la siguiente posición en la lista
		const { data: lastTask } = await supabase
			.from('tasks')
			.select('"position"')
			.eq('list_id', listId)
			.eq('parent_task_id', data.parent_task_id || null)
			.order('"position"', { ascending: false })
			.limit(1)
			.single()

		const nextPosition = (lastTask?.position || 0) + 1

		const { data: task, error } = await supabase
			.from('tasks')
			.insert({
				user_id: user.id,
				title: data.title,
				description: data.description || '',
				priority: data.priority || 'medium',
				status: 'pending',
				due_date: data.due_date,
				estimated_time: data.estimated_time,
				dependencies: data.dependencies || [],
				tags: data.tags || [],
				content_id: data.content_id,
				list_id: listId,
				parent_task_id: data.parent_task_id,
				"position": nextPosition,
				notes: data.notes
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating task:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true, task }
	} catch (error) {
		console.error('Error creating task:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getTasks(filters?: {
	status?: string
	priority?: string
	project_id?: string
	list_id?: string
	include_subtasks?: boolean
}): Promise<{ success: boolean; tasks?: TaskWithContent[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Validar que list_id sea un UUID válido si se proporciona
		if (filters?.list_id) {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
			if (!uuidRegex.test(filters.list_id)) {
				console.warn('Invalid UUID format for list_id:', filters.list_id)
				return { success: true, tasks: [] }
			}
		}

		let query = supabase
			.from('tasks')
			.select(`
				*,
				contents (
					id,
					title,
					content_type
				)
			`)
			.eq('user_id', user.id)

		// Filtrar por lista si se especifica
		if (filters?.list_id) {
			query = query.eq('list_id', filters.list_id)
		}

		// Si no se incluyen subtareas, solo mostrar tareas principales
		if (!filters?.include_subtasks) {
			query = query.is('parent_task_id', null)
		}

		if (filters?.status) {
			query = query.eq('status', filters.status)
		}

		if (filters?.priority) {
			query = query.eq('priority', filters.priority)
		}

		if (filters?.project_id) {
			query = query.in('id', 
				supabase
					.from('task_projects')
					.select('task_id')
					.eq('project_id', filters.project_id)
			)
		}

		const { data: tasks, error } = await query.order('"position"', { ascending: true })

		if (error) {
			console.error('Error fetching tasks:', error)
			// En caso de error, retornar array vacío en lugar de fallar
			return { success: true, tasks: [] }
		}

		return { success: true, tasks }
	} catch (error) {
		// Silenciar errores de conexión para evitar spam en consola
		if (error instanceof Error && error.message.includes('Failed to fetch')) {
			// Error de conexión - usar datos mock
			return { success: true, tasks: [] }
		}
		console.error('Error fetching tasks:', error)
		return { success: true, tasks: [] }
	}
}

export async function updateTask(
	id: string, 
	data: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'due_date' | 'estimated_time' | 'dependencies' | 'tags'>>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('tasks')
			.update(data)
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating task:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error updating task:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('tasks')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting task:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error deleting task:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function toggleTaskStatus(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener el estado actual
		const { data: task } = await supabase
			.from('tasks')
			.select('status')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (!task) {
			return { success: false, error: "Tarea no encontrada" }
		}

		const newStatus = task.status === 'completed' ? 'pending' : 'completed'

		const { error } = await supabase
			.from('tasks')
			.update({ status: newStatus })
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error toggling task status:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error toggling task status:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getTaskStats(): Promise<{ 
	success: boolean; 
	stats?: {
		total: number
		completed: number
		pending: number
		high_priority: number
		overdue: number
	}; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: stats, error } = await supabase
			.rpc('get_task_stats', { user_id: user.id })

		if (error) {
			console.error('Error fetching task stats:', error)
			return { success: false, error: error.message }
		}

		return { success: true, stats: stats[0] }
	} catch (error) {
		console.error('Error fetching task stats:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function extractTasksFromContent(contentId: string): Promise<{ success: boolean; tasks?: Task[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener el contenido
		const { data: content } = await supabase
			.from('contents')
			.select('*')
			.eq('id', contentId)
			.eq('user_id', user.id)
			.single()

		if (!content) {
			return { success: false, error: "Contenido no encontrado" }
		}

		// Aquí se integraría con la IA para extraer tareas
		// Por ahora, simulamos la extracción
		const mockTasks = [
			{
				title: "Revisar y analizar el contenido",
				description: "Revisar el contenido de la nota para identificar objetivos claros",
				priority: "high" as const,
				estimated_time: "30 min"
			},
			{
				title: "Definir objetivos específicos",
				description: "Establecer objetivos SMART basados en la información",
				priority: "high" as const,
				estimated_time: "45 min"
			},
			{
				title: "Crear cronograma",
				description: "Organizar las tareas en un cronograma realista",
				priority: "medium" as const,
				estimated_time: "30 min"
			}
		]

		const createdTasks: Task[] = []

		for (const taskData of mockTasks) {
			const { data: task, error } = await supabase
				.from('tasks')
				.insert({
					user_id: user.id,
					content_id: contentId,
					title: taskData.title,
					description: taskData.description,
					priority: taskData.priority,
					status: 'pending',
					estimated_time: taskData.estimated_time,
					dependencies: [],
					tags: []
				})
				.select()
				.single()

			if (!error && task) {
				createdTasks.push(task)
			}
		}

		revalidatePath('/tareas')
		return { success: true, tasks: createdTasks }
	} catch (error) {
		console.error('Error extracting tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA LISTAS DE TAREAS
// =====================================================

export async function createTaskList(data: {
	name: string
	description?: string
	color?: string
	icon?: string
}): Promise<{ success: boolean; taskList?: TaskList; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener la siguiente posición
		const { data: lastList } = await supabase
			.from('task_lists')
			.select('"position"')
			.eq('user_id', user.id)
			.order('"position"', { ascending: false })
			.limit(1)
			.single()

		const nextPosition = (lastList?.position || 0) + 1

		const { data: taskList, error } = await supabase
			.from('task_lists')
			.insert({
				user_id: user.id,
				name: data.name,
				description: data.description || '',
				color: data.color || '#3b82f6',
				icon: data.icon || 'list',
				"position": nextPosition,
				is_default: false
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating task list:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true, taskList }
	} catch (error) {
		console.error('Error creating task list:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getTaskLists(): Promise<{ success: boolean; taskLists?: TaskListWithStats[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Intentar obtener las listas de tareas reales
		const { data: taskLists, error } = await supabase
			.from('task_lists')
			.select(`
				*,
				tasks!inner(count)
			`)
			.eq('user_id', user.id)
			.order('"position"', { ascending: true })

		if (error) {
			console.error('Error fetching task lists:', error)
			// Si hay error, verificar si es porque la tabla no existe
			if (error.code === 'PGRST204') {
				console.log('📋 Tabla task_lists no existe, usando modo mock')
			} else {
				console.log('📋 Error de BD, usando modo mock:', error.message)
			}
			return { success: true, taskLists: [] }
		}

		// Si no hay listas, crear la lista por defecto
		if (!taskLists || taskLists.length === 0) {
			console.log('📋 No hay listas de tareas, creando lista por defecto')
			const { data: defaultList, error: createError } = await supabase
				.from('task_lists')
				.insert({
					user_id: user.id,
					name: 'Mis tareas',
					description: 'Lista de tareas por defecto',
					color: '#3b82f6',
					icon: 'list',
					"position": 0,
					is_default: true
				})
				.select()
				.single()

			if (createError) {
				console.error('Error creating default list:', createError)
				return { success: true, taskLists: [] }
			}

			return { success: true, taskLists: [defaultList] }
		}

		// Calcular estadísticas para cada lista
		const taskListsWithStats: TaskListWithStats[] = []
		
		for (const list of taskLists) {
			const { data: stats } = await supabase
				.rpc('get_task_list_stats', { list_uuid: list.id })

			taskListsWithStats.push({
				...list,
				total_tasks: stats?.[0]?.total_tasks || 0,
				completed_tasks: stats?.[0]?.completed_tasks || 0,
				pending_tasks: stats?.[0]?.pending_tasks || 0,
				overdue_tasks: stats?.[0]?.overdue_tasks || 0
			})
		}

		return { success: true, taskLists: taskListsWithStats }
	} catch (error) {
		// Silenciar errores de conexión para evitar spam en consola
		if (error instanceof Error && error.message.includes('Failed to fetch')) {
			// Error de conexión - usar datos mock
			return { success: true, taskLists: [] }
		}
		console.error('Error fetching task lists:', error)
		return { success: true, taskLists: [] }
	}
}

export async function updateTaskList(
	id: string, 
	data: Partial<Pick<TaskList, 'name' | 'description' | 'color' | 'icon' | 'position'>>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('task_lists')
			.update(data)
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating task list:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error updating task list:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteTaskList(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que no sea la lista por defecto
		const { data: taskList } = await supabase
			.from('task_lists')
			.select('is_default')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (taskList?.is_default) {
			return { success: false, error: "No se puede eliminar la lista por defecto" }
		}

		const { error } = await supabase
			.from('task_lists')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting task list:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error deleting task list:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA SUBTAREAS
// =====================================================

export async function getSubtasks(parentTaskId: string): Promise<{ success: boolean; subtasks?: Task[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: subtasks, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('user_id', user.id)
			.eq('parent_task_id', parentTaskId)
			.order('"position"', { ascending: true })

		if (error) {
			console.error('Error fetching subtasks:', error)
			return { success: false, error: error.message }
		}

		return { success: true, subtasks }
	} catch (error) {
		console.error('Error fetching subtasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function addSubtask(
	parentTaskId: string,
	data: {
		title: string
		description?: string
		priority?: 'high' | 'medium' | 'low'
		notes?: string
	}
): Promise<{ success: boolean; subtask?: Task; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener la tarea padre para usar su list_id
		const { data: parentTask } = await supabase
			.from('tasks')
			.select('list_id')
			.eq('id', parentTaskId)
			.eq('user_id', user.id)
			.single()

		if (!parentTask) {
			return { success: false, error: "Tarea padre no encontrada" }
		}

		// Obtener la siguiente posición para la subtarea
		const { data: lastSubtask } = await supabase
			.from('tasks')
			.select('"position"')
			.eq('parent_task_id', parentTaskId)
			.order('"position"', { ascending: false })
			.limit(1)
			.single()

		const nextPosition = (lastSubtask?.["position"] || 0) + 1

		const { data: subtask, error } = await supabase
			.from('tasks')
			.insert({
				user_id: user.id,
				title: data.title,
				description: data.description || '',
				priority: data.priority || 'medium',
				status: 'pending',
				list_id: parentTask.list_id,
				parent_task_id: parentTaskId,
				"position": nextPosition,
				notes: data.notes,
				dependencies: [],
				tags: []
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating subtask:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true, subtask }
	} catch (error) {
		console.error('Error creating subtask:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA DRAG & DROP
// =====================================================

export async function reorderTasks(taskIds: string[]): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Actualizar posiciones de las tareas
		const updates = taskIds.map((taskId, index) => ({
			id: taskId,
			"position": index
		}))

		for (const update of updates) {
			const { error } = await supabase
				.from('tasks')
				.update({ "position": update.position })
				.eq('id', update.id)
				.eq('user_id', user.id)

			if (error) {
				console.error('Error updating task position:', error)
				return { success: false, error: error.message }
			}
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error reordering tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function moveTaskToList(taskId: string, newListId: string, newPosition: number): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que la tarea pertenece al usuario
		const { data: task } = await supabase
			.from('tasks')
			.select('id, list_id')
			.eq('id', taskId)
			.eq('user_id', user.id)
			.single()

		if (!task) {
			return { success: false, error: "Tarea no encontrada" }
		}

		// Verificar que la nueva lista pertenece al usuario
		const { data: list } = await supabase
			.from('task_lists')
			.select('id')
			.eq('id', newListId)
			.eq('user_id', user.id)
			.single()

		if (!list) {
			return { success: false, error: "Lista no encontrada" }
		}

		// Actualizar la tarea
		const { error } = await supabase
			.from('tasks')
			.update({ 
				list_id: newListId,
				"position": newPosition
			})
			.eq('id', taskId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error moving task to list:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		return { success: true }
	} catch (error) {
		console.error('Error moving task to list:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA OBTENER NOTAS
// =====================================================

export async function getNotesForLinking(): Promise<{ success: boolean; notes?: Array<{ id: string; title: string; content: string; created_at: string }>; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: notes, error } = await supabase
			.from('contents')
			.select('id, title, content, created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(50) // Limitar a 50 notas para performance

		if (error) {
			console.error('Error fetching notes:', error)
			return { success: false, error: error.message }
		}

		return { success: true, notes: notes || [] }
	} catch (error) {
		console.error('Error fetching notes:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA INTEGRACIÓN CON PROYECTOS
// =====================================================

export async function linkTaskToProject(taskId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que la tarea pertenece al usuario
		const { data: task } = await supabase
			.from('tasks')
			.select('id')
			.eq('id', taskId)
			.eq('user_id', user.id)
			.single()

		if (!task) {
			return { success: false, error: "Tarea no encontrada" }
		}

		// Crear la vinculación con el proyecto
		const { error } = await supabase
			.from('project_tasks')
			.insert({
				project_id: projectId,
				task_id: taskId
			})

		if (error) {
			console.error('Error linking task to project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error linking task to project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function unlinkTaskFromProject(taskId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Eliminar la vinculación
		const { error } = await supabase
			.from('project_tasks')
			.delete()
			.eq('task_id', taskId)
			.eq('project_id', projectId)

		if (error) {
			console.error('Error unlinking task from project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error unlinking task from project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjectTasks(projectId: string): Promise<{ success: boolean; tasks?: Task[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: tasks, error } = await supabase
			.from('project_tasks')
			.select(`
				task_id,
				tasks!inner(
					id,
					title,
					description,
					status,
					priority,
					due_date,
					created_at,
					updated_at,
					list_id,
					parent_task_id,
					"position",
					notes,
					completed_at
				)
			`)
			.eq('project_id', projectId)
			.order('"position"', { ascending: true })

		if (error) {
			console.error('Error fetching project tasks:', error)
			return { success: false, error: error.message }
		}

		const projectTasks = tasks?.map(item => item.tasks).filter(Boolean) || []
		return { success: true, tasks: projectTasks }
	} catch (error) {
		console.error('Error fetching project tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getTaskProjects(taskId: string): Promise<{ success: boolean; projects?: Array<{ id: string; name: string; status: string }>; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: projects, error } = await supabase
			.from('project_tasks')
			.select(`
				project_id,
				projects!inner(id, name, status)
			`)
			.eq('task_id', taskId)

		if (error) {
			console.error('Error fetching task projects:', error)
			return { success: false, error: error.message }
		}

		const taskProjects = projects?.map(item => ({
			id: item.projects.id,
			name: item.projects.name,
			status: item.projects.status
		})) || []

		return { success: true, projects: taskProjects }
	} catch (error) {
		console.error('Error fetching task projects:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// FUNCIONES PARA VINCULACIÓN CON NOTAS
// =====================================================

export async function linkTaskToNote(taskId: string, noteId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que la tarea pertenece al usuario
		const { data: task } = await supabase
			.from('tasks')
			.select('id')
			.eq('id', taskId)
			.eq('user_id', user.id)
			.single()

		if (!task) {
			return { success: false, error: "Tarea no encontrada" }
		}

		// Verificar que la nota pertenece al usuario
		const { data: note } = await supabase
			.from('contents')
			.select('id')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (!note) {
			return { success: false, error: "Nota no encontrada" }
		}

		// Crear la vinculación
		const { error } = await supabase
			.from('task_contents')
			.insert({
				task_id: taskId,
				content_id: noteId
			})

		if (error) {
			console.error('Error linking task to note:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error linking task to note:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function unlinkTaskFromNote(taskId: string, noteId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('task_contents')
			.delete()
			.eq('task_id', taskId)
			.eq('content_id', noteId)
			.eq('content_type', 'note')

		if (error) {
			console.error('Error unlinking task from note:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/tareas')
		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error unlinking task from note:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getTaskLinkedNotes(taskId: string): Promise<{ success: boolean; notes?: Array<{ id: string; title: string; content: string }>; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: linkedNotes, error } = await supabase
			.from('task_contents')
			.select(`
				content_id,
				contents!inner(id, title, content)
			`)
			.eq('task_id', taskId)

		if (error) {
			console.error('Error fetching linked notes:', error)
			return { success: false, error: error.message }
		}

		const notes = linkedNotes?.map(item => ({
			id: item.contents.id,
			title: item.contents.title,
			content: item.contents.content
		})) || []

		return { success: true, notes }
	} catch (error) {
		console.error('Error fetching linked notes:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getNoteLinkedTasks(noteId: string): Promise<{ success: boolean; tasks?: Array<{ id: string; title: string; status: string; list_id: string }>; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: linkedTasks, error } = await supabase
			.from('task_contents')
			.select(`
				task_id,
				tasks!inner(id, title, status, list_id)
			`)
			.eq('content_id', noteId)

		if (error) {
			console.error('Error fetching linked tasks:', error)
			return { success: false, error: error.message }
		}

		const tasks = linkedTasks?.map(item => ({
			id: item.tasks.id,
			title: item.tasks.title,
			status: item.tasks.status,
			list_id: item.tasks.list_id
		})) || []

		return { success: true, tasks }
	} catch (error) {
		console.error('Error fetching linked tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function createTaskFromNote(noteId: string, taskData: {
	title: string
	description?: string
	list_id?: string
}): Promise<{ success: boolean; task?: Task; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que la nota pertenece al usuario
		const { data: note } = await supabase
			.from('contents')
			.select('id')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (!note) {
			return { success: false, error: "Nota no encontrada" }
		}

		// Crear la tarea
		const taskResult = await createTask({
			title: taskData.title,
			description: taskData.description,
			list_id: taskData.list_id
		})

		if (!taskResult.success || !taskResult.task) {
			return { success: false, error: taskResult.error }
		}

		// Vincular la tarea con la nota
		const linkResult = await linkTaskToNote(taskResult.task.id, noteId)
		if (!linkResult.success) {
			// Si falla la vinculación, eliminar la tarea creada
			await deleteTask(taskResult.task.id)
			return { success: false, error: linkResult.error }
		}

		return { success: true, task: taskResult.task }
	} catch (error) {
		console.error('Error creating task from note:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}