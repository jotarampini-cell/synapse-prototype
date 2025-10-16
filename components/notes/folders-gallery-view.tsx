"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Folder, 
	FolderPlus,
	MoreHorizontal,
	Edit,
	Trash2,
	GripVertical
} from "lucide-react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
	getFolderTree, 
	createFolder, 
	updateFolder, 
	deleteFolder,
	reorderFolders,
	type Folder as FolderType 
} from "@/app/actions/folders"
import { getUserContents } from "@/app/actions/content"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface FoldersGalleryViewProps {
	onFolderSelect: (folderId: string | null) => void
	onCreateFolder?: () => void
}

interface FolderWithNotes extends FolderType {
	notesCount: number
	recentNotes: Array<{
		id: string
		title: string
		updated_at: string
	}>
}

// Componente de carpeta arrastrable
function SortableFolderItem({ 
	folder, 
	onFolderSelect, 
	onEditFolder, 
	onDeleteFolder 
}: {
	folder: FolderWithNotes
	onFolderSelect: (folderId: string | null) => void
	onEditFolder: (folder: FolderType) => void
	onDeleteFolder: (folderId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: folder.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative group",
				isDragging && "z-50"
			)}
		>
		<Card
			className={cn(
				"p-4 transition-all duration-200 select-none",
				"bg-card/50 backdrop-blur-sm border border-border/50",
				isDragging && "shadow-2xl scale-105 opacity-90 border-primary/50 bg-primary/5"
			)}
			style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
		>
			<div 
				{...attributes}
				{...listeners}
				className="flex items-center justify-between cursor-grab active:cursor-grabbing touch-target"
				onMouseDown={(e) => e.preventDefault()}
				onTouchStart={(e) => e.preventDefault()}
			>
				<div 
					className="flex items-center gap-3 flex-1 min-w-0"
					onClick={(e) => {
						e.stopPropagation()
						onFolderSelect(folder.id)
					}}
				>
					{/* Ícono de drag siempre visible */}
					<div className="p-2 -ml-2 touch-target">
						<GripVertical className="h-4 w-4 text-muted-foreground" />
					</div>

						{/* Icono de carpeta */}
						<div 
							className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
							style={{ backgroundColor: `${folder.color}20` }}
						>
							<Folder 
								className="h-5 w-5" 
								style={{ color: folder.color }}
							/>
						</div>

						{/* Información de la carpeta */}
						<div className="flex-1 min-w-0">
							<h3 className="font-medium text-sm truncate">
								{folder.name}
							</h3>
							<p className="text-xs text-muted-foreground">
								{folder.notesCount} {folder.notesCount === 1 ? 'nota' : 'notas'}
							</p>
						</div>
					</div>

					{/* Menú de opciones */}
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
								onClick={(e) => {
									e.stopPropagation()
									onEditFolder(folder)
								}}
							>
								<Edit className="h-4 w-4 mr-2" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								onClick={(e) => {
									e.stopPropagation()
									onDeleteFolder(folder.id)
								}}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</Card>
		</div>
	)
}

export function FoldersGalleryView({ 
	onFolderSelect, 
	onCreateFolder 
}: FoldersGalleryViewProps) {
	const [folders, setFolders] = useState<FolderWithNotes[]>([])
	const [isLoading, setIsLoading] = useState(true)

	// Sensores para drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 12, // Aumentar de 8 a 12px para evitar activación accidental
				delay: 150, // Añadir delay de 150ms para distinguir drag de tap
				tolerance: 5,
			},
			// Prevenir selección de texto durante el drag
			onActivation: (event) => {
				if (event.event && event.event.preventDefault) {
					event.event.preventDefault()
				}
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	useEffect(() => {
		loadFolders()
	}, [])

	const loadFolders = async () => {
		try {
			setIsLoading(true)
			console.log('Loading folders with real data')
			
			// Usar datos reales
			const result = await getFolderTree()
			if (result.success && result.folders) {
				// Convertir folders a FolderWithNotes agregando conteo de notas
				const foldersWithNotes: FolderWithNotes[] = await Promise.all(
					result.folders.map(async (folder) => {
						try {
							// Obtener contenido de la carpeta para contar notas
							const contentResult = await getUserContents({
								folder_id: folder.id,
								limit: 100
							})
							
							const notesCount = contentResult.success && contentResult.contents 
								? contentResult.contents.length 
								: 0
							
							const recentNotes = contentResult.success && contentResult.contents
								? contentResult.contents.slice(0, 3).map(note => ({
									id: note.id,
									title: note.title,
									updated_at: note.updated_at
								}))
								: []
							
							return {
								...folder,
								notesCount,
								recentNotes
							}
						} catch (error) {
							console.error(`Error loading notes for folder ${folder.id}:`, error)
							return {
								...folder,
								notesCount: 0,
								recentNotes: []
							}
						}
					})
				)
				
				setFolders(foldersWithNotes)
			} else {
				console.log('No folders found, using empty array')
				setFolders([])
			}
		} catch (error) {
			console.error('Error loading folders:', error)
			toast.error('Error al cargar las carpetas')
			// Fallback a datos mock en caso de error
			const mockFolders: FolderWithNotes[] = [
				{
					id: '1',
					user_id: 'user1',
					name: 'Notas',
					parent_id: null,
					color: '#3b82f6',
					icon: 'folder',
					position: 0,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					notesCount: 0,
					recentNotes: []
				}
			]
			setFolders(mockFolders)
		} finally {
			setIsLoading(false)
		}
	}

	const handleCreateFolder = async () => {
		try {
			const result = await createFolder({
				name: 'Nueva Carpeta',
				color: '#3b82f6'
			})
			
			if (result.success) {
				toast.success('Carpeta creada')
				loadFolders()
				onCreateFolder?.()
			}
		} catch (error) {
			console.error('Error creating folder:', error)
			toast.error('Error al crear la carpeta')
		}
	}

	const handleDeleteFolder = async (folderId: string) => {
		try {
			const result = await deleteFolder(folderId)
			
			if (result.success) {
				toast.success('Carpeta eliminada')
				loadFolders()
			}
		} catch (error) {
			console.error('Error deleting folder:', error)
			toast.error('Error al eliminar la carpeta')
		}
	}

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			const oldIndex = folders.findIndex(folder => folder.id === active.id)
			const newIndex = folders.findIndex(folder => folder.id === over.id)

			// Actualizar estado local inmediatamente para feedback visual
			const newFolders = arrayMove(folders, oldIndex, newIndex)
			setFolders(newFolders)

			// Actualizar en la base de datos
			try {
				const folderIds = newFolders.map(folder => folder.id)
				const result = await reorderFolders(folderIds)
				
				if (!result.success) {
					// Revertir cambios si falla
					setFolders(folders)
					toast.error(result.error || 'Error al reordenar carpetas')
				} else {
					toast.success('Orden de carpetas actualizado')
				}
			} catch (error) {
				// Revertir cambios si falla
				setFolders(folders)
				console.error('Error reordering folders:', error)
				toast.error('Error al reordenar carpetas')
			}
		}
	}

	if (isLoading) {
		return (
			<div className="p-4 grid grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="p-4 animate-pulse">
						<div className="h-4 bg-muted rounded mb-2" />
						<div className="h-3 bg-muted rounded mb-1" />
						<div className="h-3 bg-muted rounded w-2/3" />
					</Card>
				))}
			</div>
		)
	}

	// Estado vacío
	if (folders.length === 0) {
		return (
			<div className="p-4 flex flex-col items-center justify-center h-full min-h-[400px]">
				<Folder className="w-16 h-16 text-muted-foreground/30 mb-4" />
				<p className="text-lg font-medium text-muted-foreground mb-2">
					No tienes carpetas
				</p>
				<p className="text-sm text-muted-foreground/70 mb-4 text-center">
					Crea tu primera carpeta para organizar tus notas
				</p>
				<Button
					onClick={onCreateFolder}
					variant="outline"
					size="sm"
				>
					<FolderPlus className="h-4 w-4 mr-2" />
					Crear primera carpeta
				</Button>
			</div>
		)
	}

	return (
		<div className="p-4">
			{/* Lista de carpetas con drag and drop */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={folders.map(f => f.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2">
						{folders.map((folder) => (
							<SortableFolderItem
								key={folder.id}
								folder={folder}
								onFolderSelect={onFolderSelect}
								onEditFolder={(folder) => {
									// TODO: Implementar edición de carpeta
									toast.info('Edición de carpeta próximamente')
								}}
								onDeleteFolder={handleDeleteFolder}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}
