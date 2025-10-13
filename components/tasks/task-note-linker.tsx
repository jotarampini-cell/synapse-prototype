"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
	Dialog, 
	DialogContent, 
	DialogHeader, 
	DialogTitle, 
	DialogTrigger 
} from "@/components/ui/dialog"
import { 
	FileText, 
	Search, 
	Plus, 
	Link as LinkIcon,
	Check
} from "lucide-react"
import { 
	linkTaskToNote,
	getNotesForLinking,
	type Task 
} from "@/app/actions/tasks"

interface TaskNoteLinkerProps {
	task: Task
	onLinkCreated: () => void
	trigger?: React.ReactNode
}

interface Note {
	id: string
	title: string
	content: string
	created_at: string
}

export function TaskNoteLinker({ task, onLinkCreated, trigger }: TaskNoteLinkerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [notes, setNotes] = useState<Note[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isLinking, setIsLinking] = useState<string | null>(null)

	// Cargar notas cuando se abre el diálogo
	useEffect(() => {
		if (isOpen) {
			loadNotes()
		}
	}, [isOpen])

	const loadNotes = async () => {
		setIsLoading(true)
		try {
			const result = await getNotesForLinking()
			if (result.success && result.notes) {
				setNotes(result.notes)
			} else {
				console.error("Error loading notes:", result.error)
				setNotes([])
			}
		} catch (error) {
			console.error("Error loading notes:", error)
			setNotes([])
		} finally {
			setIsLoading(false)
		}
	}

	// Filtrar notas basado en la búsqueda
	const filteredNotes = notes.filter(note =>
		note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		note.content.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Manejar vincular nota
	const handleLinkNote = async (noteId: string) => {
		setIsLinking(noteId)
		try {
			const result = await linkTaskToNote(task.id, noteId)
			if (result.success) {
				onLinkCreated()
				setIsOpen(false)
				setSearchQuery("")
			}
		} catch (error) {
			console.error("Error linking note:", error)
		} finally {
			setIsLinking(null)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm">
						<LinkIcon className="h-4 w-4 mr-2" />
						Vincular Nota
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl w-[95vw] sm:w-full">
				<DialogHeader>
					<DialogTitle>Vincular nota con tarea</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4">
					{/* Información de la tarea */}
					<div className="p-3 bg-muted/50 rounded-lg">
						<div className="flex items-center gap-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium">{task.title}</span>
						</div>
						{task.description && (
							<p className="text-sm text-muted-foreground mt-1">
								{task.description}
							</p>
						)}
					</div>

					{/* Búsqueda */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar notas..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Lista de notas */}
					<div className="max-h-96 overflow-y-auto space-y-2">
						{isLoading ? (
							<div className="text-center py-8 text-muted-foreground">
								Cargando notas...
							</div>
						) : filteredNotes.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								{searchQuery ? "No se encontraron notas" : "No hay notas disponibles"}
							</div>
						) : (
							filteredNotes.map((note) => (
								<div 
									key={note.id}
									className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
											<span className="font-medium truncate">{note.title}</span>
										</div>
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{note.content}
										</p>
										<div className="text-xs text-muted-foreground mt-1">
											{new Date(note.created_at).toLocaleDateString()}
										</div>
									</div>
									
									<Button
										size="sm"
										onClick={() => handleLinkNote(note.id)}
										disabled={isLinking === note.id}
									>
										{isLinking === note.id ? (
											<>
												<div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
												Vinculando...
											</>
										) : (
											<>
												<Plus className="h-4 w-4 mr-2" />
												Vincular
											</>
										)}
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
