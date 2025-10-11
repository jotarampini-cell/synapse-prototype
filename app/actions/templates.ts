'use server'

import { createClient } from '@/lib/supabase/server'

export interface Template {
	id: string
	name: string
	description: string
	content: string
	category: string
	is_default: boolean
	user_id: string
	created_at: string
	updated_at: string
}

export async function getTemplates(): Promise<Template[]> {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { data, error } = await supabase
		.from('templates')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching templates:', error)
		throw new Error('Error al obtener plantillas')
	}

	return data || []
}

export async function createTemplate(templateData: {
	name: string
	description: string
	content: string
	category: string
}): Promise<Template> {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { data, error } = await supabase
		.from('templates')
		.insert({
			...templateData,
			user_id: user.id,
			is_default: false
		})
		.select()
		.single()

	if (error) {
		console.error('Error creating template:', error)
		throw new Error('Error al crear plantilla')
	}

	return data
}

export async function updateTemplate(templateId: string, templateData: {
	name?: string
	description?: string
	content?: string
	category?: string
}): Promise<Template> {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { data, error } = await supabase
		.from('templates')
		.update(templateData)
		.eq('id', templateId)
		.eq('user_id', user.id)
		.select()
		.single()

	if (error) {
		console.error('Error updating template:', error)
		throw new Error('Error al actualizar plantilla')
	}

	return data
}

export async function deleteTemplate(templateId: string): Promise<void> {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { error } = await supabase
		.from('templates')
		.delete()
		.eq('id', templateId)
		.eq('user_id', user.id)

	if (error) {
		console.error('Error deleting template:', error)
		throw new Error('Error al eliminar plantilla')
	}
}

export async function getTemplateById(templateId: string): Promise<Template | null> {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { data, error } = await supabase
		.from('templates')
		.select('*')
		.eq('id', templateId)
		.eq('user_id', user.id)
		.single()

	if (error) {
		if (error.code === 'PGRST116') {
			return null // Template not found
		}
		console.error('Error fetching template:', error)
		throw new Error('Error al obtener plantilla')
	}

	return data
}

export function processTemplateContent(content: string, variables: Record<string, string> = {}): string {
	let processedContent = content
	
	// Replace default variables
	const defaultVariables = {
		fecha: new Date().toLocaleDateString('es-ES'),
		título: '',
		participantes: '',
		...variables
	}
	
	Object.entries(defaultVariables).forEach(([key, value]) => {
		const regex = new RegExp(`{{${key}}}`, 'g')
		processedContent = processedContent.replace(regex, value)
	})
	
	return processedContent
}





