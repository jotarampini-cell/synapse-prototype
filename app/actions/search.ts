'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/gemini/client'

export async function searchContents(query: string) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	if (!query.trim()) {
		return []
	}

	try {
		// 1. Generar embedding de la query
		const queryEmbedding = await generateEmbedding(query)

		// 2. Búsqueda por similitud de vectores
		const { data, error } = await supabase.rpc('match_contents', {
			query_embedding: queryEmbedding,
			match_threshold: 0.5,
			match_count: 20,
			user_id: user.id
		})

		if (error) {
			console.error('Error in vector search:', error)
			// Fallback a búsqueda de texto
			const { data: fallbackData, error: fallbackError } = await supabase
				.from('contents')
				.select(`
					*,
					summaries (
						summary,
						key_concepts
					)
				`)
				.eq('user_id', user.id)
				.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
				.order('created_at', { ascending: false })
				.limit(20)

			if (fallbackError) {
				throw new Error(fallbackError.message)
			}

			return fallbackData || []
		}

		// 3. Obtener detalles completos de los contenidos encontrados
		const contentIds = data.map((item: any) => item.id)
		
		if (contentIds.length === 0) {
			return []
		}

		const { data: contents, error: contentsError } = await supabase
			.from('contents')
			.select(`
				*,
				summaries (
					summary,
					key_concepts
				)
			`)
			.in('id', contentIds)
			.eq('user_id', user.id)

		if (contentsError) {
			throw new Error(contentsError.message)
		}

		// 4. Ordenar por relevancia (similarity score)
		const contentsWithSimilarity = contents.map(content => {
			const similarityData = data.find((item: any) => item.id === content.id)
			return {
				...content,
				similarity: similarityData?.similarity || 0
			}
		})

		return contentsWithSimilarity.sort((a, b) => b.similarity - a.similarity)
	} catch (error) {
		console.error('Error searching contents:', error)
		throw new Error(error instanceof Error ? error.message : 'Error al buscar contenido')
	}
}

export async function getSuggestedConnections(userId: string) {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from('connections')
		.select('*')
		.eq('user_id', userId)
		.order('strength', { ascending: false })
		.limit(10)

	if (error) {
		throw new Error(error.message)
	}

	return data || []
}

export async function getRecentSummaries(userId: string) {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from('summaries')
		.select(`
			*,
			contents (
				title,
				created_at,
				tags
			)
		`)
		.eq('contents.user_id', userId)
		.order('created_at', { ascending: false })
		.limit(5)

	if (error) {
		throw new Error(error.message)
	}

	return data || []
}
