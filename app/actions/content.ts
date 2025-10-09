'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
	generateEmbedding, 
	generateSummary, 
	extractConcepts, 
	suggestConnections,
	extractUrlContent 
} from '@/lib/gemini/client'
import { Database } from '@/lib/database.types'

type Content = Database['public']['Tables']['contents']['Insert']

export async function createTextContent(formData: FormData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(t => t.length > 0) || []

	if (!title || !content) {
		throw new Error('Título y contenido son requeridos')
	}

	try {
		// 1. Crear el contenido
		const { data: contentData, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title,
				content,
				content_type: 'text',
				tags
			})
			.select()
			.single()

		if (contentError) {
			throw new Error(contentError.message)
		}

		// 2. Generar embedding
		const embedding = await generateEmbedding(`${title} ${content}`)
		
		// 3. Actualizar con embedding
		await supabase
			.from('contents')
			.update({ embedding })
			.eq('id', contentData.id)

		// 4. Generar resumen y conceptos
		const summary = await generateSummary(content)
		const concepts = await extractConcepts(content)

		// 5. Guardar resumen
		await supabase
			.from('summaries')
			.insert({
				content_id: contentData.id,
				summary,
				key_concepts: concepts
			})

		// 6. Obtener conceptos existentes para sugerir conexiones
		const { data: existingContents } = await supabase
			.from('summaries')
			.select('key_concepts')
			.eq('content_id', '!=', contentData.id)

		const existingConcepts = existingContents
			?.flatMap(s => s.key_concepts || [])
			.filter((concept, index, arr) => arr.indexOf(concept) === index) || []

		// 7. Sugerir conexiones
		if (concepts.length > 0 && existingConcepts.length > 0) {
			const connections = await suggestConnections(concepts, existingConcepts)
			
			for (const connection of connections) {
				await supabase
					.from('connections')
					.insert({
						user_id: user.id,
						source_concept: connection.source,
						target_concept: connection.target,
						strength: connection.strength,
						reason: connection.reason
					})
			}
		}

		// 8. Crear nodos del grafo para conceptos nuevos
		const colors = ['#42a5f5', '#66bb6a', '#ab47bc', '#ffa726', '#ec407a']
		
		for (let i = 0; i < concepts.length; i++) {
			const concept = concepts[i]
			
			// Verificar si el nodo ya existe
			const { data: existingNode } = await supabase
				.from('graph_nodes')
				.select('id')
				.eq('user_id', user.id)
				.eq('label', concept)
				.single()

			if (!existingNode) {
				await supabase
					.from('graph_nodes')
					.insert({
						user_id: user.id,
						label: concept,
						type: 'concept',
						color: colors[i % colors.length],
						position: {
							x: Math.random() * 400 + 200,
							y: Math.random() * 300 + 150
						}
					})
			}
		}

		revalidatePath('/dashboard')
		revalidatePath('/search')
		revalidatePath('/graph')
		
		return { success: true, contentId: contentData.id }
	} catch (error) {
		console.error('Error creating content:', error)
		throw new Error(error instanceof Error ? error.message : 'Error al crear contenido')
	}
}

export async function createUrlContent(formData: FormData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const url = formData.get('url') as string

	if (!url) {
		throw new Error('URL es requerida')
	}

	try {
		// 1. Extraer contenido de la URL
		const { title, content } = await extractUrlContent(url)

		// 2. Crear el contenido
		const { data: contentData, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title,
				content,
				content_type: 'url',
				tags: ['URL']
			})
			.select()
			.single()

		if (contentError) {
			throw new Error(contentError.message)
		}

		// 3. Generar embedding
		const embedding = await generateEmbedding(`${title} ${content}`)
		
		// 4. Actualizar con embedding
		await supabase
			.from('contents')
			.update({ embedding })
			.eq('id', contentData.id)

		// 5. Generar resumen y conceptos
		const summary = await generateSummary(content)
		const concepts = await extractConcepts(content)

		// 6. Guardar resumen
		await supabase
			.from('summaries')
			.insert({
				content_id: contentData.id,
				summary,
				key_concepts: concepts
			})

		revalidatePath('/dashboard')
		revalidatePath('/search')
		revalidatePath('/graph')
		
		return { success: true, contentId: contentData.id }
	} catch (error) {
		console.error('Error creating URL content:', error)
		throw new Error(error instanceof Error ? error.message : 'Error al procesar URL')
	}
}

export async function getContents(userId: string) {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from('contents')
		.select(`
			*,
			summaries (
				summary,
				key_concepts
			)
		`)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })

	if (error) {
		throw new Error(error.message)
	}

	return data
}

export async function getContentById(contentId: string) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { data, error } = await supabase
		.from('contents')
		.select(`
			*,
			summaries (
				summary,
				key_concepts
			)
		`)
		.eq('id', contentId)
		.eq('user_id', user.id)
		.single()

	if (error) {
		throw new Error(error.message)
	}

	return data
}

export async function deleteContent(contentId: string) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { error } = await supabase
		.from('contents')
		.delete()
		.eq('id', contentId)
		.eq('user_id', user.id)

	if (error) {
		throw new Error(error.message)
	}

	revalidatePath('/dashboard')
	revalidatePath('/search')
	revalidatePath('/graph')
	
	return { success: true }
}

export async function updateContent(contentId: string, formData: FormData) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(t => t.length > 0) || []

	if (!title || !content) {
		throw new Error('Título y contenido son requeridos')
	}

	try {
		// 1. Actualizar contenido
		const { error: contentError } = await supabase
			.from('contents')
			.update({
				title,
				content,
				tags,
				updated_at: new Date().toISOString()
			})
			.eq('id', contentId)
			.eq('user_id', user.id)

		if (contentError) {
			throw new Error(contentError.message)
		}

		// 2. Regenerar embedding
		const embedding = await generateEmbedding(`${title} ${content}`)
		
		await supabase
			.from('contents')
			.update({ embedding })
			.eq('id', contentId)

		// 3. Regenerar resumen y conceptos
		const summary = await generateSummary(content)
		const concepts = await extractConcepts(content)

		// 4. Actualizar resumen
		await supabase
			.from('summaries')
			.update({
				summary,
				key_concepts: concepts
			})
			.eq('content_id', contentId)

		revalidatePath('/dashboard')
		revalidatePath('/search')
		revalidatePath('/graph')
		
		return { success: true }
	} catch (error) {
		console.error('Error updating content:', error)
		throw new Error(error instanceof Error ? error.message : 'Error al actualizar contenido')
	}
}
