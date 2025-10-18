"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { log } from "@/lib/logger"

export interface Project {
	id: string
	name: string
	description: string
	color: string
	status: 'active' | 'completed' | 'paused' | 'archived'
	ai_summary?: string
	created_at: string
	updated_at: string
}

export interface ProjectWithStats extends Project {
	notes_count: number
	tasks_count: number
	completed_tasks: number
}

export async function createProject(data: {
	name: string
	description?: string
	color?: string
}): Promise<{ success: boolean; project?: Project; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: project, error } = await supabase
			.from('projects')
			.insert({
				user_id: user.id,
				name: data.name,
				description: data.description || '',
				color: data.color || '#3B82F6',
				status: 'active'
			})
			.select()
			.single()

		if (error) {
			log.error('Error creating project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true, project }
	} catch (error) {
		log.error('Error creating project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjects(): Promise<{ success: boolean; projects?: ProjectWithStats[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: projects, error } = await supabase
			.from('projects')
			.select(`
				*,
				project_notes(count),
				project_tasks(count),
				project_tasks!inner(tasks(status))
			`)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })

		if (error) {
			log.error('Error fetching projects:', error)
			return { success: false, error: error.message }
		}

		const projectsWithStats: ProjectWithStats[] = projects.map(project => ({
			...project,
			notes_count: project.project_notes?.[0]?.count || 0,
			tasks_count: project.project_tasks?.[0]?.count || 0,
			completed_tasks: project.project_tasks?.[0]?.tasks?.filter((t: { status: string }) => t.status === 'completed').length || 0
		}))

		return { success: true, projects: projectsWithStats }
	} catch (error) {
		log.error('Error fetching projects:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function updateProject(
	id: string, 
	data: Partial<Pick<Project, 'name' | 'description' | 'color' | 'status'>>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('projects')
			.update(data)
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			log.error('Error updating project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error updating project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('projects')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			log.error('Error deleting project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error deleting project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function addNoteToProject(
	projectId: string, 
	contentId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que el proyecto pertenece al usuario
		const { data: project } = await supabase
			.from('projects')
			.select('id')
			.eq('id', projectId)
			.eq('user_id', user.id)
			.single()

		if (!project) {
			return { success: false, error: "Proyecto no encontrado" }
		}

		const { error } = await supabase
			.from('project_notes')
			.insert({
				project_id: projectId,
				content_id: contentId
			})

		if (error) {
			log.error('Error adding note to project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error adding note to project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function removeNoteFromProject(
	projectId: string, 
	contentId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('project_notes')
			.delete()
			.eq('project_id', projectId)
			.eq('content_id', contentId)

		if (error) {
			log.error('Error removing note from project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error removing note from project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjectNotes(projectId: string): Promise<{ success: boolean; notes?: Array<{ id: string; title: string; content: string; created_at: string }>; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: notes, error } = await supabase
			.from('project_notes')
			.select(`
				content_id,
				contents (
					id,
					title,
					content,
					content_type,
					tags,
					created_at,
					updated_at
				)
			`)
			.eq('project_id', projectId)
			.order('created_at', { ascending: false })

		if (error) {
			log.error('Error fetching project notes:', error)
			return { success: false, error: error.message }
		}

		const formattedNotes = notes.map(item => item.contents).filter(Boolean)
		return { success: true, notes: formattedNotes }
	} catch (error) {
		log.error('Error fetching project notes:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjectById(projectId: string): Promise<{ success: boolean; project?: ProjectWithStats; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: project, error } = await supabase
			.from('projects')
			.select(`
				*,
				project_notes(count),
				project_tasks(count),
				project_tasks!inner(tasks(status))
			`)
			.eq('id', projectId)
			.eq('user_id', user.id)
			.single()

		if (error) {
			log.error('Error fetching project:', error)
			return { success: false, error: error.message }
		}

		const projectWithStats: ProjectWithStats = {
			...project,
			notes_count: project.project_notes?.[0]?.count || 0,
			tasks_count: project.project_tasks?.[0]?.count || 0,
			completed_tasks: project.project_tasks?.[0]?.tasks?.filter((t: { status: string }) => t.status === 'completed').length || 0
		}

		return { success: true, project: projectWithStats }
	} catch (error) {
		log.error('Error fetching project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function addTaskToProject(
	projectId: string, 
	taskId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar que el proyecto pertenece al usuario
		const { data: project } = await supabase
			.from('projects')
			.select('id')
			.eq('id', projectId)
			.eq('user_id', user.id)
			.single()

		if (!project) {
			return { success: false, error: "Proyecto no encontrado" }
		}

		const { error } = await supabase
			.from('project_tasks')
			.insert({
				project_id: projectId,
				task_id: taskId
			})

		if (error) {
			log.error('Error adding task to project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error adding task to project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function removeTaskFromProject(
	projectId: string, 
	taskId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('project_tasks')
			.delete()
			.eq('project_id', projectId)
			.eq('task_id', taskId)

		if (error) {
			log.error('Error removing task from project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		log.error('Error removing task from project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjectTasks(projectId: string): Promise<{ success: boolean; tasks?: Array<{ id: string; title: string; description: string; status: string; priority: string; due_date?: string; created_at: string }>; error?: string }> {
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
				tasks (
					id,
					title,
					description,
					status,
					priority,
					due_date,
					created_at
				)
			`)
			.eq('project_id', projectId)
			.order('created_at', { ascending: false })

		if (error) {
			log.error('Error fetching project tasks:', error)
			return { success: false, error: error.message }
		}

		const formattedTasks = tasks.map(item => item.tasks).filter(Boolean)
		return { success: true, tasks: formattedTasks }
	} catch (error) {
		log.error('Error fetching project tasks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function generateProjectInsights(projectId: string): Promise<{
	success: boolean
	insights?: string
	error?: string
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener el proyecto
		const { data: project, error: projectError } = await supabase
			.from('projects')
			.select('*')
			.eq('id', projectId)
			.eq('user_id', user.id)
			.single()

		if (projectError || !project) {
			return { success: false, error: "Proyecto no encontrado" }
		}

		// Obtener notas del proyecto
		const { data: notes, error: notesError } = await supabase
			.from('project_notes')
			.select(`
				contents (
					title,
					content
				)
			`)
			.eq('project_id', projectId)

		if (notesError) {
			log.error('Error fetching project notes:', notesError)
		}

		// Obtener tareas del proyecto
		const { data: tasks, error: tasksError } = await supabase
			.from('project_tasks')
			.select(`
				tasks (
					title,
					status,
					priority,
					due_date
				)
			`)
			.eq('project_id', projectId)

		if (tasksError) {
			log.error('Error fetching project tasks:', tasksError)
		}

		// Generar insights usando IA (simulación inteligente para MVP)
		const notesData = notes?.map(item => item.contents).filter(Boolean) || []
		const tasksData = tasks?.map(item => item.tasks).filter(Boolean) || []

		// Análisis básico de datos
		const urgentTasks = tasksData.filter((t: any) => t.priority === 'high' && t.status !== 'completed')
		const completedTasks = tasksData.filter((t: any) => t.status === 'completed')
		const totalTasks = tasksData.length
		const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

		// Extraer temas principales de las notas
		const allContent = notesData.map((n: any) => `${n.title} ${n.content}`).join(' ')
		const commonWords = allContent.toLowerCase()
			.split(/\s+/)
			.filter(word => word.length > 3)
			.reduce((acc: any, word) => {
				acc[word] = (acc[word] || 0) + 1
				return acc
			}, {})

		const mainTopics = Object.entries(commonWords)
			.sort(([,a]: any, [,b]: any) => b - a)
			.slice(0, 3)
			.map(([word]) => word)

		// Generar insight
		let insights = `Este proyecto se centra en ${mainTopics.length > 0 ? mainTopics.join(', ') : 'desarrollo general'}. `
		
		if (urgentTasks.length > 0) {
			insights += `Tienes ${urgentTasks.length} tarea${urgentTasks.length > 1 ? 's' : ''} de alta prioridad pendiente${urgentTasks.length > 1 ? 's' : ''}. `
		}
		
		if (totalTasks > 0) {
			insights += `Progreso: ${completionRate}% completado (${completedTasks.length}/${totalTasks} tareas). `
		}
		
		if (notesData.length > 0) {
			insights += `Las notas incluyen ${notesData.length} documento${notesData.length > 1 ? 's' : ''} con información relevante. `
		}

		// Sugerencia de acción
		if (urgentTasks.length > 0) {
			insights += 'Considera priorizar las tareas urgentes para mantener el momentum del proyecto.'
		} else if (completionRate < 50) {
			insights += 'El proyecto está en fase inicial, enfócate en completar las tareas fundamentales.'
		} else if (completionRate > 80) {
			insights += 'Excelente progreso, estás cerca de completar este proyecto.'
		} else {
			insights += 'Mantén el ritmo actual para alcanzar los objetivos del proyecto.'
		}

		// Actualizar el proyecto con el insight
		const { error: updateError } = await supabase
			.from('projects')
			.update({ ai_summary: insights })
			.eq('id', projectId)
			.eq('user_id', user.id)

		if (updateError) {
			log.error('Error updating project insights:', updateError)
			return { success: false, error: "Error al guardar insights" }
		}

		revalidatePath('/proyectos')
		return { success: true, insights }
	} catch (error) {
		log.error('Error generating project insights:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}