"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
	Briefcase, 
	FileText, 
	CheckSquare, 
	MoreHorizontal, 
	Sparkles 
} from "lucide-react"
import Link from "next/link"
import type { ProjectWithStats } from "@/app/actions/projects"

interface ProjectCardMobileProps {
	project: ProjectWithStats
	className?: string
}

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

export function ProjectCardMobile({ project, className = "" }: ProjectCardMobileProps) {
	const progress = project.tasks_count > 0 ? Math.round((project.completed_tasks / project.tasks_count) * 100) : 0

	return (
		<Link href={`/proyectos/${project.id}`}>
			<Card className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors touch-target ${className}`}>
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
}
