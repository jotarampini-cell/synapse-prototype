"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface AIFeedback {
	id: string
	feedback_type: 'suggestion' | 'analysis' | 'connection' | 'tag' | 'folder'
	feedback_data: any
	is_positive: boolean
	content_id?: string
	created_at: string
}

export async function submitFeedback(data: {
	feedback_type: 'suggestion' | 'analysis' | 'connection' | 'tag' | 'folder'
	feedback_data: any
	is_positive: boolean
	content_id?: string
}): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('ai_feedback')
			.insert({
				user_id: user.id,
				feedback_type: data.feedback_type,
				feedback_data: data.feedback_data,
				is_positive: data.is_positive,
				content_id: data.content_id
			})

		if (error) {
			console.error('Error submitting feedback:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error submitting feedback:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getFeedbackStats(): Promise<{ 
	success: boolean; 
	stats?: {
		total: number
		positive: number
		negative: number
		by_type: Record<string, { total: number; positive: number; negative: number }>
	}; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: feedback, error } = await supabase
			.from('ai_feedback')
			.select('feedback_type, is_positive')
			.eq('user_id', user.id)

		if (error) {
			console.error('Error fetching feedback stats:', error)
			return { success: false, error: error.message }
		}

		const stats = {
			total: feedback.length,
			positive: feedback.filter(f => f.is_positive).length,
			negative: feedback.filter(f => !f.is_positive).length,
			by_type: feedback.reduce((acc, f) => {
				if (!acc[f.feedback_type]) {
					acc[f.feedback_type] = { total: 0, positive: 0, negative: 0 }
				}
				acc[f.feedback_type].total++
				if (f.is_positive) {
					acc[f.feedback_type].positive++
				} else {
					acc[f.feedback_type].negative++
				}
				return acc
			}, {} as Record<string, { total: number; positive: number; negative: number }>)
		}

		return { success: true, stats }
	} catch (error) {
		console.error('Error fetching feedback stats:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getRecentFeedback(limit: number = 10): Promise<{ 
	success: boolean; 
	feedback?: AIFeedback[]; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: feedback, error } = await supabase
			.from('ai_feedback')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) {
			console.error('Error fetching recent feedback:', error)
			return { success: false, error: error.message }
		}

		return { success: true, feedback }
	} catch (error) {
		console.error('Error fetching recent feedback:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}
