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

	const [actionsMenuMode, setActionsMenuMode] = useState<'filters' | 'sort' | 'all'>('all')

	// En vista de carpetas, no mostrar FABs (se manejan desde notes/page.tsx)
	if (currentView === 'folders') {
		return null
	}

	// En vista de editor, no mostrar FAB (se maneja desde el editor)
	if (currentView === 'editor') {
		return null
	}

	// En vista de notas, mostrar solo chevron con acciones (FAB se maneja desde notes/page.tsx)
	return (
		<>
			
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
					{/* Botón Filtros */}
					<Button
						onClick={() => {
							setActionsMenuMode('filters')
							setShowActionsMenu(true)
						}}
						className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
						size="icon"
						variant="secondary"
					>
						<Filter className="h-4 w-4" />
					</Button>
					
					{/* Botón Ordenar */}
					<Button
						onClick={() => {
							setActionsMenuMode('sort')
							setShowActionsMenu(true)
						}}
						className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
						size="icon"
						variant="secondary"
					>
						<SortAsc className="h-4 w-4" />
					</Button>
					
					{/* Botón Vista - Cambia directamente sin abrir menú */}
					<Button
						onClick={() => {
							// Cambiar entre galería y lista directamente
							onViewModeChange?.('list') // Por ahora alterna a lista, se puede mejorar
						}}
						className="h-10 w-10 rounded-full shadow-lg shadow-primary/20 touch-target hover:scale-110 active:scale-95 transition-transform bg-background/90 backdrop-blur-sm border border-border/50"
						size="icon"
						variant="secondary"
					>
						<Grid3X3 className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Menú de acciones */}
			<NotesActionsMenu
				isOpen={showActionsMenu}
				onClose={() => setShowActionsMenu(false)}
				onFilterChange={onFilterChange}
				onSortChange={onSortChange}
				onViewModeChange={onViewModeChange}
				mode={actionsMenuMode}
			/>
		</>
	)
}
