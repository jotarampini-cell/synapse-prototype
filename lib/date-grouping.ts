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
	if (!content) return ''
	
	try {
		// Si es JSON (BlockEditor)
		const parsed = JSON.parse(content)
		if (parsed.blocks && Array.isArray(parsed.blocks)) {
			return parsed.blocks
				.map((block: any) => block.data?.text || '')
				.join(' ')
				.replace(/<[^>]*>/g, '') // Remover HTML tags
				.substring(0, 100)
		}
	} catch {
		// Si no es JSON, tratar como texto plano
		return content
			.replace(/<[^>]*>/g, '') // Remover HTML tags
			.substring(0, 100)
	}
	
	return content.substring(0, 100)
}
