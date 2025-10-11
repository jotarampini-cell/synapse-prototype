"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Source {
	id: string
	title: string
	url?: string
	file_path?: string
	content_type: 'url' | 'file' | 'voice'
	extracted_content?: string
	metadata?: any
	created_at: string
	updated_at: string
}

export async function createSource(data: {
	title: string
	url?: string
	file_path?: string
	content_type: 'url' | 'file' | 'voice'
	extracted_content?: string
	metadata?: any
}): Promise<{ success: boolean; source?: Source; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: source, error } = await supabase
			.from('sources')
			.insert({
				user_id: user.id,
				title: data.title,
				url: data.url,
				file_path: data.file_path,
				content_type: data.content_type,
				extracted_content: data.extracted_content,
				metadata: data.metadata
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating source:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/fuentes')
		return { success: true, source }
	} catch (error) {
		console.error('Error creating source:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function getSources(filters?: {
	content_type?: string
}): Promise<{ success: boolean; sources?: Source[]; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		let query = supabase
			.from('sources')
			.select('*')
			.eq('user_id', user.id)

		if (filters?.content_type) {
			query = query.eq('content_type', filters.content_type)
		}

		const { data: sources, error } = await query.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching sources:', error)
			return { success: false, error: error.message }
		}

		return { success: true, sources }
	} catch (error) {
		console.error('Error fetching sources:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function updateSource(
	id: string, 
	data: Partial<Pick<Source, 'title' | 'extracted_content' | 'metadata'>>
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('sources')
			.update(data)
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating source:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/fuentes')
		return { success: true }
	} catch (error) {
		console.error('Error updating source:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteSource(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { error } = await supabase
			.from('sources')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting source:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/fuentes')
		return { success: true }
	} catch (error) {
		console.error('Error deleting source:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function extractContentFromUrl(url: string): Promise<{ 
	success: boolean; 
	content?: {
		title: string
		content: string
		metadata: any
	}; 
	error?: string 
}> {
	try {
		// Simular extracción de contenido de URL
		// En implementación real, esto sería una llamada a una API de extracción
		const mockContent = {
			title: `Contenido extraído de ${url}`,
			content: `Este es el contenido extraído de la URL: ${url}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
			metadata: {
				url,
				extracted_at: new Date().toISOString(),
				word_count: 45,
				language: 'es'
			}
		}

		return { success: true, content: mockContent }
	} catch (error) {
		console.error('Error extracting content from URL:', error)
		return { success: false, error: "Error al extraer contenido de la URL" }
	}
}

export async function extractContentFromFile(file: File): Promise<{ 
	success: boolean; 
	content?: {
		title: string
		content: string
		metadata: any
	}; 
	error?: string 
}> {
	try {
		// Simular extracción de contenido de archivo
		// En implementación real, esto sería procesamiento real del archivo
		const mockContent = {
			title: `Contenido extraído de ${file.name}`,
			content: `Este es el contenido extraído del archivo: ${file.name}\n\nEl archivo contiene información relevante que puede ser procesada y analizada por la IA para extraer conceptos clave y tareas.`,
			metadata: {
				filename: file.name,
				size: file.size,
				type: file.type,
				extracted_at: new Date().toISOString()
			}
		}

		return { success: true, content: mockContent }
	} catch (error) {
		console.error('Error extracting content from file:', error)
		return { success: false, error: "Error al extraer contenido del archivo" }
	}
}

export async function getSourceStats(): Promise<{ 
	success: boolean; 
	stats?: {
		total: number
		urls: number
		files: number
		voice: number
	}; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: sources, error } = await supabase
			.from('sources')
			.select('content_type')
			.eq('user_id', user.id)

		if (error) {
			console.error('Error fetching source stats:', error)
			return { success: false, error: error.message }
		}

		const stats = {
			total: sources.length,
			urls: sources.filter(s => s.content_type === 'url').length,
			files: sources.filter(s => s.content_type === 'file').length,
			voice: sources.filter(s => s.content_type === 'voice').length
		}

		return { success: true, stats }
	} catch (error) {
		console.error('Error fetching source stats:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}
