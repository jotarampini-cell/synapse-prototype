"use client"

import { useState, useEffect } from "react"
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
	FileText,
	CheckSquare,
	MoreHorizontal,
	TrendingUp,
	Sparkles,
	Loader2
} from "lucide-react"
import { getProjects, createProject, type ProjectWithStats } from "@/app/actions/projects"
import { toast } from "sonner"
import Link from "next/link"

const statusColors = {
	active: "bg-green-500",
	completed: "bg-gray-500",
	paused: "bg-yellow-500",
	archived: "bg-gray-400"
}

const statusLabels = {
	active: "Activo",
	completed: "Completado",
	paused: "En pausa",
	archived: "Archivado"
}

export default function ProyectosPage() {
	const { isMobile } = useMobileDetection()
	const filtersDrawer = useMobileDrawer()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedStatus, setSelectedStatus] = useState("all")
	const [projects, setProjects] = useState<ProjectWithStats[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)

	// Cargar proyectos al montar el componente
	useEffect(() => {
		loadProjects()
	}, [])

	const loadProjects = async () => {
		setIsLoading(true)
		try {
			const result = await getProjects()
			if (result.success && result.projects) {
				setProjects(result.projects)
			} else {
				toast.error(result.error || "Error al cargar proyectos")
			}
		} catch (error) {
			toast.error("Error al cargar proyectos")
		} finally {
			setIsLoading(false)
		}
	}

	const handleCreateProject = async () => {
		setIsCreating(true)
		try {
			const result = await createProject({
				name: "Nuevo Proyecto",
				description: "Descripción del proyecto",
				color: "#3B82F6"
			})
			
			if (result.success && result.project) {
				toast.success("Proyecto creado exitosamente")
				await loadProjects()
			} else {
				toast.error(result.error || "Error al crear proyecto")
			}
		} catch (error) {
			toast.error("Error al crear proyecto")
		} finally {
			setIsCreating(false)
		}
	}

	const filteredProjects = projects.filter(project => {
		const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
		
		const matchesStatus = selectedStatus === "all" || project.status === selectedStatus
		
		return matchesSearch && matchesStatus
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
							placeholder="Buscar proyectos..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							size="mobile"
						/>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						onClick={handleCreateProject}
						disabled={isCreating}
						className="touch-target"
					>
						{isCreating ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Plus className="h-5 w-5" />
						)}
					</Button>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20">
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
								<div className="text-sm font-bold text-yellow-500">
									{projects.filter(p => p.status === "paused").length}
								</div>
								<div className="text-xs text-muted-foreground">En pausa</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-gray-500">
									{projects.filter(p => p.status === "completed").length}
								</div>
								<div className="text-xs text-muted-foreground">Completados</div>
							</Card>
						</div>

						{/* Lista de proyectos */}
						{isLoading ? (
							<div className="text-center py-8">
								<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
								<p className="text-muted-foreground">Cargando proyectos...</p>
							</div>
						) : (
							filteredProjects.map((project) => {
								const progress = project.tasks_count > 0 ? Math.round((project.completed_tasks / project.tasks_count) * 100) : 0
								
								return (
									<Link key={project.id} href={`/proyectos/${project.id}`}>
										<Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors touch-target">
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<div 
															className="w-3 h-3 rounded-full" 
															style={{ backgroundColor: project.color }}
														/>
														<h3 className="font-semibold text-base">{project.name}</h3>
													</div>
													{project.description && (
														<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
															{project.description}
														</p>
													)}
												</div>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</div>
											
											{/* ⭐ AQUÍ ESTÁ LA MAGIA - Insight de IA */}
											{project.ai_summary && (
												<div className="bg-primary/5 border-l-2 border-primary p-3 rounded-r mb-3">
													<div className="flex items-start gap-2">
														<Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
														<div>
															<p className="text-xs font-medium text-primary mb-1">Insight de IA</p>
															<p className="text-xs text-foreground/80 line-clamp-2">{project.ai_summary}</p>
														</div>
													</div>
												</div>
											)}
											
											{/* Progress bar */}
											{project.tasks_count > 0 && (
												<div className="mb-3">
													<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
														<span>Progreso</span>
														<span>{progress}%</span>
													</div>
													<div className="w-full bg-muted rounded-full h-2">
														<div 
															className="bg-primary h-2 rounded-full transition-all"
															style={{ width: `${progress}%` }}
														/>
													</div>
												</div>
											)}

											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Badge 
														variant="secondary" 
														className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
													>
														{statusLabels[project.status as keyof typeof statusLabels]}
													</Badge>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<div className="flex items-center gap-1">
														<FileText className="h-3 w-3" />
														<span>{project.notes_count}</span>
													</div>
													<div className="flex items-center gap-1">
														<CheckSquare className="h-3 w-3" />
														<span>{project.completed_tasks}/{project.tasks_count}</span>
													</div>
												</div>
											</div>
										</Card>
									</Link>
								)
							})
						)}

						{/* Empty state */}
						{!isLoading && filteredProjects.length === 0 && (
							<div className="text-center py-8">
								<Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
								<p className="text-muted-foreground mb-4">
									{searchQuery ? "No se encontraron proyectos con ese criterio" : "Crea tu primer proyecto"}
								</p>
								<Button onClick={handleCreateProject} disabled={isCreating}>
									{isCreating ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<Plus className="h-4 w-4 mr-2" />
									)}
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
					onClick={handleCreateProject}
					disabled={isCreating}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 touch-target"
					size="icon"
				>
					{isCreating ? (
						<Loader2 className="h-6 w-6 animate-spin" />
					) : (
						<Plus className="h-6 w-6" />
					)}
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
										value="paused"
										checked={selectedStatus === "paused"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>En pausa</span>
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
										value="archived"
										checked={selectedStatus === "archived"}
										onChange={(e) => setSelectedStatus(e.target.value)}
									/>
									<span>Archivados</span>
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
					<Button onClick={handleCreateProject} disabled={isCreating}>
						{isCreating ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Plus className="h-4 w-4 mr-2" />
						)}
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
								<div className="p-3 bg-yellow-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-yellow-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{projects.filter(p => p.status === "paused").length}</p>
									<p className="text-sm text-muted-foreground">En pausa</p>
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
					{isLoading ? (
						<div className="text-center py-12">
							<Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
							<p className="text-muted-foreground">Cargando proyectos...</p>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{filteredProjects.map((project) => {
								const progress = project.tasks_count > 0 ? Math.round((project.completed_tasks / project.tasks_count) * 100) : 0
								
								return (
									<Link key={project.id} href={`/proyectos/${project.id}`}>
										<Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
											<div className="flex items-start justify-between mb-4">
												<div className="flex items-start gap-3 flex-1">
													<div 
														className="w-3 h-3 rounded-full mt-2" 
														style={{ backgroundColor: project.color }}
													/>
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<Briefcase className="h-4 w-4 text-muted-foreground" />
															<h3 className="text-lg font-semibold">{project.name}</h3>
														</div>
														{project.description && (
															<p className="text-muted-foreground mb-3">{project.description}</p>
														)}
													</div>
												</div>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</div>
											
											{/* ⭐ AQUÍ ESTÁ LA MAGIA - Insight de IA */}
											{project.ai_summary && (
												<div className="bg-primary/5 border-l-2 border-primary p-3 rounded-r mb-4">
													<div className="flex items-start gap-2">
														<Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
														<div>
															<p className="text-xs font-medium text-primary mb-1">Insight de IA</p>
															<p className="text-xs text-foreground/80 line-clamp-2">{project.ai_summary}</p>
														</div>
													</div>
												</div>
											)}
											
											{/* Progress bar */}
											{project.tasks_count > 0 && (
												<div className="mb-4">
													<div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
														<span>Progreso</span>
														<span>{progress}%</span>
													</div>
													<div className="w-full bg-muted rounded-full h-2">
														<div 
															className="bg-primary h-2 rounded-full transition-all"
															style={{ width: `${progress}%` }}
														/>
													</div>
												</div>
											)}

											<div className="flex items-center justify-between mb-3">
												<Badge 
													variant="secondary" 
													className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
												>
													{statusLabels[project.status as keyof typeof statusLabels]}
												</Badge>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<CheckSquare className="h-4 w-4" />
													<span>{project.completed_tasks}/{project.tasks_count} tareas</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-3 border-t border-border">
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<FileText className="h-4 w-4" />
													<span>{project.notes_count} notas</span>
												</div>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<CheckSquare className="h-4 w-4" />
													<span>{project.tasks_count} tareas</span>
												</div>
											</div>
										</Card>
									</Link>
								)
							})}
						</div>
					)}

					{/* Empty state */}
					{!isLoading && filteredProjects.length === 0 && (
						<Card className="p-12 text-center">
							<Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
							<h3 className="text-xl font-semibold mb-2">No hay proyectos</h3>
							<p className="text-muted-foreground mb-6">
								{searchQuery ? "No se encontraron proyectos con ese criterio" : "Crea tu primer proyecto para comenzar"}
							</p>
							<Button size="lg" onClick={handleCreateProject} disabled={isCreating}>
								{isCreating ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Plus className="h-4 w-4 mr-2" />
								)}
								Nuevo Proyecto
							</Button>
						</Card>
					)}
				</div>
			</main>
		</div>
	)
}