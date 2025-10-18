"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
	FileText, 
	Search, 
	Link, 
	Loader2,
	Plus
} from "lucide-react"
import { addNoteToProject, getProjectNotes } from "@/app/actions/projects"
import { getContents } from "@/app/actions/content"
import { toast } from "sonner"

interface LinkNoteToProjectProps {
	projectId: string
	projectName: string
	onNoteLinked?: () => void
	trigger?: React.ReactNode
}

interface Note {
	id: string
	title: string
	content: string
	content_type: string
	tags: string[]
	created_at: string
}

export function LinkNoteToProject({ 
	projectId, 
	projectName, 
	onNoteLinked,
	trigger 
}: LinkNoteToProjectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isLinking, setIsLinking] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [notes, setNotes] = useState<Note[]>([])
	const [linkedNotes, setLinkedNotes] = useState<string[]>([])

	// Cargar notas disponibles y notas ya vinculadas
	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen, projectId])

	const loadData = async () => {
		setIsLoading(true)
		try {
			const [notesResult, linkedResult] = await Promise.all([
				getContents(),
				getProjectNotes(projectId)
			])

			if (notesResult.success && notesResult.contents) {
				setNotes(notesResult.contents)
			}

			if (linkedResult.success && linkedResult.notes) {
				setLinkedNotes(linkedResult.notes.map(note => note.id))
			}
		} catch (error) {
			toast.error("Error al cargar notas")
		} finally {
			setIsLoading(false)
		}
	}

	const handleLinkNote = async (noteId: string) => {
		setIsLinking(true)
		try {
			const result = await addNoteToProject(projectId, noteId)
			if (result.success) {
				toast.success("Nota vinculada al proyecto")
				setLinkedNotes(prev => [...prev, noteId])
				onNoteLinked?.()
			} else {
				toast.error(result.error || "Error al vincular nota")
			}
		} catch (error) {
			toast.error("Error al vincular nota")
		} finally {
			setIsLinking(false)
		}
	}

	const filteredNotes = notes.filter(note => {
		const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.content.toLowerCase().includes(searchQuery.toLowerCase())
		const isNotLinked = !linkedNotes.includes(note.id)
		return matchesSearch && isNotLinked
	})

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm">
						<Plus className="h-4 w-4 mr-2" />
						Vincular Nota
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[80vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Vincular Nota a "{projectName}"
					</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4">
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
							<div className="text-center py-8">
								<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Cargando notas...</p>
							</div>
						) : filteredNotes.length > 0 ? (
							filteredNotes.map((note) => (
								<Card key={note.id} className="p-3">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-sm mb-1 truncate">{note.title}</h4>
											<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
												{note.content}
											</p>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-xs">
													{note.content_type}
												</Badge>
												<span className="text-xs text-muted-foreground">
													{formatDate(note.created_at)}
												</span>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleLinkNote(note.id)}
											disabled={isLinking}
											className="ml-2"
										>
											{isLinking ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<>
													<Link className="h-4 w-4 mr-1" />
													Vincular
												</>
											)}
										</Button>
									</div>
								</Card>
							))
						) : (
							<div className="text-center py-8">
								<FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
								<p className="text-sm text-muted-foreground">
									{searchQuery ? "No se encontraron notas con ese criterio" : "No hay notas disponibles para vincular"}
								</p>
							</div>
						)}
					</div>

					{/* Notas ya vinculadas */}
					{linkedNotes.length > 0 && (
						<div className="pt-4 border-t">
							<p className="text-sm font-medium mb-2">
								Notas ya vinculadas ({linkedNotes.length})
							</p>
							<div className="text-xs text-muted-foreground">
								Las notas vinculadas aparecen en la vista de detalle del proyecto
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
