"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
	CheckSquare, 
	Plus, 
	ExternalLink, 
	X,
	Link as LinkIcon,
	Calendar,
	Clock
} from "lucide-react"
import { 
	getNoteLinkedTasks, 
	createTaskFromNote,
	getTaskLists,
	type TaskListWithStats 
} from "@/app/actions/tasks"
import { useRouter } from "next/navigation"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface NoteLinkedTasksProps {
	noteId: string
	onTasksChange: () => void
}

interface LinkedTask {
	id: string
	title: string
	status: string
	list_id: string
}

const statusColors = {
	pending: "bg-gray-500",
	in_progress: "bg-blue-500",
	completed: "bg-green-500"
}

const statusLabels = {
	pending: "Pendiente",
	in_progress: "En curso", 
	completed: "Completada"
}

export function NoteLinkedTasks({ noteId, onTasksChange }: NoteLinkedTasksProps) {
	const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isCreatingTask, setIsCreatingTask] = useState(false)
	const [newTaskTitle, setNewTaskTitle] = useState("")
	const [taskLists, setTaskLists] = useState<TaskListWithStats[]>([])
	const [selectedListId, setSelectedListId] = useState<string>("")
	const router = useRouter()

	// Cargar tareas vinculadas y listas de tareas
	useEffect(() => {
		loadLinkedTasks()
		loadTaskLists()
	}, [noteId])

	const loadTaskLists = async () => {
		try {
			const result = await getTaskLists()
			if (result.success && result.taskLists) {
				setTaskLists(result.taskLists)
				// Seleccionar la primera lista por defecto
				if (result.taskLists.length > 0) {
					setSelectedListId(result.taskLists[0].id)
				}
			}
		} catch (error) {
			console.error("Error loading task lists:", error)
		}
	}

	const loadLinkedTasks = async () => {
		setIsLoading(true)
		try {
			const result = await getNoteLinkedTasks(noteId)
			if (result.success && result.tasks) {
				setLinkedTasks(result.tasks)
			}
		} catch (error) {
			console.error("Error loading linked tasks:", error)
		} finally {
			setIsLoading(false)
		}
	}

	// Manejar crear tarea desde nota
	const handleCreateTask = async () => {
		if (!newTaskTitle.trim() || !selectedListId) return

		setIsCreatingTask(true)
		try {
			const result = await createTaskFromNote(noteId, {
				title: newTaskTitle,
				list_id: selectedListId
			})
			if (result.success) {
				setNewTaskTitle("")
				loadLinkedTasks()
				onTasksChange()
			}
		} catch (error) {
			console.error("Error creating task:", error)
		} finally {
			setIsCreatingTask(false)
		}
	}

	// Manejar navegar a tarea
	const handleOpenTask = (taskId: string) => {
		router.push(`/tareas?task=${taskId}`)
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CheckSquare className="h-4 w-4" />
				<span>Cargando tareas...</span>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<LinkIcon className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">Tareas vinculadas</span>
					<Badge variant="secondary" className="text-xs">
						{linkedTasks.length}
					</Badge>
				</div>
			</div>

			{/* Crear nueva tarea */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<input
						type="text"
						placeholder="Crear tarea desde esta nota..."
						value={newTaskTitle}
						onChange={(e) => setNewTaskTitle(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleCreateTask()
							}
						}}
						className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<Button
						size="sm"
						onClick={handleCreateTask}
						disabled={!newTaskTitle.trim() || !selectedListId || isCreatingTask}
					>
						{isCreatingTask ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
						) : (
							<Plus className="h-4 w-4" />
						)}
					</Button>
				</div>
				
				{/* Selector de lista */}
				{taskLists.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Lista:</span>
						<Select value={selectedListId} onValueChange={setSelectedListId}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Seleccionar lista" />
							</SelectTrigger>
							<SelectContent>
								{taskLists.map((list) => (
									<SelectItem key={list.id} value={list.id}>
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-full" 
												style={{ backgroundColor: list.color }}
											/>
											<span>{list.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Lista de tareas vinculadas */}
			{linkedTasks.length > 0 && (
				<div className="space-y-2">
					{linkedTasks.map((task) => (
						<div 
							key={task.id}
							className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
						>
							<div 
								className="flex-1 min-w-0 cursor-pointer"
								onClick={() => handleOpenTask(task.id)}
							>
								<div className="flex items-center gap-2">
									<div 
										className={`w-2 h-2 rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}
									/>
									<span className={`text-sm font-medium ${
										task.status === "completed" ? "line-through text-muted-foreground" : ""
									}`}>
										{task.title}
									</span>
									<Badge variant="outline" className="text-xs">
										{statusLabels[task.status as keyof typeof statusLabels]}
									</Badge>
									<ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Empty state */}
			{linkedTasks.length === 0 && (
				<div className="text-center py-6 text-muted-foreground">
					<CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p className="text-sm">No hay tareas vinculadas</p>
					<p className="text-xs">Crea una tarea desde esta nota</p>
				</div>
			)}
		</div>
	)
}
