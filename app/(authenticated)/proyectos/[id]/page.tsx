"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
	ArrowLeft,
	Edit,
	MoreHorizontal,
	Sparkles,
	Loader2,
	FileText,
	CheckSquare,
	AlertCircle,
	TrendingUp,
	Plus,
	Brain
} from "lucide-react"
import { 
	getProjectById, 
	generateProjectInsights, 
	getProjectNotes, 
	getProjectTasks,
	type ProjectWithStats 
} from "@/app/actions/projects"
import { LinkNoteToProject } from "@/components/projects/link-note-to-project"
import { LinkTaskToProject } from "@/components/projects/link-task-to-project"
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

export default function ProjectDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { isMobile } = useMobileDetection()
	const projectId = params.id as string
	
	const [project, setProject] = useState<ProjectWithStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isGenerating, setIsGenerating] = useState(false)
	const [notes, setNotes] = useState<any[]>([])
	const [tasks, setTasks] = useState<any[]>([])

	// Cargar datos del proyecto
	useEffect(() => {
		if (projectId) {
			loadProjectData()
		}
	}, [projectId])

	const loadProjectData = async () => {
		setIsLoading(true)
		try {
			const [projectResult, notesResult, tasksResult] = await Promise.all([
				getProjectById(projectId),
				getProjectNotes(projectId),
				getProjectTasks(projectId)
			])

			if (projectResult.success && projectResult.project) {
				setProject(projectResult.project)
			} else {
				toast.error("Proyecto no encontrado")
				router.push("/proyectos")
				return
			}

			if (notesResult.success && notesResult.notes) {
				setNotes(notesResult.notes)
			}

			if (tasksResult.success && tasksResult.tasks) {
				setTasks(tasksResult.tasks)
			}
		} catch (error) {
			toast.error("Error al cargar el proyecto")
			router.push("/proyectos")
		} finally {
			setIsLoading(false)
		}
	}

	const handleGenerateInsights = async () => {
		setIsGenerating(true)
		try {
			const result = await generateProjectInsights(projectId)
			if (result.success && result.insights) {
				toast.success("Análisis generado exitosamente")
				// Recargar datos del proyecto para obtener el nuevo insight
				await loadProjectData()
			} else {
				toast.error(result.error || "Error al generar análisis")
			}
		} catch (error) {
			toast.error("Error al generar análisis")
		} finally {
			setIsGenerating(false)
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	if (isLoading) {
		return (
			<div className="h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Cargando proyecto...</p>
				</div>
			</div>
		)
	}

	if (!project) {
		return (
			<div className="h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<p className="text-muted-foreground">Proyecto no encontrado</p>
					<Button asChild className="mt-4">
						<Link href="/proyectos">Volver a Proyectos</Link>
					</Button>
				</div>
			</div>
		)
	}

	const progress = project.tasks_count > 0 ? Math.round((project.completed_tasks / project.tasks_count) * 100) : 0
	const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<Button 
						variant="ghost" 
						size="icon-mobile" 
						onClick={() => router.back()}
						className="touch-target"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="flex-1 mx-2">
						<h1 className="font-semibold text-base truncate">{project.name}</h1>
					</div>
					<Button variant="ghost" size="icon-mobile" className="touch-target">
						<MoreHorizontal className="h-5 w-5" />
					</Button>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-4">
						{/* Información del proyecto */}
						<Card className="p-4">
							<div className="flex items-center gap-3 mb-3">
								<div 
									className="w-4 h-4 rounded-full" 
									style={{ backgroundColor: project.color }}
								/>
								<h2 className="text-lg font-semibold">{project.name}</h2>
								<Badge 
									variant="secondary" 
									className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
								>
									{statusLabels[project.status as keyof typeof statusLabels]}
								</Badge>
							</div>
							{project.description && (
								<p className="text-sm text-muted-foreground mb-3">{project.description}</p>
							)}
							<div className="text-xs text-muted-foreground">
								Creado {formatDate(project.created_at)}
							</div>
						</Card>

						{/* Estadísticas rápidas */}
						<div className="grid grid-cols-4 gap-2">
							<Card className="p-2 text-center">
								<div className="text-sm font-bold">{project.notes_count}</div>
								<div className="text-xs text-muted-foreground">Notas</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold">{project.tasks_count}</div>
								<div className="text-xs text-muted-foreground">Tareas</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-red-500">{urgentTasks}</div>
								<div className="text-xs text-muted-foreground">Urgentes</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold">{progress}%</div>
								<div className="text-xs text-muted-foreground">Progreso</div>
							</Card>
						</div>

						{/* Tabs */}
						<Tabs defaultValue="insights" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="insights" className="text-xs">
									💡 IA
								</TabsTrigger>
								<TabsTrigger value="notes" className="text-xs">
									📝 Notas
								</TabsTrigger>
								<TabsTrigger value="tasks" className="text-xs">
									✓ Tareas
								</TabsTrigger>
							</TabsList>

							{/* Tab Resumen IA */}
							<TabsContent value="insights" className="space-y-4 mt-4">
								{/* Insight actual */}
								{project.ai_summary ? (
									<Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
										<div className="flex items-start gap-3 mb-3">
											<Brain className="h-5 w-5 text-primary" />
											<div>
												<h4 className="font-semibold text-sm mb-1">Análisis del Proyecto</h4>
												<p className="text-xs text-muted-foreground">
													Actualizado {formatDate(project.updated_at)}
												</p>
											</div>
										</div>
										<p className="text-sm leading-relaxed">{project.ai_summary}</p>
									</Card>
								) : (
									<Card className="p-4 text-center">
										<Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
										<p className="text-sm text-muted-foreground">Aún no hay análisis</p>
									</Card>
								)}
								
								{/* ⭐ EL BOTÓN MÁGICO */}
								<Button 
									onClick={handleGenerateInsights}
									disabled={isGenerating}
									className="w-full gap-2"
									size="lg"
								>
									{isGenerating ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Analizando proyecto...
										</>
									) : (
										<>
											<Sparkles className="h-4 w-4" />
											{project.ai_summary ? 'Actualizar Análisis' : 'Analizar Proyecto'}
										</>
									)}
								</Button>
							</TabsContent>

							{/* Tab Notas */}
							<TabsContent value="notes" className="space-y-3 mt-4">
								{/* Botón para vincular notas */}
								<div className="flex justify-end">
									<LinkNoteToProject 
										projectId={projectId}
										projectName={project.name}
										onNoteLinked={loadProjectData}
									/>
								</div>
								
								{notes.length > 0 ? (
									notes.map((note) => (
										<Card key={note.id} className="p-3">
											<h4 className="font-medium text-sm mb-1">{note.title}</h4>
											<p className="text-xs text-muted-foreground line-clamp-2">
												{note.content}
											</p>
											<div className="text-xs text-muted-foreground mt-2">
												{formatDate(note.created_at)}
											</div>
										</Card>
									))
								) : (
									<Card className="p-4 text-center">
										<FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
										<p className="text-sm text-muted-foreground mb-3">No hay notas vinculadas</p>
										<LinkNoteToProject 
											projectId={projectId}
											projectName={project.name}
											onNoteLinked={loadProjectData}
											trigger={
												<Button size="sm">
													<Plus className="h-4 w-4 mr-2" />
													Vincular Nota
												</Button>
											}
										/>
									</Card>
								)}
							</TabsContent>

							{/* Tab Tareas */}
							<TabsContent value="tasks" className="space-y-3 mt-4">
								{/* Botón para vincular tareas */}
								<div className="flex justify-end">
									<LinkTaskToProject 
										projectId={projectId}
										projectName={project.name}
										onTaskLinked={loadProjectData}
									/>
								</div>
								
								{tasks.length > 0 ? (
									tasks.map((task) => (
										<Card key={task.id} className="p-3">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-medium text-sm mb-1">{task.title}</h4>
													{task.description && (
														<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
															{task.description}
														</p>
													)}
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
															{task.status}
														</Badge>
														<Badge variant="outline" className="text-xs">
															{task.priority}
														</Badge>
													</div>
												</div>
											</div>
										</Card>
									))
								) : (
									<Card className="p-4 text-center">
										<CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
										<p className="text-sm text-muted-foreground mb-3">No hay tareas vinculadas</p>
										<LinkTaskToProject 
											projectId={projectId}
											projectName={project.name}
											onTaskLinked={loadProjectData}
											trigger={
												<Button size="sm">
													<Plus className="h-4 w-4 mr-2" />
													Vincular Tarea
												</Button>
											}
										/>
									</Card>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			{/* Header */}
			<header className="h-16 px-6 flex items-center border-b border-border">
				<Button 
					variant="ghost" 
					size="sm" 
					onClick={() => router.back()}
					className="mr-4"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Volver
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<div 
							className="w-4 h-4 rounded-full" 
							style={{ backgroundColor: project.color }}
						/>
						<h1 className="text-2xl font-bold">{project.name}</h1>
						<Badge 
							variant="secondary" 
							className={`text-xs ${statusColors[project.status as keyof typeof statusColors]} text-white`}
						>
							{statusLabels[project.status as keyof typeof statusLabels]}
						</Badge>
					</div>
					{project.description && (
						<p className="text-muted-foreground mt-1">{project.description}</p>
					)}
				</div>
				<Button variant="ghost" size="sm">
					<Edit className="h-4 w-4 mr-2" />
					Editar
				</Button>
			</header>

			{/* Contenido principal */}
			<main className="flex-1 p-6">
				<div className="max-w-4xl mx-auto">
					{/* Estadísticas */}
					<div className="grid grid-cols-4 gap-4 mb-6">
						<Card className="p-4 text-center">
							<FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
							<div className="text-2xl font-bold">{project.notes_count}</div>
							<div className="text-sm text-muted-foreground">Notas</div>
						</Card>
						<Card className="p-4 text-center">
							<CheckSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
							<div className="text-2xl font-bold">{project.tasks_count}</div>
							<div className="text-sm text-muted-foreground">Tareas</div>
						</Card>
						<Card className="p-4 text-center">
							<AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
							<div className="text-2xl font-bold">{urgentTasks}</div>
							<div className="text-sm text-muted-foreground">Urgentes</div>
						</Card>
						<Card className="p-4 text-center">
							<TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
							<div className="text-2xl font-bold">{progress}%</div>
							<div className="text-sm text-muted-foreground">Progreso</div>
						</Card>
					</div>

					{/* Tabs */}
					<Tabs defaultValue="insights" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="insights">💡 Resumen IA</TabsTrigger>
							<TabsTrigger value="notes">📝 Notas ({notes.length})</TabsTrigger>
							<TabsTrigger value="tasks">✓ Tareas ({tasks.length})</TabsTrigger>
						</TabsList>

						{/* Tab Resumen IA */}
						<TabsContent value="insights" className="space-y-4 mt-6">
							{/* Insight actual */}
							{project.ai_summary ? (
								<Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
									<div className="flex items-start gap-3 mb-4">
										<Brain className="h-6 w-6 text-primary" />
										<div>
											<h4 className="font-semibold text-lg mb-1">Análisis del Proyecto</h4>
											<p className="text-sm text-muted-foreground">
												Actualizado {formatDate(project.updated_at)}
											</p>
										</div>
									</div>
									<p className="text-base leading-relaxed">{project.ai_summary}</p>
								</Card>
							) : (
								<Card className="p-8 text-center">
									<Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
									<h4 className="text-lg font-semibold mb-2">Aún no hay análisis</h4>
									<p className="text-muted-foreground mb-4">
										Genera un análisis inteligente de tu proyecto basado en las notas y tareas
									</p>
								</Card>
							)}
							
							{/* ⭐ EL BOTÓN MÁGICO */}
							<Button 
								onClick={handleGenerateInsights}
								disabled={isGenerating}
								className="w-full gap-2"
								size="lg"
							>
								{isGenerating ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										Analizando proyecto...
									</>
								) : (
									<>
										<Sparkles className="h-5 w-5" />
										{project.ai_summary ? 'Actualizar Análisis' : 'Analizar Proyecto'}
									</>
								)}
							</Button>
						</TabsContent>

						{/* Tab Notas */}
						<TabsContent value="notes" className="space-y-4 mt-6">
							{/* Botón para vincular notas */}
							<div className="flex justify-end">
								<LinkNoteToProject 
									projectId={projectId}
									projectName={project.name}
									onNoteLinked={loadProjectData}
								/>
							</div>
							
							{notes.length > 0 ? (
								<div className="grid gap-4">
									{notes.map((note) => (
										<Card key={note.id} className="p-4">
											<h4 className="font-semibold text-lg mb-2">{note.title}</h4>
											<p className="text-muted-foreground mb-3 line-clamp-3">
												{note.content}
											</p>
											<div className="text-sm text-muted-foreground">
												{formatDate(note.created_at)}
											</div>
										</Card>
									))}
								</div>
							) : (
								<Card className="p-8 text-center">
									<FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
									<h4 className="text-lg font-semibold mb-2">No hay notas vinculadas</h4>
									<p className="text-muted-foreground mb-4">
										Vincula notas a este proyecto para organizar mejor tu información
									</p>
									<LinkNoteToProject 
										projectId={projectId}
										projectName={project.name}
										onNoteLinked={loadProjectData}
										trigger={
											<Button>
												<Plus className="h-4 w-4 mr-2" />
												Vincular Nota
											</Button>
										}
									/>
								</Card>
							)}
						</TabsContent>

						{/* Tab Tareas */}
						<TabsContent value="tasks" className="space-y-4 mt-6">
							{/* Botón para vincular tareas */}
							<div className="flex justify-end">
								<LinkTaskToProject 
									projectId={projectId}
									projectName={project.name}
									onTaskLinked={loadProjectData}
								/>
							</div>
							
							{tasks.length > 0 ? (
								<div className="grid gap-4">
									{tasks.map((task) => (
										<Card key={task.id} className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-semibold text-lg mb-2">{task.title}</h4>
													{task.description && (
														<p className="text-muted-foreground mb-3 line-clamp-2">
															{task.description}
														</p>
													)}
													<div className="flex items-center gap-2">
														<Badge variant="outline">
															{task.status}
														</Badge>
														<Badge variant="outline">
															{task.priority}
														</Badge>
														{task.due_date && (
															<Badge variant="outline">
																{formatDate(task.due_date)}
															</Badge>
														)}
													</div>
												</div>
											</div>
										</Card>
									))}
								</div>
							) : (
								<Card className="p-8 text-center">
									<CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
									<h4 className="text-lg font-semibold mb-2">No hay tareas vinculadas</h4>
									<p className="text-muted-foreground mb-4">
										Vincula tareas a este proyecto para hacer seguimiento del progreso
									</p>
									<LinkTaskToProject 
										projectId={projectId}
										projectName={project.name}
										onTaskLinked={loadProjectData}
										trigger={
											<Button>
												<Plus className="h-4 w-4 mr-2" />
												Vincular Tarea
											</Button>
										}
									/>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	)
}
