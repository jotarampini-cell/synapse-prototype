"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionStep {
	id: string
	title: string
	description: string
	priority: 'high' | 'medium' | 'low'
	estimated_time: string
	dependencies: string[]
	completed: boolean
}

export interface ActionPlan {
	id: string
	title: string
	description: string
	steps: ActionStep[]
	estimated_total_time: string
	status: 'draft' | 'active' | 'completed' | 'paused'
	content_id?: string
	created_at: string
	updated_at: string
}

export async function createActionPlan(data: {
	title: string
	description?: string
	steps: ActionStep[]
	estimated_total_time?: string
	content_id?: string
}): Promise<{ success: boolean; plan?: ActionPlan; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: plan, error } = await supabase
			.from('action_plans')
			.insert({
				user_id: user.id,
				title: data.title,
				description: data.description || '',
				steps: data.steps,
				estimated_total_time: data.estimated_total_time || '',
				status: 'draft',
				content_id: data.content_id
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating action plan:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/acciones')
		return { success: true, plan }
	} catch (error) {
		console.error('Error creating action plan:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getActionPlans(filters?: {
	status?: string
	content_id?: string
}): Promise<{ success: boolean; plans?: ActionPlan[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		let query = supabase
			.from('action_plans')
			.select('*')
			.eq('user_id', user.id)

		if (filters?.status) {
			query = query.eq('status', filters.status)
		}

		if (filters?.content_id) {
			query = query.eq('content_id', filters.content_id)
		}

		const { data: plans, error } = await query.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching action plans:', error)
			return { success: false, error: error.message }
		}

		return { success: true, plans }
	} catch (error) {
		console.error('Error fetching action plans:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function updateActionPlan(
	id: string, 
	data: Partial<Pick<ActionPlan, 'title' | 'description' | 'steps' | 'estimated_total_time' | 'status'>>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('action_plans')
			.update(data)
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating action plan:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/acciones')
		return { success: true }
	} catch (error) {
		console.error('Error updating action plan:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteActionPlan(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('action_plans')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting action plan:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/acciones')
		return { success: true }
	} catch (error) {
		console.error('Error deleting action plan:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function updateActionStep(
	planId: string,
	stepId: string,
	updates: Partial<ActionStep>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener el plan actual
		const { data: plan } = await supabase
			.from('action_plans')
			.select('steps')
			.eq('id', planId)
			.eq('user_id', user.id)
			.single()

		if (!plan) {
			return { success: false, error: "Plan de acción no encontrado" }
		}

		// Actualizar el paso específico
		const updatedSteps = plan.steps.map((step: ActionStep) => 
			step.id === stepId ? { ...step, ...updates } : step
		)

		// Guardar los pasos actualizados
		const { error } = await supabase
			.from('action_plans')
			.update({ steps: updatedSteps })
			.eq('id', planId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating action step:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/acciones')
		return { success: true }
	} catch (error) {
		console.error('Error updating action step:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function generateActionPlanFromContent(contentId: string): Promise<{ 
	success: boolean; 
	plan?: ActionPlan; 
	error?: string 
}> {
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

		// Generar plan de acción basado en el contenido
		// En implementación real, esto sería una llamada a la IA
		const mockSteps: ActionStep[] = [
			{
				id: "1",
				title: "Análisis inicial",
				description: "Revisar y analizar el contenido de la nota para identificar objetivos claros",
				priority: "high",
				estimated_time: "30 min",
				dependencies: [],
				completed: false
			},
			{
				id: "2",
				title: "Definir objetivos específicos",
				description: "Establecer objetivos SMART basados en la información de la nota",
				priority: "high",
				estimated_time: "45 min",
				dependencies: ["1"],
				completed: false
			},
			{
				id: "3",
				title: "Crear cronograma",
				description: "Organizar las tareas en un cronograma realista con fechas límite",
				priority: "medium",
				estimated_time: "30 min",
				dependencies: ["2"],
				completed: false
			},
			{
				id: "4",
				title: "Asignar recursos",
				description: "Identificar y asignar los recursos necesarios para cada tarea",
				priority: "medium",
				estimated_time: "20 min",
				dependencies: ["3"],
				completed: false
			},
			{
				id: "5",
				title: "Implementar seguimiento",
				description: "Establecer sistema de seguimiento y métricas de progreso",
				priority: "low",
				estimated_time: "15 min",
				dependencies: ["4"],
				completed: false
			}
		]

		const planData = {
			title: `Plan de Acción: ${content.title}`,
			description: `Plan generado automáticamente basado en la nota "${content.title}". Incluye pasos organizados por prioridad y tiempo estimado.`,
			steps: mockSteps,
			estimated_total_time: "2-3 horas",
			content_id: contentId
		}

		const result = await createActionPlan(planData)
		return result
	} catch (error) {
		console.error('Error generating action plan:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getActionPlanStats(): Promise<{ 
	success: boolean; 
	stats?: {
		total: number
		active: number
		completed: number
		draft: number
	}; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: plans, error } = await supabase
			.from('action_plans')
			.select('status')
			.eq('user_id', user.id)

		if (error) {
			console.error('Error fetching action plan stats:', error)
			return { success: false, error: error.message }
		}

		const stats = {
			total: plans.length,
			active: plans.filter(p => p.status === 'active').length,
			completed: plans.filter(p => p.status === 'completed').length,
			draft: plans.filter(p => p.status === 'draft').length
		}

		return { success: true, stats }
	} catch (error) {
		console.error('Error fetching action plan stats:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}
