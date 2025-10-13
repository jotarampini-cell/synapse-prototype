"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
	Plus, 
	MoreHorizontal, 
	Edit2, 
	Trash2, 
	ChevronRight,
	Palette,
	Tag
} from "lucide-react"
import { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
	createTaskList, 
	updateTaskList, 
	deleteTaskList,
	type TaskListWithStats 
} from "@/app/actions/tasks"

interface TaskListSelectorProps {
	taskLists: TaskListWithStats[]
	selectedListId: string
	onListSelect: (listId: string) => void
	onListsChange: () => void
}

const predefinedColors = [
	"#3b82f6", // blue
	"#10b981", // emerald
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // violet
	"#06b6d4", // cyan
	"#84cc16", // lime
	"#f97316", // orange
	"#ec4899", // pink
	"#6b7280", // gray
]

const predefinedIcons = [
	"list",
	"briefcase", 
	"home",
	"heart",
	"star",
	"target",
	"bookmark",
	"flag",
	"zap",
	"gift"
]

export function TaskListSelector({ 
	taskLists, 
	selectedListId, 
	onListSelect, 
	onListsChange 
}: TaskListSelectorProps) {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingList, setEditingList] = useState<TaskListWithStats | null>(null)
	const [newListName, setNewListName] = useState("")
	const [newListDescription, setNewListDescription] = useState("")
	const [newListColor, setNewListColor] = useState("#3b82f6")
	const [newListIcon, setNewListIcon] = useState("list")
	const [isLoading, setIsLoading] = useState(false)

	const handleCreateList = async () => {
		if (!newListName.trim()) return

		setIsLoading(true)
		try {
			const result = await createTaskList({
				name: newListName,
				description: newListDescription,
				color: newListColor,
				icon: newListIcon
			})

			if (result.success) {
				setNewListName("")
				setNewListDescription("")
				setNewListColor("#3b82f6")
				setNewListIcon("list")
				setIsCreateDialogOpen(false)
				onListsChange()
			}
		} catch (error) {
			console.error("Error creating task list:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleEditList = async () => {
		if (!editingList || !newListName.trim()) return

		setIsLoading(true)
		try {
			const result = await updateTaskList(editingList.id, {
				name: newListName,
				description: newListDescription,
				color: newListColor,
				icon: newListIcon
			})

			if (result.success) {
				setEditingList(null)
				setNewListName("")
				setNewListDescription("")
				setNewListColor("#3b82f6")
				setNewListIcon("list")
				setIsEditDialogOpen(false)
				onListsChange()
			}
		} catch (error) {
			console.error("Error updating task list:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDeleteList = async (listId: string) => {
		if (!confirm("¿Estás seguro de que quieres eliminar esta lista? Esta acción no se puede deshacer.")) {
			return
		}

		try {
			const result = await deleteTaskList(listId)
			if (result.success) {
				onListsChange()
			}
		} catch (error) {
			console.error("Error deleting task list:", error)
		}
	}

	const openEditDialog = (list: TaskListWithStats) => {
		setEditingList(list)
		setNewListName(list.name)
		setNewListDescription(list.description || "")
		setNewListColor(list.color)
		setNewListIcon(list.icon)
		setIsEditDialogOpen(true)
	}

	const selectedList = taskLists.find(list => list.id === selectedListId)

	return (
		<div className="space-y-2">
			{/* Lista actual (móvil) */}
			<div className="md:hidden">
				<select 
					value={selectedListId}
					onChange={(e) => onListSelect(e.target.value)}
					className="w-full bg-transparent text-sm font-medium border border-input rounded-md px-3 py-2"
				>
					{taskLists.map(list => (
						<option key={list.id} value={list.id}>
							{list.name} ({list.pending_tasks})
						</option>
					))}
				</select>
			</div>

			{/* Lista de listas (desktop) */}
			<div className="hidden md:block space-y-1">
				{taskLists.map(list => (
					<div
						key={list.id}
						className={`group flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
							selectedListId === list.id 
								? "bg-primary text-primary-foreground" 
								: "hover:bg-muted"
						}`}
						onClick={() => onListSelect(list.id)}
					>
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<div 
								className="w-3 h-3 rounded-full flex-shrink-0"
								style={{ backgroundColor: list.color }}
							/>
							<span className="font-medium truncate">{list.name}</span>
							<Badge variant="secondary" className="text-xs flex-shrink-0">
								{list.pending_tasks}
							</Badge>
						</div>
						
						{!list.is_default && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
									<Button 
										variant="ghost" 
										size="icon" 
										className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<MoreHorizontal className="h-3 w-3" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => openEditDialog(list)}>
										<Edit2 className="h-4 w-4 mr-2" />
										Editar
									</DropdownMenuItem>
									<DropdownMenuItem 
										onClick={() => handleDeleteList(list.id)}
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Eliminar
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				))}

				{/* Botón crear nueva lista */}
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button 
							variant="outline" 
							className="w-full justify-start"
						>
							<Plus className="h-4 w-4 mr-2" />
							Nueva Lista
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Crear Nueva Lista</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="list-name">Nombre</Label>
								<Input
									id="list-name"
									value={newListName}
									onChange={(e) => setNewListName(e.target.value)}
									placeholder="Nombre de la lista"
								/>
							</div>
							<div>
								<Label htmlFor="list-description">Descripción (opcional)</Label>
								<Input
									id="list-description"
									value={newListDescription}
									onChange={(e) => setNewListDescription(e.target.value)}
									placeholder="Descripción de la lista"
								/>
							</div>
							<div>
								<Label>Color</Label>
								<div className="flex gap-2 mt-2">
									{predefinedColors.map(color => (
										<button
											key={color}
											className={`w-8 h-8 rounded-full border-2 ${
												newListColor === color ? "border-foreground" : "border-transparent"
											}`}
											style={{ backgroundColor: color }}
											onClick={() => setNewListColor(color)}
										/>
									))}
								</div>
							</div>
							<div className="flex gap-2">
								<Button 
									onClick={handleCreateList}
									disabled={!newListName.trim() || isLoading}
								>
									{isLoading ? "Creando..." : "Crear Lista"}
								</Button>
								<Button 
									variant="outline" 
									onClick={() => setIsCreateDialogOpen(false)}
								>
									Cancelar
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Dialog de edición */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Lista</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-list-name">Nombre</Label>
							<Input
								id="edit-list-name"
								value={newListName}
								onChange={(e) => setNewListName(e.target.value)}
								placeholder="Nombre de la lista"
							/>
						</div>
						<div>
							<Label htmlFor="edit-list-description">Descripción (opcional)</Label>
							<Input
								id="edit-list-description"
								value={newListDescription}
								onChange={(e) => setNewListDescription(e.target.value)}
								placeholder="Descripción de la lista"
							/>
						</div>
						<div>
							<Label>Color</Label>
							<div className="flex gap-2 mt-2">
								{predefinedColors.map(color => (
									<button
										key={color}
										className={`w-8 h-8 rounded-full border-2 ${
											newListColor === color ? "border-foreground" : "border-transparent"
										}`}
										style={{ backgroundColor: color }}
										onClick={() => setNewListColor(color)}
									/>
								))}
							</div>
						</div>
						<div className="flex gap-2">
							<Button 
								onClick={handleEditList}
								disabled={!newListName.trim() || isLoading}
							>
								{isLoading ? "Guardando..." : "Guardar Cambios"}
							</Button>
							<Button 
								variant="outline" 
								onClick={() => setIsEditDialogOpen(false)}
							>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

