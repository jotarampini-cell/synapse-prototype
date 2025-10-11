'use server'

import { createClient } from '@/lib/supabase/server'
import { 
	getSmartSuggestions, 
	suggestAutoTags, 
	suggestFolder 
} from '@/lib/gemini/client'

export async function getContentSuggestions(
	content: string,
	context?: string
): Promise<{
	completions: string[]
	tags: string[]
	concepts: string[]
}> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		// Obtener notas recientes para contexto
		const { data: recentNotes } = await supabase
			.from('contents')
			.select('title, content')
			.eq('user_id', user.id)
			.order('updated_at', { ascending: false })
			.limit(5)

		const previousNotes = recentNotes?.map(note => note.title) || []

		const suggestions = await getSmartSuggestions(
			content,
			context || '',
			previousNotes
		)

		return suggestions
	} catch (error) {
		console.error('Error getting content suggestions:', error)
		return {
			completions: [],
			tags: [],
			concepts: []
		}
	}
}

export async function getAutoTags(content: string): Promise<string[]> {
	try {
		const tags = await suggestAutoTags(content)
		return tags
	} catch (error) {
		console.error('Error getting auto tags:', error)
		return []
	}
}

export async function getSuggestedFolder(
	content: string,
	title?: string
): Promise<string | null> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		// Obtener carpetas del usuario
		const { data: folders } = await supabase
			.from('folders')
			.select('name')
			.eq('user_id', user.id)

		const folderNames = folders?.map(f => f.name) || []
		
		if (folderNames.length === 0) {
			return null
		}

		const fullContent = title ? `${title}\n\n${content}` : content
		const suggestedFolder = await suggestFolder(fullContent, folderNames)
		
		return suggestedFolder
	} catch (error) {
		console.error('Error getting suggested folder:', error)
		return null
	}
}

export async function getRecentNotes(limit: number = 10): Promise<{
	id: string
	title: string
	content: string
	updated_at: string
}[]> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		const { data: notes } = await supabase
			.from('contents')
			.select('id, title, content, updated_at')
			.eq('user_id', user.id)
			.order('updated_at', { ascending: false })
			.limit(limit)

		return notes || []
	} catch (error) {
		console.error('Error getting recent notes:', error)
		return []
	}
}




