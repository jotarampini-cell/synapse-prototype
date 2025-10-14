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
	deleteContent 
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
		
		// Si no hay búsqueda, mostrar notas de ejemplo
		return <SampleNotes folderId={folderId} onNoteSelect={onNoteSelect} viewMode={viewMode} />
	}

	// Renderizado condicional basado en viewMode
	console.log('NotesGalleryView render - viewMode:', viewMode, 'notes count:', sortedNotes.length)
	
	if (viewMode === 'list') {
		console.log('Rendering list view with', sortedNotes.length, 'notes')
		console.log('List view notes data:', sortedNotes)
		
		// NUEVA VISTA DE LISTA SIMPLIFICADA Y FUNCIONAL
		return (
			<div style={{ padding: '16px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>
					Vista de Lista - {sortedNotes.length} notas
				</h2>
				{sortedNotes.map((note) => (
					<div 
						key={note.id}
						style={{ 
							padding: '12px', 
							border: '1px solid #e5e7eb', 
							backgroundColor: 'white',
							marginBottom: '8px',
							borderRadius: '8px',
							cursor: 'pointer',
							boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
						}}
						onClick={() => onNoteSelect(note.id)}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<FileText style={{ width: '16px', height: '16px', color: '#6b7280' }} />
							<div style={{ flex: 1 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
									<h3 style={{ 
										fontWeight: 'bold', 
										fontSize: '14px', 
										color: 'black',
										margin: 0
									}}>
										{note.title || 'Sin título'}
									</h3>
									{note.is_pinned && (
										<Pin style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
									)}
									{note.is_archived && (
										<Archive style={{ width: '12px', height: '12px', color: '#6b7280' }} />
									)}
								</div>
								<p style={{ 
									fontSize: '12px', 
									color: '#6b7280',
									margin: '0 0 4px 0',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									{note.content || 'Sin contenido'}
								</p>
								<div style={{ 
									display: 'flex', 
									alignItems: 'center', 
									gap: '4px',
									fontSize: '10px',
									color: '#9ca3af'
								}}>
									<Clock style={{ width: '12px', height: '12px' }} />
									<span>{formatRelativeDate(note.updated_at)}</span>
									{note.word_count > 0 && (
										<span>• {note.word_count} palabras</span>
									)}
								</div>
							</div>
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
