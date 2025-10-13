"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
	Dialog, 
	DialogContent, 
	DialogHeader, 
	DialogTitle 
} from "@/components/ui/dialog"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { 
	Calendar,
	Clock,
	Tag,
	FileText,
	X,
	Save,
	Trash2,
	Plus,
	ChevronDown,
	ChevronRight
} from "lucide-react"
import { 
	updateTask, 
	deleteTask,
	getTaskLists,
	type Task,
	type TaskListWithStats 
} from "@/app/actions/tasks"
import { TaskLinkedNotes } from "./task-linked-notes"
import { TaskNoteLinker } from "./task-note-linker"
import { SubtaskList } from "./subtask-list"

interface TaskDetailsPanelProps {
	task: Task | null
	isOpen: boolean
	onClose: () => void
	onTaskUpdate: () => void
}

const priorityOptions = [
	{ value: "low", label: "Baja", color: "bg-green-500" },
	{ value: "medium", label: "Media", color: "bg-yellow-500" },
	{ value: "high", label: "Alta", color: "bg-red-500" }
]

const statusOptions = [
	{ value: "pending", label: "Pendiente", color: "bg-gray-500" },
	{ value: "in_progress", label: "En curso", color: "bg-blue-500" },
	{ value: "completed", label: "Completada", color: "bg-green-500" }
]

export function TaskDetailsPanel({ task, isOpen, onClose, onTaskUpdate }: TaskDetailsPanelProps) {
	const [editedTask, setEditedTask] = useState<Task | null>(null)
	const [taskLists, setTaskLists] = useState<TaskListWithStats[]>([])
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [newTag, setNewTag] = useState("")
	const [isExpanded, setIsExpanded] = useState({
		notes: true,
		subtasks: true,
		metadata: false
	})

	// Inicializar datos cuando se abre el panel
	useEffect(() => {
		if (isOpen && task) {
			setEditedTask({ ...task })
			loadTaskLists()
		}
	}, [isOpen, task])

	const loadTaskLists = async () => {
		try {
			const result = await getTaskLists()
			if (result.success && result.taskLists) {
				setTaskLists(result.taskLists)
			}
		} catch (error) {
			console.error("Error loading task lists:", error)
		}
	}

	// Manejar guardar cambios
	const handleSave = async () => {
		if (!editedTask) return

		setIsSaving(true)
		try {
			const result = await updateTask(editedTask.id, {
				title: editedTask.title,
				description: editedTask.description,
				priority: editedTask.priority,
				status: editedTask.status,
				due_date: editedTask.due_date,
				estimated_time: editedTask.estimated_time,
				tags: editedTask.tags,
				list_id: editedTask.list_id,
				notes: editedTask.notes
			})

			if (result.success) {
				onTaskUpdate()
				onClose()
			}
		} catch (error) {
			console.error("Error saving task:", error)
		} finally {
			setIsSaving(false)
		}
	}

	// Manejar eliminar tarea
	const handleDelete = async () => {
		if (!editedTask) return

		if (!confirm("¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.")) {
			return
		}

		setIsDeleting(true)
		try {
			const result = await deleteTask(editedTask.id)
			if (result.success) {
				onTaskUpdate()
				onClose()
			}
		} catch (error) {
			console.error("Error deleting task:", error)
		} finally {
			setIsDeleting(false)
		}
	}

	// Manejar agregar tag
	const handleAddTag = () => {
		if (!newTag.trim() || !editedTask) return

		const tag = newTag.trim()
		if (!editedTask.tags.includes(tag)) {
			setEditedTask({
				...editedTask,
				tags: [...editedTask.tags, tag]
			})
		}
		setNewTag("")
	}

	// Manejar eliminar tag
	const handleRemoveTag = (tagToRemove: string) => {
		if (!editedTask) return

		setEditedTask({
			...editedTask,
			tags: editedTask.tags.filter(tag => tag !== tagToRemove)
		})
	}

	if (!editedTask) return null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Detalles de la tarea
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Información básica */}
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Título</label>
							<Input
								value={editedTask.title}
								onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
								placeholder="Título de la tarea"
								className="min-w-0"
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">Descripción</label>
							<Textarea
								value={editedTask.description || ""}
								onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
								placeholder="Descripción de la tarea"
								rows={3}
								className="min-w-0"
							/>
						</div>

						<div>
							<label className="text-sm font-medium mb-2 block">Notas adicionales</label>
							<Textarea
								value={editedTask.notes || ""}
								onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
								placeholder="Notas adicionales sobre la tarea"
								rows={2}
								className="min-w-0"
							/>
						</div>
					</div>

					{/* Metadatos */}
					<div className="space-y-4">
						<button
							onClick={() => setIsExpanded(prev => ({ ...prev, metadata: !prev.metadata }))}
							className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							{isExpanded.metadata ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
							Metadatos
						</button>

						{isExpanded.metadata && (
							<div className="grid grid-cols-2 gap-4 pl-6">
								<div>
									<label className="text-sm font-medium mb-2 block">Lista</label>
									<Select 
										value={editedTask.list_id} 
										onValueChange={(value) => setEditedTask({ ...editedTask, list_id: value })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{taskLists.map((list) => (
												<SelectItem key={list.id} value={list.id}>
													<div className="flex items-center gap-2">
														<div 
															className="w-3 h-3 rounded-full"
															style={{ backgroundColor: list.color }}
														/>
														{list.name}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="text-sm font-medium mb-2 block">Estado</label>
									<Select 
										value={editedTask.status} 
										onValueChange={(value) => setEditedTask({ ...editedTask, status: value as "pending" | "in_progress" | "completed" })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<div className={`w-2 h-2 rounded-full ${option.color}`} />
														{option.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="text-sm font-medium mb-2 block">Prioridad</label>
									<Select 
										value={editedTask.priority} 
										onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as "low" | "medium" | "high" })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{priorityOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<div className={`w-2 h-2 rounded-full ${option.color}`} />
														{option.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="text-sm font-medium mb-2 block">Fecha de vencimiento</label>
									<Input
										type="date"
										value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ""}
										onChange={(e) => setEditedTask({ 
											...editedTask, 
											due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined 
										})}
									/>
								</div>

								<div>
									<label className="text-sm font-medium mb-2 block">Tiempo estimado</label>
									<Input
										value={editedTask.estimated_time || ""}
										onChange={(e) => setEditedTask({ ...editedTask, estimated_time: e.target.value })}
										placeholder="ej: 2 horas, 30 min"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Tags */}
					<div className="space-y-3">
						<label className="text-sm font-medium">Etiquetas</label>
						<div className="flex flex-wrap gap-2">
							{editedTask.tags.map((tag) => (
								<Badge key={tag} variant="secondary" className="flex items-center gap-1">
									{tag}
									<button
										onClick={() => handleRemoveTag(tag)}
										className="ml-1 hover:text-destructive"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								placeholder="Agregar etiqueta"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddTag()
									}
								}}
							/>
							<Button size="sm" onClick={handleAddTag}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Notas vinculadas */}
					<div className="space-y-3">
						<button
							onClick={() => setIsExpanded(prev => ({ ...prev, notes: !prev.notes }))}
							className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							{isExpanded.notes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
							Notas vinculadas
						</button>

						{isExpanded.notes && (
							<div className="pl-6 space-y-3">
								<TaskLinkedNotes
									task={editedTask}
									onNotesChange={onTaskUpdate}
								/>
								<TaskNoteLinker
									task={editedTask}
									onLinkCreated={onTaskUpdate}
								/>
							</div>
						)}
					</div>

					{/* Subtareas */}
					<div className="space-y-3">
						<button
							onClick={() => setIsExpanded(prev => ({ ...prev, subtasks: !prev.subtasks }))}
							className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							{isExpanded.subtasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
							Subtareas
						</button>

						{isExpanded.subtasks && (
							<div className="pl-6">
								<SubtaskList
									parentTaskId={editedTask.id}
									onSubtasksChange={onTaskUpdate}
								/>
							</div>
						)}
					</div>

					{/* Acciones */}
					<div className="flex items-center justify-between pt-4 border-t">
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
									Eliminando...
								</>
							) : (
								<>
									<Trash2 className="h-4 w-4 mr-2" />
									Eliminar
								</>
							)}
						</Button>

						<div className="flex gap-2">
							<Button variant="outline" onClick={onClose}>
								Cancelar
							</Button>
							<Button onClick={handleSave} disabled={isSaving}>
								{isSaving ? (
									<>
										<div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
										Guardando...
									</>
								) : (
									<>
										<Save className="h-4 w-4 mr-2" />
										Guardar
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
