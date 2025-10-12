"use client"

import { useState } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileDrawer, useMobileDrawer } from "@/components/mobile-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Search,
	Plus,
	Filter,
	CheckSquare,
	Clock,
	Calendar,
	MoreHorizontal,
	AlertCircle,
	Briefcase
} from "lucide-react"

// Mock data
const actions = [
	{
		id: "1",
		title: "Revisar propuesta de cliente",
		description: "Analizar los requerimientos y preparar respuesta",
		priority: "high",
		dueDate: "2024-01-15",
		status: "pending",
		project: "Proyecto Alpha"
	},
	{
		id: "2", 
		title: "Actualizar documentación técnica",
		description: "Completar la documentación de la API",
		priority: "medium",
		dueDate: "2024-01-20",
		status: "in_progress",
		project: "Proyecto Beta"
	},
	{
		id: "3",
		title: "Reunión con el equipo de diseño",
		description: "Discutir los mockups del nuevo dashboard",
		priority: "low",
		dueDate: "2024-01-12",
		status: "completed",
		project: "Proyecto Gamma"
	},
	{
		id: "4",
		title: "Configurar servidor de staging",
		description: "Preparar ambiente para pruebas",
		priority: "high",
		dueDate: "2024-01-18",
		status: "pending",
		project: "Infraestructura"
	}
]

const priorityColors = {
	high: "bg-red-500",
	medium: "bg-yellow-500", 
	low: "bg-green-500"
}

const statusColors = {
	pending: "bg-gray-500",
	in_progress: "bg-blue-500",
	completed: "bg-green-500"
}

export default function AccionesPage() {
	const { isMobile } = useMobileDetection()
	const filtersDrawer = useMobileDrawer()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedFilter, setSelectedFilter] = useState("all")

	const filteredActions = actions.filter(action => {
		const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			action.description.toLowerCase().includes(searchQuery.toLowerCase())
		
		const matchesFilter = selectedFilter === "all" || action.status === selectedFilter
		
		return matchesSearch && matchesFilter
	})

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<Button 
						variant="ghost" 
						size="icon-mobile" 
						onClick={filtersDrawer.openDrawer}
						className="touch-target"
					>
						<Filter className="h-5 w-5" />
					</Button>
					<div className="flex-1 mx-2">
						<Input 
							placeholder="Buscar acciones..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							size="mobile"
						/>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						className="touch-target"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-3">
						{/* Stats rápidas */}
						<div className="grid grid-cols-3 gap-3 mb-4">
							<Card className="p-3 text-center">
								<div className="text-lg font-bold text-red-500">
									{actions.filter(a => a.priority === "high").length}
								</div>
								<div className="text-xs text-muted-foreground">Alta</div>
							</Card>
							<Card className="p-3 text-center">
								<div className="text-lg font-bold text-blue-500">
									{actions.filter(a => a.status === "in_progress").length}
								</div>
								<div className="text-xs text-muted-foreground">En curso</div>
							</Card>
							<Card className="p-3 text-center">
								<div className="text-lg font-bold text-green-500">
									{actions.filter(a => a.status === "completed").length}
								</div>
								<div className="text-xs text-muted-foreground">Completadas</div>
							</Card>
						</div>

						{/* Lista de acciones */}
						{filteredActions.map((action) => (
							<Card key={action.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors touch-target">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-semibold text-base">{action.title}</h3>
											<div className={`w-3 h-3 rounded-full ${priorityColors[action.priority as keyof typeof priorityColors]}`} />
										</div>
										<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
											{action.description}
										</p>
									</div>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</div>
								
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{action.project}
										</Badge>
										<Badge 
											variant="secondary" 
											className={`text-xs ${statusColors[action.status as keyof typeof statusColors]} text-white`}
										>
											{action.status === "pending" ? "Pendiente" : 
											 action.status === "in_progress" ? "En curso" : "Completada"}
										</Badge>
									</div>
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<Calendar className="h-3 w-3" />
										<span>{new Date(action.dueDate).toLocaleDateString()}</span>
									</div>
								</div>
							</Card>
						))}

						{/* Empty state */}
						{filteredActions.length === 0 && (
							<div className="text-center py-8">
								<CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-lg font-semibold mb-2">No hay acciones</h3>
								<p className="text-muted-foreground mb-4">
									{searchQuery ? "No se encontraron acciones con ese criterio" : "Crea tu primera acción"}
								</p>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Nueva Acción
								</Button>
							</div>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB */}
				<Button
					onClick={() => alert("Crear nueva acción")}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 touch-target"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Filters Drawer */}
				<MobileDrawer
					isOpen={filtersDrawer.isOpen}
					onClose={filtersDrawer.closeDrawer}
					title="Filtros"
					height="md"
				>
					<div className="p-4 space-y-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Estado</label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="all"
										checked={selectedFilter === "all"}
										onChange={(e) => setSelectedFilter(e.target.value)}
									/>
									<span>Todos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="pending"
										checked={selectedFilter === "pending"}
										onChange={(e) => setSelectedFilter(e.target.value)}
									/>
									<span>Pendientes</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="in_progress"
										checked={selectedFilter === "in_progress"}
										onChange={(e) => setSelectedFilter(e.target.value)}
									/>
									<span>En curso</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="completed"
										checked={selectedFilter === "completed"}
										onChange={(e) => setSelectedFilter(e.target.value)}
									/>
									<span>Completadas</span>
								</label>
							</div>
						</div>
						
						<div>
							<label className="text-sm font-medium mb-2 block">Prioridad</label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Alta</span>
								</label>
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Media</span>
								</label>
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Baja</span>
								</label>
							</div>
						</div>
					</div>
				</MobileDrawer>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center justify-between border-b border-border">
				<h1 className="text-2xl font-bold">Acciones</h1>
				<div className="flex items-center gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input 
							placeholder="Buscar acciones..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 w-64"
						/>
					</div>
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Nueva Acción
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-7xl mx-auto">
					{/* Stats Cards */}
					<div className="grid grid-cols-4 gap-6 mb-8">
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-red-100 rounded-lg">
									<AlertCircle className="h-6 w-6 text-red-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{actions.filter(a => a.priority === "high").length}</p>
									<p className="text-sm text-muted-foreground">Alta Prioridad</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Clock className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{actions.filter(a => a.status === "in_progress").length}</p>
									<p className="text-sm text-muted-foreground">En Progreso</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{actions.filter(a => a.status === "completed").length}</p>
									<p className="text-sm text-muted-foreground">Completadas</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-gray-100 rounded-lg">
									<Calendar className="h-6 w-6 text-gray-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{actions.filter(a => a.status === "pending").length}</p>
									<p className="text-sm text-muted-foreground">Pendientes</p>
								</div>
							</div>
						</Card>
					</div>

					{/* Actions List */}
					<div className="space-y-4">
						{filteredActions.map((action) => (
							<Card key={action.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4 flex-1">
										<div className={`w-4 h-4 rounded-full mt-1 ${priorityColors[action.priority as keyof typeof priorityColors]}`} />
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-lg font-semibold">{action.title}</h3>
												<Badge 
													variant="secondary" 
													className={`text-xs ${statusColors[action.status as keyof typeof statusColors]} text-white`}
												>
													{action.status === "pending" ? "Pendiente" : 
													 action.status === "in_progress" ? "En curso" : "Completada"}
												</Badge>
											</div>
											<p className="text-muted-foreground mb-3">{action.description}</p>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Briefcase className="h-4 w-4" />
													<span>{action.project}</span>
												</div>
												<div className="flex items-center gap-1">
													<Calendar className="h-4 w-4" />
													<span>{new Date(action.dueDate).toLocaleDateString()}</span>
												</div>
											</div>
										</div>
									</div>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</div>
							</Card>
						))}

						{/* Empty state */}
						{filteredActions.length === 0 && (
							<Card className="p-12 text-center">
								<CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-xl font-semibold mb-2">No hay acciones</h3>
								<p className="text-muted-foreground mb-6">
									{searchQuery ? "No se encontraron acciones con ese criterio" : "Crea tu primera acción para comenzar"}
								</p>
								<Button size="lg">
									<Plus className="h-4 w-4 mr-2" />
									Nueva Acción
								</Button>
							</Card>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}