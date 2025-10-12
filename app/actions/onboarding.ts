"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { log } from "@/lib/logger"

export interface OnboardingStep {
	id: string
	title: string
	description: string
	completed: boolean
	completed_at?: string
}

export interface UserOnboarding {
	id: string
	completed_steps: OnboardingStep[]
	completed_at?: string
	created_at: string
}

export async function getOnboardingStatus(): Promise<{ 
	success: boolean; 
	onboarding?: UserOnboarding; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: onboarding, error } = await supabase
			.from('user_onboarding')
			.select('*')
			.eq('user_id', user.id)
			.single()

		if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
			log.error('Error fetching onboarding status:', { error })
			return { success: false, error: error.message }
		}

		// Si no existe, crear uno nuevo
		if (!onboarding) {
			const defaultSteps: OnboardingStep[] = [
				{
					id: 'welcome',
					title: 'Bienvenido a Synapse',
					description: 'Conoce las funcionalidades principales',
					completed: false
				},
				{
					id: 'create_note',
					title: 'Crear primera nota',
					description: 'Crea tu primera nota para comenzar',
					completed: false
				},
				{
					id: 'ai_analysis',
					title: 'Análisis con IA',
					description: 'Ve cómo la IA analiza tu contenido',
					completed: false
				},
				{
					id: 'create_action',
					title: 'Crear plan de acción',
					description: 'Convierte ideas en acciones concretas',
					completed: false
				},
				{
					id: 'explore_features',
					title: 'Explorar funcionalidades',
					description: 'Descubre todas las características',
					completed: false
				}
			]

			const { data: newOnboarding, error: createError } = await supabase
				.from('user_onboarding')
				.insert({
					user_id: user.id,
					completed_steps: defaultSteps
				})
				.select()
				.single()

			if (createError) {
				log.error('Error creating onboarding:', { error: createError })
				return { success: false, error: createError.message }
			}

			return { success: true, onboarding: newOnboarding }
		}

		return { success: true, onboarding }
	} catch (error) {
		log.error('Error fetching onboarding status:', { error })
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function completeOnboardingStep(stepId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener el estado actual
		const { data: onboarding } = await supabase
			.from('user_onboarding')
			.select('completed_steps')
			.eq('user_id', user.id)
			.single()

		if (!onboarding) {
			return { success: false, error: "Estado de onboarding no encontrado" }
		}

		// Actualizar el paso específico
		const updatedSteps = onboarding.completed_steps.map((step: OnboardingStep) => 
			step.id === stepId 
				? { ...step, completed: true, completed_at: new Date().toISOString() }
				: step
		)

		// Verificar si todos los pasos están completados
		const allCompleted = updatedSteps.every((step: OnboardingStep) => step.completed)
		const completedAt = allCompleted ? new Date().toISOString() : null

		// Actualizar en la base de datos
		const { error } = await supabase
			.from('user_onboarding')
			.update({ 
				completed_steps: updatedSteps,
				completed_at: completedAt
			})
			.eq('user_id', user.id)

		if (error) {
			log.error('Error completing onboarding step:', { error })
			return { success: false, error: error.message }
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		log.error('Error completing onboarding step:', { error })
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function resetOnboarding(): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const defaultSteps: OnboardingStep[] = [
			{
				id: 'welcome',
				title: 'Bienvenido a Synapse',
				description: 'Conoce las funcionalidades principales',
				completed: false
			},
			{
				id: 'create_note',
				title: 'Crear primera nota',
				description: 'Crea tu primera nota para comenzar',
				completed: false
			},
			{
				id: 'ai_analysis',
				title: 'Análisis con IA',
				description: 'Ve cómo la IA analiza tu contenido',
				completed: false
			},
			{
				id: 'create_action',
				title: 'Crear plan de acción',
				description: 'Convierte ideas en acciones concretas',
				completed: false
			},
			{
				id: 'explore_features',
				title: 'Explorar funcionalidades',
				description: 'Descubre todas las características',
				completed: false
			}
		]

		const { error } = await supabase
			.from('user_onboarding')
			.update({ 
				completed_steps: defaultSteps,
				completed_at: null
			})
			.eq('user_id', user.id)

		if (error) {
			log.error('Error resetting onboarding:', { error })
			return { success: false, error: error.message }
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		log.error('Error resetting onboarding:', { error })
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function isOnboardingCompleted(): Promise<{ 
	success: boolean; 
	completed?: boolean; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: onboarding } = await supabase
			.from('user_onboarding')
			.select('completed_at')
			.eq('user_id', user.id)
			.single()

		return { success: true, completed: !!onboarding?.completed_at }
	} catch (error) {
		log.error('Error checking onboarding completion:', { error })
		return { success: false, error: "Error interno del servidor" }
	}
}
