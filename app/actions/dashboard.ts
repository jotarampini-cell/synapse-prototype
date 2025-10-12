'use server'

import { createClient } from '@/lib/supabase/server'
import { demoContents, demoStats } from '@/lib/demo-data'
import { log } from '@/lib/logger'

export async function getUserStats() {
	// Verificar si Supabase está configurado
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	
	if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
		// Modo demo
		return {
			total_contents: demoStats.totalNotes,
			total_connections: 0,
			total_nodes: 0,
			recent_growth: demoStats.recentActivity
		}
	}

	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Usar la función SQL para obtener estadísticas
		const { data, error } = await supabase.rpc('get_user_stats', {
			user_id: user.id
		})

		if (error) {
			log.error('Error getting user stats:', { error })
			// Fallback a consultas individuales
			const [contentsResult, connectionsResult, recentResult] = await Promise.all([
				supabase.from('contents').select('id', { count: 'exact' }).eq('user_id', user.id),
				supabase.from('connections').select('id', { count: 'exact' }).eq('user_id', user.id),
				supabase.from('contents').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
			])

			return {
				total_contents: contentsResult.count || 0,
				total_connections: connectionsResult.count || 0,
				total_nodes: 0,
				recent_growth: recentResult.count || 0
			}
		}

		return data[0] || {
			total_contents: 0,
			total_connections: 0,
			total_nodes: 0,
			recent_growth: 0
		}
	} catch (error) {
		log.error('Error getting user stats:', { error })
		throw new Error('Error al obtener estadísticas')
	}
}

export async function getRecentSummaries() {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		const { data, error } = await supabase
			.from('summaries')
			.select(`
				*,
				contents!inner (
					title,
					created_at,
					tags,
					user_id
				)
			`)
			.eq('contents.user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(5)

		if (error) {
			throw new Error(error.message)
		}

		return data || []
	} catch (error) {
		log.error('Error getting recent summaries:', { error })
		throw new Error('Error al obtener resúmenes recientes')
	}
}

export async function getSuggestedConnections() {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		const { data, error } = await supabase
			.from('connections')
			.select('*')
			.eq('user_id', user.id)
			.order('strength', { ascending: false })
			.limit(10)

		if (error) {
			throw new Error(error.message)
		}

		return data || []
	} catch (error) {
		log.error('Error getting suggested connections:', { error })
		throw new Error('Error al obtener conexiones sugeridas')
	}
}

export async function getProcessingItems() {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener contenidos recientes sin resumen (en procesamiento)
		const { data, error } = await supabase
			.from('contents')
			.select(`
				id,
				title,
				created_at,
				summaries (id)
			`)
			.eq('user_id', user.id)
			.is('summaries.id', null)
			.order('created_at', { ascending: false })
			.limit(5)

		if (error) {
			throw new Error(error.message)
		}

		// Simular progreso basado en tiempo transcurrido
		const now = new Date()
		const processingItems = (data || []).map(item => {
			const created = new Date(item.created_at)
			const elapsed = now.getTime() - created.getTime()
			const minutesElapsed = Math.floor(elapsed / (1000 * 60))
			
			// Simular progreso: 0-2 min = 25%, 2-5 min = 50%, 5-10 min = 75%, 10+ min = 100%
			let progress = 25
			if (minutesElapsed >= 2) progress = 50
			if (minutesElapsed >= 5) progress = 75
			if (minutesElapsed >= 10) progress = 100

			return {
				id: item.id,
				title: item.title,
				progress,
				status: progress === 100 ? 'complete' : 'processing'
			}
		})

		return processingItems
	} catch (error) {
		log.error('Error getting processing items:', { error })
		throw new Error('Error al obtener elementos en procesamiento')
	}
}

export async function getUserContents(limit?: number) {
	// Verificar si Supabase está configurado
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	
	if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
		// Modo demo - retornar datos de demostración
		return demoContents.slice(0, limit || 50).map(content => ({
			...content,
			hasSummary: content.hasSummary,
			summary: content.hasSummary ? {
				id: `summary-${content.id}`,
				summary: `Resumen de demostración para "${content.title}"`,
				key_concepts: content.tags || [],
				created_at: content.created_at
			} : null
		}))
	}

	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener contenidos con sus resúmenes usando LEFT JOIN
		const { data, error } = await supabase
			.from('contents')
			.select(`
				id,
				title,
				content,
				content_type,
				tags,
				created_at,
				updated_at,
				file_url,
				summaries (
					id,
					summary,
					key_concepts,
					created_at
				)
			`)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(limit || 50)

		if (error) {
			throw new Error(error.message)
		}

		// Transformar los datos para incluir información de resúmenes
		const contents = (data || []).map(content => ({
			...content,
			hasSummary: content.summaries && content.summaries.length > 0,
			summary: content.summaries?.[0] || null
		}))

		return contents
	} catch (error) {
		log.error('Error getting user contents:', { error })
		throw new Error('Error al obtener contenidos del usuario')
	}
}

