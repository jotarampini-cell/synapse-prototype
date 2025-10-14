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
	Trash2
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
	type Folder as FolderType 
} from "@/app/actions/folders"
import { getUserContents } from "@/app/actions/content"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

export function FoldersGalleryView({ 
	onFolderSelect, 
	onCreateFolder 
}: FoldersGalleryViewProps) {
	const [folders, setFolders] = useState<FolderWithNotes[]>([])
	const [isLoading, setIsLoading] = useState(true)

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

	return (
		<div className="p-4">
			{/* Lista de carpetas */}
			<div className="space-y-2">
				{folders.map((folder) => (
					<div 
						key={folder.id}
						className="flex items-center justify-between p-4 bg-card rounded-lg border cursor-pointer hover:bg-accent transition-colors"
						onClick={() => onFolderSelect(folder.id)}
					>
						<div className="flex items-center gap-3">
							<Folder 
								className="h-5 w-5" 
								style={{ color: folder.color }}
							/>
							<div>
								<h3 className="font-semibold text-base">
									{folder.name}
								</h3>
								<p className="text-sm text-muted-foreground">
									{folder.notesCount} notas
								</p>
							</div>
						</div>
						
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button 
									variant="ghost" 
									size="icon"
									className="h-8 w-8"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									<Edit className="h-4 w-4 mr-2" />
									Renombrar
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem 
									className="text-destructive"
									onClick={() => handleDeleteFolder(folder.id)}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				))}
			</div>
			
			{/* FAB para crear carpeta */}
			<Button
				onClick={handleCreateFolder}
				className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 touch-target hover:scale-110 active:scale-95 transition-transform"
				size="icon"
			>
				<FolderPlus className="h-6 w-6" />
			</Button>
		</div>
	)
}
