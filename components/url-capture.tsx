"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Link, 
	Plus, 
	X, 
	ExternalLink,
	FileText,
	Globe,
	Loader2,
	CheckCircle,
	AlertCircle,
	Sparkles
} from "lucide-react"
import { toast } from "sonner"

interface URLData {
	url: string
	title: string
	content: string
	domain: string
	extracted_at: string
}

interface URLCaptureProps {
	onContentExtracted: (content: string, title: string, source: string) => void
	className?: string
}

export function URLCapture({ onContentExtracted, className = "" }: URLCaptureProps) {
	const [url, setUrl] = useState("")
	const [isExtracting, setIsExtracting] = useState(false)
	const [extractedData, setExtractedData] = useState<URLData | null>(null)
	const [showPreview, setShowPreview] = useState(false)

	const extractContentFromURL = async (url: string) => {
		if (!url.trim()) {
			toast.error("Por favor, ingresa una URL válida")
			return
		}

		// Validar URL
		try {
			new URL(url)
		} catch {
			toast.error("URL inválida")
			return
		}

		setIsExtracting(true)
		try {
			// Simular extracción de contenido (en implementación real, esto sería una API call)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// Datos simulados
			const mockData: URLData = {
				url,
				title: "Artículo sobre Inteligencia Artificial",
				content: `La inteligencia artificial está revolucionando múltiples industrias. Desde el machine learning hasta el procesamiento de lenguaje natural, las tecnologías de IA están transformando la forma en que trabajamos y vivimos.

## Principales Aplicaciones de la IA

### 1. Machine Learning
El machine learning permite a las máquinas aprender de los datos sin ser programadas explícitamente. Esto ha llevado a avances significativos en:
- Reconocimiento de imágenes
- Procesamiento de lenguaje natural
- Sistemas de recomendación

### 2. Procesamiento de Lenguaje Natural
El NLP permite a las máquinas entender e interpretar el lenguaje humano. Las aplicaciones incluyen:
- Chatbots inteligentes
- Traducción automática
- Análisis de sentimientos

### 3. Visión por Computadora
La visión por computadora permite a las máquinas interpretar y entender el mundo visual. Se utiliza en:
- Vehículos autónomos
- Diagnóstico médico
- Reconocimiento facial

## Impacto en la Sociedad

La IA está cambiando fundamentalmente la forma en que interactuamos con la tecnología. A medida que estas tecnologías maduran, podemos esperar ver:
- Mayor automatización de tareas rutinarias
- Nuevas oportunidades de empleo en campos relacionados con IA
- Mejoras en la eficiencia y productividad

## Conclusión

La inteligencia artificial representa una de las transformaciones tecnológicas más significativas de nuestro tiempo. Es crucial que desarrollemos estas tecnologías de manera responsable y ética.`,
				domain: new URL(url).hostname,
				extracted_at: new Date().toISOString()
			}

			setExtractedData(mockData)
			setShowPreview(true)
			toast.success("Contenido extraído exitosamente")
			
		} catch (error) {
			console.error('Error extracting content:', error)
			toast.error("Error al extraer contenido de la URL")
		} finally {
			setIsExtracting(false)
		}
	}

	const handleAddToNote = () => {
		if (extractedData) {
			const formattedContent = `# ${extractedData.title}

**Fuente**: [${extractedData.domain}](${extractedData.url})  
**Extraído**: ${new Date(extractedData.extracted_at).toLocaleDateString('es-ES')}

---

${extractedData.content}`
			
			onContentExtracted(formattedContent, extractedData.title, extractedData.url)
			toast.success("Contenido agregado a la nota")
			
			// Reset form
			setUrl("")
			setExtractedData(null)
			setShowPreview(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isExtracting) {
			extractContentFromURL(url)
		}
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Globe className="h-4 w-4" />
					Capturar URL
				</CardTitle>
			</CardHeader>
			
			<CardContent className="space-y-4">
				{!showPreview ? (
					<>
						<div className="space-y-2">
							<Input
								placeholder="https://ejemplo.com/articulo"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								onKeyPress={handleKeyPress}
								disabled={isExtracting}
								className="w-full"
							/>
							<p className="text-xs text-muted-foreground">
								Ingresa una URL para extraer su contenido automáticamente
							</p>
						</div>
						
						<Button
							onClick={() => extractContentFromURL(url)}
							disabled={isExtracting || !url.trim()}
							className="w-full gap-2"
						>
							{isExtracting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Extrayendo...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Extraer Contenido
								</>
							)}
						</Button>
					</>
				) : extractedData ? (
					<div className="space-y-4">
						{/* Preview del contenido extraído */}
						<div className="border border-border rounded-lg p-4 bg-muted/30">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<h3 className="font-semibold text-sm mb-1">{extractedData.title}</h3>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Globe className="h-3 w-3" />
										<span>{extractedData.domain}</span>
										<Badge variant="outline" className="text-xs">
											{extractedData.content.length} caracteres
										</Badge>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowPreview(false)}
									className="h-6 w-6 p-0"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
							
							<div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
								{extractedData.content.substring(0, 200)}...
							</div>
						</div>
						
						{/* Acciones */}
						<div className="flex gap-2">
							<Button
								onClick={handleAddToNote}
								className="flex-1 gap-2"
							>
								<Plus className="h-4 w-4" />
								Agregar a Nota
							</Button>
							<Button
								variant="outline"
								onClick={() => window.open(extractedData.url, '_blank')}
								className="gap-2"
							>
								<ExternalLink className="h-4 w-4" />
								Abrir
							</Button>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}

// Componente para mostrar fuentes en una nota
export function NoteSources({ sources }: { sources: string[] }) {
	if (sources.length === 0) return null

	return (
		<div className="mt-4 p-3 bg-muted/30 rounded-lg">
			<div className="flex items-center gap-2 mb-2">
				<Link className="h-4 w-4 text-primary" />
				<span className="text-sm font-medium">Fuentes</span>
				<Badge variant="secondary" className="text-xs">
					{sources.length}
				</Badge>
			</div>
			<div className="space-y-1">
				{sources.map((source, index) => (
					<div key={index} className="flex items-center gap-2 text-xs">
						<Globe className="h-3 w-3 text-muted-foreground" />
						<a 
							href={source} 
							target="_blank" 
							rel="noopener noreferrer"
							className="text-primary hover:underline truncate"
						>
							{source}
						</a>
					</div>
				))}
			</div>
		</div>
	)
}

