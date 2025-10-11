"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Project {
	id: string
	name: string
	description: string
	color: string
	status: 'active' | 'completed' | 'paused' | 'archived'
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
			console.error('Error creating project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true, project }
	} catch (error) {
		console.error('Error creating project:', error)
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
			console.error('Error fetching projects:', error)
			return { success: false, error: error.message }
		}

		const projectsWithStats: ProjectWithStats[] = projects.map(project => ({
			...project,
			notes_count: project.project_notes?.[0]?.count || 0,
			tasks_count: project.project_tasks?.[0]?.count || 0,
			completed_tasks: project.project_tasks?.[0]?.tasks?.filter((t: any) => t.status === 'completed').length || 0
		}))

		return { success: true, projects: projectsWithStats }
	} catch (error) {
		console.error('Error fetching projects:', error)
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
			console.error('Error updating project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error updating project:', error)
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
			console.error('Error deleting project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error deleting project:', error)
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
			console.error('Error adding note to project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error adding note to project:', error)
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
			console.error('Error removing note from project:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/proyectos')
		return { success: true }
	} catch (error) {
		console.error('Error removing note from project:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getProjectNotes(projectId: string): Promise<{ success: boolean; notes?: any[]; error?: string }> {
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
			console.error('Error fetching project notes:', error)
			return { success: false, error: error.message }
		}

		const formattedNotes = notes.map(item => item.contents).filter(Boolean)
		return { success: true, notes: formattedNotes }
	} catch (error) {
		console.error('Error fetching project notes:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}