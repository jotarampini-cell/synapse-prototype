"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
	Plus,
	ChevronUp,
	Filter,
	SortAsc,
	Grid3X3,
	MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotesActionsMenu } from "./notes-actions-menu"

interface NotesFabMenuProps {
	onCreateNote: () => void
	currentView: 'folders' | 'notes' | 'editor'
	onFilterChange?: (filter: string) => void
	onSortChange?: (sort: string) => void
	onViewModeChange?: (mode: string) => void
}

export function NotesFabMenu({ 
	onCreateNote,
	currentView,
	onFilterChange,
	onSortChange,
	onViewModeChange
}: NotesFabMenuProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [showActionsMenu, setShowActionsMenu] = useState(false)

	const actions = [
		{ 
			icon: Filter, 
			label: 'Filtros', 
			onClick: () => setShowActionsMenu(true) 
		},
		{ 
			icon: SortAsc, 
			label: 'Ordenar', 
			onClick: () => setShowActionsMenu(true) 
		},
		{ 
			icon: Grid3X3, 
			label: 'Vista', 
			onClick: () => setShowActionsMenu(true) 
		}
	]

	// En vista de carpetas, solo mostrar FAB para crear carpeta
	if (currentView === 'folders') {
		return (
			<Button
				onClick={onCreateNote}
				className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 touch-target hover:scale-110 active:scale-95 transition-transform"
				size="icon"
			>
				<Plus className="h-6 w-6" />
			</Button>
		)
	}

	// En vista de editor, no mostrar FAB (se maneja desde el editor)
	if (currentView === 'editor') {
		return null
	}

	// En vista de notas, mostrar FAB + chevron con acciones
	return (
		<>
			{/* Botón FAB principal */}
			<Button
				onClick={onCreateNote}
				className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 touch-target hover:scale-110 active:scale-95 transition-transform"
				size="icon"
			>
				<Plus className="h-6 w-6" />
			</Button>
			
			{/* Indicador chevron para desplegar */}
			<Button
				onClick={() => setIsExpanded(!isExpanded)}
				className="fixed bottom-36 right-4 h-10 w-10 rounded-full shadow-lg shadow-primary/20 z-50 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
				size="icon"
				variant="secondary"
			>
				<ChevronUp className={cn(
					"h-4 w-4 transition-transform duration-200",
					isExpanded && "rotate-180"
				)} />
			</Button>
			
			{/* Acciones desplegables - alineadas con FAB */}
			{isExpanded && (
				<div className="fixed bottom-48 right-4 flex flex-col gap-2 z-50">
					{actions.map((action, i) => (
						<Button
							key={i}
							onClick={action.onClick}
							className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
							size="icon"
							variant="secondary"
						>
							<action.icon className="h-4 w-4" />
						</Button>
					))}
				</div>
			)}

			{/* Menú de acciones */}
			<NotesActionsMenu
				isOpen={showActionsMenu}
				onClose={() => setShowActionsMenu(false)}
				onFilterChange={onFilterChange}
				onSortChange={onSortChange}
				onViewModeChange={onViewModeChange}
			/>
		</>
	)
}
