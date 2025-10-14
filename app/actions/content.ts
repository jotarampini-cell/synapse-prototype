'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
	generateEmbedding, 
	generateSummary, 
	extractConcepts, 
	suggestConnections
} from '@/lib/gemini/client'
import { transcribeAudio } from '@/lib/speech/client'
// import { Database } from '@/lib/database.types'

// type Content = Database['public']['Tables']['contents']['Insert']

// ===== FUNCIONES AUXILIARES =====

async function ensureUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: any) {
	// Verificar si el usuario existe en la tabla profiles, si no, crearlo
	const { error: profileError } = await supabase
		.from('profiles')
		.select('id')
		.eq('id', user.id)
		.single()

	if (profileError && profileError.code === 'PGRST116') {
		// El perfil no existe, crearlo
		const { error: insertError } = await supabase
			.from('profiles')
			.insert({
				id: user.id,
				email: user.email || '',
				full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
				interests: [],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})

		if (insertError) {
			// Log error but continue
			throw new Error('Error al crear perfil de usuario')
		}
	} else if (profileError) {
		// Log error but continue
		throw new Error('Error al verificar perfil de usuario')
	}
}

// ===== ACCIONES BÁSICAS (SIN IA) =====

export async function createBasicTextContent(formData: FormData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	// Asegurar que el usuario tenga un perfil
	await ensureUserProfile(supabase, user)

	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(t => t.length > 0) || []
	const folderId = formData.get('folder_id') as string

	if (!title || !content) {
		throw new Error('Título y contenido son requeridos')
	}

	try {
		// Obtener o crear carpeta Inbox si no se especifica carpeta
		let finalFolderId = null
		if (folderId && folderId !== 'none') {
			finalFolderId = folderId
		} else {
			// Buscar carpeta Inbox del usuario
			const { data: inboxFolder } = await supabase
				.from('folders')
				.select('id')
				.eq('user_id', user.id)
				.eq('name', 'Inbox')
				.single()
			
			if (inboxFolder) {
				finalFolderId = inboxFolder.id
			} else {
				// Crear carpeta Inbox si no existe
				const { data: newInboxFolder, error: inboxError } = await supabase
					.from('folders')
					.insert({
						user_id: user.id,
						name: 'Inbox',
						color: '#6b7280',
						parent_id: null
					})
					.select()
					.single()
				
				if (inboxError) {
					console.error('Error creating Inbox folder:', { error: inboxError })
				} else {
					finalFolderId = newInboxFolder.id
				}
			}
		}

		const { data: contentData, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title,
				content,
				content_type: 'text',
				tags,
				folder_id: finalFolderId
			})
			.select()
			.single()

		if (contentError) {
			console.error('Supabase error:', { error: contentError })
			throw new Error(`Error de base de datos: ${contentError.message}`)
		}

		if (!contentData) {
			throw new Error('No se pudo crear el contenido')
		}

		revalidatePath('/dashboard')
		
		return { success: true, contentId: contentData.id }
	} catch (error) {
		console.error('Error creating basic content:', { error })
		// Asegurar que el error sea serializable
		const errorMessage = error instanceof Error ? error.message : 'Error al crear contenido'
		throw new Error(errorMessage)
	}
}


export async function createBasicFileContent(formData: FormData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	// Asegurar que el usuario tenga un perfil
	await ensureUserProfile(supabase, user)

	const file = formData.get('file') as File
	const title = formData.get('title') as string
	const folderId = formData.get('folder_id') as string

	if (!file) {
		throw new Error('Archivo es requerido')
	}

	try {
		// Subir archivo a Supabase Storage
		const fileExt = file.name.split('.').pop()
		const fileName = `${user.id}/${Date.now()}.${fileExt}`
		
		const { error: uploadError } = await supabase.storage
			.from('content-files')
			.upload(fileName, file)

		if (uploadError) {
			throw new Error(uploadError.message)
		}

		// Obtener URL pública
		const { data: { publicUrl } } = supabase.storage
			.from('content-files')
			.getPublicUrl(fileName)

		// Obtener o crear carpeta Inbox si no se especifica carpeta
		let finalFolderId = null
		if (folderId && folderId !== 'none') {
			finalFolderId = folderId
		} else {
			// Buscar carpeta Inbox del usuario
			const { data: inboxFolder } = await supabase
				.from('folders')
				.select('id')
				.eq('user_id', user.id)
				.eq('name', 'Inbox')
				.single()
			
			if (inboxFolder) {
				finalFolderId = inboxFolder.id
			} else {
				// Crear carpeta Inbox si no existe
				const { data: newInboxFolder, error: inboxError } = await supabase
					.from('folders')
					.insert({
						user_id: user.id,
						name: 'Inbox',
						color: '#6b7280',
						parent_id: null
					})
					.select()
					.single()
				
				if (inboxError) {
					console.error('Error creating Inbox folder:', { error: inboxError })
				} else {
					finalFolderId = newInboxFolder.id
				}
			}
		}

		// Crear contenido
		const { data: contentData, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title: title || file.name,
				content: `Archivo: ${file.name}`,
				content_type: 'file',
				file_url: publicUrl,
				tags: ['Archivo', fileExt?.toUpperCase() || 'FILE'],
				folder_id: finalFolderId
			})
			.select()
			.single()

		if (contentError) {
			throw new Error(contentError.message)
		}

		revalidatePath('/dashboard')
		
		return { success: true, contentId: contentData.id }
	} catch (error) {
		console.error('Error creating file content:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al subir archivo')
	}
}

export async function createBasicVoiceContent(formData: FormData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	// Asegurar que el usuario tenga un perfil
	await ensureUserProfile(supabase, user)

	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const audioFile = formData.get('audio') as File
	const folderId = formData.get('folder_id') as string

	if (!title) {
		throw new Error('Título es requerido')
	}

	try {
		let finalContent = content || ''

		// Si hay archivo de audio, transcribirlo
		if (audioFile && audioFile.size > 0) {
			try {
				const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
				const transcription = await transcribeAudio(audioBuffer)
				finalContent = transcription.transcript
			} catch (transcriptionError) {
				console.error('Error en transcripción:', { error: transcriptionError })
				// Continuar con el contenido manual si la transcripción falla
				if (!content) {
					throw new Error('Error al transcribir el audio. Por favor, proporciona el contenido manualmente.')
				}
			}
		}

		if (!finalContent) {
			throw new Error('Contenido es requerido (transcripción o texto manual)')
		}

		// Obtener o crear carpeta Inbox si no se especifica carpeta
		let finalFolderId = null
		if (folderId && folderId !== 'none') {
			finalFolderId = folderId
		} else {
			// Buscar carpeta Inbox del usuario
			const { data: inboxFolder } = await supabase
				.from('folders')
				.select('id')
				.eq('user_id', user.id)
				.eq('name', 'Inbox')
				.single()
			
			if (inboxFolder) {
				finalFolderId = inboxFolder.id
			} else {
				// Crear carpeta Inbox si no existe
				const { data: newInboxFolder, error: inboxError } = await supabase
					.from('folders')
					.insert({
						user_id: user.id,
						name: 'Inbox',
						color: '#6b7280',
						parent_id: null
					})
					.select()
					.single()
				
				if (inboxError) {
					console.error('Error creating Inbox folder:', { error: inboxError })
				} else {
					finalFolderId = newInboxFolder.id
				}
			}
		}

		const { data: contentData, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title,
				content: finalContent,
				content_type: 'voice',
				tags: ['Voz', 'Transcripción'],
				folder_id: finalFolderId
			})
			.select()
			.single()

		if (contentError) {
			throw new Error(contentError.message)
		}

		revalidatePath('/dashboard')
		
		return { success: true, contentId: contentData.id }
	} catch (error) {
		console.error('Error creating voice content:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al crear contenido de voz')
	}
}

export async function transcribeAudioFile(formData: FormData) {
	const audioFile = formData.get('audio') as File
	const language = formData.get('language') as string || 'es-ES'

	if (!audioFile || audioFile.size === 0) {
		throw new Error('Archivo de audio es requerido')
	}

	try {
		const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
		const apiKey = process.env.GEMINI_API_KEY;
		
		if (!apiKey) {
			throw new Error('API Key de Google no configurada');
		}

		const audioBase64 = audioBuffer.toString('base64');
		
		const requestBody = {
			config: {
				encoding: 'WEBM_OPUS',
				sampleRateHertz: 48000,
				languageCode: language,
				enableAutomaticPunctuation: true,
				model: 'latest_long'
			},
			audio: {
				content: audioBase64
			}
		};

		const response = await fetch(
			`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(`Error de API: ${errorData.error?.message || 'Error desconocido'}`);
		}

		const data = await response.json();
		
		if (!data.results || data.results.length === 0) {
			throw new Error('No se pudo transcribir el audio');
		}

		const result = data.results[0];
		const alternative = result.alternatives?.[0];

		if (!alternative) {
			throw new Error('No se encontraron alternativas de transcripción');
		}

		return {
			success: true,
			transcript: alternative.transcript || '',
			confidence: alternative.confidence || 0,
			language: language
		}
	} catch (error) {
		console.error('Error transcribing audio:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al transcribir el audio')
	}
}

// ===== ACCIONES DE ANÁLISIS CON IA =====

export async function analyzeContentWithAI(contentId: string, analysisType: 'summary' | 'concepts' | 'connections' | 'all') {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener contenido
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('*')
			.eq('id', contentId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			throw new Error('Contenido no encontrado')
		}

		const results: Record<string, unknown> = {}

		// Generar embedding si no existe
		if (!content.embedding) {
			const embedding = await generateEmbedding(`${content.title} ${content.content}`)
			await supabase
				.from('contents')
				.update({ embedding })
				.eq('id', contentId)
		}

		// Análisis según tipo
		if (analysisType === 'summary' || analysisType === 'all') {
			const summary = await generateSummary(content.content)
			results.summary = summary
		}

		if (analysisType === 'concepts' || analysisType === 'all') {
			const concepts = await extractConcepts(content.content)
			results.concepts = concepts
		}

		if (analysisType === 'connections' || analysisType === 'all') {
			// Obtener conceptos existentes
			const { data: existingContents } = await supabase
				.from('summaries')
				.select('key_concepts')
				.neq('content_id', contentId)

			const existingConcepts = existingContents
				?.flatMap(s => s.key_concepts || [])
				.filter((concept, index, arr) => arr.indexOf(concept) === index) || []

			if (results.concepts && results.concepts.length > 0 && existingConcepts.length > 0) {
				const connections = await suggestConnections(results.concepts, existingConcepts)
				results.connections = connections
			}
		}

		// Guardar resultados en base de datos
		if (results.summary || results.concepts) {
			await supabase
				.from('summaries')
				.upsert({
					content_id: contentId,
					summary: results.summary,
					key_concepts: results.concepts
				})
		}

		// Guardar conexiones
		if (results.connections) {
			for (const connection of results.connections) {
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


		revalidatePath('/dashboard')
		
		return { success: true, results }
	} catch (error) {
		console.error('Error analyzing content:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al analizar contenido')
	}
}

// ===== ACCIONES LEGACY (MANTENER COMPATIBILIDAD) =====

export async function createTextContent(formData: FormData) {
	return createBasicTextContent(formData)
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
	
	return { success: true }
}

export async function updateContent(contentId: string, formData: FormData, options: { skipAI?: boolean } = {}) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(t => t.length > 0) || []
	const folderId = formData.get('folder_id') as string

	if (!title || !content) {
		throw new Error('Título y contenido son requeridos')
	}

	try {
		// 1. Actualizar contenido básico
		const updateData: Record<string, unknown> = {
			title,
			content,
			tags,
			updated_at: new Date().toISOString()
		}

		// Solo actualizar folder_id si se proporciona
		if (folderId && folderId !== 'none') {
			updateData.folder_id = folderId
		} else if (folderId === 'none') {
			updateData.folder_id = null
		}

		const { error: contentError } = await supabase
			.from('contents')
			.update(updateData)
			.eq('id', contentId)
			.eq('user_id', user.id)

		if (contentError) {
			throw new Error(contentError.message)
		}

		// 2. Solo regenerar AI si no se omite
		if (!options.skipAI) {
			// Regenerar embedding
			const embedding = await generateEmbedding(`${title} ${content}`)
			
			await supabase
				.from('contents')
				.update({ embedding })
				.eq('id', contentId)

			// Regenerar resumen y conceptos
			const summary = await generateSummary(content)
			const concepts = await extractConcepts(content)

			// Actualizar resumen
			await supabase
				.from('summaries')
				.update({
					summary,
					key_concepts: concepts
				})
				.eq('content_id', contentId)
		}

		revalidatePath('/dashboard')
		revalidatePath('/notes')
		
		return { success: true }
	} catch (error) {
		console.error('Error updating content:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al actualizar contenido')
	}
}


// Función createContent genérica
export async function createContent(formData: FormData) {
	const contentType = formData.get('content_type') as string
	
	switch (contentType) {
		case 'text':
			return await createBasicTextContent(formData)
		case 'file':
			return await createBasicFileContent(formData)
		case 'voice':
			return await createBasicVoiceContent(formData)
		default:
			throw new Error('Tipo de contenido no válido')
	}
}

// Función getUserContents
export async function getUserContents() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		console.log('Usuario no autenticado en getUserContents')
		return []
	}
	
	const { data: contents, error } = await supabase
		.from('contents')
		.select(`
			id,
			title,
			content,
			content_type,
			tags,
			created_at,
			updated_at,
			folder_id,
			is_pinned,
			is_archived,
			word_count,
			reading_time,
			folders (
				name,
				color
			),
			summaries (
				id
			)
		`)
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
	
	if (error) {
		throw new Error(error.message)
	}
	
	// Agregar hasSummary a cada contenido
	return contents?.map(content => ({
		...content,
		hasSummary: content.summaries && content.summaries.length > 0
	})) || []
}

// ===== FUNCIÓN PARA ADJUNTAR AUDIO =====

export async function createAudioAttachment(data: {
	noteId: string
	audioBlob: Blob
	duration: number
}) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		return { success: false, error: 'Usuario no autenticado' }
	}

	try {
		// Crear un nombre único para el archivo de audio
		const timestamp = Date.now()
		const fileName = `audio-${timestamp}.wav`
		const filePath = `audio-attachments/${user.id}/${fileName}`

		// Subir el archivo de audio a Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from('content-files')
			.upload(filePath, data.audioBlob, {
				contentType: 'audio/wav',
				upsert: false
			})

		if (uploadError) {
			console.error('Error uploading audio:', uploadError)
			return { success: false, error: 'Error al subir el archivo de audio' }
		}

		// Obtener la URL pública del archivo
		const { data: { publicUrl } } = supabase.storage
			.from('content-files')
			.getPublicUrl(filePath)

		// Crear un registro de contenido para el audio adjunto
		const { data: audioContent, error: contentError } = await supabase
			.from('contents')
			.insert({
				user_id: user.id,
				title: `Audio adjunto (${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')})`,
				content: `[AUDIO_ATTACHMENT]${publicUrl}[/AUDIO_ATTACHMENT]`,
				content_type: 'audio',
				folder_id: null,
				metadata: {
					audio_url: publicUrl,
					duration: data.duration,
					file_path: filePath,
					attached_to_note: data.noteId
				}
			})
			.select()
			.single()

		if (contentError) {
			console.error('Error creating audio content:', contentError)
			return { success: false, error: 'Error al crear el registro de audio' }
		}

		// Actualizar la nota original para incluir referencia al audio
		const { error: updateError } = await supabase
			.from('contents')
			.update({
				metadata: {
					audio_attachments: [audioContent.id]
				}
			})
			.eq('id', data.noteId)

		if (updateError) {
			console.error('Error updating note with audio reference:', updateError)
			// No es crítico, el audio ya está guardado
		}

		revalidatePath('/notes')
		
		return { 
			success: true, 
			contentId: audioContent.id,
			audioUrl: publicUrl,
			message: 'Audio adjuntado correctamente'
		}

	} catch (error) {
		console.error('Error in createAudioAttachment:', error)
		return { success: false, error: 'Error interno del servidor' }
	}
}

