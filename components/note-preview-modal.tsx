"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Save, FileText, Brain, Star, Calendar, FolderOpen } from "lucide-react"
import { getContentById, updateContent } from "@/app/actions/content"
import { toast } from "sonner"

interface Note {
	id: string
	title: string
	content: string
	content_type: string
	tags: string[]
	created_at: string
	updated_at: string
	folder_id: string | null
	is_pinned: boolean
	is_archived: boolean
	hasSummary: boolean
	folders?: {
		name: string
		color: string
	}
}

interface NotePreviewModalProps {
	isOpen: boolean
	onClose: () => void
	noteId: string | null
	onNavigateToNotes: (noteId: string) => void
	onNoteSaved?: () => void
}

export function NotePreviewModal({ 
	isOpen, 
	onClose, 
	noteId, 
	onNavigateToNotes, 
	onNoteSaved 
}: NotePreviewModalProps) {
	const [note, setNote] = useState<Note | null>(null)
	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)

	// Cargar la nota cuando se abre el modal
	useEffect(() => {
		if (isOpen && noteId) {
			loadNote()
		}
	}, [isOpen, noteId])

	// Detectar cambios
	useEffect(() => {
		if (note) {
			const titleChanged = title !== note.title
			const contentChanged = content !== note.content
			setHasChanges(titleChanged || contentChanged)
		}
	}, [title, content, note])

	const loadNote = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			const noteData = await getContentById(noteId)
			if (noteData) {
				setNote(noteData)
				setTitle(noteData.title)
				setContent(noteData.content)
			} else {
				toast.error("No se pudo cargar la nota")
				onClose()
			}
		} catch (error) {
			console.error('Error loading note:', error)
			toast.error("Error al cargar la nota")
			onClose()
		} finally {
			setIsLoading(false)
		}
	}

	const handleSave = async () => {
		if (!noteId || !hasChanges) return

		setIsSaving(true)
		try {
			const formData = new FormData()
			formData.set('title', title.trim())
			formData.set('content', content.trim())
			formData.set('tags', note?.tags?.join(',') || '')
			formData.set('folder_id', note?.folder_id || '')

			await updateContent(noteId, formData, { skipAI: true })
			
			toast.success("Nota guardada exitosamente")
			setHasChanges(false)
			onNoteSaved?.()
		} catch (error) {
			console.error('Error saving note:', error)
			toast.error("Error al guardar la nota")
		} finally {
			setIsSaving(false)
		}
	}

	const handleNavigateToNotes = () => {
		if (noteId) {
			onNavigateToNotes(noteId)
		}
	}

	const handleClose = () => {
		if (hasChanges) {
			const shouldClose = window.confirm("¿Deseas guardar los cambios antes de cerrar?")
			if (shouldClose) {
				handleSave()
			}
		}
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div 
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={handleClose}
			/>
			
			{/* Modal */}
			<Card className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-card border-border shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-border">
					<div className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-semibold text-foreground">
							Vista Previa de Nota
						</h2>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClose}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							<span className="ml-2 text-muted-foreground">Cargando nota...</span>
						</div>
					) : note ? (
						<>
							{/* Metadatos */}
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline" className="text-xs">
									{note.content_type === 'text' ? 'Texto' :
									 note.content_type === 'file' ? 'Archivo' : 'Voz'}
								</Badge>
								{note.hasSummary && (
									<Badge className="bg-emerald-100 text-emerald-800 text-xs">
										<Brain className="h-3 w-3 mr-1" />
										Con IA
									</Badge>
								)}
								{note.is_pinned && (
									<Badge className="bg-yellow-100 text-yellow-800 text-xs">
										<Star className="h-3 w-3 mr-1" />
										Fijada
									</Badge>
								)}
								{note.folders && (
									<Badge variant="outline" className="text-xs">
										<FolderOpen className="h-3 w-3 mr-1" />
										{note.folders.name}
									</Badge>
								)}
								<Badge variant="outline" className="text-xs">
									<Calendar className="h-3 w-3 mr-1" />
									{new Date(note.updated_at).toLocaleDateString('es-ES')}
								</Badge>
							</div>

							{/* Título editable */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-foreground">
									Título
								</label>
								<Input
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Título de la nota"
									className="text-lg font-medium"
								/>
							</div>

							{/* Contenido editable */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-foreground">
									Contenido
								</label>
								<Textarea
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="Contenido de la nota"
									className="min-h-[200px] resize-none"
								/>
							</div>

							{/* Tags */}
							{note.tags && note.tags.length > 0 && (
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground">
										Tags
									</label>
									<div className="flex flex-wrap gap-1">
										{note.tags.map((tag, index) => (
											<Badge key={index} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground">No se pudo cargar la nota</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-6 border-t border-border">
					<div className="flex items-center gap-2">
						{hasChanges && (
							<span className="text-xs text-muted-foreground">
								Cambios sin guardar
							</span>
						)}
					</div>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={handleClose}
						>
							Cerrar
						</Button>
						{hasChanges && (
							<Button
								onClick={handleSave}
								disabled={isSaving}
								className="gap-2"
							>
								<Save className="h-4 w-4" />
								{isSaving ? 'Guardando...' : 'Guardar'}
							</Button>
						)}
						<Button
							onClick={handleNavigateToNotes}
							className="gap-2"
						>
							<FileText className="h-4 w-4" />
							Abrir en Mis Notas
						</Button>
					</div>
				</div>
			</Card>
		</div>
	)
}


