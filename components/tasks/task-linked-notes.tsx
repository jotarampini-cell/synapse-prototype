"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
	FileText, 
	Plus, 
	ExternalLink, 
	X,
	Link as LinkIcon,
	Paperclip
} from "lucide-react"
import { 
	getTaskLinkedNotes, 
	unlinkTaskFromNote,
	type Task 
} from "@/app/actions/tasks"
import { useRouter } from "next/navigation"

interface TaskLinkedNotesProps {
	task: Task
	onNotesChange: () => void
}

interface LinkedNote {
	id: string
	title: string
	content: string
}

export function TaskLinkedNotes({ task, onNotesChange }: TaskLinkedNotesProps) {
	const [linkedNotes, setLinkedNotes] = useState<LinkedNote[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	// Cargar notas vinculadas
	useEffect(() => {
		loadLinkedNotes()
	}, [task.id])

	const loadLinkedNotes = async () => {
		setIsLoading(true)
		try {
			const result = await getTaskLinkedNotes(task.id)
			if (result.success && result.notes) {
				setLinkedNotes(result.notes)
			}
		} catch (error) {
			console.error("Error loading linked notes:", error)
		} finally {
			setIsLoading(false)
		}
	}

	// Manejar desvincular nota
	const handleUnlinkNote = async (noteId: string) => {
		try {
			const result = await unlinkTaskFromNote(task.id, noteId)
			if (result.success) {
				setLinkedNotes(prev => prev.filter(note => note.id !== noteId))
				onNotesChange()
			}
		} catch (error) {
			console.error("Error unlinking note:", error)
		}
	}

	// Manejar navegar a nota
	const handleOpenNote = (noteId: string) => {
		router.push(`/notes/${noteId}`)
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Paperclip className="h-3 w-3" />
				<span>Cargando...</span>
			</div>
		)
	}

	if (linkedNotes.length === 0) {
		return null // No mostrar nada si no hay notas vinculadas
	}

	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-1.5">
				<Paperclip className="h-3 w-3 text-muted-foreground" />
				<span className="text-xs text-muted-foreground">
					{linkedNotes.length} {linkedNotes.length === 1 ? 'nota' : 'notas'}
				</span>
			</div>
			
			<div className="space-y-1">
				{linkedNotes.map((note) => (
					<div 
						key={note.id}
						className="flex items-center justify-between p-1.5 bg-muted/30 rounded-md group hover:bg-muted/50 transition-colors"
					>
						<div 
							className="flex-1 min-w-0 cursor-pointer"
							onClick={() => handleOpenNote(note.id)}
						>
							<div className="flex items-center gap-1.5">
								<FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
								<span className="text-xs font-medium truncate text-foreground/80">
									{note.title}
								</span>
								<ExternalLink className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>
							{note.content && (
								<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
									{note.content.substring(0, 60)}...
								</p>
							)}
						</div>
						
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 md:h-5 md:w-5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
							onClick={() => handleUnlinkNote(note.id)}
						>
							<X className="h-2.5 w-2.5" />
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}
