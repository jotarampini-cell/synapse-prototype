"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	MoreHorizontal,
	Pin,
	Archive,
	FileText,
	Clock,
	Plus
} from "lucide-react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { formatRelativeDate, extractTextPreview } from "@/lib/date-grouping"

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

interface SampleNotesProps {
	folderId: string | null
	onNoteSelect: (noteId: string) => void
	viewMode?: 'gallery' | 'list'
}

const sampleNotes: Note[] = [
	{
		id: 'sample-1',
		title: 'Bienvenido a Synapse',
		content: 'Esta es tu primera nota en Synapse. Aquí puedes escribir tus ideas, pensamientos y organizar tu conocimiento de manera inteligente.',
		content_type: 'text',
		tags: ['bienvenida', 'inicio'],
		created_at: new Date().toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
		folder_id: null,
		is_pinned: true,
		is_archived: false,
		word_count: 25,
		reading_time: 1
	},
	{
		id: 'sample-2',
		title: 'Cómo usar las carpetas',
		content: 'Las carpetas te ayudan a organizar tus notas por temas o proyectos. Puedes crear nuevas carpetas desde el menú principal.',
		content_type: 'text',
		tags: ['ayuda', 'organización'],
		created_at: new Date().toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
		folder_id: null,
		is_pinned: false,
		is_archived: false,
		word_count: 20,
		reading_time: 1
	},
	{
		id: 'sample-3',
		title: 'Funciones de IA',
		content: 'Synapse incluye funciones de inteligencia artificial para ayudarte a resumir, extraer conceptos y encontrar conexiones entre tus notas.',
		content_type: 'text',
		tags: ['IA', 'funciones'],
		created_at: new Date().toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
		folder_id: null,
		is_pinned: false,
		is_archived: false,
		word_count: 22,
		reading_time: 1
	},
	{
		id: 'sample-4',
		title: 'Notas de voz',
		content: 'Puedes grabar notas de voz que se transcriben automáticamente. Perfecto para capturar ideas rápidamente.',
		content_type: 'voice',
		tags: ['voz', 'transcripción'],
		created_at: new Date().toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
		folder_id: null,
		is_pinned: false,
		is_archived: false,
		word_count: 18,
		reading_time: 1
	}
]

export function SampleNotes({ folderId, onNoteSelect, viewMode = 'gallery' }: SampleNotesProps) {
	const [notes, setNotes] = useState<Note[]>(sampleNotes)

	const handleCreateNote = () => {
		const newNote: Note = {
			id: `sample-${Date.now()}`,
			title: 'Nueva Nota',
			content: 'Escribe tu contenido aquí...',
			content_type: 'text',
			tags: [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			folder_id: folderId,
			is_pinned: false,
			is_archived: false,
			word_count: 5,
			reading_time: 1
		}
		setNotes(prev => [newNote, ...prev])
		onNoteSelect(newNote.id)
	}

	if (viewMode === 'list') {
		console.log('SampleNotes rendering list view with', notes.length, 'notes')
		console.log('SampleNotes list data:', notes)
		return (
			<div className="p-4 space-y-2">
				{notes.map((note) => (
					<Card 
						key={note.id}
						className="p-3 cursor-pointer hover:shadow-sm transition-all duration-200 h-20 flex items-center overflow-hidden rounded-xl border bg-card hover:bg-muted/50"
						onClick={() => onNoteSelect(note.id)}
					>
						{/* Icono de tipo de contenido */}
						<div className="flex-shrink-0 mr-3 text-muted-foreground">
							<FileText className="h-4 w-4" />
						</div>
						
						<div className="flex-1 min-w-0 overflow-hidden">
							{/* Título en negrita */}
							<div className="flex items-center gap-2 mb-1">
								<h3 className="font-semibold text-sm truncate">
									{note.title}
								</h3>
								{note.is_pinned && (
									<Pin className="h-3 w-3 text-primary flex-shrink-0" />
								)}
								{note.is_archived && (
									<Archive className="h-3 w-3 text-muted-foreground flex-shrink-0" />
								)}
							</div>
							
							{/* Preview del contenido (1 línea) */}
							<p className="text-sm text-muted-foreground line-clamp-1 truncate mb-1">
								{note.content || 'Sin contenido'}
							</p>
							
							{/* Fecha relativa abajo */}
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Clock className="h-3 w-3" />
								<span>{formatRelativeDate(note.updated_at)}</span>
								{note.word_count > 0 && (
									<span>• {note.word_count} palabras</span>
								)}
							</div>
						</div>
						
						{/* Menú opciones */}
						<div className="flex items-center gap-2 ml-3 flex-shrink-0">
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
									<DropdownMenuItem>
										<Pin className="h-4 w-4 mr-2" />
										Fijar
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Archive className="h-4 w-4 mr-2" />
										Archivar
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="text-destructive">
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

	// Vista galería
	return (
		<div className="p-3 grid grid-cols-2 gap-3">
			{notes.map((note) => (
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
								<DropdownMenuItem>
									<Pin className="h-4 w-4 mr-2" />
									Fijar
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Archive className="h-4 w-4 mr-2" />
									Archivar
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-destructive">
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					
					{/* Preview del contenido - Altura fija con overflow controlado */}
					<div className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-2 min-w-0 overflow-hidden">
						{note.content || 'Sin contenido'}
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
