"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
	FileText, 
	LinkIcon, 
	Upload, 
	Mic, 
	Brain, 
	ChevronDown, 
	ChevronRight,
	Sparkles,
	Eye,
	Edit,
	Trash2,
	Calendar,
	Tag
} from "lucide-react"
import { toast } from "sonner"

interface NoteCardProps {
	note: {
		id: string
		title: string
		content: string
		content_type: 'text' | 'url' | 'file' | 'voice'
		tags: string[]
		created_at: string
		updated_at: string
		file_url?: string
		hasSummary: boolean
		summary?: {
			id: string
			summary: string
			key_concepts: string[]
			created_at: string
		} | null
	}
	onAnalyze: (contentId: string) => Promise<void>
	onDelete?: (contentId: string) => Promise<void>
	onEdit?: (contentId: string) => void
	onView?: (contentId: string) => void
}

export function NoteCard({ note, onAnalyze, onDelete, onEdit, onView }: NoteCardProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)

	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'text':
				return <FileText className="h-4 w-4" />
			case 'url':
				return <LinkIcon className="h-4 w-4" />
			case 'file':
				return <Upload className="h-4 w-4" />
			case 'voice':
				return <Mic className="h-4 w-4" />
			default:
				return <FileText className="h-4 w-4" />
		}
	}

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'text':
				return 'bg-blue-100 text-blue-800'
			case 'url':
				return 'bg-green-100 text-green-800'
			case 'file':
				return 'bg-purple-100 text-purple-800'
			case 'voice':
				return 'bg-orange-100 text-orange-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'text':
				return 'Texto'
			case 'url':
				return 'URL'
			case 'file':
				return 'Archivo'
			case 'voice':
				return 'Voz'
			default:
				return 'Desconocido'
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const getContentPreview = (content: string, maxLength: number = 150) => {
		if (content.length <= maxLength) return content
		return content.substring(0, maxLength) + '...'
	}

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      console.log('Iniciando análisis para nota:', note.id)
      await onAnalyze(note.id)
      toast.success("Análisis con IA completado")
    } catch (error) {
      console.error('Error analyzing content:', error)
      const errorMessage = error instanceof Error ? error.message : "Error al analizar con IA"
      toast.error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

	return (
		<Card className="p-4 hover:shadow-md transition-shadow">
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2 flex-1">
					{getTypeIcon(note.content_type)}
					<h3 className="font-semibold text-lg text-foreground line-clamp-1">
						{note.title}
					</h3>
					<Badge className={`${getTypeColor(note.content_type)} text-xs`}>
						{getTypeLabel(note.content_type)}
					</Badge>
					{note.hasSummary && (
						<Badge className="bg-emerald-100 text-emerald-800 text-xs">
							<Brain className="h-3 w-3 mr-1" />
							IA
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-1">
					{onView && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onView(note.id)}
							className="h-8 w-8 p-0"
						>
							<Eye className="h-4 w-4" />
						</Button>
					)}
					{onEdit && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onEdit(note.id)}
							className="h-8 w-8 p-0"
						>
							<Edit className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDelete(note.id)}
							className="h-8 w-8 p-0 text-destructive hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Content Preview */}
			<div className="mb-3">
				<p className="text-sm text-muted-foreground leading-relaxed">
					{getContentPreview(note.content)}
				</p>
			</div>

			{/* Tags */}
			{note.tags && note.tags.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-3">
					{note.tags.map((tag, index) => (
						<Badge key={index} variant="secondary" className="text-xs">
							<Tag className="h-3 w-3 mr-1" />
							{tag}
						</Badge>
					))}
				</div>
			)}

			{/* Metadata */}
			<div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
				<div className="flex items-center gap-1">
					<Calendar className="h-3 w-3" />
					{formatDate(note.created_at)}
				</div>
				{note.file_url && (
					<div className="flex items-center gap-1">
						<Upload className="h-3 w-3" />
						Archivo adjunto
					</div>
				)}
			</div>

			{/* AI Analysis Section */}
			{note.hasSummary && note.summary ? (
				<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
					<CollapsibleTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-between"
						>
							<div className="flex items-center gap-2">
								<Brain className="h-4 w-4" />
								<span>Análisis con IA</span>
							</div>
							{isExpanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-3 space-y-3">
						{/* Summary */}
						<div className="bg-muted/50 rounded-lg p-3">
							<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
								<Sparkles className="h-4 w-4" />
								Resumen
							</h4>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{note.summary.summary}
							</p>
						</div>

						{/* Key Concepts */}
						{note.summary.key_concepts && note.summary.key_concepts.length > 0 && (
							<div className="bg-muted/50 rounded-lg p-3">
								<h4 className="font-medium text-sm mb-2">Conceptos Clave</h4>
								<div className="flex flex-wrap gap-1">
									{note.summary.key_concepts.map((concept, index) => (
										<Badge key={index} variant="outline" className="text-xs">
											{concept}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CollapsibleContent>
				</Collapsible>
			) : (
				<Button
					variant="outline"
					size="sm"
					onClick={handleAnalyze}
					disabled={isAnalyzing}
					className="w-full"
				>
					{isAnalyzing ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
							Analizando...
						</>
					) : (
						<>
							<Brain className="h-4 w-4 mr-2" />
							Analizar con IA
						</>
					)}
				</Button>
			)}
		</Card>
	)
}
