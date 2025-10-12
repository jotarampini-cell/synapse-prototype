'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
	generateEmbedding, 
	generateSummary, 
	extractConcepts, 
	suggestConnections,
	generateMindMap,
	suggestRelatedTopics,
	extractTasks,
	analyzeContentSentiment
} from '@/lib/gemini/client'
import { log } from '@/lib/logger'

export interface MindMapNode {
	main: string
	subtopics: string[]
}

export interface ExtractedTask {
	task: string
	priority: 'high' | 'medium' | 'low'
	dueDate?: string
}

export interface AIAnalysis {
	id: string
	content_id: string
	summary: string | null
	mind_map: MindMapNode[] | null
	related_topics: string[] | null
	extracted_tasks: ExtractedTask[] | null
	key_concepts: string[] | null
	sentiment: string | null
	confidence_score: number | null
	analysis_type: string
	created_at: string
	updated_at: string
}

// =====================================================
// ACCIONES DE ANÁLISIS DE IA
// =====================================================

export async function analyzeNote(noteId: string, analysisType: 'summary' | 'mind_map' | 'tasks' | 'full' = 'full') {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener el contenido de la nota
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('*')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Nota no encontrada')
		}

		const results: Record<string, unknown> = {}

		// Generar embedding si no existe
		if (!content.embedding) {
			const embedding = await generateEmbedding(`${content.title} ${content.content}`)
			await supabase
				.from('contents')
				.update({ embedding })
				.eq('id', noteId)
		}

		// Análisis según tipo - optimizado para paralelismo
		if (analysisType === 'full') {
			// Para análisis completo, hacer llamadas en paralelo para mayor velocidad
			const [summary, mindMap, tasks, concepts] = await Promise.all([
				generateSummary(content.content),
				generateMindMap(content.content),
				extractTasks(content.content),
				extractConcepts(content.content)
			])
			
			results.summary = summary
			results.mind_map = mindMap
			results.extracted_tasks = tasks
			results.key_concepts = concepts

			// Obtener temas relacionados y sentimiento en paralelo
			const { data: existingContents } = await supabase
				.from('contents')
				.select('title, content, embedding')
				.eq('user_id', user.id)
				.neq('id', noteId)
				.not('embedding', 'is', null)
				.limit(10)

			const [relatedTopics, sentimentResult] = await Promise.all([
				suggestRelatedTopics(content.content, existingContents || []),
				analyzeContentSentiment(content.content)
			])
			
			const sentiment = sentimentResult.sentiment
			
			results.related_topics = relatedTopics
			results.sentiment = sentiment
			results.confidence_score = 0.85 // Valor por defecto
		} else {
			// Para análisis específicos, hacer solo la llamada necesaria
			if (analysisType === 'summary') {
				const summary = await generateSummary(content.content)
				results.summary = summary
			}

			if (analysisType === 'mind_map') {
				const mindMap = await generateMindMap(content.content)
				results.mind_map = mindMap
			}

			if (analysisType === 'tasks') {
				const tasks = await extractTasks(content.content)
				results.extracted_tasks = tasks
			}
		}

		// Verificar si ya existe un análisis para esta nota
		const { data: existingAnalysis } = await supabase
			.from('ai_analyses')
			.select('id')
			.eq('content_id', noteId)
			.single()

		let analysis
		if (existingAnalysis) {
			// Actualizar análisis existente
			const { data: updatedAnalysis, error: updateError } = await supabase
				.from('ai_analyses')
				.update({
					summary: results.summary,
					extracted_tasks: results.extracted_tasks,
					key_concepts: results.key_concepts,
					connections: results.connections,
					confidence_score: results.confidence_score || 0.8,
					updated_at: new Date().toISOString()
				})
				.eq('content_id', noteId)
				.select()
				.single()

			if (updateError) {
				log.error('Error updating analysis:', { error: updateError })
				throw new Error(updateError.message)
			}
			analysis = updatedAnalysis
		} else {
			// Crear nuevo análisis
			const { data: newAnalysis, error: insertError } = await supabase
				.from('ai_analyses')
				.insert({
					content_id: noteId,
					user_id: user.id,
					summary: results.summary,
					extracted_tasks: results.extracted_tasks,
					key_concepts: results.key_concepts,
					connections: results.connections,
					analysis_type: analysisType,
					confidence_score: results.confidence_score || 0.8
				})
				.select()
				.single()

			if (insertError) {
				log.error('Error inserting analysis:', { error: insertError })
				throw new Error(insertError.message)
			}
			analysis = newAnalysis
		}

		revalidatePath('/notes')
		return { success: true, analysis, results }
	} catch (error) {
		log.error('Error analyzing note:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al analizar nota')
	}
}

export async function getAnalysis(noteId: string) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la nota pertenece al usuario
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Nota no encontrada')
		}

		// Obtener análisis
		const { data: analysis, error } = await supabase
			.from('ai_analysis')
			.select('*')
			.eq('content_id', noteId)
			.single()

		if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
			throw new Error(error.message)
		}

		return analysis || null
	} catch (error) {
		log.error('Error getting analysis:', { error })
		throw new Error('Error al obtener análisis')
	}
}

export async function updateAnalysis(noteId: string, updates: Partial<AIAnalysis>) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la nota pertenece al usuario
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Nota no encontrada')
		}

		// Actualizar análisis
		const { data: analysis, error } = await supabase
			.from('ai_analysis')
			.update(updates)
			.eq('content_id', noteId)
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, analysis }
	} catch (error) {
		log.error('Error updating analysis:', { error })
		throw new Error('Error al actualizar análisis')
	}
}

export async function deleteAnalysis(noteId: string) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la nota pertenece al usuario
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Nota no encontrada')
		}

		// Eliminar análisis
		const { error } = await supabase
			.from('ai_analysis')
			.delete()
			.eq('content_id', noteId)

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		log.error('Error deleting analysis:', { error })
		throw new Error('Error al eliminar análisis')
	}
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Función removida ya que no se usa

// =====================================================
// ACCIONES DE TEMAS RELACIONADOS
// =====================================================

export async function getRelatedNotes(noteId: string, limit: number = 5) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener la nota actual
		const { data: currentNote, error: currentError } = await supabase
			.from('contents')
			.select('embedding')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (currentError) {
			log.error('Error obteniendo nota actual:', { error: currentError })
			return [] // Retornar array vacío en lugar de lanzar error
		}

		if (!currentNote?.embedding) {
			log.info('Nota sin embedding, retornando notas recientes como alternativa')
			// Si no hay embedding, retornar notas recientes como alternativa
			return await getRecentNotesAsAlternative(user.id, noteId, limit)
		}

		// Buscar notas similares usando búsqueda vectorial
		const { data: similarNotes, error } = await supabase.rpc('match_contents', {
			query_embedding: currentNote.embedding,
			match_threshold: 0.3,
			match_count: limit + 1, // +1 para excluir la nota actual
			user_id: user.id
		})

		if (error) {
			log.error('Error en búsqueda vectorial:', { error })
			// Si falla la búsqueda vectorial, usar alternativa
			return await getRecentNotesAsAlternative(user.id, noteId, limit)
		}

		// Filtrar la nota actual y obtener detalles completos
		const similarIds = similarNotes
			?.filter((note: { id: string }) => note.id !== noteId)
			.slice(0, limit)
			.map((note: { id: string }) => note.id) || []

		if (similarIds.length === 0) {
			log.info('No se encontraron notas similares, retornando notas recientes')
			return await getRecentNotesAsAlternative(user.id, noteId, limit)
		}

		const { data: notes, error: notesError } = await supabase
			.from('contents')
			.select(`
				id,
				title,
				content,
				created_at,
				folders (
					name,
					color
				)
			`)
			.in('id', similarIds)
			.eq('user_id', user.id)

		if (notesError) {
			log.error('Error obteniendo detalles de notas:', { error: notesError })
			return await getRecentNotesAsAlternative(user.id, noteId, limit)
		}

		// Combinar con scores de similitud
		const notesWithSimilarity = notes?.map(note => {
			const similarityData = similarNotes?.find((s: { id: string; similarity: number }) => s.id === note.id)
			return {
				...note,
				similarity: similarityData?.similarity || 0
			}
		}).sort((a, b) => (b as { similarity: number }).similarity - (a as { similarity: number }).similarity) || []

		return notesWithSimilarity
	} catch (error) {
		log.error('Error getting related notes:', { error })
		// En caso de error general, retornar notas recientes como fallback
		try {
			return await getRecentNotesAsAlternative(user.id, noteId, limit)
		} catch (fallbackError) {
			log.error('Error en fallback:', { error: fallbackError })
			return [] // Retornar array vacío como último recurso
		}
	}
}

// Función auxiliar para obtener notas recientes como alternativa
async function getRecentNotesAsAlternative(userId: string, excludeNoteId: string, limit: number) {
	const supabase = await createClient()
	
	const { data: notes, error } = await supabase
		.from('contents')
		.select(`
			id,
			title,
			content,
			created_at,
			folders (
				name,
				color
			)
		`)
		.eq('user_id', userId)
		.neq('id', excludeNoteId)
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) {
		log.error('Error obteniendo notas recientes:', { error })
		return []
	}

	// Añadir similitud de 0.5 como valor por defecto para notas recientes
	return notes?.map(note => ({
		...note,
		similarity: 0.5
	})) || []
}

export async function getNotesByTopic(topic: string, limit: number = 10) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Buscar en títulos y contenido
		const { data: notes, error } = await supabase
			.from('contents')
			.select(`
				id,
				title,
				content,
				created_at,
				folders (
					name,
					color
				)
			`)
			.eq('user_id', user.id)
			.or(`title.ilike.%${topic}%,content.ilike.%${topic}%`)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) {
			throw new Error(error.message)
		}

		return notes || []
	} catch (error) {
		log.error('Error getting notes by topic:', { error })
		throw new Error('Error al buscar notas por tema')
	}
}

// =====================================================
// ACCIONES DE ESTADÍSTICAS DE IA
// =====================================================

export async function getAIAnalysisStats() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		const { data: stats, error } = await supabase.rpc('get_user_stats', {
			user_uuid: user.id
		})

		if (error) {
			throw new Error(error.message)
		}

		return stats[0] || {
			total_contents: 0,
			total_folders: 0,
			total_tags: 0,
			total_ai_analyses: 0,
			recent_growth: 0,
			total_words: 0,
			total_reading_time: 0
		}
	} catch (error) {
		log.error('Error getting AI analysis stats:', { error })
		throw new Error('Error al obtener estadísticas de IA')
	}
}

// =====================================================
// ANÁLISIS AUTOMÁTICO EN BACKGROUND
// =====================================================

export async function analyzeNoteInBackground(noteId: string) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar si ya existe un análisis reciente (menos de 1 hora)
		let existingAnalysis = null
		try {
			const { data, error: checkError } = await supabase
				.from('ai_analyses')
				.select('*')
				.eq('content_id', noteId)
				.eq('user_id', user.id)
				.gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
				.single()

			if (checkError && checkError.code !== 'PGRST116') {
				log.warn('Error checking existing analysis:', { error: checkError.message })
				// Continuar sin verificar análisis existente
			} else {
				existingAnalysis = data
			}
		} catch (error) {
			log.warn('Error accessing ai_analyses table:', { error })
			// Continuar sin verificar análisis existente
		}

		// Si ya existe un análisis reciente, no hacer nada
		if (existingAnalysis) {
			return { success: true, message: 'Análisis ya existe y está actualizado' }
		}

		// Obtener el contenido de la nota
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('*')
			.eq('id', noteId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Nota no encontrada')
		}

		// Marcar como "analizando" en la base de datos
		const { error: updateError } = await supabase
			.from('contents')
			.update({ 
				ai_analysis_status: 'analyzing',
				ai_analysis_updated_at: new Date().toISOString()
			})
			.eq('id', noteId)

		if (updateError) {
			log.error('Error updating analysis status:', { error: updateError })
		}

		// Realizar análisis completo en paralelo
		const [summary, tasks, concepts, connections] = await Promise.all([
			generateSummary(content.content),
			extractTasks(content.content),
			extractConcepts(content.content),
			suggestConnections(content.content, [])
		])

		// Guardar o actualizar el análisis
		const analysisData = {
			content_id: noteId,
			user_id: user.id,
			summary,
			extracted_tasks: tasks,
			key_concepts: concepts,
			connections: connections,
			analysis_type: 'background',
			confidence_score: 0.8,
			updated_at: new Date().toISOString()
		}

		try {
			const { error: upsertError } = await supabase
				.from('ai_analyses')
				.upsert(analysisData, {
					onConflict: 'content_id,user_id'
				})

			if (upsertError) {
				log.warn('Error upserting AI analysis:', { error: upsertError.message })
				// Continuar sin guardar el análisis en la tabla específica
			}
		} catch (error) {
			log.warn('Error accessing ai_analyses table for upsert:', { error })
			// Continuar sin guardar el análisis en la tabla específica
		}

		// Marcar como "completado" en la base de datos
		await supabase
			.from('contents')
			.update({ 
				ai_analysis_status: 'completed',
				ai_analysis_updated_at: new Date().toISOString()
			})
			.eq('id', noteId)

		// Revalidar la página
		revalidatePath('/notes')
		revalidatePath('/home')

		return { 
			success: true, 
			message: 'Análisis completado automáticamente',
			data: analysisData
		}

	} catch (error) {
		log.error('Error in background analysis:', { error })
		
		// Marcar como "error" en la base de datos
		await supabase
			.from('contents')
			.update({ 
				ai_analysis_status: 'error',
				ai_analysis_updated_at: new Date().toISOString()
			})
			.eq('id', noteId)

		return { 
			success: false, 
			message: 'Error en análisis automático',
			error: error instanceof Error ? error.message : 'Error desconocido'
		}
	}
}
