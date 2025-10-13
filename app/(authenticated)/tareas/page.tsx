"use client"

import { useState, useEffect } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useSearchParams } from "next/navigation"
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
import { TaskListSelector } from "@/components/tasks/task-list-selector"
import { TaskList as TaskListComponent } from "@/components/tasks/task-list"
import { AppFooter } from "@/components/app-footer"

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

	// Cargar listas de tareas
	useEffect(() => {
		loadTaskLists()
	}, [])

	// Detectar parámetro create=true para abrir formulario automáticamente
	useEffect(() => {
		if (shouldCreate && !isAddingTask) {
			setIsAddingTask(true)
			// Scroll al formulario después de un breve delay
			setTimeout(() => {
				const input = document.querySelector('input[placeholder*="Título"]')
				if (input instanceof HTMLElement) {
					input.scrollIntoView({ behavior: 'smooth', block: 'center' })
					input.focus()
				}
			}, 300)
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
			<div className="h-screen flex flex-col bg-background overflow-x-hidden">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<h1 className="text-lg font-semibold">Tareas</h1>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
					<div className="p-4">
						{/* Selector de lista */}
						<TaskListSelector
							taskLists={taskLists}
							selectedListId={selectedList}
							onListSelect={setSelectedList}
							onListsChange={loadTaskLists}
						/>
						
						{/* Lista de tareas */}
						{currentList && (
							<div className="mt-4">
								<TaskListComponent
									selectedList={currentList}
									onTasksChange={loadTaskLists}
								/>
							</div>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />
				
				{/* Footer móvil */}
				<AppFooter />
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex bg-background">
			{/* Sidebar de listas */}
			<div className="w-64 border-r border-border bg-muted/20">
				<div className="p-4">
					<h2 className="text-lg font-semibold mb-4">Listas de tareas</h2>
					<TaskListSelector
						taskLists={taskLists}
						selectedListId={selectedList}
						onListSelect={setSelectedList}
						onListsChange={loadTaskLists}
					/>
				</div>
			</div>

			{/* Contenido principal */}
			<div className="flex-1 flex flex-col">
				<header className="h-16 px-6 flex items-center justify-between border-b border-border">
					<div>
						<h1 className="text-2xl font-bold">{currentList?.name}</h1>
						<p className="text-sm text-muted-foreground">
							{currentList?.pending_tasks} tareas pendientes
						</p>
					</div>
				</header>

				<main className="flex-1 p-6">
					<div className="max-w-4xl mx-auto">
						{/* Lista de tareas */}
						{currentList && (
							<TaskListComponent
								selectedList={currentList}
								onTasksChange={loadTaskLists}
							/>
						)}
					</div>
				</main>
			</div>
		</div>
	)
}
