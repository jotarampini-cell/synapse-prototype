"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
	Search, 
	Filter, 
	SortAsc, 
	SortDesc, 
	Pin, 
	PinOff, 
	Archive, 
	ArchiveRestore,
	MoreHorizontal,
	Edit,
	Trash2,
	Move,
	Brain,
	FileText,
	Upload,
	Mic,
	Clock
} from "lucide-react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem 
} from "@/components/ui/dropdown-menu"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { 
	getUserContents, 
	updateContent, 
	deleteContent 
} from "@/app/actions/content"
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
	word_count: number
	reading_time: number
	hasSummary?: boolean
	summary?: { summary: string; concepts: string[]; connections: string[] }
	folders?: {
		name: string
		color: string
	}
}

interface NotesListProps {
	selectedFolderId: string | null
	selectedNoteId: string | null
	onNoteSelect: (noteId: string | null) => void
	onCreateNote?: (folderId: string | null) => void
}

type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'
type FilterOption = 'all' | 'pinned' | 'archived' | 'has_ai' | 'no_ai'

export function NotesList({ selectedFolderId, selectedNoteId, onNoteSelect, onCreateNote }: NotesListProps) {
	const [notes, setNotes] = useState<Note[]>([])
	const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")
	const [sortBy, setSortBy] = useState<SortOption>('updated_desc')
	const [filterBy, setFilterBy] = useState<FilterOption>('all')
	const [showArchived, setShowArchived] = useState(false)

	useEffect(() => {
		loadNotes()
	}, [selectedFolderId])

	useEffect(() => {
		filterAndSortNotes()
	}, [notes, searchQuery, sortBy, filterBy, showArchived])

	// Escuchar eventos de actualización de notas
	useEffect(() => {
		const handleNotesUpdated = () => {
			loadNotes()
		}

		window.addEventListener('notesUpdated', handleNotesUpdated)
		return () => {
			window.removeEventListener('notesUpdated', handleNotesUpdated)
		}
	}, [])

	const loadNotes = async () => {
		try {
			setIsLoading(true)
			const result = await getUserContents()
			
			// Verificar que el resultado es válido
			let allNotes = []
			if (result && Array.isArray(result)) {
				allNotes = result
			} else if (result && result.contents && Array.isArray(result.contents)) {
				allNotes = result.contents
			} else {
				console.warn('getUserContents returned invalid data:', result)
				allNotes = []
			}
			
			// Filtrar por carpeta si está seleccionada
			let filteredNotes = allNotes
			if (selectedFolderId) {
				filteredNotes = allNotes.filter(note => note.folder_id === selectedFolderId)
			}
			
			setNotes(filteredNotes)
		} catch (error) {
			toast.error("Error al cargar notas")
			console.error("Error loading notes:", error)
			setNotes([]) // Asegurar que siempre sea un array
		} finally {
			setIsLoading(false)
		}
	}

	const filterAndSortNotes = () => {
		// Verificar que notes es un array antes de procesar
		if (!Array.isArray(notes)) {
			console.warn('Notes is not an array:', notes)
			setFilteredNotes([])
			return
		}
		
		let filtered = [...notes]

		// Aplicar filtro de búsqueda
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(note => 
				note.title.toLowerCase().includes(query) ||
				note.content.toLowerCase().includes(query) ||
				note.tags.some(tag => tag.toLowerCase().includes(query))
			)
		}

		// Aplicar filtros
		switch (filterBy) {
			case 'pinned':
				filtered = filtered.filter(note => note.is_pinned)
				break
			case 'archived':
				filtered = filtered.filter(note => note.is_archived)
				break
			case 'has_ai':
				filtered = filtered.filter(note => note.hasSummary)
				break
			case 'no_ai':
				filtered = filtered.filter(note => !note.hasSummary)
				break
		}

		// Mostrar archivadas
		if (!showArchived) {
			filtered = filtered.filter(note => !note.is_archived)
		}

		// Aplicar ordenamiento
		filtered.sort((a, b) => {
			// Notas fijadas siempre van primero
			if (a.is_pinned && !b.is_pinned) return -1
			if (!a.is_pinned && b.is_pinned) return 1

			switch (sortBy) {
				case 'created_desc':
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				case 'created_asc':
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				case 'updated_desc':
					return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
				case 'updated_asc':
					return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
				case 'title_asc':
					return a.title.localeCompare(b.title)
				case 'title_desc':
					return b.title.localeCompare(a.title)
				default:
					return 0
			}
		})

		setFilteredNotes(filtered)
	}

	const handleTogglePin = async (noteId: string, isPinned: boolean) => {
		try {
			await updateContent(noteId, new FormData())
			// Actualizar estado local
			setNotes(prev => prev.map(note => 
				note.id === noteId ? { ...note, is_pinned: !isPinned } : note
			))
			toast.success(isPinned ? "Nota desfijada" : "Nota fijada")
		} catch (error) {
			toast.error("Error al actualizar nota")
		}
	}

	const handleToggleArchive = async (noteId: string, isArchived: boolean) => {
		try {
			await updateContent(noteId, new FormData())
			// Actualizar estado local
			setNotes(prev => prev.map(note => 
				note.id === noteId ? { ...note, is_archived: !isArchived } : note
			))
			toast.success(isArchived ? "Nota desarchivada" : "Nota archivada")
		} catch (error) {
			toast.error("Error al actualizar nota")
		}
	}

	const handleDeleteNote = async (noteId: string) => {
		try {
			await deleteContent(noteId)
			setNotes(prev => prev.filter(note => note.id !== noteId))
			if (selectedNoteId === noteId) {
				onNoteSelect(null)
			}
			toast.success("Nota eliminada")
		} catch (error) {
			toast.error("Error al eliminar nota")
		}
	}

	const getContentTypeIcon = (contentType: string) => {
		switch (contentType) {
			case 'text':
				return <FileText className="w-4 h-4" />
			case 'file':
				return <Upload className="w-4 h-4" />
			case 'voice':
				return <Mic className="w-4 h-4" />
			default:
				return <FileText className="w-4 h-4" />
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
		
		if (diffInHours < 24) {
			return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
		} else if (diffInHours < 24 * 7) {
			return date.toLocaleDateString('es-ES', { weekday: 'short' })
		} else {
			return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
		}
	}

	const getContentPreview = (content: string, maxLength: number = 100) => {
		const cleanContent = content.replace(/[#*`]/g, '').trim()
		return cleanContent.length > maxLength 
			? cleanContent.substring(0, maxLength) + '...'
			: cleanContent
	}

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<div className="p-4 border-b border-border">
					<div className="animate-pulse space-y-3">
						<div className="h-8 bg-muted rounded"></div>
						<div className="h-6 bg-muted rounded w-3/4"></div>
					</div>
				</div>
				<div className="flex-1 p-4 space-y-3">
					{[1, 2, 3, 4, 5].map(i => (
						<div key={i} className="animate-pulse">
							<div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
							<div className="h-3 bg-muted rounded w-1/2"></div>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-foreground">
						{selectedFolderId ? 'Notas' : 'Todas las notas'}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onCreateNote?.(selectedFolderId)}
						className="h-8 w-8 p-0"
					>
						<FileText className="w-4 h-4" />
					</Button>
				</div>

				{/* Search */}
				<div className="relative mb-3">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar notas..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Filters and Sort */}
				<div className="flex gap-2">
					<Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todas</SelectItem>
							<SelectItem value="pinned">Fijadas</SelectItem>
							<SelectItem value="archived">Archivadas</SelectItem>
							<SelectItem value="has_ai">Con IA</SelectItem>
							<SelectItem value="no_ai">Sin IA</SelectItem>
						</SelectContent>
					</Select>

					<Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
						<SelectTrigger className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="updated_desc">Recientes</SelectItem>
							<SelectItem value="created_desc">Nuevas</SelectItem>
							<SelectItem value="title_asc">A-Z</SelectItem>
							<SelectItem value="title_desc">Z-A</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowArchived(!showArchived)}
						className={showArchived ? 'bg-muted' : ''}
					>
						<Archive className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Notes List */}
			<div className="flex-1 overflow-y-auto">
				{filteredNotes.length === 0 ? (
					<div className="p-8 text-center text-muted-foreground">
						<FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm">
							{searchQuery ? 'No se encontraron notas' : 'No hay notas en esta carpeta'}
						</p>
						{!searchQuery && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onCreateNote?.(selectedFolderId)}
								className="mt-3"
							>
								Crear primera nota
							</Button>
						)}
					</div>
				) : (
					<div className="p-2 space-y-1">
						{filteredNotes.map((note) => (
							<Card
								key={note.id}
								className={`group p-3 cursor-pointer transition-all hover:shadow-sm ${
									selectedNoteId === note.id 
										? 'ring-2 ring-primary bg-primary/5' 
										: 'hover:bg-muted/50'
								} ${note.is_archived ? 'opacity-60' : ''}`}
								onClick={() => onNoteSelect(note.id)}
							>
								<div className="flex items-start gap-3">
									{/* Content Type Icon */}
									<div className="flex-shrink-0 mt-0.5 text-muted-foreground">
										{getContentTypeIcon(note.content_type)}
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-medium text-sm truncate">
												{note.title}
											</h3>
											{note.is_pinned && (
												<Pin className="w-3 h-3 text-primary flex-shrink-0" />
											)}
											{note.is_archived && (
												<Archive className="w-3 h-3 text-muted-foreground flex-shrink-0" />
											)}
										</div>
										
										<p className="text-xs text-muted-foreground mb-2 line-clamp-2">
											{getContentPreview(note.content)}
										</p>

										{/* Tags */}
										{note.tags && note.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 mb-2">
												{note.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
														{tag}
													</Badge>
												))}
												{note.tags.length > 3 && (
													<Badge variant="secondary" className="text-xs px-1.5 py-0.5">
														+{note.tags.length - 3}
													</Badge>
												)}
											</div>
										)}

										{/* Footer */}
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<div className="flex items-center gap-3">
												<span className="flex items-center gap-1">
													<Clock className="w-3 h-3" />
													{formatDate(note.updated_at)}
												</span>
												{note.word_count > 0 && (
													<span>{note.word_count} palabras</span>
												)}
											</div>
											
											{note.hasSummary && (
												<Brain className="w-3 h-3 text-primary" />
											)}
										</div>
									</div>

									{/* Actions */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={(e) => e.stopPropagation()}
											>
												<MoreHorizontal className="w-3 h-3" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem onClick={() => onNoteSelect(note.id)}>
												<Edit className="w-4 h-4 mr-2" />
												Abrir
											</DropdownMenuItem>
											<DropdownMenuItem 
												onClick={() => handleTogglePin(note.id, note.is_pinned)}
											>
												{note.is_pinned ? (
													<>
														<PinOff className="w-4 h-4 mr-2" />
														Desfijar
													</>
												) : (
													<>
														<Pin className="w-4 h-4 mr-2" />
														Fijar
													</>
												)}
											</DropdownMenuItem>
											<DropdownMenuItem 
												onClick={() => handleToggleArchive(note.id, note.is_archived)}
											>
												{note.is_archived ? (
													<>
														<ArchiveRestore className="w-4 h-4 mr-2" />
														Desarchivar
													</>
												) : (
													<>
														<Archive className="w-4 h-4 mr-2" />
														Archivar
													</>
												)}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem 
												onClick={() => handleDeleteNote(note.id)}
												className="text-destructive"
											>
												<Trash2 className="w-4 h-4 mr-2" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
