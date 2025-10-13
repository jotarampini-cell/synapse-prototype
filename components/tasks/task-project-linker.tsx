"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Briefcase, Link, Unlink } from "lucide-react"
import { linkTaskToProject, unlinkTaskFromProject, getTaskProjects } from "@/app/actions/tasks"

interface TaskProjectLinkerProps {
	taskId: string
	onLinkChange: () => void
	trigger?: React.ReactNode
}

interface Project {
	id: string
	name: string
	status: string
}

// Mock de proyectos disponibles
const availableProjects: Project[] = [
	{ id: "1", name: "Synapse Mobile App", status: "active" },
	{ id: "2", name: "API Documentation", status: "planning" },
	{ id: "3", name: "User Research", status: "completed" },
	{ id: "4", name: "Database Migration", status: "active" },
	{ id: "5", name: "UI/UX Redesign", status: "planning" }
]

export function TaskProjectLinker({ taskId, onLinkChange, trigger }: TaskProjectLinkerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [linkedProjects, setLinkedProjects] = useState<Project[]>([])
	const [isLoading, setIsLoading] = useState(false)

	// Cargar proyectos vinculados
	useEffect(() => {
		if (isOpen) {
			loadLinkedProjects()
		}
	}, [isOpen, taskId])

	const loadLinkedProjects = async () => {
		setIsLoading(true)
		try {
			const result = await getTaskProjects(taskId)
			if (result.success && result.projects) {
				setLinkedProjects(result.projects)
			}
		} catch (error) {
			console.error('Error loading linked projects:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleLinkProject = async (projectId: string) => {
		const result = await linkTaskToProject(taskId, projectId)
		if (result.success) {
			await loadLinkedProjects()
			onLinkChange()
		}
	}

	const handleUnlinkProject = async (projectId: string) => {
		const result = await unlinkTaskFromProject(taskId, projectId)
		if (result.success) {
			await loadLinkedProjects()
			onLinkChange()
		}
	}

	const isProjectLinked = (projectId: string) => {
		return linkedProjects.some(p => p.id === projectId)
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active': return 'bg-green-500'
			case 'planning': return 'bg-yellow-500'
			case 'completed': return 'bg-blue-500'
			case 'paused': return 'bg-gray-500'
			default: return 'bg-gray-500'
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm">
						<Briefcase className="h-4 w-4 mr-2" />
						Proyectos
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl w-[95vw] sm:w-full">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Briefcase className="h-5 w-5" />
						Vincular con Proyectos
					</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4">
					{/* Proyectos vinculados */}
					{linkedProjects.length > 0 && (
						<div>
							<h4 className="font-medium mb-2">Proyectos vinculados</h4>
							<div className="space-y-2">
								{linkedProjects.map((project) => (
									<div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center gap-3">
											<div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
											<span className="font-medium">{project.name}</span>
											<Badge variant="secondary" className="text-xs">
												{project.status}
											</Badge>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleUnlinkProject(project.id)}
										>
											<Unlink className="h-4 w-4 mr-2" />
											Desvincular
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Proyectos disponibles */}
					<div>
						<h4 className="font-medium mb-2">Proyectos disponibles</h4>
						<div className="space-y-2">
							{availableProjects
								.filter(project => !isProjectLinked(project.id))
								.map((project) => (
									<div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center gap-3">
											<div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
											<span className="font-medium">{project.name}</span>
											<Badge variant="secondary" className="text-xs">
												{project.status}
											</Badge>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleLinkProject(project.id)}
										>
											<Link className="h-4 w-4 mr-2" />
											Vincular
										</Button>
									</div>
								))}
						</div>
					</div>

					{/* Estado vacío */}
					{linkedProjects.length === 0 && availableProjects.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							<Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No hay proyectos disponibles</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
