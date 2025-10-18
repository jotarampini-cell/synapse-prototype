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
	Briefcase,
	Users,
	Calendar,
	CheckSquare,
	MoreHorizontal,
	TrendingUp
} from "lucide-react"

// Mock data
const projects = [
	{
		id: "1",
		name: "Synapse Mobile App",
		description: "Desarrollo de la aplicación móvil para gestión de conocimiento",
		status: "active",
		progress: 75,
		team: ["Ana", "Carlos", "María"],
		dueDate: "2024-02-15",
		tasks: { total: 12, completed: 9 },
		priority: "high"
	},
	{
		id: "2",
		name: "API Documentation",
		description: "Crear documentación completa de la API REST",
		status: "planning",
		progress: 25,
		team: ["Pedro", "Laura"],
		dueDate: "2024-01-30",
		tasks: { total: 8, completed: 2 },
		priority: "medium"
	},
	{
		id: "3",
		name: "User Research",
		description: "Investigación de usuarios y análisis de feedback",
		status: "completed",
		progress: 100,
		team: ["Sofia", "Diego"],
		dueDate: "2024-01-10",
		tasks: { total: 5, completed: 5 },
		priority: "low"
	},
	{
		id: "4",
		name: "Performance Optimization",
		description: "Optimizar rendimiento de la aplicación web",
		status: "on_hold",
		progress: 40,
		team: ["Alex", "Carmen"],
		dueDate: "2024-03-01",
		tasks: { total: 6, completed: 2 },
		priority: "medium"
	}
]

const statusColors = {
	active: "bg-green-500",
	planning: "bg-blue-500",
	completed: "bg-gray-500",
	on_hold: "bg-yellow-500"
}

const priorityColors = {
	high: "bg-red-500",
	medium: "bg-yellow-500",
	low: "bg-green-500"
}

export default function ProyectosPage() {
	const { isMobile } = useMobileDetection()
	const filtersDrawer = useMobileDrawer()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedStatus, setSelectedStatus] = useState("all")

	const filteredProjects = projects.filter(project => {
		const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			project.description.toLowerCase().includes(searchQuery.toLowerCase())
		
		const matchesStatus = selectedStatus === "all" || project.status === selectedStatus
		
		return matchesSearch && matchesStatus
	})

	// Layout móvil
	if (isMobile) {
		return (
			<div className="mobile-page-container bg-background">
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
							placeholder="Buscar proyectos..." 
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
				<main className="mobile-page-main">
					<div className="p-4 space-y-3">
						{/* Stats rápidas */}
						<div className="grid grid-cols-4 gap-2 mb-4">
							<Card className="p-2 text-center">
								<div className="text-sm font-bold">{projects.length}</div>
								<div className="text-xs text-muted-foreground">Total</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-green-500">
									{projects.filter(p => p.status === "active").length}
								</div>
								<div className="text-xs text-muted-foreground">Activos</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-blue-500">
									{projects.filter(p => p.status === "planning").length}
								</div>
								<div className="text-xs text-muted-foreground">Planificando</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-gray-500">
									{projects.filter(p => p.status === "completed").length}
								</div>
								<div className="text-xs text-muted-foreground">Completados</div>
							</Card>
						</div>

						{/* Lista de proyectos */}
						{filteredProjects.map((project) => (
							<Card key={project.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors touch-target">
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Briefcase className="h-4 w-4 text-muted-foreground" />
											<h3 className="font-semibold text-base">{project.name}</h3>
											<div className={`w-2 h-2 rounded-full ${priorityColors[project.priority as keyof typeof priorityColors]}`} />
										</div>
										<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
											{project.description}
										</p>
									</div>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</div>
								
								{/* Progress bar */}
								<div className="mb-3">
									<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
										<span>Progreso</span>
										<span>{project.progress}%</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div 
											className="bg-primary h-2 rounded-full transition-all"
											style={{ width: `${project.progress}%` }}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge 
											variant="secondary" 
											className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
										>
											{project.status === "active" ? "Activo" : 
											 project.status === "planning" ? "Planificando" :
											 project.status === "completed" ? "Completado" : "En pausa"}
										</Badge>
										<Badge variant="outline" className="text-xs">
											<Users className="h-3 w-3 mr-1" />
											{project.team.length}
										</Badge>
									</div>
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<CheckSquare className="h-3 w-3" />
										<span>{project.tasks.completed}/{project.tasks.total}</span>
									</div>
								</div>

								{/* Team and due date */}
								<div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<Users className="h-3 w-3" />
										<span>{project.team.join(", ")}</span>
									</div>
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<Calendar className="h-3 w-3" />
										<span>{new Date(project.dueDate).toLocaleDateString()}</span>
									</div>
								</div>
							</Card>
						))}

						{/* Empty state */}
						{filteredProjects.length === 0 && (
							<div className="text-center py-8">
								<Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
								<p className="text-muted-foreground mb-4">
									{searchQuery ? "No se encontraron proyectos con ese criterio" : "Crea tu primer proyecto"}
								</p>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Nuevo Proyecto
								</Button>
							</div>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB */}
				<Button
					onClick={() => alert("Crear nuevo proyecto")}
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
										checked={selectedStatus === "all"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>Todos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="active"
										checked={selectedStatus === "active"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>Activos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="planning"
										checked={selectedStatus === "planning"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>Planificando</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="completed"
										checked={selectedStatus === "completed"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>Completados</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="status" 
										value="on_hold"
										checked={selectedStatus === "on_hold"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>En pausa</span>
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
		<div className="desktop-page-container bg-background">
			<header className="h-16 px-6 flex items-center justify-between border-b border-border">
				<h1 className="text-2xl font-bold">Proyectos</h1>
				<div className="flex items-center gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input 
							placeholder="Buscar proyectos..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 w-64"
						/>
					</div>
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Nuevo Proyecto
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-7xl mx-auto">
					{/* Stats Cards */}
					<div className="grid grid-cols-4 gap-6 mb-8">
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Briefcase className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{projects.length}</p>
									<p className="text-sm text-muted-foreground">Total</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<TrendingUp className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{projects.filter(p => p.status === "active").length}</p>
									<p className="text-sm text-muted-foreground">Activos</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Calendar className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{projects.filter(p => p.status === "planning").length}</p>
									<p className="text-sm text-muted-foreground">Planificando</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-gray-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-gray-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{projects.filter(p => p.status === "completed").length}</p>
									<p className="text-sm text-muted-foreground">Completados</p>
								</div>
							</div>
						</Card>
					</div>

					{/* Projects Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{filteredProjects.map((project) => (
							<Card key={project.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-start gap-3 flex-1">
										<div className={`w-3 h-3 rounded-full mt-2 ${priorityColors[project.priority as keyof typeof priorityColors]}`} />
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<Briefcase className="h-4 w-4 text-muted-foreground" />
												<h3 className="text-lg font-semibold">{project.name}</h3>
											</div>
											<p className="text-muted-foreground mb-3">{project.description}</p>
										</div>
									</div>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</div>
								
								{/* Progress bar */}
								<div className="mb-4">
									<div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
										<span>Progreso</span>
										<span>{project.progress}%</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div 
											className="bg-primary h-2 rounded-full transition-all"
											style={{ width: `${project.progress}%` }}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between mb-3">
									<Badge 
										variant="secondary" 
										className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
									>
										{project.status === "active" ? "Activo" : 
										 project.status === "planning" ? "Planificando" :
										 project.status === "completed" ? "Completado" : "En pausa"}
									</Badge>
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<CheckSquare className="h-4 w-4" />
										<span>{project.tasks.completed}/{project.tasks.total} tareas</span>
									</div>
								</div>

								<div className="flex items-center justify-between pt-3 border-t border-border">
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<Users className="h-4 w-4" />
										<span>{project.team.join(", ")}</span>
									</div>
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<Calendar className="h-4 w-4" />
										<span>{new Date(project.dueDate).toLocaleDateString()}</span>
									</div>
								</div>
							</Card>
						))}
					</div>

					{/* Empty state */}
					{filteredProjects.length === 0 && (
						<Card className="p-12 text-center">
							<Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
							<h3 className="text-xl font-semibold mb-2">No hay proyectos</h3>
							<p className="text-muted-foreground mb-6">
								{searchQuery ? "No se encontraron proyectos con ese criterio" : "Crea tu primer proyecto para comenzar"}
							</p>
							<Button size="lg">
								<Plus className="h-4 w-4 mr-2" />
								Nuevo Proyecto
							</Button>
						</Card>
					)}
				</div>
			</main>
		</div>
	)
}