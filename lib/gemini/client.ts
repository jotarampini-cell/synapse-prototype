import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const model = genAI.getGenerativeModel({ model: 'embedding-001' })
		const result = await model.embedContent(text)
		return result.embedding.values
	} catch (error) {
		console.error('Error generating embedding:', error)
		throw new Error('Failed to generate embedding')
	}
}

export async function generateSummary(content: string): Promise<string> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
		const prompt = `Analiza el siguiente contenido y genera un resumen conciso y claro en español. El resumen debe capturar los puntos clave y conceptos principales:

${content}

Resumen:`

		const result = await model.generateContent(prompt)
		const response = await result.response
		return response.text()
	} catch (error) {
		console.error('Error generating summary:', error)
		throw new Error('Failed to generate summary')
	}
}

export async function extractConcepts(content: string): Promise<string[]> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
		throw new Error('Failed to extract concepts')
	}
}

export async function suggestConnections(
	concepts: string[],
	existingConcepts: string[]
): Promise<Array<{ source: string; target: string; reason: string; strength: number }>> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
		const prompt = `Analiza los siguientes conceptos y sugiere conexiones lógicas entre ellos. Considera también los conceptos existentes para encontrar relaciones.

Conceptos nuevos: ${concepts.join(', ')}
Conceptos existentes: ${existingConcepts.join(', ')}

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
			const connections = JSON.parse(jsonText)
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

export async function extractUrlContent(url: string): Promise<{ title: string; content: string }> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
		const prompt = `Extrae el contenido principal de la siguiente URL. Proporciona el título y el contenido principal en texto plano:

URL: ${url}

Devuelve en formato JSON:
{
  "title": "título del contenido",
  "content": "contenido principal extraído"
}`

		const result = await model.generateContent(prompt)
		const response = await result.response
		const jsonText = response.text()
		
		try {
			const extracted = JSON.parse(jsonText)
			return {
				title: extracted.title || 'Sin título',
				content: extracted.content || 'No se pudo extraer contenido'
			}
		} catch (parseError) {
			console.error('Error parsing URL content JSON:', parseError)
			return {
				title: 'Contenido extraído',
				content: jsonText
			}
		}
	} catch (error) {
		console.error('Error extracting URL content:', error)
		throw new Error('Failed to extract URL content')
	}
}
