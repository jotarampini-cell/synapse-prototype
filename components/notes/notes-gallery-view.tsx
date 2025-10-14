"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	MoreHorizontal,
	Edit,
	Trash2,
	Pin,
	PinOff,
	Archive,
	ArchiveRestore
} from "lucide-react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
	getUserContents, 
	updateContent, 
	deleteContent 
} from "@/app/actions/content"
import { formatRelativeDate, extractTextPreview } from "@/lib/date-grouping"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
	word_count: number
	reading_time: number
}

interface NotesGalleryViewProps {
	folderId: string | null
	onNoteSelect: (noteId: string) => void
	searchQuery?: string
}

export function NotesGalleryView({ 
	folderId, 
	onNoteSelect,
	searchQuery = ""
}: NotesGalleryViewProps) {
	const [notes, setNotes] = useState<Note[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		loadNotes()
	}, [folderId])

	// Ordenar automáticamente por updated_at DESC (más recientes primero)
	const sortedNotes = useMemo(() => {
		let filtered = [...notes]
		
		// Filtrar por búsqueda
		if (searchQuery) {
			filtered = filtered.filter(note => 
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				extractTextPreview(note.content).toLowerCase().includes(searchQuery.toLowerCase())
			)
		}
		
		// Ordenar por fecha de actualización (más recientes primero)
		return filtered.sort((a, b) => 
			new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
		)
	}, [notes, searchQuery])

	const loadNotes = async () => {
		try {
			setIsLoading(true)
			const result = await getUserContents({
				folder_id: folderId,
				limit: 100
			})
			
			if (result.success && result.contents) {
				setNotes(result.contents)
			}
		} catch (error) {
			console.error('Error loading notes:', error)
			toast.error('Error al cargar las notas')
		} finally {
			setIsLoading(false)
		}
	}

	const handleTogglePin = async (noteId: string, currentPin: boolean) => {
		try {
			const result = await updateContent(noteId, {
				is_pinned: !currentPin
			})
			
			if (result.success) {
				setNotes(prev => prev.map(note => 
					note.id === noteId 
						? { ...note, is_pinned: !currentPin }
						: note
				))
				toast.success(currentPin ? 'Nota desfijada' : 'Nota fijada')
			}
		} catch (error) {
			console.error('Error toggling pin:', error)
			toast.error('Error al actualizar la nota')
		}
	}

	const handleToggleArchive = async (noteId: string, currentArchive: boolean) => {
		try {
			const result = await updateContent(noteId, {
				is_archived: !currentArchive
			})
			
			if (result.success) {
				setNotes(prev => prev.map(note => 
					note.id === noteId 
						? { ...note, is_archived: !currentArchive }
						: note
				))
				toast.success(currentArchive ? 'Nota desarchivada' : 'Nota archivada')
			}
		} catch (error) {
			console.error('Error toggling archive:', error)
			toast.error('Error al actualizar la nota')
		}
	}

	const handleDeleteNote = async (noteId: string) => {
		try {
			const result = await deleteContent(noteId)
			
			if (result.success) {
				setNotes(prev => prev.filter(note => note.id !== noteId))
				toast.success('Nota eliminada')
			}
		} catch (error) {
			console.error('Error deleting note:', error)
			toast.error('Error al eliminar la nota')
		}
	}

	if (isLoading) {
		return (
			<div className="p-4 grid grid-cols-2 gap-4">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Card key={i} className="p-3 animate-pulse">
						<div className="h-3 bg-muted rounded mb-2" />
						<div className="h-4 bg-muted rounded mb-2" />
						<div className="h-3 bg-muted rounded w-2/3" />
					</Card>
				))}
			</div>
		)
	}

	if (sortedNotes.length === 0) {
		return (
			<div className="p-4 text-center">
				<div className="text-muted-foreground">
					{searchQuery ? 'No se encontraron notas' : 'No hay notas en esta carpeta'}
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 grid grid-cols-2 gap-4">
			{sortedNotes.map((note) => (
				<Card 
					key={note.id}
					className="p-3 cursor-pointer hover:shadow-md transition-shadow"
					onClick={() => onNoteSelect(note.id)}
				>
					{/* Preview del contenido (3-4 líneas) */}
					<div className="text-sm text-muted-foreground line-clamp-3 mb-2 min-h-[3rem]">
						{extractTextPreview(note.content)}
					</div>
					
					{/* Título fuera del preview */}
					<div className="flex items-start justify-between mb-1">
						<h3 className="font-semibold text-sm truncate flex-1">
							{note.title}
						</h3>
						
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button 
									variant="ghost" 
									size="icon"
									className="h-6 w-6 ml-1"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontal className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => handleTogglePin(note.id, note.is_pinned)}
								>
									{note.is_pinned ? (
										<PinOff className="h-4 w-4 mr-2" />
									) : (
										<Pin className="h-4 w-4 mr-2" />
									)}
									{note.is_pinned ? 'Desfijar' : 'Fijar'}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleToggleArchive(note.id, note.is_archived)}
								>
									{note.is_archived ? (
										<ArchiveRestore className="h-4 w-4 mr-2" />
									) : (
										<Archive className="h-4 w-4 mr-2" />
									)}
									{note.is_archived ? 'Desarchivar' : 'Archivar'}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem 
									className="text-destructive"
									onClick={() => handleDeleteNote(note.id)}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					
					{/* Fecha relativa */}
					<p className="text-xs text-muted-foreground">
						{formatRelativeDate(note.updated_at)}
					</p>
					
					{/* Badges para estado */}
					<div className="flex gap-1 mt-2">
						{note.is_pinned && (
							<Badge variant="secondary" className="text-xs px-1 py-0">
								Fijada
							</Badge>
						)}
						{note.is_archived && (
							<Badge variant="outline" className="text-xs px-1 py-0">
								Archivada
							</Badge>
						)}
					</div>
				</Card>
			))}
		</div>
	)
}
