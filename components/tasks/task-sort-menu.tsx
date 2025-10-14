"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuSeparator,
	DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
	MoreVertical, 
	ArrowUpDown, 
	Calendar, 
	Star, 
	CheckSquare,
	Eye,
	EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

type SortField = "position" | "title" | "due_date" | "priority" | "created_at" | "starred"
type SortOrder = "asc" | "desc"

interface TaskSortMenuProps {
	sortField: SortField
	sortOrder: SortOrder
	onSortChange: (field: SortField, order: SortOrder) => void
	showCompleted: boolean
	onToggleCompleted: () => void
}

export function TaskSortMenu({
	sortField,
	sortOrder,
	onSortChange,
	showCompleted,
	onToggleCompleted
}: TaskSortMenuProps) {
	const [isOpen, setIsOpen] = useState(false)

	const sortOptions = [
		{
			field: "position" as const,
			label: "Posición",
			icon: ArrowUpDown,
			description: "Orden personalizado"
		},
		{
			field: "due_date" as const,
			label: "Fecha de vencimiento",
			icon: Calendar,
			description: "Próximas fechas primero"
		},
		{
			field: "priority" as const,
			label: "Prioridad",
			icon: Star,
			description: "Alta, media, baja"
		},
		{
			field: "starred" as const,
			label: "Destacadas primero",
			icon: Star,
			description: "Tareas marcadas con estrella"
		},
		{
			field: "title" as const,
			label: "Título",
			icon: ArrowUpDown,
			description: "Orden alfabético"
		},
		{
			field: "created_at" as const,
			label: "Fecha de creación",
			icon: Calendar,
			description: "Más recientes primero"
		}
	]

	const handleSortSelect = (field: SortField) => {
		if (field === sortField) {
			// Si es el mismo campo, cambiar el orden
			onSortChange(field, sortOrder === "asc" ? "desc" : "asc")
		} else {
			// Si es un campo diferente, usar orden por defecto
			const defaultOrder = field === "due_date" || field === "created_at" ? "asc" : "asc"
			onSortChange(field, defaultOrder)
		}
		setIsOpen(false)
	}

	const getCurrentSortLabel = () => {
		const option = sortOptions.find(opt => opt.field === sortField)
		return option ? option.label : "Ordenar por"
	}

	const getSortIcon = () => {
		const option = sortOptions.find(opt => opt.field === sortField)
		return option ? option.icon : ArrowUpDown
	}

	const SortIcon = getSortIcon()

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-10 w-10 rounded-full hover:bg-muted/50 active:scale-95 transition-all"
				>
					<MoreVertical className="h-5 w-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				{/* Sección de ordenamiento */}
				<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					Ordenar por
				</div>
				
				{sortOptions.map((option) => {
					const Icon = option.icon
					const isSelected = sortField === option.field
					
					return (
						<DropdownMenuItem
							key={option.field}
							onClick={() => handleSortSelect(option.field)}
							className="flex items-center gap-3 p-2 cursor-pointer"
						>
							<Icon className={cn(
								"h-4 w-4",
								isSelected ? "text-primary" : "text-muted-foreground"
							)} />
							<div className="flex-1">
								<div className={cn(
									"text-sm font-medium",
									isSelected ? "text-primary" : "text-foreground"
								)}>
									{option.label}
								</div>
								<div className="text-xs text-muted-foreground">
									{option.description}
								</div>
							</div>
							{isSelected && (
								<div className="text-xs text-primary font-medium">
									{sortOrder === "asc" ? "↑" : "↓"}
								</div>
							)}
						</DropdownMenuItem>
					)
				})}

				<DropdownMenuSeparator />

				{/* Sección de vista */}
				<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					Vista
				</div>

				<DropdownMenuItem
					onClick={onToggleCompleted}
					className="flex items-center gap-3 p-2 cursor-pointer"
				>
					{showCompleted ? (
						<EyeOff className="h-4 w-4 text-muted-foreground" />
					) : (
						<Eye className="h-4 w-4 text-muted-foreground" />
					)}
					<div className="flex-1">
						<div className="text-sm font-medium text-foreground">
							{showCompleted ? "Ocultar completadas" : "Mostrar completadas"}
						</div>
						<div className="text-xs text-muted-foreground">
							{showCompleted ? "Solo tareas pendientes" : "Incluir tareas terminadas"}
						</div>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}


