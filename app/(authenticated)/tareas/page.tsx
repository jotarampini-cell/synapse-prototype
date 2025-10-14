"use client"

import { useState, useEffect } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
	getTasks, 
	getTaskLists, 
	createTask, 
	createTaskList,
	toggleTaskStatus,
	type Task,
	type TaskList,
	type TaskListWithStats
} from "@/app/actions/tasks"
import { TaskList as TaskListComponent } from "@/components/tasks/task-list"
import { TaskTabs } from "@/components/tasks/task-tabs"
import { TaskSidebarMenu } from "@/components/tasks/task-sidebar-menu"
import { TaskSortMenu } from "@/components/tasks/task-sort-menu"
import { TaskQuickAddSlider } from "@/components/tasks/task-quick-add-slider"
import { StarredTasksView } from "@/components/tasks/starred-tasks-view"
import { MobileBottomNav, MobileBottomNavSpacer } from "@/components/mobile-bottom-nav"
import { AppFooter } from "@/components/app-footer"
import { 
	Menu, 
	Plus, 
	MoreVertical,
	Star,
	CheckSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data para desarrollo
const mockTaskLists: TaskListWithStats[] = [
	{
		id: "550e8400-e29b-41d4-a716-446655440001",
		name: "Mis tareas",
		description: "Lista de tareas por defecto",
		color: "#3b82f6",
		icon: "list",
		position: 0,
		is_default: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		total_tasks: 4,
		completed_tasks: 1,
		pending_tasks: 3,
		overdue_tasks: 0
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440002",
		name: "Trabajo",
		description: "Tareas relacionadas con el trabajo",
		color: "#10b981",
		icon: "briefcase",
		position: 1,
		is_default: false,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		total_tasks: 2,
		completed_tasks: 0,
		pending_tasks: 2,
		overdue_tasks: 1
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440003",
		name: "Personal",
		description: "Tareas personales",
		color: "#f59e0b",
		icon: "user",
		position: 2,
		is_default: false,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		total_tasks: 1,
		completed_tasks: 1,
		pending_tasks: 0,
		overdue_tasks: 0
	}
]

const mockTasks: Task[] = [
	{
		id: "1",
		title: "Revisar propuesta de cliente",
		description: "Analizar los requerimientos y preparar respuesta",
		priority: "high",
		status: "pending",
		due_date: "2024-01-15",
		estimated_time: "2h",
		dependencies: [],
		tags: ["trabajo", "cliente"],
		content_id: undefined,
		list_id: "550e8400-e29b-41d4-a716-446655440001",
		parent_task_id: undefined,
		position: 0,
		notes: "Revisar con el equipo antes de enviar",
		completed_at: undefined,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: "2",
		title: "Actualizar documentación técnica",
		description: "Completar la documentación de la API",
		priority: "medium",
		status: "in_progress",
		due_date: "2024-01-20",
		estimated_time: "4h",
		dependencies: [],
		tags: ["desarrollo", "documentación"],
		content_id: undefined,
		list_id: "550e8400-e29b-41d4-a716-446655440001",
		parent_task_id: undefined,
		position: 1,
		notes: "",
		completed_at: undefined,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: "3",
		title: "Reunión con el equipo de diseño",
		description: "Discutir los mockups del nuevo dashboard",
		priority: "low",
		status: "completed",
		due_date: "2024-01-12",
		estimated_time: "1h",
		dependencies: [],
		tags: ["reunión", "diseño"],
		content_id: undefined,
		list_id: "550e8400-e29b-41d4-a716-446655440001",
		parent_task_id: undefined,
		position: 2,
		notes: "Reunión completada exitosamente",
		completed_at: "2024-01-12T15:30:00Z",
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-12T15:30:00Z"
	},
	{
		id: "4",
		title: "Configurar servidor de staging",
		description: "Preparar ambiente para pruebas",
		priority: "high",
		status: "pending",
		due_date: "2024-01-18",
		estimated_time: "3h",
		dependencies: [],
		tags: ["infraestructura", "devops"],
		content_id: undefined,
		list_id: "550e8400-e29b-41d4-a716-446655440001",
		parent_task_id: undefined,
		position: 3,
		notes: "Verificar que todos los servicios estén funcionando",
		completed_at: undefined,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	}
]

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

export default function TareasPage() {
	const { isMobile } = useMobileDetection()
	const searchParams = useSearchParams()
	const shouldCreate = searchParams.get('create') === 'true'
	const [selectedList, setSelectedList] = useState<string>("")
	const [taskLists, setTaskLists] = useState<TaskListWithStats[]>([])
	const [isAddingTask, setIsAddingTask] = useState(false)
	const [showStarred, setShowStarred] = useState(false)
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [sortField, setSortField] = useState<"position" | "title" | "due_date" | "priority" | "created_at" | "starred">("position")
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
	const [showCompleted, setShowCompleted] = useState(false)

	// Cargar listas de tareas
	useEffect(() => {
		loadTaskLists()
	}, [])

	// Detectar parámetro create=true para abrir slider automáticamente
	useEffect(() => {
		if (shouldCreate && !isAddingTask) {
			setIsAddingTask(true)
		}
	}, [shouldCreate, isAddingTask])

	const loadTaskLists = async () => {
		try {
			const result = await getTaskLists()
			if (result.success && result.taskLists && result.taskLists.length > 0) {
				console.log('✅ Listas de tareas cargadas desde BD:', result.taskLists.length)
				setTaskLists(result.taskLists)
				if (!selectedList && result.taskLists.length > 0) {
					setSelectedList(result.taskLists[0].id)
				}
			} else {
				console.log('📋 Usando datos mock - BD vacía o no disponible')
				// Usar datos mock como fallback
				setTaskLists(mockTaskLists)
				if (!selectedList) {
					setSelectedList(mockTaskLists[0].id)
				}
			}
		} catch (error) {
			console.error('❌ Error cargando listas:', error)
			// Usar datos mock como fallback
			setTaskLists(mockTaskLists)
			if (!selectedList) {
				setSelectedList(mockTaskLists[0].id)
			}
		}
	}

	const currentList = taskLists.find(list => list.id === selectedList)

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-gradient-to-br from-blue-50/30 via-background to-purple-50/20 overflow-x-hidden">
				{/* Tabs */}
				<div className="px-4 py-2 border-b border-border/50 bg-background/50">
					<TaskTabs
						taskLists={taskLists}
						selectedListId={selectedList}
						onListSelect={setSelectedList}
						onCreateNewList={() => console.log('Crear nueva lista')}
						showStarred={showStarred}
						onToggleStarred={() => setShowStarred(!showStarred)}
					/>
				</div>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
					<div className="p-4">
						{/* Vista de tareas destacadas o lista normal */}
						{showStarred ? (
							<StarredTasksView onTaskUpdate={loadTaskLists} />
						) : currentList ? (
							<TaskListComponent
								selectedList={currentList}
								onTasksChange={loadTaskLists}
							/>
						) : (
							<div className="text-center py-12">
								<div className="text-muted-foreground">Selecciona una lista de tareas</div>
							</div>
						)}
					</div>
				</main>

				{/* Barra inferior integrada con navegación */}
				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB para nueva tarea */}
				<Button
					onClick={() => setIsAddingTask(true)}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-40 touch-target hover:scale-110 active:scale-95 transition-transform"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Botón hamburguesa flotante izquierdo */}
				<Button
					onClick={() => setIsSidebarOpen(true)}
					className="fixed bottom-20 left-4 h-12 w-12 rounded-full shadow-xl shadow-primary/20 z-40 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
					size="icon"
					variant="ghost"
				>
					<Menu className="h-5 w-5" />
				</Button>

				{/* Botones de acción flotantes */}
				<div className="fixed bottom-32 right-4 flex flex-col gap-2 z-40">
					{/* Botón de ordenamiento */}
					<Button
						onClick={() => {/* Toggle sort menu */}}
						className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
						size="icon"
						variant="ghost"
					>
						<MoreVertical className="h-4 w-4" />
					</Button>
					
					{/* Botón de destacadas */}
					<Button
						onClick={() => setShowStarred(!showStarred)}
						className={cn(
							"h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50",
							showStarred && "bg-yellow-500/20 border-yellow-500/50"
						)}
						size="icon"
						variant="ghost"
					>
						<Star className="h-4 w-4" />
					</Button>
					
					{/* Botón de completadas */}
					<Button
						onClick={() => setShowCompleted(!showCompleted)}
						className={cn(
							"h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50",
							showCompleted && "bg-green-500/20 border-green-500/50"
						)}
						size="icon"
						variant="ghost"
					>
						<CheckSquare className="h-4 w-4" />
					</Button>
				</div>

				{/* Componentes modales */}
				<TaskSidebarMenu
					isOpen={isSidebarOpen}
					onClose={() => setIsSidebarOpen(false)}
					taskLists={taskLists}
					selectedListId={selectedList}
					onListSelect={setSelectedList}
					onListsChange={loadTaskLists}
					showStarred={showStarred}
					onToggleStarred={() => setShowStarred(!showStarred)}
				/>

				<TaskQuickAddSlider
					isOpen={isAddingTask}
					onClose={() => setIsAddingTask(false)}
					onTaskCreated={loadTaskLists}
					listId={selectedList}
				/>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-gradient-to-br from-blue-50/30 via-background to-purple-50/20">
			{/* Tabs */}
			<div className="px-6 py-3 border-b border-border/50 bg-background/50">
				<TaskTabs
					taskLists={taskLists}
					selectedListId={selectedList}
					onListSelect={setSelectedList}
					onCreateNewList={() => console.log('Crear nueva lista')}
					showStarred={showStarred}
					onToggleStarred={() => setShowStarred(!showStarred)}
				/>
			</div>

			{/* Contenido principal */}
			<main className="flex-1 p-6 overflow-y-auto">
				<div className="max-w-4xl mx-auto">
					{/* Vista de tareas destacadas o lista normal */}
					{showStarred ? (
						<StarredTasksView onTaskUpdate={loadTaskLists} />
					) : currentList ? (
						<TaskListComponent
							selectedList={currentList}
							onTasksChange={loadTaskLists}
						/>
					) : (
						<div className="text-center py-12">
							<div className="text-muted-foreground">Selecciona una lista de tareas</div>
						</div>
					)}
				</div>
			</main>

			{/* Barra inferior fija */}
			<div className="px-6 py-4 bg-background/80 backdrop-blur-xl border-t border-border/50">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsSidebarOpen(true)}
						className="h-12 w-12 rounded-full"
					>
						<Menu className="h-6 w-6" />
					</Button>
					
					<Button
						onClick={() => setIsAddingTask(true)}
						className="h-14 w-14 rounded-full shadow-2xl shadow-primary/30"
						size="icon"
					>
						<Plus className="h-6 w-6" />
					</Button>
					
					<TaskSortMenu
						sortField={sortField}
						sortOrder={sortOrder}
						onSortChange={(field, order) => {
							setSortField(field)
							setSortOrder(order)
						}}
						showCompleted={showCompleted}
						onToggleCompleted={() => setShowCompleted(!showCompleted)}
					/>
				</div>
			</div>

			{/* Componentes modales */}
			<TaskSidebarMenu
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				taskLists={taskLists}
				selectedListId={selectedList}
				onListSelect={setSelectedList}
				onListsChange={loadTaskLists}
				showStarred={showStarred}
				onToggleStarred={() => setShowStarred(!showStarred)}
			/>

			<TaskQuickAddSlider
				isOpen={isAddingTask}
				onClose={() => setIsAddingTask(false)}
				onTaskCreated={loadTaskLists}
				listId={selectedList}
			/>
		</div>
	)
}
