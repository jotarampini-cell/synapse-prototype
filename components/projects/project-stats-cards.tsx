"use client"

import { Card } from "@/components/ui/card"
import { FileText, CheckSquare, AlertCircle, TrendingUp, Clock, Users } from "lucide-react"

interface StatCardProps {
	icon: React.ComponentType<{ className?: string }>
	label: string
	value: string | number
	color?: string
}

function StatCard({ icon: Icon, label, value, color = "text-blue-500" }: StatCardProps) {
	return (
		<Card className="p-3 text-center">
			<Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
			<div className="text-lg font-bold">{value}</div>
			<div className="text-xs text-muted-foreground">{label}</div>
		</Card>
	)
}

interface ProjectStatsCardsProps {
	notesCount: number
	tasksCount: number
	completedTasks: number
	urgentTasks?: number
	progress?: number
	className?: string
}

export function ProjectStatsCards({ 
	notesCount, 
	tasksCount, 
	completedTasks, 
	urgentTasks = 0,
	progress = 0,
	className = "" 
}: ProjectStatsCardsProps) {
	return (
		<div className={`grid grid-cols-2 gap-2 ${className}`}>
			<StatCard 
				icon={FileText} 
				label="Notas" 
				value={notesCount}
				color="text-blue-500"
			/>
			<StatCard 
				icon={CheckSquare} 
				label="Tareas" 
				value={tasksCount}
				color="text-green-500"
			/>
			<StatCard 
				icon={AlertCircle} 
				label="Urgentes" 
				value={urgentTasks}
				color="text-red-500"
			/>
			<StatCard 
				icon={TrendingUp} 
				label="Progreso" 
				value={`${progress}%`}
				color="text-purple-500"
			/>
		</div>
	)
}

// Versión para desktop con más información
export function ProjectStatsCardsDesktop({ 
	notesCount, 
	tasksCount, 
	completedTasks, 
	urgentTasks = 0,
	progress = 0,
	className = "" 
}: ProjectStatsCardsProps) {
	return (
		<div className={`grid grid-cols-4 gap-4 ${className}`}>
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
	)
}
