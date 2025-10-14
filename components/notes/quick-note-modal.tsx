"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileModal } from "@/components/mobile-modal"
import { FileText, Inbox } from "lucide-react"
import { createQuickNote } from "@/app/actions/content"
import { getFolderTree } from "@/app/actions/folders"
import { toast } from "sonner"

interface QuickNoteModalProps {
	isOpen: boolean
	onClose: () => void
	onNoteCreated?: () => void
	defaultFolderId?: string | null
}

interface Folder {
	id: string
	name: string
	color: string
}

export function QuickNoteModal({ 
	isOpen, 
	onClose, 
	onNoteCreated,
	defaultFolderId = null 
}: QuickNoteModalProps) {
	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
	const [folders, setFolders] = useState<Folder[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingFolders, setIsLoadingFolders] = useState(true)

	// Cargar carpetas al abrir el modal
	useEffect(() => {
		if (isOpen) {
			loadFolders()
		}
	}, [isOpen])

	// Establecer carpeta por defecto
	useEffect(() => {
		if (defaultFolderId) {
			setSelectedFolderId(defaultFolderId)
		} else if (folders.length > 0) {
			// Buscar carpeta "Inbox" o usar la primera
			const inboxFolder = folders.find(f => f.name.toLowerCase() === 'inbox')
			setSelectedFolderId(inboxFolder?.id || folders[0].id)
		}
	}, [folders, defaultFolderId])

	const loadFolders = async () => {
		try {
			setIsLoadingFolders(true)
			const result = await getFolderTree()
			
			if (result.success && result.folders) {
				// Aplanar la estructura de carpetas para el selector
				const flattenFolders = (folders: any[]): Folder[] => {
					let flat: Folder[] = []
					folders.forEach(folder => {
						flat.push({
							id: folder.id,
							name: folder.name,
							color: folder.color
						})
						if (folder.children && folder.children.length > 0) {
							flat = flat.concat(flattenFolders(folder.children))
						}
					})
					return flat
				}
				
				setFolders(flattenFolders(result.folders))
			}
		} catch (error) {
			console.error('Error loading folders:', error)
			toast.error('Error al cargar las carpetas')
		} finally {
			setIsLoadingFolders(false)
		}
	}

	const handleCreateNote = async () => {
		if (!title.trim()) {
			toast.error("Por favor ingresa un título para la nota")
			return
		}

		setIsLoading(true)
		try {
			const result = await createQuickNote({
				title: title.trim(),
				content: content.trim() || '',
				folder_id: selectedFolderId
			})

			if (result.success) {
				toast.success("Nota creada exitosamente")
				resetForm()
				onNoteCreated?.()
				onClose()
			} else {
				toast.error(result.error || "Error al crear la nota")
			}
		} catch (error) {
			console.error('Error creating note:', error)
			toast.error("Error al crear la nota")
		} finally {
			setIsLoading(false)
		}
	}

	const resetForm = () => {
		setTitle("")
		setContent("")
		setSelectedFolderId(null)
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	return (
		<MobileModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Nueva Nota"
			headerActions={
				<Button 
					onClick={handleCreateNote}
					disabled={isLoading || !title.trim()}
					size="sm"
				>
					{isLoading ? "Guardando..." : "Guardar"}
				</Button>
			}
		>
			<div className="p-4 space-y-4">
				{/* Input de título */}
				<div>
					<label className="block text-sm font-medium mb-2">
						Título de la nota
					</label>
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="¿De qué se trata tu nota?"
						className="w-full"
						maxLength={100}
					/>
				</div>

				{/* Selector de carpeta */}
				<div>
					<label className="block text-sm font-medium mb-2">
						Carpeta
					</label>
					{isLoadingFolders ? (
						<div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
							Cargando carpetas...
						</div>
					) : (
						<Select 
							value={selectedFolderId || ''} 
							onValueChange={setSelectedFolderId}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecciona una carpeta" />
							</SelectTrigger>
							<SelectContent>
								{folders.map((folder) => (
									<SelectItem key={folder.id} value={folder.id}>
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: folder.color }}
											/>
											<span>{folder.name}</span>
											{folder.name.toLowerCase() === 'inbox' && (
												<Inbox className="h-3 w-3 text-muted-foreground" />
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				{/* Textarea de contenido */}
				<div>
					<label className="block text-sm font-medium mb-2">
						Contenido (opcional)
					</label>
					<Textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Escribe tus ideas aquí..."
						rows={4}
						className="w-full resize-none"
						maxLength={1000}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						{content.length}/1000 caracteres
					</p>
				</div>

				{/* Preview */}
				{title && (
					<div className="p-3 bg-muted/30 rounded-xl">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
								<FileText className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-sm truncate">
									{title}
								</p>
								{content && (
									<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
										{content}
									</p>
								)}
								<p className="text-xs text-muted-foreground mt-1">
									Vista previa
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</MobileModal>
	)
}
