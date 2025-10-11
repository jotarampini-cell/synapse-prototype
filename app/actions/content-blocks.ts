"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ContentBlock {
	id: string
	content_id: string
	type: 'source' | 'related_note' | 'file' | 'reference'
	title: string
	url?: string
	note_id?: string
	file_url?: string
	excerpt: string
	metadata: Record<string, any>
	order_index: number
	created_at: string
	updated_at: string
}

export interface CreateContentBlockData {
	content_id: string
	type: 'source' | 'related_note' | 'file' | 'reference'
	title: string
	url?: string
	note_id?: string
	file_url?: string
	excerpt: string
	metadata?: Record<string, any>
	order_index?: number
}

export interface UpdateContentBlockData {
	title?: string
	url?: string
	note_id?: string
	file_url?: string
	excerpt?: string
	metadata?: Record<string, any>
	order_index?: number
}

export async function getContentBlocks(contentId: string): Promise<{ success: boolean; blocks?: ContentBlock[]; error?: string }> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, error: "Usuario no autenticado" }
		}

		const { data: blocks, error } = await supabase
			.from('content_blocks')
			.select('*')
			.eq('content_id', contentId)
			.order('order_index', { ascending: true })

		if (error) {
			console.error('Error fetching content blocks:', error)
			return { success: false, error: "Error al cargar bloques de contenido" }
		}

		return { success: true, blocks: blocks || [] }
	} catch (error) {
		console.error('Error in getContentBlocks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function createContentBlock(data: CreateContentBlockData): Promise<{ success: boolean; blockId?: string; error?: string }> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, error: "Usuario no autenticado" }
		}

		// Verify that the user owns the content
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id')
			.eq('id', data.content_id)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			return { success: false, error: "Contenido no encontrado o sin permisos" }
		}

		// Get the next order index if not provided
		let orderIndex = data.order_index
		if (orderIndex === undefined) {
			const { data: maxOrder } = await supabase
				.from('content_blocks')
				.select('order_index')
				.eq('content_id', data.content_id)
				.order('order_index', { ascending: false })
				.limit(1)
				.single()

			orderIndex = (maxOrder?.order_index || 0) + 1
		}

		const { data: block, error } = await supabase
			.from('content_blocks')
			.insert({
				content_id: data.content_id,
				type: data.type,
				title: data.title,
				url: data.url,
				note_id: data.note_id,
				file_url: data.file_url,
				excerpt: data.excerpt,
				metadata: data.metadata || {},
				order_index: orderIndex
			})
			.select('id')
			.single()

		if (error) {
			console.error('Error creating content block:', error)
			return { success: false, error: "Error al crear bloque de contenido" }
		}

		revalidatePath('/notes')
		return { success: true, blockId: block.id }
	} catch (error) {
		console.error('Error in createContentBlock:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function updateContentBlock(blockId: string, data: UpdateContentBlockData): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, error: "Usuario no autenticado" }
		}

		// Verify that the user owns the content block
		const { data: block, error: blockError } = await supabase
			.from('content_blocks')
			.select(`
				id,
				content:content_id (
					user_id
				)
			`)
			.eq('id', blockId)
			.single()

		if (blockError || !block || block.content.user_id !== user.id) {
			return { success: false, error: "Bloque no encontrado o sin permisos" }
		}

		const { error } = await supabase
			.from('content_blocks')
			.update({
				title: data.title,
				url: data.url,
				note_id: data.note_id,
				file_url: data.file_url,
				excerpt: data.excerpt,
				metadata: data.metadata,
				order_index: data.order_index
			})
			.eq('id', blockId)

		if (error) {
			console.error('Error updating content block:', error)
			return { success: false, error: "Error al actualizar bloque de contenido" }
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error in updateContentBlock:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function deleteContentBlock(blockId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, error: "Usuario no autenticado" }
		}

		// Verify that the user owns the content block
		const { data: block, error: blockError } = await supabase
			.from('content_blocks')
			.select(`
				id,
				content:content_id (
					user_id
				)
			`)
			.eq('id', blockId)
			.single()

		if (blockError || !block || block.content.user_id !== user.id) {
			return { success: false, error: "Bloque no encontrado o sin permisos" }
		}

		const { error } = await supabase
			.from('content_blocks')
			.delete()
			.eq('id', blockId)

		if (error) {
			console.error('Error deleting content block:', error)
			return { success: false, error: "Error al eliminar bloque de contenido" }
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error in deleteContentBlock:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

export async function reorderContentBlocks(contentId: string, blockIds: string[]): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, error: "Usuario no autenticado" }
		}

		// Verify that the user owns the content
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id')
			.eq('id', contentId)
			.eq('user_id', user.id)
			.single()

		if (contentError || !content) {
			return { success: false, error: "Contenido no encontrado o sin permisos" }
		}

		// Update order indices
		const updates = blockIds.map((blockId, index) => ({
			id: blockId,
			order_index: index + 1
		}))

		for (const update of updates) {
			const { error } = await supabase
				.from('content_blocks')
				.update({ order_index: update.order_index })
				.eq('id', update.id)
				.eq('content_id', contentId)

			if (error) {
				console.error('Error reordering content blocks:', error)
				return { success: false, error: "Error al reordenar bloques" }
			}
		}

		revalidatePath('/notes')
		return { success: true }
	} catch (error) {
		console.error('Error in reorderContentBlocks:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}
