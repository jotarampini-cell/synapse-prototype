"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
	Folder, 
	FolderOpen, 
	ChevronRight, 
	ChevronDown, 
	Plus, 
	MoreHorizontal, 
	Edit, 
	Trash2, 
	Move,
	Inbox,
	Calendar,
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
	Dialog, 
	DialogContent, 
	DialogHeader, 
	DialogTitle, 
	DialogTrigger 
} from "@/components/ui/dialog"
import { 
	getFolderTree, 
	createFolder, 
	updateFolder, 
	deleteFolder, 
	moveFolder,
	type Folder as FolderType 
} from "@/app/actions/folders"
import { toast } from "sonner"

interface FolderTreeProps {
	selectedFolderId: string | null
	onFolderSelect: (folderId: string | null) => void
	onCreateNote?: (folderId: string | null) => void
}

interface FolderNodeProps {
	folder: FolderType & { children?: FolderType[] }
	level: number
	expandedFolders: Set<string>
	onToggleExpand: (folderId: string) => void
	onFolderSelect: (folderId: string | null) => void
	onCreateNote: (folderId: string | null) => void
	onCreateSubfolder: (parentId: string) => void
	onEditFolder: (folder: FolderType) => void
	onDeleteFolder: (folderId: string) => void
	onMoveFolder: (folderId: string, newParentId: string | null) => void
	selectedFolderId: string | null
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	folder: Folder,
	folderOpen: FolderOpen,
	inbox: Inbox,
	calendar: Calendar,
	clock: Clock,
	// Agregar más iconos según sea necesario
}

function FolderNode({ 
	folder, 
	level, 
	expandedFolders, 
	onToggleExpand, 
	onFolderSelect, 
	onCreateNote,
	onCreateSubfolder,
	onEditFolder,
	onDeleteFolder,
	onMoveFolder,
	selectedFolderId 
}: FolderNodeProps) {
	const [isExpanded, setIsExpanded] = useState(expandedFolders.has(folder.id))
	const [isEditing, setIsEditing] = useState(false)
	const [editName, setEditName] = useState(folder.name)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showMoveDialog, setShowMoveDialog] = useState(false)

	const IconComponent = iconMap[folder.icon] || Folder
	const hasChildren = folder.children && folder.children.length > 0
	const isSelected = selectedFolderId === folder.id

	useEffect(() => {
		setIsExpanded(expandedFolders.has(folder.id))
	}, [expandedFolders, folder.id])

	const handleToggleExpand = () => {
		if (hasChildren) {
			onToggleExpand(folder.id)
		}
	}

	const handleEdit = async () => {
		if (editName.trim() && editName !== folder.name) {
			try {
				await updateFolder(folder.id, { name: editName.trim() })
				toast.success("Carpeta actualizada")
				setIsEditing(false)
			} catch (error) {
				toast.error("Error al actualizar carpeta")
			}
		} else {
			setIsEditing(false)
			setEditName(folder.name)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleEdit()
		} else if (e.key === 'Escape') {
			setIsEditing(false)
			setEditName(folder.name)
		}
	}

	return (
		<div className="select-none">
			<div 
				className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group hover:bg-muted/50 transition-colors ${
					isSelected ? 'bg-primary/10 text-primary' : 'text-foreground'
				}`}
				style={{ paddingLeft: `${level * 16 + 8}px` }}
				onClick={() => onFolderSelect(folder.id)}
			>
				{/* Expand/Collapse Button */}
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleToggleExpand()
					}}
					className="flex items-center justify-center w-4 h-4 hover:bg-muted rounded"
					disabled={!hasChildren}
				>
					{hasChildren ? (
						isExpanded ? (
							<ChevronDown className="w-3 h-3" />
						) : (
							<ChevronRight className="w-3 h-3" />
						)
					) : (
						<div className="w-3 h-3" />
					)}
				</button>

				{/* Folder Icon */}
				<div 
					className="flex items-center justify-center w-5 h-5"
					style={{ color: folder.color }}
				>
					<IconComponent className="w-4 h-4" />
				</div>

				{/* Folder Name */}
				{isEditing ? (
					<Input
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						onBlur={handleEdit}
						onKeyDown={handleKeyPress}
						className="h-6 text-sm"
						autoFocus
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="flex-1 text-sm font-medium truncate">
						{folder.name}
					</span>
				)}

				{/* Note Count Badge */}
				{folder.note_count && folder.note_count > 0 && (
					<Badge variant="secondary" className="text-xs px-1.5 py-0.5">
						{folder.note_count}
					</Badge>
				)}

				{/* Actions Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="w-3 h-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-48">
						<DropdownMenuItem onClick={() => onCreateNote(folder.id)}>
							<Plus className="w-4 h-4 mr-2" />
							Nueva nota
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
							<Plus className="w-4 h-4 mr-2" />
							Nueva subcarpeta
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => setIsEditing(true)}>
							<Edit className="w-4 h-4 mr-2" />
							Renombrar
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
							<Move className="w-4 h-4 mr-2" />
							Mover
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem 
							onClick={() => onDeleteFolder(folder.id)}
							className="text-destructive"
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Children */}
			{hasChildren && isExpanded && (
				<div>
					{folder.children!.map((child) => (
						<FolderNode
							key={child.id}
							folder={child}
							level={level + 1}
							expandedFolders={expandedFolders}
							onToggleExpand={onToggleExpand}
							onFolderSelect={onFolderSelect}
							onCreateNote={onCreateNote}
							onCreateSubfolder={onCreateSubfolder}
							onEditFolder={onEditFolder}
							onDeleteFolder={onDeleteFolder}
							onMoveFolder={onMoveFolder}
							selectedFolderId={selectedFolderId}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export function FolderTree({ selectedFolderId, onFolderSelect, onCreateNote }: FolderTreeProps) {
	const [folders, setFolders] = useState<(FolderType & { children?: FolderType[] })[]>([])
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
	const [isLoading, setIsLoading] = useState(true)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [createParentId, setCreateParentId] = useState<string | null>(null)

	useEffect(() => {
		loadFolders()
	}, [])

	// Escuchar eventos de actualización de notas para refrescar contadores
	useEffect(() => {
		const handleNotesUpdated = () => {
			loadFolders()
		}

		window.addEventListener('notesUpdated', handleNotesUpdated)
		return () => {
			window.removeEventListener('notesUpdated', handleNotesUpdated)
		}
	}, [])

	const loadFolders = async () => {
		try {
			setIsLoading(true)
		const folderTreeResult = await getFolderTree()
		
		// Verificar si la respuesta es exitosa
		if (!folderTreeResult.success || !folderTreeResult.folders) {
			console.error('Error getting folder tree:', folderTreeResult.error)
			setFolders([])
			return
		}
		
		const folderTree = folderTreeResult.folders
		
		// Convertir lista plana a árbol jerárquico
		const folderMap = new Map<string, FolderType & { children?: FolderType[] }>()
		const rootFolders: (FolderType & { children?: FolderType[] })[] = []

		folderTree.forEach(folder => {
			folderMap.set(folder.id, { ...folder, children: [] })
		})

		folderTree.forEach(folder => {
				const folderWithChildren = folderMap.get(folder.id)!
				if (folder.parent_id) {
					const parent = folderMap.get(folder.parent_id)
					if (parent) {
						parent.children!.push(folderWithChildren)
					}
				} else {
					rootFolders.push(folderWithChildren)
				}
			})

			setFolders(rootFolders)
			
			// Expandir carpetas por defecto (Inbox, Diario)
			const defaultExpanded = new Set<string>()
			rootFolders.forEach(folder => {
				if (folder.name === 'Inbox' || folder.name === 'Diario') {
					defaultExpanded.add(folder.id)
				}
			})
			setExpandedFolders(defaultExpanded)
		} catch (error) {
			toast.error("Error al cargar carpetas")
			console.error("Error loading folders:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleToggleExpand = (folderId: string) => {
		setExpandedFolders(prev => {
			const newSet = new Set(prev)
			if (newSet.has(folderId)) {
				newSet.delete(folderId)
			} else {
				newSet.add(folderId)
			}
			return newSet
		})
	}

	const handleCreateFolder = async (name: string, parentId: string | null = null) => {
		try {
			await createFolder({ name, parent_id: parentId })
			toast.success("Carpeta creada")
			await loadFolders()
			setShowCreateDialog(false)
			setCreateParentId(null)
		} catch (error) {
			toast.error("Error al crear carpeta")
		}
	}

	const handleDeleteFolder = async (folderId: string) => {
		try {
			await deleteFolder(folderId)
			toast.success("Carpeta eliminada")
			await loadFolders()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Error al eliminar carpeta")
		}
	}

	const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
		try {
			await moveFolder(folderId, newParentId)
			toast.success("Carpeta movida")
			await loadFolders()
		} catch (error) {
			toast.error("Error al mover carpeta")
		}
	}

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse space-y-2">
					<div className="h-4 bg-muted rounded w-3/4"></div>
					<div className="h-4 bg-muted rounded w-1/2"></div>
					<div className="h-4 bg-muted rounded w-2/3"></div>
				</div>
			</div>
		)
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-foreground">Carpetas</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setCreateParentId(null)
							setShowCreateDialog(true)
						}}
						className="h-8 w-8 p-0"
					>
						<Plus className="w-4 h-4" />
					</Button>
				</div>
				
				{/* Quick Actions */}
				<div className="space-y-1">
					<button
						onClick={() => onFolderSelect(null)}
						className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
							selectedFolderId === null 
								? 'bg-primary/10 text-primary' 
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
						}`}
					>
						<Clock className="w-4 h-4" />
						Recientes
					</button>
				</div>
			</div>

			{/* Folder Tree */}
			<div className="flex-1 overflow-y-auto p-2">
				{folders.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No hay carpetas</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowCreateDialog(true)}
							className="mt-2"
						>
							Crear primera carpeta
						</Button>
					</div>
				) : (
					<div className="space-y-1">
						{folders.map((folder) => (
							<FolderNode
								key={folder.id}
								folder={folder}
								level={0}
								expandedFolders={expandedFolders}
								onToggleExpand={handleToggleExpand}
								onFolderSelect={onFolderSelect}
								onCreateNote={onCreateNote || (() => {})}
								onCreateSubfolder={(parentId) => {
									setCreateParentId(parentId)
									setShowCreateDialog(true)
								}}
								onEditFolder={() => {}}
								onDeleteFolder={handleDeleteFolder}
								onMoveFolder={handleMoveFolder}
								selectedFolderId={selectedFolderId}
							/>
						))}
					</div>
				)}
			</div>

			{/* Create Folder Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{createParentId ? 'Nueva subcarpeta' : 'Nueva carpeta'}
						</DialogTitle>
					</DialogHeader>
					<CreateFolderForm
						parentId={createParentId}
						onSubmit={handleCreateFolder}
						onCancel={() => {
							setShowCreateDialog(false)
							setCreateParentId(null)
						}}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}

interface CreateFolderFormProps {
	parentId: string | null
	onSubmit: (name: string, parentId: string | null) => void
	onCancel: () => void
}

function CreateFolderForm({ parentId, onSubmit, onCancel }: CreateFolderFormProps) {
	const [name, setName] = useState("")

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (name.trim()) {
			onSubmit(name.trim(), parentId)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="folder-name" className="block text-sm font-medium mb-2">
					Nombre de la carpeta
				</label>
				<Input
					id="folder-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Mi nueva carpeta"
					autoFocus
					required
				/>
			</div>
			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" disabled={!name.trim()}>
					Crear
				</Button>
			</div>
		</form>
	)
}
