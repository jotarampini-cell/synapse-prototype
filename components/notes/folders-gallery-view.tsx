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
			const result = await getFolderTree()
			
			if (result.success && result.folders) {
				// Cargar información de notas para cada carpeta
				const foldersWithNotes = await Promise.all(
					result.folders.map(async (folder) => {
						const notesResult = await getUserContents({
							folder_id: folder.id,
							limit: 3
						})
						
						return {
							...folder,
							notesCount: notesResult.success ? notesResult.contents?.length || 0 : 0,
							recentNotes: notesResult.success ? 
								(notesResult.contents || []).slice(0, 3).map(note => ({
									id: note.id,
									title: note.title,
									updated_at: note.updated_at
								})) : []
						}
					})
				)
				
				setFolders(foldersWithNotes)
			}
		} catch (error) {
			console.error('Error loading folders:', error)
			toast.error('Error al cargar las carpetas')
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
			{/* Grid de carpetas */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				{folders.map((folder) => (
					<Card 
						key={folder.id}
						className="p-4 cursor-pointer hover:shadow-md transition-shadow"
						onClick={() => onFolderSelect(folder.id)}
					>
						<div className="flex items-start justify-between mb-3">
							<div className="flex items-center gap-2">
								<Folder 
									className="h-5 w-5" 
									style={{ color: folder.color }}
								/>
								<h3 className="font-semibold text-sm truncate">
									{folder.name}
								</h3>
							</div>
							
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button 
										variant="ghost" 
										size="icon"
										className="h-6 w-6"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontal className="h-3 w-3" />
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
						
						{/* Contador de notas */}
						<Badge variant="secondary" className="mb-3">
							{folder.notesCount} notas
						</Badge>
						
						{/* Preview de notas recientes */}
						{folder.recentNotes.length > 0 && (
							<div className="space-y-1">
								{folder.recentNotes.map((note) => (
									<div key={note.id} className="text-xs text-muted-foreground truncate">
										{note.title}
									</div>
								))}
							</div>
						)}
					</Card>
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
