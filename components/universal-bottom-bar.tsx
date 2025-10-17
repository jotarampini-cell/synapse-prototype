"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
	Home, 
	FileText, 
	CheckSquare, 
	Link as LinkIcon, 
	Briefcase,
	Menu,
	Plus,
	MoreVertical
} from "lucide-react"
import { TaskSortMenu } from "./tasks/task-sort-menu"
import { cn } from "@/lib/utils"

interface UniversalBottomBarProps {
	onAddAction: () => void
	onOpenSidebar?: () => void
	// Props específicas para tareas (opcional)
	sortField?: "position" | "title" | "due_date" | "priority" | "created_at" | "starred"
	sortOrder?: "asc" | "desc"
	onSortChange?: (field: "position" | "title" | "due_date" | "priority" | "created_at" | "starred", order: "asc" | "desc") => void
	showCompleted?: boolean
	onToggleCompleted?: () => void
}

const navItems = [
	{ 
		icon: Home, 
		label: "Home", 
		href: "/home",
		ariaLabel: "Ir a Home"
	},
	{ 
		icon: FileText, 
		label: "Notas", 
		href: "/notes",
		ariaLabel: "Ir a Notas"
	},
	{ 
		icon: CheckSquare, 
		label: "Tareas", 
		href: "/tareas",
		ariaLabel: "Ir a Tareas"
	},
	{ 
		icon: LinkIcon, 
		label: "Fuentes", 
		href: "/fuentes",
		ariaLabel: "Ir a Fuentes"
	},
	{ 
		icon: Briefcase, 
		label: "Proyectos", 
		href: "/proyectos",
		ariaLabel: "Ir a Proyectos"
	}
]

export function UniversalBottomBar({
	onAddAction,
	onOpenSidebar,
	sortField,
	sortOrder,
	onSortChange,
	showCompleted,
	onToggleCompleted
}: UniversalBottomBarProps) {
	const pathname = usePathname()

	// Determinar ícono y acción según ruta
	const getCentralButton = () => {
		switch(pathname) {
			case '/tareas': 
				return { icon: Plus, label: 'Nueva tarea' }
			case '/notes': 
				return { icon: Plus, label: 'Nueva nota' }
			case '/home': 
				return { icon: Plus, label: 'Crear' }
			case '/fuentes': 
				return { icon: Plus, label: 'Nueva fuente' }
			case '/proyectos': 
				return { icon: Plus, label: 'Nuevo proyecto' }
			default: 
				return { icon: Plus, label: 'Crear' }
		}
	}

	const centralButton = getCentralButton()
	const CentralIcon = centralButton.icon

	// Determinar si mostrar menú de ordenamiento (solo en tareas)
	const showSortMenu = pathname === '/tareas' && sortField && sortOrder && onSortChange && showCompleted !== undefined && onToggleCompleted

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
			{/* Barra principal con navegación */}
			<div className="flex items-center justify-around h-16 px-1 safe-area-left safe-area-right">
				{/* Botón de menú lateral (solo si se proporciona) */}
				{onOpenSidebar ? (
					<Button
						variant="ghost"
						size="icon"
						onClick={onOpenSidebar}
						className="h-12 w-12 rounded-full"
					>
						<Menu className="h-5 w-5" />
					</Button>
				) : (
					<div className="w-12" /> // Espaciador si no hay menú
				)}

				{/* Navegación principal */}
				<div className="flex items-center justify-center flex-1 gap-1">
					{navItems.slice(0, 2).map((item) => {
						const isActive = pathname === item.href
						const Icon = item.icon
						
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex flex-col items-center justify-center",
									"min-h-[44px] min-w-[44px] p-1 rounded-lg mx-1",
									"transition-all duration-200",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
									"active:scale-95",
									isActive 
										? "text-primary bg-primary/10 scale-105" 
										: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								)}
								aria-label={item.ariaLabel}
							>
								<Icon 
									className={cn(
										"h-4 w-4 mb-0.5 transition-transform duration-200",
										isActive && "scale-110"
									)} 
								/>
								<span 
									className={cn(
										"text-[9px] font-medium leading-none transition-all duration-200",
										isActive && "font-semibold text-primary"
									)}
								>
									{item.label}
								</span>
							</Link>
						)
					})}
					
					{/* Espaciador para el botón central */}
					<div className="w-16" />
					
					{navItems.slice(2).map((item) => {
						const isActive = pathname === item.href
						const Icon = item.icon
						
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex flex-col items-center justify-center",
									"min-h-[44px] min-w-[44px] p-1 rounded-lg mx-1",
									"transition-all duration-200",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
									"active:scale-95",
									isActive 
										? "text-primary bg-primary/10 scale-105" 
										: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								)}
								aria-label={item.ariaLabel}
							>
								<Icon 
									className={cn(
										"h-4 w-4 mb-0.5 transition-transform duration-200",
										isActive && "scale-110"
									)} 
								/>
								<span 
									className={cn(
										"text-[9px] font-medium leading-none transition-all duration-200",
										isActive && "font-semibold text-primary"
									)}
								>
									{item.label}
								</span>
							</Link>
						)
					})}
				</div>

				{/* Menú de ordenamiento (solo en tareas) o espaciador */}
				{showSortMenu ? (
					<TaskSortMenu
						sortField={sortField}
						sortOrder={sortOrder}
						onSortChange={onSortChange}
						showCompleted={showCompleted}
						onToggleCompleted={onToggleCompleted}
					/>
				) : (
					<div className="w-12" /> // Espaciador si no hay menú de ordenamiento
				)}
			</div>

			{/* Botón flotante central - más elevado */}
			<div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-60">
				<Button
					onClick={onAddAction}
					className={cn(
						"h-16 w-16 rounded-full shadow-2xl shadow-primary/40",
						"bg-gradient-to-r from-primary to-primary/80",
						"hover:from-primary/90 hover:to-primary/70",
						"active:scale-95 transition-all duration-200",
						"border-4 border-background"
					)}
					size="icon"
					aria-label={centralButton.label}
				>
					<CentralIcon className="h-7 w-7" />
				</Button>
			</div>
		</div>
	)
}



