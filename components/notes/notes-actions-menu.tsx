"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { 
	Filter,
	SortAsc,
	Grid3X3,
	List,
	Pin,
	Archive,
	Clock,
	Calendar,
	Type
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotesActionsMenuProps {
	isOpen: boolean
	onClose: () => void
	onFilterChange?: (filter: string) => void
	onSortChange?: (sort: string) => void
	onViewModeChange?: (mode: string) => void
	mode?: 'filters' | 'sort' | 'all'
}

export function NotesActionsMenu({
	isOpen,
	onClose,
	onFilterChange,
	onSortChange,
	onViewModeChange,
	mode = 'all'
}: NotesActionsMenuProps) {
	const [selectedFilter, setSelectedFilter] = useState('all')
	const [selectedSort, setSelectedSort] = useState('updated_desc')
	const [selectedView, setSelectedView] = useState('gallery')

	const handleFilterChange = (filter: string) => {
		setSelectedFilter(filter)
		onFilterChange?.(filter)
	}

	const handleSortChange = (sort: string) => {
		setSelectedSort(sort)
		onSortChange?.(sort)
	}

	const handleViewModeChange = (mode: string) => {
		setSelectedView(mode)
		onViewModeChange?.(mode)
	}

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent side="bottom" className="h-auto">
				<SheetHeader className="text-center pb-4">
					<SheetTitle className="text-lg">Opciones de vista</SheetTitle>
				</SheetHeader>
				
				<div className="space-y-6 p-4">
					{/* Filtros - Solo mostrar si mode es 'filters' o 'all' */}
					{(mode === 'filters' || mode === 'all') && (
						<div>
							<h3 className="font-semibold mb-3 flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Filtrar por
							</h3>
							<div className="space-y-2">
								<Button 
									variant={selectedFilter === 'all' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleFilterChange('all')}
								>
									Todas las notas
								</Button>
								<Button 
									variant={selectedFilter === 'pinned' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleFilterChange('pinned')}
								>
									<Pin className="h-4 w-4 mr-2" />
									Destacadas
								</Button>
								<Button 
									variant={selectedFilter === 'archived' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleFilterChange('archived')}
								>
									<Archive className="h-4 w-4 mr-2" />
									Archivadas
								</Button>
							</div>
						</div>
					)}
					
					{/* Ordenamiento - Solo mostrar si mode es 'sort' o 'all' */}
					{(mode === 'sort' || mode === 'all') && (
						<div>
							<h3 className="font-semibold mb-3 flex items-center gap-2">
								<SortAsc className="h-4 w-4" />
								Ordenar por
							</h3>
							<div className="space-y-2">
								<Button 
									variant={selectedSort === 'updated_desc' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleSortChange('updated_desc')}
								>
									<Clock className="h-4 w-4 mr-2" />
									Más recientes
								</Button>
								<Button 
									variant={selectedSort === 'updated_asc' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleSortChange('updated_asc')}
								>
									<Calendar className="h-4 w-4 mr-2" />
									Más antiguas
								</Button>
								<Button 
									variant={selectedSort === 'title_asc' ? 'default' : 'ghost'}
									className="w-full justify-start"
									onClick={() => handleSortChange('title_asc')}
								>
									<Type className="h-4 w-4 mr-2" />
									Alfabético
								</Button>
							</div>
						</div>
					)}
					
					{/* Vista - Solo mostrar si mode es 'all' */}
					{mode === 'all' && (
						<div>
							<h3 className="font-semibold mb-3 flex items-center gap-2">
								<Grid3X3 className="h-4 w-4" />
								Vista
							</h3>
							<div className="flex gap-2">
								<Button 
									variant={selectedView === 'gallery' ? 'default' : 'outline'}
									className="flex-1"
									onClick={() => handleViewModeChange('gallery')}
								>
									<Grid3X3 className="h-4 w-4 mr-2" />
									Galería
								</Button>
								<Button 
									variant={selectedView === 'list' ? 'default' : 'outline'}
									className="flex-1"
									onClick={() => handleViewModeChange('list')}
								>
									<List className="h-4 w-4 mr-2" />
									Lista
								</Button>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}
