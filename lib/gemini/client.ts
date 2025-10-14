import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando embedding dummy.')
			// Generar un embedding dummy para evitar errores
			return new Array(768).fill(0).map(() => Math.random() - 0.5)
		}

		const model = genAI.getGenerativeModel({ model: 'embedding-001' })
		const result = await model.embedContent(text)
		return result.embedding.values
	} catch (error) {
		console.error('Error generating embedding:', error)
		// En caso de error, generar un embedding dummy para evitar fallos
		console.warn('Generando embedding dummy debido a error en la API')
		return new Array(768).fill(0).map(() => Math.random() - 0.5)
	}
}

export async function generateSummary(content: string): Promise<string> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando resumen dummy.')
			return `Resumen automático: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y genera un resumen conciso y claro en español. El resumen debe capturar los puntos clave y conceptos principales:

${content}

Resumen:`

		const result = await model.generateContent(prompt)
		const response = await result.response
		return response.text()
	} catch (error) {
		console.error('Error generating summary:', error)
		// En caso de error, generar un resumen básico
		console.warn('Generando resumen dummy debido a error en la API')
		return `Resumen automático: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`
	}
}

export async function extractConcepts(content: string): Promise<string[]> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando conceptos dummy.')
			// Extraer palabras clave básicas del contenido
			const words = content.toLowerCase().split(/\s+/)
				.filter(word => word.length > 4)
				.filter(word => !['para', 'con', 'por', 'que', 'una', 'los', 'las', 'del', 'este', 'esta'].includes(word))
			return [...new Set(words)].slice(0, 5)
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Extrae los conceptos clave del siguiente contenido. Devuelve solo una lista de conceptos separados por comas, sin explicaciones adicionales:

${content}

Conceptos:`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const conceptsText = response.text()
		
		// Parse the response and clean up
		return conceptsText
			.split(',')
			.map(concept => concept.trim())
			.filter(concept => concept.length > 0)
			.slice(0, 10) // Limit to 10 concepts
	} catch (error) {
		console.error('Error extracting concepts:', error)
		// En caso de error, generar conceptos básicos
		console.warn('Generando conceptos dummy debido a error en la API')
		const words = content.toLowerCase().split(/\s+/)
			.filter(word => word.length > 4)
			.filter(word => !['para', 'con', 'por', 'que', 'una', 'los', 'las', 'del', 'este', 'esta'].includes(word))
		return [...new Set(words)].slice(0, 5)
	}
}

export async function suggestConnections(
	concepts: string[],
	existingConcepts: string[]
): Promise<Array<{ source: string; target: string; reason: string; strength: number }>> {
	try {
		// Validar que los parámetros sean arrays
		const validConcepts = Array.isArray(concepts) ? concepts : []
		const validExistingConcepts = Array.isArray(existingConcepts) ? existingConcepts : []
		
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza los siguientes conceptos y sugiere conexiones lógicas entre ellos. Considera también los conceptos existentes para encontrar relaciones.

Conceptos nuevos: ${validConcepts.join(', ')}
Conceptos existentes: ${validExistingConcepts.join(', ')}

Para cada conexión, proporciona:
- Concepto origen
- Concepto destino  
- Razón de la conexión
- Fuerza de la conexión (0-1)

Devuelve solo las conexiones más relevantes (máximo 5) en formato JSON:
[
  {
    "source": "concepto1",
    "target": "concepto2", 
    "reason": "explicación de la relación",
    "strength": 0.8
  }
]`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		// Try to parse JSON response
		try {
			// Limpiar el texto JSON removiendo markdown code blocks
			let cleanJsonText = jsonText.trim()
			if (cleanJsonText.startsWith('```json')) {
				cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
			} else if (cleanJsonText.startsWith('```')) {
				cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
			}
			
			const connections = JSON.parse(cleanJsonText)
			return Array.isArray(connections) ? connections : []
		} catch (parseError) {
			console.error('Error parsing connections JSON:', parseError)
			return []
		}
	} catch (error) {
		console.error('Error suggesting connections:', error)
		throw new Error('Failed to suggest connections')
	}
}

// =====================================================
// NUEVAS FUNCIONES DE IA PARA MAPA MENTAL Y TEMAS
// =====================================================

export async function generateMindMap(content: string): Promise<Array<{ main: string; subtopics: string[] }>> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y crea un mapa mental estructurado. Identifica los conceptos principales y sus subtemas relacionados.

${content}

Devuelve en formato JSON un array de objetos donde cada objeto representa un concepto principal con sus subtemas:
[
  {
    "main": "Concepto principal 1",
    "subtopics": ["Subtema 1", "Subtema 2", "Subtema 3"]
  },
  {
    "main": "Concepto principal 2", 
    "subtopics": ["Subtema A", "Subtema B"]
  }
]

Máximo 5 conceptos principales y 3-5 subtemas por concepto.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		try {
			// Limpiar el texto JSON removiendo markdown code blocks
			let cleanJsonText = jsonText.trim()
			if (cleanJsonText.startsWith('```json')) {
				cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
			} else if (cleanJsonText.startsWith('```')) {
				cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
			}
			
			const mindMap = JSON.parse(cleanJsonText)
			return Array.isArray(mindMap) ? mindMap : []
		} catch (parseError) {
			console.error('Error parsing mind map JSON:', parseError)
			// Fallback: crear mapa mental básico
			return [{
				main: "Conceptos principales",
				subtopics: ["Tema 1", "Tema 2", "Tema 3"]
			}]
		}
	} catch (error) {
		console.error('Error generating mind map:', error)
		throw new Error('Failed to generate mind map')
	}
}

export async function suggestRelatedTopics(content: string, existingNotes: Array<{ title: string; content: string }> = []): Promise<string[]> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		
		const existingContext = existingNotes.length > 0 
			? `\n\nNotas existentes del usuario para contexto:\n${existingNotes.map(note => `- ${note.title}: ${note.content.substring(0, 200)}...`).join('\n')}`
			: ''

		const prompt = `Analiza el siguiente contenido y sugiere 5-7 temas relacionados que podrían ser útiles para el usuario. Considera tanto temas que ya existen en sus notas como nuevos temas a explorar.

${content}${existingContext}

Devuelve solo una lista de temas separados por comas, sin explicaciones adicionales. Incluye tanto temas específicos como generales que podrían estar relacionados.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const topicsText = response.text()
		
		// Parse the response and clean up
		return topicsText
			.split(',')
			.map(topic => topic.trim())
			.filter(topic => topic.length > 0)
			.slice(0, 7) // Limit to 7 topics
	} catch (error) {
		console.error('Error suggesting related topics:', error)
		throw new Error('Failed to suggest related topics')
	}
}

export async function extractTasks(content: string): Promise<Array<{ task: string; priority: 'high' | 'medium' | 'low'; dueDate?: string }>> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y extrae ÚNICAMENTE las tareas o acciones pendientes.

INSTRUCCIONES CRÍTICAS:
- Responde SOLO con un array JSON válido
- NO incluyas explicaciones, saludos o texto adicional
- Si no hay tareas, responde: []
- Formato estricto JSON sin markdown

Texto a analizar:
${content}

FORMATO DE RESPUESTA (ejemplo):
[{"task":"Descripción de la tarea","priority":"high","dueDate":"2024-01-15"}]

Máximo 10 tareas. Si no hay tareas claras, devuelve un array vacío.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		try {
			// Extraer JSON del texto, manejando múltiples formatos
			let cleanJsonText = jsonText.trim()

			// Remover bloques de código markdown
			cleanJsonText = cleanJsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

			// Buscar el primer [ y el último ]
			const firstBracket = cleanJsonText.indexOf('[')
			const lastBracket = cleanJsonText.lastIndexOf(']')

			if (firstBracket !== -1 && lastBracket !== -1) {
				cleanJsonText = cleanJsonText.substring(firstBracket, lastBracket + 1)
			} else {
				// No hay array JSON, retornar array vacío
				console.warn('No JSON array found in response, returning empty array')
				return []
			}
			
			const tasks = JSON.parse(cleanJsonText)
			if (!Array.isArray(tasks)) {
				console.warn('Response is not an array, returning empty array')
				return []
			}
			return tasks
		} catch (parseError) {
			console.error('Error parsing tasks JSON:', parseError)
			return []
		}
	} catch (error) {
		console.error('Error extracting tasks:', error)
		throw new Error('Failed to extract tasks')
	}
}

export async function generateNoteFromTemplate(templateContent: string, userInputs: Record<string, string>): Promise<string> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		
		// Reemplazar placeholders en el template
		let processedTemplate = templateContent
		Object.entries(userInputs).forEach(([key, value]) => {
			const placeholder = `{{${key}}}`
			processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value)
		})
		
		const prompt = `Completa el siguiente template de nota reemplazando cualquier placeholder restante con contenido apropiado basado en el contexto. Mantén el formato y estructura del template.

Template:
${processedTemplate}

Si hay placeholders sin reemplazar (como {{fecha}}), reemplázalos con valores apropiados. Para {{fecha}}, usa la fecha actual. Para otros placeholders, genera contenido relevante.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		return response.text()
	} catch (error) {
		console.error('Error generating note from template:', error)
		throw new Error('Failed to generate note from template')
	}
}

export async function analyzeContentSentiment(content: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'; confidence: number }> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el sentimiento del siguiente contenido y determina si es positivo, negativo, neutral o mixto.

${content}

Devuelve en formato JSON:
{
  "sentiment": "positive|negative|neutral|mixed",
  "confidence": 0.85
}

Donde confidence es un número entre 0 y 1 que indica qué tan seguro estás del análisis.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		try {
			// Limpiar el texto JSON removiendo markdown code blocks
			let cleanJsonText = jsonText.trim()
			if (cleanJsonText.startsWith('```json')) {
				cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
			} else if (cleanJsonText.startsWith('```')) {
				cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
			}
			
			const analysis = JSON.parse(cleanJsonText)
			return {
				sentiment: analysis.sentiment || 'neutral',
				confidence: analysis.confidence || 0.5
			}
		} catch (parseError) {
			console.error('Error parsing sentiment JSON:', parseError)
			return {
				sentiment: 'neutral',
				confidence: 0.5
			}
		}
	} catch (error) {
		console.error('Error analyzing sentiment:', error)
		throw new Error('Failed to analyze sentiment')
	}
}

export async function generateSocraticQuestions(content: string): Promise<string[]> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando preguntas dummy.')
			return [
				'¿Qué aspectos de este tema te resultan más interesantes?',
				'¿Cómo podrías aplicar estos conceptos en tu vida diaria?',
				'¿Qué preguntas adicionales te surgen al reflexionar sobre esto?'
			]
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y genera 3-5 preguntas socráticas que ayuden a profundizar el pensamiento y expandir las ideas. Las preguntas deben ser abiertas, estimulantes y que inviten a la reflexión.

Contenido: "${content}"

Responde SOLO con un array JSON de strings, sin texto adicional:
["pregunta 1", "pregunta 2", "pregunta 3"]`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const text = response.text()

		// Clean and parse JSON
		const cleanedText = text.replace(/```json|```/g, '').trim()
		const questions = JSON.parse(cleanedText)

		return Array.isArray(questions) ? questions : []
	} catch (error) {
		console.error('Error generating socratic questions:', error)
		return []
	}
}

export async function getSmartSuggestions(
	currentText: string, 
	context: string, 
	previousNotes: string[]
): Promise<{
	completions: string[]
	tags: string[]
	concepts: string[]
}> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando sugerencias dummy.')
			return {
				completions: ['sugerencia 1', 'sugerencia 2', 'sugerencia 3'],
				tags: ['tag1', 'tag2', 'tag3'],
				concepts: ['concepto1', 'concepto2']
			}
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contexto de escritura y genera sugerencias inteligentes:

Texto actual: "${currentText}"
Contexto: "${context}"
Notas anteriores relacionadas: ${previousNotes.slice(0, 3).join(', ')}

Genera sugerencias en formato JSON:
{
  "completions": ["sugerencia 1", "sugerencia 2", "sugerencia 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "concepts": ["concepto1", "concepto2"]
}

- completions: 3 sugerencias para completar la frase actual
- tags: etiquetas relevantes basadas en el contenido
- concepts: conceptos clave que podrían expandirse

Responde solo con el JSON válido.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		try {
			// Limpiar el texto JSON
			let cleanJsonText = jsonText.trim()
			if (cleanJsonText.startsWith('```json')) {
				cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
			} else if (cleanJsonText.startsWith('```')) {
				cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
			}
			
			const suggestions = JSON.parse(cleanJsonText)
			return {
				completions: suggestions.completions || [],
				tags: suggestions.tags || [],
				concepts: suggestions.concepts || []
			}
		} catch (parseError) {
			console.error('Error parsing suggestions JSON:', parseError)
			return {
				completions: [],
				tags: [],
				concepts: []
			}
		}
	} catch (error) {
		console.error('Error getting smart suggestions:', error)
		return {
			completions: [],
			tags: [],
			concepts: []
		}
	}
}

export async function suggestAutoTags(content: string): Promise<string[]> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Generando tags dummy.')
			return ['tecnología', 'productividad', 'ideas']
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y sugiere 3-5 etiquetas relevantes en español:

${content}

Devuelve solo las etiquetas separadas por comas, sin numeración ni formato adicional.
Ejemplo: tecnología, productividad, ideas, aprendizaje`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const tagsText = response.text().trim()
		
		// Limpiar y dividir las etiquetas
		const tags = tagsText
			.split(',')
			.map(tag => tag.trim())
			.filter(tag => tag.length > 0)
			.slice(0, 5) // Máximo 5 etiquetas
		
		return tags
	} catch (error) {
		console.error('Error suggesting auto tags:', error)
		return []
	}
}

export async function suggestFolder(content: string, existingFolders: string[]): Promise<string | null> {
	try {
		// Verificar que la API key esté configurada
		if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
			console.warn('GEMINI_API_KEY no está configurada. Sugiriendo carpeta dummy.')
			return existingFolders[0] || null
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
		const prompt = `Analiza el siguiente contenido y sugiere la carpeta más apropiada de la lista:

Contenido: ${content}

Carpetas disponibles: ${existingFolders.join(', ')}

Responde solo con el nombre de la carpeta más apropiada, o "ninguna" si ninguna es adecuada.`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const suggestedFolder = response.text().trim()
		
		// Verificar que la carpeta sugerida esté en la lista
		if (existingFolders.includes(suggestedFolder)) {
			return suggestedFolder
		}
		
		return null
	} catch (error) {
		console.error('Error suggesting folder:', error)
		return null
	}
}

