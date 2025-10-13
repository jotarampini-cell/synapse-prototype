"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
	Plus, 
	ChevronDown, 
	ChevronRight,
	Search,
	Filter,
	SortAsc,
	SortDesc
} from "lucide-react"
import { TaskItem } from "./task-item"
import { TaskDetailsPanel } from "./task-details-panel"
import { SortableTaskItem } from "./sortable-task-item"
import { TaskDragOverlay } from "./drag-overlay"
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help"
import { 
	getTasks, 
	createTask,
	reorderTasks,
	type Task,
	type TaskListWithStats 
} from "@/app/actions/tasks"
import {
	DndContext,
	DragEndEvent,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	closestCenter,
	KeyboardSensor,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useKeyboardShortcuts, TASK_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts"

interface TaskListProps {
	selectedList: TaskListWithStats
	onTasksChange: () => void
}

type SortField = "position" | "title" | "due_date" | "priority" | "created_at"
type SortOrder = "asc" | "desc"

export function TaskList({ selectedList, onTasksChange }: TaskListProps) {
	const [tasks, setTasks] = useState<Task[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState("")
	const [showCompleted, setShowCompleted] = useState(false)
	const [sortField, setSortField] = useState<SortField>("position")
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
	const [isAddingTask, setIsAddingTask] = useState(false)
	const [newTaskTitle, setNewTaskTitle] = useState("")
	const [newTaskDescription, setNewTaskDescription] = useState("")
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
	const [activeTask, setActiveTask] = useState<Task | null>(null)
	const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(-1)
	const [isAutoSaving, setIsAutoSaving] = useState(false)
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Configuración de sensores para drag & drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	// Cargar tareas
	useEffect(() => {
		loadTasks()
	}, [selectedList.id])

	// Limpiar timeout al desmontar componente
	useEffect(() => {
		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current)
			}
		}
	}, [])

	const loadTasks = async () => {
		setIsLoading(true)
		try {
			const result = await getTasks({
				list_id: selectedList.id,
				include_subtasks: true
			})
			if (result.success && result.tasks) {
				setTasks(result.tasks)
			} else {
				// Si no hay tareas reales, usar array vacío
				setTasks([])
			}
		} catch (error) {
			console.error("Error loading tasks:", error)
			// En caso de error, usar array vacío para evitar que se rompa la UI
			setTasks([])
		} finally {
			setIsLoading(false)
		}
	}

	// Filtrar y ordenar tareas
	const filteredAndSortedTasks = tasks
		.filter(task => {
			const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				task.description?.toLowerCase().includes(searchQuery.toLowerCase())
			
			const matchesCompleted = showCompleted || task.status !== "completed"
			
			return matchesSearch && matchesCompleted
		})
		.sort((a, b) => {
			let aValue: string | number | Date | null = a[sortField as keyof typeof a]
			let bValue: string | number | Date | null = b[sortField as keyof typeof b]

			// Manejar valores especiales
			if (sortField === "priority") {
				const priorityOrder = { high: 3, medium: 2, low: 1 }
				aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
				bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
			}

			if (sortField === "due_date") {
				aValue = a.due_date ? new Date(a.due_date).getTime() : 0
				bValue = b.due_date ? new Date(b.due_date).getTime() : 0
			}

			if (sortField === "created_at") {
				aValue = new Date(a.created_at).getTime()
				bValue = new Date(b.created_at).getTime()
			}

			if (sortOrder === "asc") {
				return aValue > bValue ? 1 : -1
			} else {
				return aValue < bValue ? 1 : -1
			}
		})

	// Separar tareas principales y subtareas
	const mainTasks = filteredAndSortedTasks.filter(task => !task.parent_task_id)
	const completedTasks = filteredAndSortedTasks.filter(task => task.status === "completed" && !task.parent_task_id)
	const pendingTasks = filteredAndSortedTasks.filter(task => task.status !== "completed" && !task.parent_task_id)

	// Manejar agregar nueva tarea
	const handleAddTask = async () => {
		if (!newTaskTitle.trim()) return

		setIsAutoSaving(true)
		try {
			const result = await createTask({
				title: newTaskTitle,
				description: newTaskDescription.trim() || undefined,
				list_id: selectedList.id
			})

			if (result.success) {
				setNewTaskTitle("")
				setNewTaskDescription("")
				setIsAddingTask(false)
				loadTasks()
				onTasksChange()
			}
		} catch (error) {
			console.error("Error creating task:", error)
		} finally {
			setIsAutoSaving(false)
		}
	}

	// Manejar cambio de ordenamiento
	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortOrder("asc")
		}
	}

	// Manejar abrir panel de detalles
	const handleOpenDetails = (task: Task) => {
		setSelectedTask(task)
		setIsDetailsPanelOpen(true)
	}

	// Manejar cerrar panel de detalles
	const handleCloseDetails = () => {
		setIsDetailsPanelOpen(false)
		setSelectedTask(null)
	}

	// Funciones de drag & drop
	const handleDragStart = (event: DragStartEvent) => {
		const taskId = event.active.id as string
		const task = tasks.find(t => t.id === taskId)
		setActiveTask(task || null)
	}

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event

		if (!over || active.id === over.id) {
			setActiveTask(null)
			return
		}

		const oldIndex = tasks.findIndex((task) => task.id === active.id)
		const newIndex = tasks.findIndex((task) => task.id === over.id)

		if (oldIndex !== -1 && newIndex !== -1) {
			const newTasks = arrayMove(tasks, oldIndex, newIndex)
			setTasks(newTasks)

			// Actualizar posiciones en la base de datos
			const taskIds = newTasks.map(task => task.id)
			const result = await reorderTasks(taskIds)
			
			if (!result.success) {
				console.error('Error reordering tasks:', result.error)
				// Revertir cambios locales si falla la actualización
				loadTasks()
			}
		}

		setActiveTask(null)
	}

	// Atajos de teclado
	useKeyboardShortcuts([
		{
			key: TASK_SHORTCUTS.NEW_TASK,
			action: () => setIsAddingTask(true),
			description: "Crear nueva tarea"
		},
		{
			key: TASK_SHORTCUTS.COMPLETE_TASK,
			action: () => {
				if (selectedTaskIndex >= 0 && selectedTaskIndex < pendingTasks.length) {
					const task = pendingTasks[selectedTaskIndex]
					if (task && task.status === 'pending') {
						handleToggleTaskStatus(task.id, 'completed')
					}
				}
			},
			description: "Completar tarea seleccionada"
		},
		{
			key: TASK_SHORTCUTS.DELETE_TASK,
			action: () => {
				if (selectedTaskIndex >= 0 && selectedTaskIndex < pendingTasks.length) {
					const task = pendingTasks[selectedTaskIndex]
					if (task) {
						handleDeleteTask(task.id)
					}
				}
			},
			description: "Eliminar tarea seleccionada"
		},
		{
			key: TASK_SHORTCUTS.EDIT_TASK,
			action: () => {
				if (selectedTaskIndex >= 0 && selectedTaskIndex < pendingTasks.length) {
					const task = pendingTasks[selectedTaskIndex]
					if (task) {
						handleOpenDetails(task)
					}
				}
			},
			description: "Editar tarea seleccionada"
		},
		{
			key: TASK_SHORTCUTS.TOGGLE_COMPLETED,
			action: () => setShowCompleted(!showCompleted),
			description: "Mostrar/ocultar tareas completadas"
		},
		{
			key: TASK_SHORTCUTS.ESCAPE,
			action: () => {
				setIsAddingTask(false)
				setNewTaskTitle("")
				setSelectedTaskIndex(-1)
				setIsDetailsPanelOpen(false)
			},
			description: "Cancelar acción"
		},
		{
			key: TASK_SHORTCUTS.MOVE_UP,
			action: () => {
				if (selectedTaskIndex > 0) {
					setSelectedTaskIndex(selectedTaskIndex - 1)
				}
			},
			description: "Mover selección hacia arriba"
		},
		{
			key: TASK_SHORTCUTS.MOVE_DOWN,
			action: () => {
				if (selectedTaskIndex < pendingTasks.length - 1) {
					setSelectedTaskIndex(selectedTaskIndex + 1)
				}
			},
			description: "Mover selección hacia abajo"
		}
	])

	// Obtener subtareas de una tarea
	const getSubtasks = (parentTaskId: string) => {
		return filteredAndSortedTasks.filter(task => task.parent_task_id === parentTaskId)
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-muted-foreground">Cargando tareas...</div>
			</div>
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="space-y-4 overflow-x-hidden">
			{/* Header con controles */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold">{selectedList.name}</h2>
					<span className="text-sm text-muted-foreground">
						({pendingTasks.length} pendientes)
					</span>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<KeyboardShortcutsHelp />
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowCompleted(!showCompleted)}
						className="text-xs sm:text-sm"
					>
						{showCompleted ? "Ocultar completadas" : "Mostrar completadas"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsAddingTask(true)}
					>
						<Plus className="h-4 w-4 mr-2" />
						Nueva Tarea
					</Button>
				</div>
			</div>

			{/* Búsqueda y filtros */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Buscar tareas..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleSort("due_date")}
						className="flex-1 sm:flex-none"
					>
						Fecha
						{sortField === "due_date" && (
							sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
						)}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleSort("priority")}
						className="flex-1 sm:flex-none"
					>
						Prioridad
						{sortField === "priority" && (
							sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
						)}
					</Button>
				</div>
			</div>

			{/* Agregar nueva tarea */}
			{isAddingTask && (
				<div className="flex flex-col gap-2 p-3 border border-dashed border-muted-foreground/30 rounded-lg">
					<div className="flex items-center gap-3">
						<Checkbox 
							checked={false}
							onCheckedChange={() => {}}
							className="h-5 w-5"
						/>
						<div className="flex-1 relative">
							<Input
								ref={inputRef}
								placeholder="Título de la tarea..."
								value={newTaskTitle}
								className="h-10 md:h-9 border-0 shadow-none focus-visible:ring-0 min-w-0"
								onChange={(e) => {
									const value = e.target.value
									setNewTaskTitle(value)
									
									// Limpiar timeout anterior
									if (autoSaveTimeoutRef.current) {
										clearTimeout(autoSaveTimeoutRef.current)
									}
									
									// Solo configurar auto-save si hay contenido
									if (value.trim()) {
										autoSaveTimeoutRef.current = setTimeout(() => {
											// Verificar que el valor actual del input coincida con el valor del timeout
											const currentValue = inputRef.current?.value || ""
											if (currentValue.trim() === value.trim() && currentValue.trim()) {
												handleAddTask()
											}
										}, 2000)
									}
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault()
										handleAddTask()
									} else if (e.key === "Escape") {
										setIsAddingTask(false)
										setNewTaskTitle("")
										setNewTaskDescription("")
									}
								}}
								autoFocus
							/>
							{/* Indicador de guardado automático */}
							{isAutoSaving && (
								<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
									<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
								</div>
							)}
						</div>
					</div>
						<Textarea
							placeholder="Detalles (opcional)..."
							value={newTaskDescription}
							onChange={(e) => setNewTaskDescription(e.target.value)}
							className="min-h-[60px] md:min-h-[50px] border-0 shadow-none focus-visible:ring-0 resize-none ml-8 min-w-0"
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey) {
									e.preventDefault()
									handleAddTask()
								} else if (e.key === "Escape") {
									setIsAddingTask(false)
									setNewTaskTitle("")
									setNewTaskDescription("")
								}
							}}
							rows={2}
						/>
						{/* Mensaje de ayuda */}
						<div className="text-xs text-muted-foreground ml-8 flex items-center gap-1">
							<span>Enter para guardar • Ctrl+Enter para guardar desde descripción • Se guarda automáticamente</span>
						</div>
				</div>
			)}

			{/* Lista de tareas */}
			<SortableContext items={pendingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
				<div className="space-y-1">
					{/* Tareas pendientes */}
					{pendingTasks.map((task, index) => (
						<div key={task.id} className="group/task-group relative">
							{/* Separador sutil entre grupos de tareas */}
							{index > 0 && (
								<div className="absolute -top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
							)}
							<SortableTaskItem
								task={task}
								onTaskUpdate={loadTasks}
								level={0}
								onOpenDetails={handleOpenDetails}
								isSelected={selectedTaskIndex === index}
								onSelect={() => setSelectedTaskIndex(index)}
							/>
							{/* Subtareas */}
							{getSubtasks(task.id).map((subtask) => (
								<TaskItem
									key={subtask.id}
									task={subtask}
									onTaskUpdate={loadTasks}
									level={1}
									onOpenDetails={handleOpenDetails}
								/>
							))}
						</div>
					))}

				{/* Tareas completadas */}
				{showCompleted && completedTasks.length > 0 && (
					<>
						<div className="flex items-center gap-2 py-3 text-muted-foreground border-t border-border/20 mt-4 pt-4">
							<ChevronDown className="h-4 w-4" />
							<span className="text-sm font-medium">
								Completadas ({completedTasks.length})
							</span>
						</div>
						<div className="space-y-1">
							{completedTasks.map((task) => (
								<div key={task.id} className="group/task-group">
									<TaskItem
										task={task}
										onTaskUpdate={loadTasks}
										level={0}
										onOpenDetails={handleOpenDetails}
									/>
									{/* Subtareas completadas */}
									{getSubtasks(task.id).map((subtask) => (
										<TaskItem
											key={subtask.id}
											task={subtask}
											onTaskUpdate={loadTasks}
											level={1}
											onOpenDetails={handleOpenDetails}
										/>
									))}
								</div>
							))}
						</div>
					</>
				)}
				</div>
			</SortableContext>

			{/* Empty state */}
			{filteredAndSortedTasks.length === 0 && !isAddingTask && (
				<div className="text-center py-12">
					<div className="text-muted-foreground mb-4">
						{searchQuery ? "No se encontraron tareas con ese criterio" : "No hay tareas en esta lista"}
					</div>
					<Button onClick={() => setIsAddingTask(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Crear Primera Tarea
					</Button>
				</div>
			)}

			{/* Panel de detalles */}
			<TaskDetailsPanel
				task={selectedTask}
				isOpen={isDetailsPanelOpen}
				onClose={handleCloseDetails}
				onTaskUpdate={loadTasks}
			/>
			</div>

			{/* Drag Overlay */}
			<DragOverlay>
				{activeTask ? <TaskDragOverlay activeTask={activeTask} /> : null}
			</DragOverlay>
		</DndContext>
	)
}
