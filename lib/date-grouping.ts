export function formatRelativeDate(date: string): string {
	const now = new Date()
	const noteDate = new Date(date)
	const diffInHours = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60)
	
	if (diffInHours < 1) return 'Hace unos minutos'
	if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)}h`
	if (diffInHours < 48) return 'Ayer'
	if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)} días`
	
	// Si > 1 semana, mostrar fecha completa
	return noteDate.toLocaleDateString('es-ES', { 
		day: 'numeric', 
		month: 'short' 
	})
}

export function extractTextPreview(content: string): string {
	// Extraer texto plano del contenido (puede ser HTML o JSON)
	if (!content || content.trim() === '') {
		return 'Sin contenido'
	}
	
	try {
		// Si es JSON (BlockEditor)
		const parsed = JSON.parse(content)
		if (parsed.blocks && Array.isArray(parsed.blocks)) {
			const result = parsed.blocks
				.map((block: any) => {
					// Extraer texto de diferentes tipos de bloques
					if (block.data?.text) return block.data.text
					if (block.data?.content) return block.data.content
					if (block.text) return block.text
					return ''
				})
				.join(' ')
				.replace(/<[^>]*>/g, '') // Remover HTML tags
				.replace(/\s+/g, ' ') // Normalizar espacios
				.trim()
				.substring(0, 120)
			return result || 'Sin contenido'
		}
	} catch {
		// Si no es JSON, tratar como texto plano
		const result = content
			.replace(/<[^>]*>/g, '') // Remover HTML tags
			.replace(/\s+/g, ' ') // Normalizar espacios
			.trim()
			.substring(0, 120)
		return result || 'Sin contenido'
	}
	
	const result = content
		.replace(/\s+/g, ' ') // Normalizar espacios
		.trim()
		.substring(0, 120)
	return result || 'Sin contenido'
}
