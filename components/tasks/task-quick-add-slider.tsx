"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
	X, 
	FileText, 
	Calendar as CalendarIcon, 
	Star,
	Plus
} from "lucide-react"
import { createTask } from "@/app/actions/tasks"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface TaskQuickAddSliderProps {
	isOpen: boolean
	onClose: () => void
	onTaskCreated: () => void
	listId?: string
}

export function TaskQuickAddSlider({ 
	isOpen, 
	onClose, 
	onTaskCreated,
	listId 
}: TaskQuickAddSliderProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
	const [isStarred, setIsStarred] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showDescription, setShowDescription] = useState(false)
	const [showCalendar, setShowCalendar] = useState(false)
	
	const inputRef = useRef<HTMLInputElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Auto-focus en el input cuando se abre
	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 100)
		}
	}, [isOpen])

	// Limpiar estado cuando se cierra
	useEffect(() => {
		if (!isOpen) {
			setTitle("")
			setDescription("")
			setDueDate(undefined)
			setIsStarred(false)
			setShowDescription(false)
			setShowCalendar(false)
		}
	}, [isOpen])

	const handleSave = async () => {
		if (!title.trim()) return

		setIsSaving(true)
		try {
			const result = await createTask({
				title: title.trim(),
				description: description.trim() || undefined,
				due_date: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
				list_id: listId
			})

			if (result.success) {
				onTaskCreated()
				onClose()
			}
		} catch (error) {
			console.error('Error creating task:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSave()
		} else if (e.key === "Escape") {
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<>
			{/* Overlay */}
			<div 
				className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
				onClick={onClose}
			/>
			
			{/* Slider */}
			<div className={cn(
				"fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl shadow-2xl z-50",
				"transform transition-all duration-500 ease-out",
				isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
			)}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h3 className="text-lg font-semibold">Nueva tarea</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-4">
					{/* Título */}
					<div className="space-y-2">
						<Input
							ref={inputRef}
							placeholder="Título de la tarea..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onKeyDown={handleKeyDown}
							className="text-base border-0 shadow-none focus-visible:ring-0 px-0"
							disabled={isSaving}
						/>
					</div>

					{/* Descripción (condicional) */}
					{showDescription && (
						<div className="space-y-2">
							<Textarea
								ref={textareaRef}
								placeholder="Detalles adicionales..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								onKeyDown={handleKeyDown}
								className="min-h-[80px] border-0 shadow-none focus-visible:ring-0 px-0 resize-none"
								disabled={isSaving}
							/>
						</div>
					)}

					{/* Fecha (condicional) */}
					{showCalendar && (
						<div className="space-y-2">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start text-left font-normal"
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{dueDate ? format(dueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={dueDate}
										onSelect={setDueDate}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* Íconos de acción */}
					<div className="flex items-center gap-4 pt-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowDescription(!showDescription)}
							className={cn(
								"h-10 w-10 p-0 transition-colors",
								showDescription ? "bg-blue-100 text-blue-600" : "text-muted-foreground hover:text-foreground"
							)}
						>
							<FileText className="h-5 w-5" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowCalendar(!showCalendar)}
							className={cn(
								"h-10 w-10 p-0 transition-colors",
								showCalendar ? "bg-green-100 text-green-600" : "text-muted-foreground hover:text-foreground"
							)}
						>
							<CalendarIcon className="h-5 w-5" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsStarred(!isStarred)}
							className={cn(
								"h-10 w-10 p-0 transition-colors",
								isStarred ? "bg-yellow-100 text-yellow-600" : "text-muted-foreground hover:text-foreground"
							)}
						>
							<Star className={cn("h-5 w-5", isStarred && "fill-current")} />
						</Button>

						<div className="flex-1" />

						<Button
							onClick={handleSave}
							disabled={!title.trim() || isSaving}
							className="gap-2"
						>
							{isSaving ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Guardando...
								</>
							) : (
								<>
									<Plus className="h-4 w-4" />
									Crear
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</>
	)
}
