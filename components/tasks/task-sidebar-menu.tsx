"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
	X, 
	Plus, 
	Star,
	CheckSquare,
	MoreHorizontal
} from "lucide-react"
import { TaskListWithStats, createTaskList } from "@/app/actions/tasks"
import { cn } from "@/lib/utils"

interface TaskSidebarMenuProps {
	isOpen: boolean
	onClose: () => void
	taskLists: TaskListWithStats[]
	selectedListId: string
	onListSelect: (listId: string) => void
	onListsChange: () => void
	showStarred: boolean
	onToggleStarred: () => void
}

export function TaskSidebarMenu({
	isOpen,
	onClose,
	taskLists,
	selectedListId,
	onListSelect,
	onListsChange,
	showStarred,
	onToggleStarred
}: TaskSidebarMenuProps) {
	const [isCreatingList, setIsCreatingList] = useState(false)
	const [newListName, setNewListName] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	const handleCreateList = async () => {
		if (!newListName.trim()) return

		setIsSaving(true)
		try {
			const result = await createTaskList({
				name: newListName.trim(),
				description: "",
				color: "#3b82f6",
				icon: "list"
			})

			if (result.success) {
				setNewListName("")
				setIsCreatingList(false)
				onListsChange()
			}
		} catch (error) {
			console.error('Error creating list:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleListClick = (listId: string) => {
		onListSelect(listId)
		onClose()
	}

	const handleStarredClick = () => {
		onToggleStarred()
		onClose()
	}

	return (
		<>
			{/* Overlay */}
			{isOpen && (
				<div 
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
					onClick={onClose}
				/>
			)}

			{/* Drawer */}
			<div className={cn(
				"fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border shadow-2xl z-50",
				"transform transition-all duration-500 ease-out",
				isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
			)}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-lg font-semibold">Listas de tareas</h2>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{/* Destacadas */}
					<div
						onClick={handleStarredClick}
						className={cn(
							"w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left cursor-pointer",
							"hover:bg-muted/50 active:scale-98",
							showStarred 
								? "bg-yellow-50 border border-yellow-200" 
								: "hover:bg-muted/50"
						)}
					>
						<div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
							<Star className="h-4 w-4 text-yellow-600 fill-current" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="font-medium text-sm">Tareas Destacadas</div>
							<div className="text-xs text-muted-foreground">
								{taskLists.reduce((acc, list) => acc + list.pending_tasks, 0)} tareas
							</div>
						</div>
					</div>

					{/* Separador */}
					<div className="h-px bg-border my-4" />

					{/* Lista principal */}
					<div
						onClick={() => handleListClick(taskLists[0]?.id || "")}
						className={cn(
							"w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left cursor-pointer",
							"hover:bg-muted/50 active:scale-98",
							selectedListId === taskLists[0]?.id && !showStarred
								? "bg-primary/10 border border-primary/20" 
								: "hover:bg-muted/50"
						)}
					>
						<div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
							<CheckSquare className="h-4 w-4 text-blue-600" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="font-medium text-sm">Mis tareas</div>
							<div className="text-xs text-muted-foreground">
								{taskLists[0]?.pending_tasks || 0} pendientes
							</div>
						</div>
					</div>

					{/* Listas personalizadas */}
					{taskLists.slice(1).map((list) => (
						<div
							key={list.id}
							onClick={() => handleListClick(list.id)}
							className={cn(
								"w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left cursor-pointer group",
								"hover:bg-muted/50 active:scale-98",
								selectedListId === list.id && !showStarred
									? "bg-primary/10 border border-primary/20" 
									: "hover:bg-muted/50"
							)}
						>
							<div 
								className="w-8 h-8 rounded-lg flex items-center justify-center"
								style={{ backgroundColor: `${list.color}20` }}
							>
								<CheckSquare 
									className="h-4 w-4" 
									style={{ color: list.color }}
								/>
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm truncate">{list.name}</div>
								<div className="text-xs text-muted-foreground">
									{list.pending_tasks} pendientes
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={(e) => {
									e.stopPropagation()
									console.log('Opciones de lista:', list.name)
								}}
							>
								<MoreHorizontal className="h-3 w-3" />
							</Button>
						</div>
					))}

					{/* Botón crear nueva lista */}
					<Dialog open={isCreatingList} onOpenChange={setIsCreatingList}>
						<DialogTrigger asChild>
							<button className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-muted/50 active:scale-98 border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50">
								<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
									<Plus className="h-4 w-4 text-muted-foreground" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm text-muted-foreground">Nueva lista</div>
									<div className="text-xs text-muted-foreground/70">
										Crear una nueva lista de tareas
									</div>
								</div>
							</button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Crear nueva lista</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<Input
									placeholder="Nombre de la lista..."
									value={newListName}
									onChange={(e) => setNewListName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleCreateList()
										}
									}}
									autoFocus
								/>
								<div className="flex gap-2 justify-end">
									<Button
										variant="outline"
										onClick={() => {
											setIsCreatingList(false)
											setNewListName("")
										}}
									>
										Cancelar
									</Button>
									<Button
										onClick={handleCreateList}
										disabled={!newListName.trim() || isSaving}
									>
										{isSaving ? "Creando..." : "Crear"}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</>
	)
}
