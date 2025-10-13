"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
	ChevronDown, 
	ChevronRight,
	Plus,
	MoreHorizontal,
	Edit2,
	Trash2
} from "lucide-react"
import { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskItem } from "./task-item"
import { 
	getSubtasks, 
	addSubtask,
	type Task 
} from "@/app/actions/tasks"

interface SubtaskListProps {
	parentTaskId: string
	onSubtasksChange: () => void
}

export function SubtaskList({ parentTaskId, onSubtasksChange }: SubtaskListProps) {
	const [subtasks, setSubtasks] = useState<Task[]>([])
	const [isExpanded, setIsExpanded] = useState(false)
	const [isAddingSubtask, setIsAddingSubtask] = useState(false)
	const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
	const [newSubtaskDescription, setNewSubtaskDescription] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isAutoSaving, setIsAutoSaving] = useState(false)
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Cargar subtareas
	useEffect(() => {
		if (isExpanded) {
			loadSubtasks()
		}
	}, [isExpanded, parentTaskId])

	// Limpiar timeout al desmontar componente
	useEffect(() => {
		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current)
			}
		}
	}, [])

	const loadSubtasks = async () => {
		setIsLoading(true)
		try {
			const result = await getSubtasks(parentTaskId)
			if (result.success && result.subtasks) {
				setSubtasks(result.subtasks)
			}
		} catch (error) {
			console.error("Error loading subtasks:", error)
		} finally {
			setIsLoading(false)
		}
	}

	// Manejar agregar subtarea
	const handleAddSubtask = async () => {
		if (!newSubtaskTitle.trim()) return

		setIsAutoSaving(true)
		try {
			const result = await addSubtask(parentTaskId, {
				title: newSubtaskTitle,
				description: newSubtaskDescription.trim() || undefined
			})

			if (result.success) {
				setNewSubtaskTitle("")
				setNewSubtaskDescription("")
				setIsAddingSubtask(false)
				loadSubtasks()
				onSubtasksChange()
			}
		} catch (error) {
			console.error("Error creating subtask:", error)
		} finally {
			setIsAutoSaving(false)
		}
	}

	// Contar subtareas completadas
	const completedCount = subtasks.filter(task => task.status === "completed").length
	const totalCount = subtasks.length

	if (totalCount === 0 && !isAddingSubtask) {
		return (
			<div className="ml-4 md:ml-8 mt-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setIsExpanded(true)
						setIsAddingSubtask(true)
					}}
					className="text-muted-foreground hover:text-foreground"
				>
					<Plus className="h-4 w-4 mr-2" />
					Agregar subtarea
				</Button>
			</div>
		)
	}

	return (
		<div className="ml-4 md:ml-8 mt-2 space-y-1">
			{/* Header de subtareas */}
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsExpanded(!isExpanded)}
					className="h-6 w-6 p-0"
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</Button>
				<span className="text-sm text-muted-foreground">
					Subtareas ({completedCount}/{totalCount})
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setIsExpanded(true)
						setIsAddingSubtask(true)
					}}
					className="h-6 px-2 text-xs"
				>
					<Plus className="h-3 w-3 mr-1" />
					Agregar
				</Button>
			</div>

			{/* Lista de subtareas */}
			{isExpanded && (
				<div className="space-y-1">
					{/* Agregar nueva subtarea */}
					{isAddingSubtask && (
						<div className="flex flex-col gap-2 p-2 border border-dashed border-muted-foreground/30 rounded-lg">
							<div className="flex items-center gap-2">
								<Checkbox 
									checked={false}
									onCheckedChange={() => {}}
									className="h-4 w-4"
								/>
								<div className="flex-1 relative">
									<Input
										ref={inputRef}
										placeholder="Título de la subtarea..."
										value={newSubtaskTitle}
										className="h-9 md:h-8 border-0 shadow-none focus-visible:ring-0 text-sm min-w-0"
										onChange={(e) => {
											const value = e.target.value
											setNewSubtaskTitle(value)
											
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
														handleAddSubtask()
													}
												}, 2000)
											}
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault()
												handleAddSubtask()
											} else if (e.key === "Escape") {
												setIsAddingSubtask(false)
												setNewSubtaskTitle("")
												setNewSubtaskDescription("")
											}
										}}
										autoFocus
									/>
									{/* Indicador de guardado automático */}
									{isAutoSaving && (
										<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
											<div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
										</div>
									)}
								</div>
							</div>
							<Textarea
								placeholder="Detalles (opcional)..."
								value={newSubtaskDescription}
								onChange={(e) => setNewSubtaskDescription(e.target.value)}
								className="min-h-[50px] md:min-h-[40px] border-0 shadow-none focus-visible:ring-0 text-sm resize-none min-w-0"
								onKeyDown={(e) => {
									if (e.key === "Enter" && e.ctrlKey) {
										e.preventDefault()
										handleAddSubtask()
									} else if (e.key === "Escape") {
										setIsAddingSubtask(false)
										setNewSubtaskTitle("")
										setNewSubtaskDescription("")
									}
								}}
								rows={2}
							/>
							{/* Mensaje de ayuda */}
							<div className="text-xs text-muted-foreground ml-6 flex items-center gap-1">
								<span>Enter para guardar • Se guarda automáticamente</span>
							</div>
						</div>
					)}

					{/* Subtareas existentes */}
					{isLoading ? (
						<div className="text-xs text-muted-foreground p-2">
							Cargando subtareas...
						</div>
					) : (
						subtasks.map((subtask) => (
							<TaskItem
								key={subtask.id}
								task={subtask}
								onTaskUpdate={loadSubtasks}
								level={1}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
}
