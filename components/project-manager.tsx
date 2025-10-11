"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
	Folder, 
	Plus, 
	Edit, 
	Trash2, 
	Users, 
	Calendar,
	Target,
	FileText,
	Sparkles,
	Loader2,
	CheckCircle,
	Clock
} from "lucide-react"
import { toast } from "sonner"

interface Project {
	id: string
	name: string
	description: string
	color: string
	notes: string[]
	tasks: string[]
	created_at: string
	updated_at: string
}

interface ProjectManagerProps {
	notes: Array<{ id: string; title: string; content: string; tags: string[] }>
	onProjectCreated: (project: Project) => void
	className?: string
}

export function ProjectManager({ notes, onProjectCreated, className = "" }: ProjectManagerProps) {
	const [isGenerating, setIsGenerating] = useState(false)
	const [suggestedProjects, setSuggestedProjects] = useState<Project[]>([])
	const [isCreating, setIsCreating] = useState(false)
	const [newProject, setNewProject] = useState({
		name: "",
		description: "",
		color: "#3B82F6"
	})

	const colors = [
		"#3B82F6", // Blue
		"#EF4444", // Red
		"#10B981", // Green
		"#F59E0B", // Yellow
		"#8B5CF6", // Purple
		"#F97316", // Orange
		"#06B6D4", // Cyan
		"#EC4899", // Pink
	]

	const generateProjectSuggestions = async () => {
		if (notes.length === 0) {
			toast.error("No hay notas para analizar")
			return
		}

		setIsGenerating(true)
		try {
			// Simular generación de proyectos (en implementación real, esto sería una API call)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			// Mock proyectos basados en las notas
			const mockProjects: Project[] = [
				{
					id: "1",
					name: "Desarrollo Web",
					description: "Proyecto de desarrollo de aplicaciones web con React y Node.js",
					color: "#3B82F6",
					notes: notes.filter(note => 
						note.title.toLowerCase().includes('react') || 
						note.title.toLowerCase().includes('web') ||
						note.tags.some(tag => tag.toLowerCase().includes('desarrollo'))
					).map(note => note.id),
					tasks: [],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{
					id: "2",
					name: "Aprendizaje IA",
					description: "Estudio y experimentación con inteligencia artificial y machine learning",
					color: "#10B981",
					notes: notes.filter(note => 
						note.title.toLowerCase().includes('ia') || 
						note.title.toLowerCase().includes('ai') ||
						note.tags.some(tag => tag.toLowerCase().includes('aprendizaje'))
					).map(note => note.id),
					tasks: [],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{
					id: "3",
					name: "Productividad Personal",
					description: "Sistema de organización y mejora de productividad personal",
					color: "#F59E0B",
					notes: notes.filter(note => 
						note.title.toLowerCase().includes('productividad') || 
						note.title.toLowerCase().includes('organización') ||
						note.tags.some(tag => tag.toLowerCase().includes('personal'))
					).map(note => note.id),
					tasks: [],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			]

			setSuggestedProjects(mockProjects)
			toast.success("Proyectos sugeridos generados")
			
		} catch (error) {
			console.error('Error generating projects:', error)
			toast.error("Error al generar sugerencias de proyectos")
		} finally {
			setIsGenerating(false)
		}
	}

	const createProject = () => {
		if (!newProject.name.trim()) {
			toast.error("El nombre del proyecto es requerido")
			return
		}

		const project: Project = {
			id: Date.now().toString(),
			name: newProject.name,
			description: newProject.description,
			color: newProject.color,
			notes: [],
			tasks: [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}

		onProjectCreated(project)
		toast.success("Proyecto creado exitosamente")
		
		// Reset form
		setNewProject({ name: "", description: "", color: "#3B82F6" })
		setIsCreating(false)
	}

	const acceptSuggestedProject = (project: Project) => {
		onProjectCreated(project)
		toast.success(`Proyecto "${project.name}" creado`)
		setSuggestedProjects(prev => prev.filter(p => p.id !== project.id))
	}

	const rejectSuggestedProject = (projectId: string) => {
		setSuggestedProjects(prev => prev.filter(p => p.id !== projectId))
		toast.success("Sugerencia rechazada")
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Folder className="h-4 w-4" />
					Gestión de Proyectos
				</CardTitle>
			</CardHeader>
			
			<CardContent className="space-y-4">
				{/* Create New Project */}
				{!isCreating ? (
					<div className="flex gap-2">
						<Button
							onClick={() => setIsCreating(true)}
							variant="outline"
							className="flex-1 gap-2"
						>
							<Plus className="h-4 w-4" />
							Crear Proyecto
						</Button>
						<Button
							onClick={generateProjectSuggestions}
							disabled={isGenerating || notes.length === 0}
							className="gap-2"
						>
							{isGenerating ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4" />
							)}
							IA Sugiere
						</Button>
					</div>
				) : (
					<div className="space-y-3 p-3 border border-border rounded-lg">
						<Input
							placeholder="Nombre del proyecto"
							value={newProject.name}
							onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
						/>
						<Input
							placeholder="Descripción (opcional)"
							value={newProject.description}
							onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
						/>
						
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Color:</span>
							<div className="flex gap-1">
								{colors.map((color) => (
									<button
										key={color}
										onClick={() => setNewProject({ ...newProject, color })}
										className={`w-6 h-6 rounded-full border-2 ${
											newProject.color === color ? 'border-foreground' : 'border-transparent'
										}`}
										style={{ backgroundColor: color }}
									/>
								))}
							</div>
						</div>
						
						<div className="flex gap-2">
							<Button
								onClick={createProject}
								className="flex-1"
							>
								Crear
							</Button>
							<Button
								variant="outline"
								onClick={() => setIsCreating(false)}
								className="flex-1"
							>
								Cancelar
							</Button>
						</div>
					</div>
				)}

				{/* Suggested Projects */}
				{suggestedProjects.length > 0 && (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium">Proyectos Sugeridos</span>
						</div>
						
						{suggestedProjects.map((project) => (
							<div
								key={project.id}
								className="p-3 border border-border rounded-lg"
							>
								<div className="flex items-start gap-3">
									<div 
										className="w-4 h-4 rounded-full mt-1"
										style={{ backgroundColor: project.color }}
									/>
									
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm">{project.name}</h4>
										<p className="text-xs text-muted-foreground mb-2">
											{project.description}
										</p>
										
										<div className="flex items-center gap-4 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<FileText className="h-3 w-3" />
												<span>{project.notes.length} notas</span>
											</div>
											<div className="flex items-center gap-1">
												<Target className="h-3 w-3" />
												<span>{project.tasks.length} tareas</span>
											</div>
										</div>
									</div>
									
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="sm"
											onClick={() => acceptSuggestedProject(project)}
											className="h-6 w-6 p-0"
											title="Aceptar"
										>
											<CheckCircle className="h-3 w-3" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => rejectSuggestedProject(project.id)}
											className="h-6 w-6 p-0 text-destructive hover:text-destructive"
											title="Rechazar"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Empty State */}
				{!isCreating && suggestedProjects.length === 0 && (
					<div className="text-center py-6">
						<Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							Organiza tus notas en proyectos para mejor gestión
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

