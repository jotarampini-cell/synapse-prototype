"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
	MoreHorizontal, 
	Calendar, 
	Clock, 
	ChevronRight, 
	ChevronDown,
	Plus,
	Edit2,
	Trash2,
	Copy,
	Link as LinkIcon,
	Briefcase,
	GripVertical,
	MousePointer2
} from "lucide-react"
import { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
	updateTask, 
	deleteTask, 
	toggleTaskStatus,
	type Task 
} from "@/app/actions/tasks"
import { SubtaskList } from "./subtask-list"
import { TaskLinkedNotes } from "./task-linked-notes"
import { TaskNoteLinker } from "./task-note-linker"
import { TaskProjectLinker } from "./task-project-linker"

interface TaskItemProps {
	task: Task
	onTaskUpdate: () => void
	onAddSubtask?: (parentTaskId: string) => void
	showSubtasks?: boolean
	level?: number
	onOpenDetails?: (task: Task) => void
	dragHandleProps?: any
	onSelect?: () => void
}

const priorityColors = {
	high: "bg-red-500",
	medium: "bg-yellow-500", 
	low: "bg-green-500"
}

const statusColors = {
	pending: "bg-gray-500",
	in_progress: "bg-blue-500",
	completed: "bg-green-500"
}

export function TaskItem({ 
	task, 
	onTaskUpdate, 
	onAddSubtask,
	showSubtasks = false,
	level = 0,
	onOpenDetails,
	dragHandleProps,
	onSelect
}: TaskItemProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editTitle, setEditTitle] = useState(task.title)
	const [isLoading, setIsLoading] = useState(false)

	const handleToggleTask = async () => {
		setIsLoading(true)
		try {
			const result = await toggleTaskStatus(task.id)
			if (result.success) {
				onTaskUpdate()
			}
		} catch (error) {
			console.error("Error toggling task:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleUpdateTask = async () => {
		if (!editTitle.trim()) return

		setIsLoading(true)
		try {
			const result = await updateTask(task.id, {
				title: editTitle
			})
			if (result.success) {
				setIsEditing(false)
				onTaskUpdate()
			}
		} catch (error) {
			console.error("Error updating task:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDeleteTask = async () => {
		if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
			return
		}

		setIsLoading(true)
		try {
			const result = await deleteTask(task.id)
			if (result.success) {
				onTaskUpdate()
			}
		} catch (error) {
			console.error("Error deleting task:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDuplicateTask = async () => {
		// TODO: Implementar duplicación de tarea
		console.log("Duplicar tarea:", task.id)
	}

	const isCompleted = task.status === "completed"
	const indentStyle = level > 0 ? { marginLeft: `${Math.min(level * 24, 96)}px` } : {}

	return (
		<div className={`transition-all duration-300 ease-in-out ${isCompleted ? 'transform translate-x-2' : ''}`}>
			<div 
				className={`group flex items-start gap-2 p-1.5 hover:bg-muted/30 active:bg-muted/40 rounded-md transition-all duration-200 ${
					isCompleted ? "opacity-60 bg-green-50/50 border-l-4 border-green-400" : ""
				} ${level === 0 ? "bg-muted/5 hover:bg-muted/20 active:bg-muted/30" : "hover:bg-muted/15 active:bg-muted/25"}`}
				style={indentStyle}
				onClick={() => {
					onSelect?.()
					setIsExpanded(!isExpanded)
				}}
			>
			{/* Drag Handle - solo para tareas principales */}
			{level === 0 && dragHandleProps && (
				<div 
					{...dragHandleProps}
					className="flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
				>
					<GripVertical className="h-4 w-4" />
				</div>
			)}

			{/* Checkbox personalizado con animación */}
			<div 
				className={`relative mt-0.5 flex-shrink-0 ${level === 0 ? "h-6 w-6 md:h-5 md:w-5" : "h-5 w-5 md:h-4 md:w-4"} cursor-pointer`}
				onClick={handleToggleTask}
			>
				<div 
					className={`
						relative w-full h-full rounded border-2 transition-all duration-300 ease-in-out
						${isCompleted 
							? 'bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-500/30' 
							: 'bg-background border-muted-foreground hover:border-primary hover:scale-105 active:scale-110'
						}
						${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
						${isCompleted ? 'animate-pulse' : ''}
					`}
				>
					{/* Checkmark animado */}
					{isCompleted && (
						<div className="absolute inset-0 flex items-center justify-center">
							<svg 
								className="w-3 h-3 text-white animate-in zoom-in-50 duration-200" 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={3} 
									d="M5 13l4 4L19 7" 
								/>
							</svg>
						</div>
					)}
					
					{/* Efecto de ripple al hacer clic */}
					{isCompleted && (
						<div className="absolute inset-0 rounded bg-green-400 animate-in fade-in-0 zoom-in-75 duration-300" />
					)}
				</div>
			</div>

			{/* Contenido de la tarea */}
			<div 
				className="flex-1 min-w-0 cursor-pointer"
				onDoubleClick={() => onOpenDetails?.(task)}
				title="Doble clic para editar"
			>
				{isEditing ? (
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleUpdateTask()
								} else if (e.key === "Escape") {
									setIsEditing(false)
									setEditTitle(task.title)
								}
							}}
							className="flex-1 bg-transparent border-none outline-none font-medium min-w-0"
							autoFocus
						/>
						<Button 
							size="sm" 
							onClick={handleUpdateTask}
							disabled={!editTitle.trim() || isLoading}
						>
							Guardar
						</Button>
						<Button 
							size="sm" 
							variant="outline"
							onClick={() => {
								setIsEditing(false)
								setEditTitle(task.title)
							}}
						>
							Cancelar
						</Button>
					</div>
				) : (
					<div className="space-y-1">
						{/* Título */}
						<div className="flex items-center gap-2">
							<h3 className={`font-medium transition-all duration-300 truncate ${
								level === 0 ? "text-sm" : "text-xs"
							} ${
								isCompleted ? "line-through text-muted-foreground opacity-70" : ""
							}`}>
								{task.title}
							</h3>
							{task.priority === "high" && (
								<div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
							)}
							{task.status === "in_progress" && (
								<Badge variant="secondary" className="text-xs">
									En curso
								</Badge>
							)}
							{/* Indicadores */}
							<div className="flex items-center gap-1 ml-auto">
								{/* Indicador de expansión */}
								{task.description && (
									<div className="opacity-60">
										{isExpanded ? (
											<ChevronDown className="h-3 w-3 text-muted-foreground" />
										) : (
											<ChevronRight className="h-3 w-3 text-muted-foreground" />
										)}
									</div>
								)}
								{/* Indicador de doble clic */}
								<div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
									<MousePointer2 className="h-3 w-3 text-muted-foreground" />
								</div>
							</div>
						</div>

						{/* Descripción */}
						{task.description && (
							<p className={`text-muted-foreground ${
								level === 0 ? "text-xs" : "text-xs"
							} ${
								isExpanded ? "" : "line-clamp-2"
							}`}>
								{task.description}
							</p>
						)}

						{/* Metadatos */}
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{task.due_date && (
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									<span>{new Date(task.due_date).toLocaleDateString()}</span>
								</div>
							)}
							{task.estimated_time && (
								<div className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									<span>{task.estimated_time}</span>
								</div>
							)}
							{task.tags && task.tags.length > 0 && (
								<div className="flex items-center gap-1">
									{task.tags.slice(0, 2).map(tag => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
									{task.tags.length > 2 && (
										<span>+{task.tags.length - 2}</span>
									)}
								</div>
							)}
						</div>

						{/* Notas */}
						{task.notes && (
							<p className="text-xs text-muted-foreground italic">
								{task.notes}
							</p>
						)}
					</div>
				)}
			</div>

			{/* Botón de acciones */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button 
						variant="ghost" 
						size="icon" 
						className="h-8 w-8 md:h-8 md:w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setIsEditing(true)}>
						<Edit2 className="h-4 w-4 mr-2" />
						Editar
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleDuplicateTask}>
						<Copy className="h-4 w-4 mr-2" />
						Duplicar
					</DropdownMenuItem>
						{onAddSubtask && (
							<DropdownMenuItem onClick={() => onAddSubtask(task.id)}>
								<Plus className="h-4 w-4 mr-2" />
								Agregar subtarea
							</DropdownMenuItem>
						)}
						<DropdownMenuItem asChild>
							<TaskNoteLinker 
								task={task} 
								onLinkCreated={onTaskUpdate}
								trigger={
									<div className="flex items-center">
										<LinkIcon className="h-4 w-4 mr-2" />
										Vincular nota
									</div>
								}
							/>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<TaskProjectLinker 
								taskId={task.id} 
								onLinkChange={onTaskUpdate}
								trigger={
									<div className="flex items-center">
										<Briefcase className="h-4 w-4 mr-2" />
										Vincular proyecto
									</div>
								}
							/>
						</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem 
						onClick={handleDeleteTask}
						className="text-destructive"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Eliminar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			</div>

			{/* Notas vinculadas - solo para tareas principales */}
			{level === 0 && (
				<div className="ml-8 mt-2">
					<TaskLinkedNotes
						task={task}
						onNotesChange={onTaskUpdate}
					/>
				</div>
			)}

			{/* Subtareas - solo para tareas principales */}
			{level === 0 && (
				<SubtaskList
					parentTaskId={task.id}
					onSubtasksChange={onTaskUpdate}
				/>
			)}
		</div>
	)
}
