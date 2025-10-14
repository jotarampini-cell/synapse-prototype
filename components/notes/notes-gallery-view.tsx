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
	ArchiveRestore,
	FileText,
	Clock
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
	deleteContent,
	togglePinContent,
	toggleArchiveContent
} from "@/app/actions/content"
import { formatRelativeDate, extractTextPreview } from "@/lib/date-grouping"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SampleNotes } from "./sample-notes"
import { DebugListView } from "./debug-list-view"

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
	filterBy?: 'all' | 'pinned' | 'archived'
	sortBy?: 'updated_at' | 'created_at' | 'title'
	onCreateNote?: (folderId: string | null) => void
}

export function NotesGalleryView({ 
	folderId, 
	onNoteSelect,
	searchQuery = "",
	viewMode = 'gallery',
	filterBy = 'all',
	sortBy = 'updated_at',
	onCreateNote
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
		
		// Filtrar por estado (pin/archive)
		if (filterBy === 'pinned') {
			filtered = filtered.filter(note => note.is_pinned)
		} else if (filterBy === 'archived') {
			filtered = filtered.filter(note => note.is_archived)
		}
		
		// Ordenar según sortBy
		return filtered.sort((a, b) => {
			switch (sortBy) {
				case 'title':
					return a.title.localeCompare(b.title)
				case 'created_at':
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				case 'updated_at':
				default:
					return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			}
		})
	}, [notes, searchQuery, filterBy, sortBy])

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
				console.log('Notes loaded successfully:', result.contents.length, 'notes')
				console.log('Raw contents:', result.contents)
				// Convertir contenido a formato Note
				const notes: Note[] = result.contents.map(content => {
					console.log('Processing note:', content.title, 'Content type:', content.content_type, 'Content length:', content.content?.length, 'Content preview:', content.content?.substring(0, 100))
					return {
						id: content.id,
						title: content.title || 'Sin título',
						content: content.content || '',
						content_type: content.content_type || 'text',
						tags: content.tags || [],
						created_at: content.created_at,
						updated_at: content.updated_at,
						folder_id: content.folder_id,
						is_pinned: content.is_pinned || false,
						is_archived: content.is_archived || false,
						word_count: content.word_count || 0,
						reading_time: content.reading_time || 1
					}
				})
				setNotes(notes)
			} else {
				console.log('No notes found for folder:', folderId)
				setNotes([])
			}
		} catch (error) {
			console.error('Error loading notes:', error)
			toast.error('Error al cargar las notas')
			setNotes([])
		} finally {
			setIsLoading(false)
		}
	}

	const handleTogglePin = async (noteId: string, currentPin: boolean) => {
		try {
			const result = await togglePinContent(noteId)
			
			if (result.success) {
				setNotes(prev => prev.map(note => 
					note.id === noteId 
						? { ...note, is_pinned: result.is_pinned }
						: note
				))
				toast.success(result.message)
			} else {
				toast.error(result.error || 'Error al actualizar la nota')
			}
		} catch (error) {
			console.error('Error toggling pin:', error)
			toast.error('Error al actualizar la nota')
		}
	}

	const handleToggleArchive = async (noteId: string, currentArchive: boolean) => {
		try {
			const result = await toggleArchiveContent(noteId)
			
			if (result.success) {
				setNotes(prev => prev.map(note => 
					note.id === noteId 
						? { ...note, is_archived: result.is_archived }
						: note
				))
				toast.success(result.message)
			} else {
				toast.error(result.error || 'Error al actualizar la nota')
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
			<div className="p-4 space-y-2">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div
						key={i}
						className="w-full bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50 animate-pulse"
					>
						<div className="flex items-start gap-3">
							{/* Icono circular skeleton */}
							<div className="w-10 h-10 rounded-lg bg-muted/50 flex-shrink-0" />
							
							{/* Contenido principal skeleton */}
							<div className="flex-1 min-w-0 max-w-0">
								{/* Título skeleton */}
								<div className="h-4 bg-muted/50 rounded mb-1 w-3/4" />
								
								{/* Preview del contenido skeleton */}
								<div className="h-3 bg-muted/30 rounded mb-1 w-full" />
								
								{/* Información secundaria skeleton */}
								<div className="flex items-center gap-1">
									<div className="h-3 bg-muted/30 rounded w-20" />
									<div className="h-3 bg-muted/30 rounded w-1" />
									<div className="h-3 bg-muted/30 rounded w-16" />
								</div>
							</div>
							
							{/* Badge skeleton */}
							<div className="h-5 bg-muted/50 rounded w-12 flex-shrink-0" />
							
							{/* Menú skeleton */}
							<div className="h-6 w-6 bg-muted/50 rounded flex-shrink-0" />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (sortedNotes.length === 0) {
		// Si hay búsqueda, mostrar mensaje de no encontrado
		if (searchQuery) {
			return (
				<div className="p-8 text-center">
					<FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
					<p className="text-muted-foreground mb-2">
						No se encontraron notas que coincidan con "{searchQuery}"
					</p>
				</div>
			)
		}
		
		// Si no hay búsqueda, mostrar mensaje de estado vacío mejorado
		return (
			<div className="p-8 text-center">
				<FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
				<p className="text-lg font-medium text-muted-foreground mb-2">
					No tienes notas
				</p>
				<p className="text-sm text-muted-foreground/70 mb-4">
					{folderId ? 'No hay notas en esta carpeta' : 'Crea tu primera nota para comenzar'}
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onCreateNote?.(folderId)}
					className="mt-2"
				>
					Crear primera nota
				</Button>
			</div>
		)
	}

	// Renderizado condicional basado en viewMode
	console.log('NotesGalleryView render - viewMode:', viewMode, 'notes count:', sortedNotes.length)
	
        if (viewMode === 'list') {
            console.log('Rendering list view with', sortedNotes.length, 'notes')
            console.log('List view notes data:', sortedNotes)

            // VISTA DE LISTA CON DISEÑO DE ACTIVIDAD RECIENTE (HOME MÓVIL)
            return (
                <div className="p-4 space-y-2">
                    {sortedNotes.map((note) => (
                        <div
                            key={note.id}
                            className="w-full group bg-card/50 backdrop-blur-sm rounded-xl p-3 text-left transition-all active:scale-98 hover:bg-card hover:shadow-md border border-border/50 cursor-pointer"
                            onClick={() => onNoteSelect(note.id)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icono circular como en Actividad Reciente */}
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/20">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                
                                {/* Contenido principal */}
                                <div className="flex-1 min-w-0 max-w-0">
                                    {/* Título */}
                                    <h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                                        {note.title || 'Sin título'}
                                    </h3>
                                    
                                    {/* Preview del contenido */}
                                    <p className="text-xs text-muted-foreground line-clamp-1 truncate mb-1">
                                        {extractTextPreview(note.content) || note.content || 'Sin contenido'}
                                    </p>
                                    
                                    {/* Información secundaria */}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span className="truncate">{formatRelativeDate(note.updated_at)}</span>
                                        {note.word_count > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="whitespace-nowrap">{note.word_count} palabras</span>
                                            </>
                                        )}
                                        {note.is_pinned && (
                                            <>
                                                <span>•</span>
                                                <Pin className="h-3 w-3 flex-shrink-0" />
                                            </>
                                        )}
                                        {note.is_archived && (
                                            <>
                                                <span>•</span>
                                                <Archive className="h-3 w-3 flex-shrink-0" />
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Badge de tipo como en Actividad Reciente */}
                                <Badge 
                                    variant="secondary" 
                                    className="text-xs flex-shrink-0"
                                >
                                    nota
                                </Badge>
                                
                                {/* Menú opciones */}
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
                        </div>
                    ))}
                </div>
            )
        }

	// Vista galería (mejorada y más pequeña con overflow controlado)
	console.log('Rendering gallery view with', sortedNotes.length, 'notes')
	return (
		<div className="p-3 grid grid-cols-2 gap-3">
			{sortedNotes.map((note) => (
				<Card 
					key={note.id}
					className="p-3 cursor-pointer hover:shadow-sm transition-all duration-200 h-32 flex flex-col overflow-hidden rounded-xl border bg-card hover:bg-muted/50"
					onClick={() => onNoteSelect(note.id)}
				>
					{/* Título arriba - Altura fija */}
					<div className="flex items-start justify-between mb-2 h-6 flex-shrink-0">
						<div className="flex items-center gap-1 flex-1 min-w-0 pr-1">
							<FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
							<h3 className="font-medium text-sm truncate">
								{note.title}
							</h3>
						</div>
						
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
					<div className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-2 min-w-0 overflow-hidden">
						{extractTextPreview(note.content) || note.content || 'Sin contenido'}
					</div>
					
					{/* Fecha y badges - Altura fija */}
					<div className="flex items-center justify-between h-5 flex-shrink-0">
						<div className="flex items-center gap-1 text-xs text-muted-foreground flex-1 min-w-0 pr-1">
							<Clock className="h-3 w-3 flex-shrink-0" />
							<span className="truncate">{formatRelativeDate(note.updated_at)}</span>
						</div>
						
						{/* Badges para estado - más pequeños */}
						<div className="flex gap-0.5 flex-shrink-0">
							{note.is_pinned && (
								<Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-[10px]">
									<Pin className="h-2 w-2 mr-0.5" />
									Fijada
								</Badge>
							)}
							{note.is_archived && (
								<Badge variant="outline" className="text-xs px-1 py-0 h-4 text-[10px]">
									<Archive className="h-2 w-2 mr-0.5" />
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
