"use client"

import { useState, useEffect } from "react"
import { TaskItem } from "./task-item"
import { getStarredTasks, type Task } from "@/app/actions/tasks"
import { Star, CheckCircle } from "lucide-react"

interface StarredTasksViewProps {
	onTaskUpdate: () => void
}

export function StarredTasksView({ onTaskUpdate }: StarredTasksViewProps) {
	const [tasks, setTasks] = useState<Task[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showCompleted, setShowCompleted] = useState(false)

	useEffect(() => {
		loadStarredTasks()
	}, [])

	const loadStarredTasks = async () => {
		setIsLoading(true)
		try {
			const result = await getStarredTasks()
			if (result.success && result.tasks) {
				setTasks(result.tasks)
			} else {
				setTasks([])
			}
		} catch (error) {
			console.error("Error loading starred tasks:", error)
			setTasks([])
		} finally {
			setIsLoading(false)
		}
	}

	// Filtrar tareas
	const pendingTasks = tasks.filter(task => task.status !== "completed")
	const completedTasks = tasks.filter(task => task.status === "completed")

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-muted-foreground">Cargando tareas destacadas...</div>
			</div>
		)
	}

	if (tasks.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
					<Star className="h-8 w-8 text-yellow-600" />
				</div>
				<h3 className="text-lg font-semibold mb-2">No hay tareas destacadas</h3>
				<p className="text-muted-foreground text-sm">
					Marca algunas tareas con la estrella para verlas aquí
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Header con contador */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Star className="h-5 w-5 text-yellow-600 fill-current" />
					<h2 className="text-lg font-semibold">Tareas Destacadas</h2>
					<span className="text-sm text-muted-foreground">
						({pendingTasks.length} pendientes)
					</span>
				</div>
				{completedTasks.length > 0 && (
					<button
						onClick={() => setShowCompleted(!showCompleted)}
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						{showCompleted ? "Ocultar" : "Mostrar"} completadas ({completedTasks.length})
					</button>
				)}
			</div>

			{/* Lista de tareas pendientes */}
			<div className="space-y-1">
				{pendingTasks.map((task) => (
					<TaskItem
						key={task.id}
						task={task}
						onTaskUpdate={loadStarredTasks}
						level={0}
						onOpenDetails={() => {}}
					/>
				))}
			</div>

			{/* Tareas completadas */}
			{showCompleted && completedTasks.length > 0 && (
				<>
					<div className="flex items-center gap-2 py-3 text-muted-foreground border-t border-border/20 mt-4 pt-4">
						<CheckCircle className="h-4 w-4" />
						<span className="text-sm font-medium">
							Completadas ({completedTasks.length})
						</span>
					</div>
					<div className="space-y-1">
						{completedTasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								onTaskUpdate={loadStarredTasks}
								level={0}
								onOpenDetails={() => {}}
							/>
						))}
					</div>
				</>
			)}
		</div>
	)
}
