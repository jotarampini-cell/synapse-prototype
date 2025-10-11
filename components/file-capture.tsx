"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Upload, 
	File, 
	FileText, 
	Image, 
	Video, 
	Music,
	Archive,
	X,
	CheckCircle,
	AlertCircle,
	Loader2,
	Sparkles
} from "lucide-react"
import { toast } from "sonner"

interface FileData {
	name: string
	size: number
	type: string
	content: string
	extracted_at: string
}

interface FileCaptureProps {
	onContentExtracted: (content: string, title: string, source: string) => void
	className?: string
}

export function FileCapture({ onContentExtracted, className = "" }: FileCaptureProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [extractedData, setExtractedData] = useState<FileData | null>(null)
	const [showPreview, setShowPreview] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const getFileIcon = (type: string) => {
		if (type.startsWith('image/')) return <Image className="h-4 w-4" />
		if (type.startsWith('video/')) return <Video className="h-4 w-4" />
		if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
		if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />
		if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
		return <File className="h-4 w-4" />
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const extractContentFromFile = async (file: File) => {
		setIsUploading(true)
		try {
			// Simular extracción de contenido (en implementación real, esto sería una API call)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// Simular contenido extraído basado en el tipo de archivo
			let mockContent = ""
			const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
			
			if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
				mockContent = await file.text()
			} else if (file.type.includes('pdf')) {
				mockContent = `# ${fileName}

**Tipo**: Documento PDF  
**Páginas**: 15  
**Autor**: Autor del documento

## Resumen del contenido

Este documento PDF contiene información importante sobre el tema. La IA ha extraído el texto principal y lo ha estructurado para facilitar su comprensión.

### Puntos clave:
- Punto importante 1
- Punto importante 2
- Punto importante 3

### Detalles adicionales:
El contenido completo del PDF ha sido procesado y está disponible para su análisis y uso en tus notas.`
			} else if (file.type.startsWith('image/')) {
				mockContent = `# ${fileName}

**Tipo**: Imagen  
**Formato**: ${file.type}  
**Resolución**: 1920x1080

## Descripción de la imagen

Esta imagen ha sido procesada por IA para extraer información relevante. La descripción incluye elementos visuales, texto presente en la imagen, y contexto general.

### Elementos identificados:
- Elemento visual 1
- Elemento visual 2
- Texto extraído (si aplica)

### Contexto:
Descripción general del contenido y propósito de la imagen.`
			} else {
				mockContent = `# ${fileName}

**Tipo**: ${file.type}  
**Tamaño**: ${formatFileSize(file.size)}

## Contenido del archivo

Este archivo ha sido procesado y su contenido está disponible para su uso en tus notas. La IA ha extraído la información relevante y la ha estructurado de manera útil.`
			}

			const fileData: FileData = {
				name: file.name,
				size: file.size,
				type: file.type,
				content: mockContent,
				extracted_at: new Date().toISOString()
			}

			setExtractedData(fileData)
			setShowPreview(true)
			toast.success("Contenido extraído exitosamente")
			
		} catch (error) {
			console.error('Error extracting content:', error)
			toast.error("Error al extraer contenido del archivo")
		} finally {
			setIsUploading(false)
		}
	}

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			// Validar tamaño (máximo 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("El archivo es demasiado grande. Máximo 10MB")
				return
			}
			
			extractContentFromFile(file)
		}
	}

	const handleAddToNote = () => {
		if (extractedData) {
			const formattedContent = `# ${extractedData.name}

**Fuente**: Archivo (${extractedData.type})  
**Tamaño**: ${formatFileSize(extractedData.size)}  
**Extraído**: ${new Date(extractedData.extracted_at).toLocaleDateString('es-ES')}

---

${extractedData.content}`
			
			onContentExtracted(formattedContent, extractedData.name, `archivo:${extractedData.name}`)
			toast.success("Contenido agregado a la nota")
			
			// Reset form
			setExtractedData(null)
			setShowPreview(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault()
		const file = event.dataTransfer.files[0]
		if (file) {
			extractContentFromFile(file)
		}
	}

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault()
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Upload className="h-4 w-4" />
					Capturar Archivo
				</CardTitle>
			</CardHeader>
			
			<CardContent className="space-y-4">
				{!showPreview ? (
					<>
						{/* Drop zone */}
						<div
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors"
						>
							<Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
							<p className="text-sm text-muted-foreground mb-2">
								Arrastra un archivo aquí o haz clic para seleccionar
							</p>
							<p className="text-xs text-muted-foreground">
								Soporta: PDF, TXT, imágenes, documentos (máx. 10MB)
							</p>
						</div>
						
						<input
							ref={fileInputRef}
							type="file"
							onChange={handleFileSelect}
							className="hidden"
							accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
						/>
						
						<Button
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="w-full gap-2"
						>
							{isUploading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Procesando...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Seleccionar Archivo
								</>
							)}
						</Button>
					</>
				) : extractedData ? (
					<div className="space-y-4">
						{/* Preview del contenido extraído */}
						<div className="border border-border rounded-lg p-4 bg-muted/30">
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-2 flex-1 min-w-0">
									{getFileIcon(extractedData.type)}
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-sm truncate">{extractedData.name}</h3>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>{extractedData.type}</span>
											<Badge variant="outline" className="text-xs">
												{formatFileSize(extractedData.size)}
											</Badge>
										</div>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowPreview(false)}
									className="h-6 w-6 p-0 flex-shrink-0"
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
								<CheckCircle className="h-4 w-4" />
								Agregar a Nota
							</Button>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}

