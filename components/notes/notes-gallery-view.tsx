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
	viewMode?: 'gallery' | 'list'
}

export function NotesGalleryView({ 
	folderId, 
	onNoteSelect,
	searchQuery = "",
	viewMode = 'gallery'
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
			console.log('Loading notes for folder:', folderId)
			
			// Usar datos reales
			const result = await getUserContents({
				folder_id: folderId,
				limit: 100
			})
			
			if (result.success && result.contents) {
				// Convertir contenido a formato Note
				const notes: Note[] = result.contents.map(content => ({
					id: content.id,
					title: content.title,
					content: content.content,
					content_type: content.content_type,
					tags: content.tags || [],
					created_at: content.created_at,
					updated_at: content.updated_at,
					folder_id: content.folder_id,
					is_pinned: content.is_pinned || false,
					is_archived: content.is_archived || false,
					word_count: content.word_count || 0,
					reading_time: content.reading_time || 1
				}))
				setNotes(notes)
			} else {
				console.log('No notes found for folder:', folderId)
				setNotes([])
			}
		} catch (error) {
			console.error('Error loading notes:', error)
			toast.error('Error al cargar las notas')
			// Fallback a datos mock en caso de error
			const mockNotes: Note[] = [
				{
					id: '1',
					title: 'Nota de ejemplo 1',
					content: 'Esta es una nota de ejemplo con contenido de prueba para mostrar en la vista de galería.',
					content_type: 'text',
					tags: [],
					created_at: new Date().toISOString(),
					updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
					folder_id: folderId,
					is_pinned: false,
					is_archived: false,
					word_count: 20,
					reading_time: 1
				}
			]
			setNotes(mockNotes)
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

	// Renderizado condicional basado en viewMode
	if (viewMode === 'list') {
		return (
			<div className="p-4 space-y-2">
				{sortedNotes.map((note) => (
					<Card 
						key={note.id}
						className="p-3 cursor-pointer hover:shadow-sm transition-shadow h-20 flex items-center overflow-hidden rounded-xl border-0 bg-card/50 backdrop-blur-sm"
						onClick={() => onNoteSelect(note.id)}
					>
						<div className="flex-1 min-w-0 overflow-hidden">
							{/* Título en negrita */}
							<h3 className="font-semibold text-sm truncate mb-1">
								{note.title}
							</h3>
							
							{/* Preview del contenido (1 línea) */}
							<p className="text-xs text-muted-foreground line-clamp-1 truncate">
								{extractTextPreview(note.content)}
							</p>
							
							{/* Fecha relativa abajo */}
							<p className="text-xs text-muted-foreground mt-1 truncate">
								{formatRelativeDate(note.updated_at)}
							</p>
						</div>
						
						{/* Menú opciones y badges */}
						<div className="flex items-center gap-2 ml-3 flex-shrink-0">
							{/* Badges para estado */}
							<div className="flex gap-1">
								{note.is_pinned && (
									<Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-[10px]">
										Fijada
									</Badge>
								)}
								{note.is_archived && (
									<Badge variant="outline" className="text-xs px-1 py-0 h-4 text-[10px]">
										Archivada
									</Badge>
								)}
							</div>
							
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button 
										variant="ghost" 
										size="icon"
										className="h-6 w-6 flex-shrink-0"
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
					</Card>
				))}
			</div>
		)
	}

	// Vista galería (mejorada y más pequeña con overflow controlado)
	return (
		<div className="p-3 grid grid-cols-2 gap-3">
			{sortedNotes.map((note) => (
				<Card 
					key={note.id}
					className="p-2.5 cursor-pointer hover:shadow-sm transition-shadow h-28 flex flex-col overflow-hidden rounded-xl border-0 bg-card/50 backdrop-blur-sm"
					onClick={() => onNoteSelect(note.id)}
				>
					{/* Título arriba - Altura fija */}
					<div className="flex items-start justify-between mb-1.5 h-5 flex-shrink-0">
						<h3 className="font-medium text-sm truncate flex-1 min-w-0 pr-1">
							{note.title}
						</h3>
						
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button 
									variant="ghost" 
									size="icon"
									className="h-5 w-5 flex-shrink-0 p-0"
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
					
					{/* Preview del contenido - Altura fija con overflow controlado */}
					<div className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-1.5 min-w-0 overflow-hidden">
						{extractTextPreview(note.content)}
					</div>
					
					{/* Fecha y badges - Altura fija */}
					<div className="flex items-center justify-between h-4 flex-shrink-0">
						<p className="text-xs text-muted-foreground truncate flex-1 min-w-0 pr-1">
							{formatRelativeDate(note.updated_at)}
						</p>
						
						{/* Badges para estado - más pequeños */}
						<div className="flex gap-0.5 flex-shrink-0">
							{note.is_pinned && (
								<Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-[10px]">
									Fijada
								</Badge>
							)}
							{note.is_archived && (
								<Badge variant="outline" className="text-xs px-1 py-0 h-4 text-[10px]">
									Archivada
								</Badge>
							)}
						</div>
					</div>
				</Card>
			))}
		</div>
	)
}
