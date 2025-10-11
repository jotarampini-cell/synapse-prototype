"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, Save, FileText } from "lucide-react"
import { createBasicTextContent } from "@/app/actions/content"
import { toast } from "sonner"

interface QuickNoteModalProps {
	isOpen: boolean
	onClose: () => void
	onNoteCreated?: () => void
}


export function QuickNoteModal({ isOpen, onClose, onNoteCreated }: QuickNoteModalProps) {
	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!title.trim() || !content.trim()) {
			toast.error("Título y contenido son requeridos")
			return
		}

		setIsLoading(true)
		
		try {
			const formData = new FormData()
			formData.set('title', title.trim())
			formData.set('content', content.trim())
			formData.set('tags', '')
			// No enviar folder_id - la nota se creará en la carpeta Inbox por defecto

			const result = await createBasicTextContent(formData)
			
			if (result?.contentId) {
				toast.success("¡Nota creada exitosamente!")
				// Disparar evento para actualizar contadores y listas
				window.dispatchEvent(new CustomEvent('notesUpdated'))
				resetForm()
				onClose()
				onNoteCreated?.()
			} else {
				toast.error("Error al crear la nota")
			}
		} catch (error) {
			console.error('Error creating note:', error)
			toast.error(error instanceof Error ? error.message : "Error al crear la nota")
		} finally {
			setIsLoading(false)
		}
	}

	const resetForm = () => {
		setTitle("")
		setContent("")
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
			<Card className="relative w-full max-w-lg max-h-[90vh] border-border bg-card p-6 shadow-2xl overflow-y-auto">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="h-6 w-6 text-primary" />
						<h2 className="text-xl font-bold text-card-foreground">Nueva Nota</h2>
					</div>
					<Button 
						variant="ghost" 
						size="sm" 
						onClick={handleClose}
						className="h-8 w-8 p-0 hover:bg-muted"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Título */}
					<div className="space-y-2">
						<Label htmlFor="title" className="text-sm font-medium text-card-foreground">
							Título *
						</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="¿De qué se trata tu nota?"
							className="bg-background"
							required
							autoFocus
						/>
					</div>

					{/* Contenido */}
					<div className="space-y-2">
						<Label htmlFor="content" className="text-sm font-medium text-card-foreground">
							Contenido *
						</Label>
						<Textarea
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Escribe tus ideas aquí..."
							rows={6}
							className="resize-none bg-background min-h-[120px] max-h-[300px] overflow-y-auto"
							required
						/>
					</div>

					{/* Nota: Las notas se crean en la carpeta Inbox por defecto */}
					<div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
						💡 La nota se creará en tu carpeta Inbox. Puedes organizarla después desde el editor.
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-3 pt-4">
						<Button 
							type="button" 
							variant="outline" 
							onClick={handleClose}
							className="bg-transparent"
						>
							Cancelar
						</Button>
						<Button 
							type="submit" 
							disabled={isLoading || !title.trim() || !content.trim()}
							className="gap-2"
						>
							<Save className="h-4 w-4" />
							{isLoading ? "Guardando..." : "Guardar Nota"}
						</Button>
					</div>
				</form>
			</Card>
		</div>
	)
}
