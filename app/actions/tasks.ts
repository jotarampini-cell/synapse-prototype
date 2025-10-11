"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
	created_at: string
	updated_at: string
}

export interface TaskWithContent extends Task {
	content?: {
		id: string
		title: string
		content_type: string
	}
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
}): Promise<{ success: boolean; task?: Task; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

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
				content_id: data.content_id
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating task:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/acciones')
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
}): Promise<{ success: boolean; tasks?: TaskWithContent[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
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

		if (filters?.status) {
			query = query.eq('status', filters.status)
		}

		if (filters?.priority) {
			query = query.eq('priority', filters.priority)
		}

		if (filters?.project_id) {
			query = query.in('id', 
				supabase
					.from('project_tasks')
					.select('task_id')
					.eq('project_id', filters.project_id)
			)
		}

		const { data: tasks, error } = await query.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching tasks:', error)
			return { success: false, error: error.message }
		}

		return { success: true, tasks }
	} catch (error) {
		console.error('Error fetching tasks:', error)
		return { success: false, error: "Error interno del servidor" }
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

		revalidatePath('/acciones')
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

		revalidatePath('/acciones')
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

		revalidatePath('/acciones')
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

		revalidatePath('/acciones')
		return { success: true, tasks: createdTasks }
	} catch (error) {
		console.error('Error extracting tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}