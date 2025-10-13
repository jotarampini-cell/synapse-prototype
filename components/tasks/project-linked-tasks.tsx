"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckSquare, Calendar, Clock, Unlink } from "lucide-react"
import { getProjectTasks, unlinkTaskFromProject } from "@/app/actions/tasks"
import { Task } from "@/app/actions/tasks"

interface ProjectLinkedTasksProps {
	projectId: string
	onTasksChange: () => void
}

export function ProjectLinkedTasks({ projectId, onTasksChange }: ProjectLinkedTasksProps) {
	const [tasks, setTasks] = useState<Task[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		loadTasks()
	}, [projectId])

	const loadTasks = async () => {
		setIsLoading(true)
		try {
			const result = await getProjectTasks(projectId)
			if (result.success && result.tasks) {
				setTasks(result.tasks)
			}
		} catch (error) {
			console.error('Error loading project tasks:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleUnlinkTask = async (taskId: string) => {
		const result = await unlinkTaskFromProject(taskId, projectId)
		if (result.success) {
			await loadTasks()
			onTasksChange()
		}
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-500'
			case 'medium': return 'bg-yellow-500'
			case 'low': return 'bg-green-500'
			default: return 'bg-gray-500'
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'bg-green-500'
			case 'pending': return 'bg-yellow-500'
			case 'in_progress': return 'bg-blue-500'
			default: return 'bg-gray-500'
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				<h4 className="font-medium flex items-center gap-2">
					<CheckSquare className="h-4 w-4" />
					Tareas del Proyecto
				</h4>
				<div className="text-sm text-muted-foreground">Cargando tareas...</div>
			</div>
		)
	}

	if (tasks.length === 0) {
		return (
			<div className="space-y-3">
				<h4 className="font-medium flex items-center gap-2">
					<CheckSquare className="h-4 w-4" />
					Tareas del Proyecto
				</h4>
				<div className="text-sm text-muted-foreground">
					No hay tareas vinculadas a este proyecto
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<h4 className="font-medium flex items-center gap-2">
				<CheckSquare className="h-4 w-4" />
				Tareas del Proyecto ({tasks.length})
			</h4>
			
			<div className="space-y-2">
				{tasks.map((task) => (
					<Card key={task.id} className="p-3">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-2">
									<div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
									<span className="font-medium truncate">{task.title}</span>
									<Badge variant="secondary" className="text-xs">
										{task.priority}
									</Badge>
								</div>
								
								{task.description && (
									<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
										{task.description}
									</p>
								)}
								
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									{task.due_date && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											{formatDate(task.due_date)}
										</div>
									)}
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{new Date(task.created_at).toLocaleDateString('es-ES')}
									</div>
								</div>
							</div>
							
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleUnlinkTask(task.id)}
								className="ml-2"
							>
								<Unlink className="h-4 w-4" />
							</Button>
						</div>
					</Card>
				))}
			</div>
		</div>
	)
}

