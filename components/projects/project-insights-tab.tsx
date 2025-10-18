"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
	Sparkles, 
	Loader2, 
	Brain, 
	FileText, 
	CheckSquare, 
	AlertCircle, 
	TrendingUp 
} from "lucide-react"
import { generateProjectInsights } from "@/app/actions/projects"
import { toast } from "sonner"
import type { ProjectWithStats } from "@/app/actions/projects"

interface ProjectInsightsTabProps {
	project: ProjectWithStats
	notesCount: number
	tasksCount: number
	urgentTasks: number
	onInsightsUpdated?: () => void
	className?: string
}

export function ProjectInsightsTab({ 
	project, 
	notesCount, 
	tasksCount, 
	urgentTasks,
	onInsightsUpdated,
	className = "" 
}: ProjectInsightsTabProps) {
	const [isGenerating, setIsGenerating] = useState(false)

	const handleGenerateInsights = async () => {
		setIsGenerating(true)
		try {
			const result = await generateProjectInsights(project.id)
			if (result.success && result.insights) {
				toast.success("Análisis generado exitosamente")
				onInsightsUpdated?.()
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

	const progress = tasksCount > 0 ? Math.round((project.completed_tasks / tasksCount) * 100) : 0

	return (
		<div className={`space-y-4 ${className}`}>
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
			
			{/* Detalles adicionales */}
			<div className="grid grid-cols-2 gap-3">
				<Card className="p-3 text-center">
					<FileText className="h-4 w-4 mx-auto mb-1 text-blue-500" />
					<div className="text-sm font-bold">{notesCount}</div>
					<div className="text-xs text-muted-foreground">Notas</div>
				</Card>
				<Card className="p-3 text-center">
					<CheckSquare className="h-4 w-4 mx-auto mb-1 text-green-500" />
					<div className="text-sm font-bold">{tasksCount}</div>
					<div className="text-xs text-muted-foreground">Tareas</div>
				</Card>
				<Card className="p-3 text-center">
					<AlertCircle className="h-4 w-4 mx-auto mb-1 text-red-500" />
					<div className="text-sm font-bold">{urgentTasks}</div>
					<div className="text-xs text-muted-foreground">Urgentes</div>
				</Card>
				<Card className="p-3 text-center">
					<TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-500" />
					<div className="text-sm font-bold">{progress}%</div>
					<div className="text-xs text-muted-foreground">Progreso</div>
				</Card>
			</div>
		</div>
	)
}

// Versión para desktop
export function ProjectInsightsTabDesktop({ 
	project, 
	notesCount, 
	tasksCount, 
	urgentTasks,
	onInsightsUpdated,
	className = "" 
}: ProjectInsightsTabProps) {
	const [isGenerating, setIsGenerating] = useState(false)

	const handleGenerateInsights = async () => {
		setIsGenerating(true)
		try {
			const result = await generateProjectInsights(project.id)
			if (result.success && result.insights) {
				toast.success("Análisis generado exitosamente")
				onInsightsUpdated?.()
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

	const progress = tasksCount > 0 ? Math.round((project.completed_tasks / tasksCount) * 100) : 0

	return (
		<div className={`space-y-6 ${className}`}>
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
			
			{/* Detalles adicionales */}
			<div className="grid grid-cols-4 gap-4">
				<Card className="p-4 text-center">
					<FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
					<div className="text-2xl font-bold">{notesCount}</div>
					<div className="text-sm text-muted-foreground">Notas</div>
				</Card>
				<Card className="p-4 text-center">
					<CheckSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
					<div className="text-2xl font-bold">{tasksCount}</div>
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
		</div>
	)
}
