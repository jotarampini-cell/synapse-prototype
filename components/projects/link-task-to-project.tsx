"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
	CheckSquare, 
	Search, 
	Link, 
	Loader2,
	Plus
} from "lucide-react"
import { addTaskToProject, getProjectTasks } from "@/app/actions/projects"
import { getTasks } from "@/app/actions/tasks"
import { toast } from "sonner"

interface LinkTaskToProjectProps {
	projectId: string
	projectName: string
	onTaskLinked?: () => void
	trigger?: React.ReactNode
}

interface Task {
	id: string
	title: string
	description: string
	status: string
	priority: string
	due_date?: string
	created_at: string
}

export function LinkTaskToProject({ 
	projectId, 
	projectName, 
	onTaskLinked,
	trigger 
}: LinkTaskToProjectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isLinking, setIsLinking] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [tasks, setTasks] = useState<Task[]>([])
	const [linkedTasks, setLinkedTasks] = useState<string[]>([])

	// Cargar tareas disponibles y tareas ya vinculadas
	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen, projectId])

	const loadData = async () => {
		setIsLoading(true)
		try {
			const [tasksResult, linkedResult] = await Promise.all([
				getTasks(),
				getProjectTasks(projectId)
			])

			if (tasksResult.success && tasksResult.tasks) {
				setTasks(tasksResult.tasks)
			}

			if (linkedResult.success && linkedResult.tasks) {
				setLinkedTasks(linkedResult.tasks.map(task => task.id))
			}
		} catch (error) {
			toast.error("Error al cargar tareas")
		} finally {
			setIsLoading(false)
		}
	}

	const handleLinkTask = async (taskId: string) => {
		setIsLinking(true)
		try {
			const result = await addTaskToProject(projectId, taskId)
			if (result.success) {
				toast.success("Tarea vinculada al proyecto")
				setLinkedTasks(prev => [...prev, taskId])
				onTaskLinked?.()
			} else {
				toast.error(result.error || "Error al vincular tarea")
			}
		} catch (error) {
			toast.error("Error al vincular tarea")
		} finally {
			setIsLinking(false)
		}
	}

	const filteredTasks = tasks.filter(task => {
		const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
		const isNotLinked = !linkedTasks.includes(task.id)
		return matchesSearch && isNotLinked
	})

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'text-red-500'
			case 'medium': return 'text-yellow-500'
			case 'low': return 'text-green-500'
			default: return 'text-gray-500'
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'text-green-500'
			case 'in_progress': return 'text-blue-500'
			case 'pending': return 'text-gray-500'
			default: return 'text-gray-500'
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm">
						<Plus className="h-4 w-4 mr-2" />
						Vincular Tarea
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[80vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<CheckSquare className="h-5 w-5" />
						Vincular Tarea a "{projectName}"
					</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4">
					{/* Búsqueda */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input 
							placeholder="Buscar tareas..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Lista de tareas */}
					<div className="max-h-96 overflow-y-auto space-y-2">
						{isLoading ? (
							<div className="text-center py-8">
								<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Cargando tareas...</p>
							</div>
						) : filteredTasks.length > 0 ? (
							filteredTasks.map((task) => (
								<Card key={task.id} className="p-3">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-sm mb-1 truncate">{task.title}</h4>
											{task.description && (
												<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
													{task.description}
												</p>
											)}
											<div className="flex items-center gap-2 flex-wrap">
												<Badge 
													variant="outline" 
													className={`text-xs ${getStatusColor(task.status)}`}
												>
													{task.status}
												</Badge>
												<Badge 
													variant="outline" 
													className={`text-xs ${getPriorityColor(task.priority)}`}
												>
													{task.priority}
												</Badge>
												{task.due_date && (
													<span className="text-xs text-muted-foreground">
														Vence: {formatDate(task.due_date)}
													</span>
												)}
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleLinkTask(task.id)}
											disabled={isLinking}
											className="ml-2"
										>
											{isLinking ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<>
													<Link className="h-4 w-4 mr-1" />
													Vincular
												</>
											)}
										</Button>
									</div>
								</Card>
							))
						) : (
							<div className="text-center py-8">
								<CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
								<p className="text-sm text-muted-foreground">
									{searchQuery ? "No se encontraron tareas con ese criterio" : "No hay tareas disponibles para vincular"}
								</p>
							</div>
						)}
					</div>

					{/* Tareas ya vinculadas */}
					{linkedTasks.length > 0 && (
						<div className="pt-4 border-t">
							<p className="text-sm font-medium mb-2">
								Tareas ya vinculadas ({linkedTasks.length})
							</p>
							<div className="text-xs text-muted-foreground">
								Las tareas vinculadas aparecen en la vista de detalle del proyecto
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
