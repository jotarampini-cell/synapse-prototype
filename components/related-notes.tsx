"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
	Network, 
	ArrowRight, 
	FileText, 
	Clock, 
	Tag,
	Sparkles,
	ThumbsUp,
	ThumbsDown,
	RefreshCw
} from "lucide-react"
import { getRelatedNotes } from "@/app/actions/ai-analysis"

interface RelatedNote {
	id: string
	title: string
	content: string
	similarity: number
	connectionType: 'topic' | 'concept' | 'task' | 'keyword'
	created_at: string
	updated_at: string
}

interface RelatedNotesProps {
	noteId: string | null
	noteContent: string
	noteTitle: string
	onNoteSelect: (noteId: string) => void
	className?: string
}

export function RelatedNotes({ 
	noteId, 
	noteContent, 
	noteTitle, 
	onNoteSelect,
	className = "" 
}: RelatedNotesProps) {
	const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [feedback, setFeedback] = useState<{[key: string]: 'useful' | 'not-useful' | null}>({})

	useEffect(() => {
		if (noteId && noteContent.length > 50) {
			loadRelatedNotes()
		}
	}, [noteId, noteContent])

	const loadRelatedNotes = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			const result = await getRelatedNotes(noteId)
			if (result.success && result.data) {
				setRelatedNotes(result.data)
			}
		} catch (error) {
			console.error('Error loading related notes:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleFeedback = (noteId: string, isUseful: boolean) => {
		setFeedback(prev => ({
			...prev,
			[noteId]: isUseful ? 'useful' : 'not-useful'
		}))
		
		// Aquí se podría enviar el feedback a la base de datos para mejorar las conexiones
		console.log(`Feedback para conexión ${noteId}: ${isUseful ? 'útil' : 'no útil'}`)
	}

	const getConnectionTypeLabel = (type: string) => {
		switch (type) {
			case 'topic': return 'Mismo tema'
			case 'concept': return 'Concepto similar'
			case 'task': return 'Tarea relacionada'
			case 'keyword': return 'Palabra clave'
			default: return 'Relacionado'
		}
	}

	const getConnectionTypeColor = (type: string) => {
		switch (type) {
			case 'topic': return 'bg-blue-100 text-blue-800'
			case 'concept': return 'bg-purple-100 text-purple-800'
			case 'task': return 'bg-green-100 text-green-800'
			case 'keyword': return 'bg-orange-100 text-orange-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: 'numeric',
			month: 'short'
		})
	}

	const getSimilarityColor = (similarity: number) => {
		if (similarity > 0.8) return 'text-green-600'
		if (similarity > 0.6) return 'text-yellow-600'
		return 'text-orange-600'
	}

	if (!noteId || noteContent.length < 50) {
		return null
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Network className="h-4 w-4" />
						Notas Relacionadas
						{relatedNotes.length > 0 && (
							<Badge variant="secondary" className="text-xs">
								{relatedNotes.length}
							</Badge>
						)}
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={loadRelatedNotes}
						disabled={isLoading}
						className="h-6 w-6 p-0"
						title="Actualizar conexiones"
					>
						{isLoading ? (
							<RefreshCw className="h-3 w-3 animate-spin" />
						) : (
							<Sparkles className="h-3 w-3" />
						)}
					</Button>
				</div>
			</CardHeader>
			
			<CardContent className="space-y-3">
				{isLoading ? (
					<div className="flex items-center justify-center py-4">
						<div className="text-center">
							<RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Buscando conexiones...</p>
						</div>
					</div>
				) : relatedNotes.length > 0 ? (
					<div className="space-y-3">
						{relatedNotes.map((note) => (
							<div
								key={note.id}
								className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
								onClick={() => onNoteSelect(note.id)}
							>
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm truncate mb-1">
											{note.title}
										</h4>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{note.content.substring(0, 100)}...
										</p>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
								</div>
								
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge 
											variant="outline" 
											className={`text-xs ${getConnectionTypeColor(note.connectionType)}`}
										>
											{getConnectionTypeLabel(note.connectionType)}
										</Badge>
										<span className={`text-xs font-medium ${getSimilarityColor(note.similarity)}`}>
											{Math.round(note.similarity * 100)}% similar
										</span>
									</div>
									
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												handleFeedback(note.id, true)
											}}
											className={`h-5 w-5 p-0 ${feedback[note.id] === 'useful' ? 'text-green-600' : 'text-muted-foreground'}`}
										>
											<ThumbsUp className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												handleFeedback(note.id, false)
											}}
											className={`h-5 w-5 p-0 ${feedback[note.id] === 'not-useful' ? 'text-red-600' : 'text-muted-foreground'}`}
										>
											<ThumbsDown className="h-3 w-3" />
										</Button>
									</div>
								</div>
								
								<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
									<Clock className="h-3 w-3" />
									<span>Actualizada {formatDate(note.updated_at)}</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-4">
						<Network className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
						<p className="text-sm text-muted-foreground">
							No se encontraron notas relacionadas
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={loadRelatedNotes}
							className="mt-2 gap-1"
						>
							<Sparkles className="h-3 w-3" />
							Buscar conexiones
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

// Componente para mostrar conexiones en el panel de IA
export function RelatedNotesPanel({ 
	noteId, 
	noteContent, 
	noteTitle 
}: { 
	noteId: string | null
	noteContent: string
	noteTitle: string
}) {
	const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (noteId && noteContent.length > 50) {
			loadRelatedNotes()
		}
	}, [noteId, noteContent])

	const loadRelatedNotes = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			const result = await getRelatedNotes(noteId)
			if (result.success && result.data) {
				setRelatedNotes(result.data)
			}
		} catch (error) {
			console.error('Error loading related notes:', error)
		} finally {
			setIsLoading(false)
		}
	}

	if (!noteId || noteContent.length < 50) {
		return null
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Network className="h-4 w-4 text-primary" />
				<span className="text-sm font-medium">Conexiones</span>
				{isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
			</div>
			
			{relatedNotes.length > 0 ? (
				<div className="space-y-2">
					{relatedNotes.slice(0, 3).map((note) => (
						<div
							key={note.id}
							className="p-2 bg-muted/30 rounded text-xs"
						>
							<div className="font-medium truncate">{note.title}</div>
							<div className="text-muted-foreground">
								{getConnectionTypeLabel(note.connectionType)} • {Math.round(note.similarity * 100)}% similar
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-xs text-muted-foreground">
					No se encontraron conexiones automáticas
				</p>
			)}
		</div>
	)
}

