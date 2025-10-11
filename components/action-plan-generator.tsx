"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
	Target, 
	Plus, 
	CheckSquare, 
	Calendar,
	Clock,
	ArrowRight,
	Sparkles,
	Loader2,
	Edit,
	Trash2,
	Save,
	X
} from "lucide-react"
import { toast } from "sonner"

interface ActionStep {
	id: string
	title: string
	description: string
	priority: 'high' | 'medium' | 'low'
	estimatedTime: string
	dependencies: string[]
	completed: boolean
}

interface ActionPlan {
	id: string
	title: string
	description: string
	steps: ActionStep[]
	estimatedTotalTime: string
	created_at: string
}

interface ActionPlanGeneratorProps {
	noteContent: string
	noteTitle: string
	onPlanCreated: (plan: ActionPlan) => void
	className?: string
}

export function ActionPlanGenerator({ 
	noteContent, 
	noteTitle, 
	onPlanCreated, 
	className = "" 
}: ActionPlanGeneratorProps) {
	const [isGenerating, setIsGenerating] = useState(false)
	const [generatedPlan, setGeneratedPlan] = useState<ActionPlan | null>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [editingStep, setEditingStep] = useState<ActionStep | null>(null)

	const generateActionPlan = async () => {
		if (!noteContent.trim()) {
			toast.error("No hay contenido para generar un plan de acción")
			return
		}

		setIsGenerating(true)
		try {
			// Simular generación de plan de acción (en implementación real, esto sería una API call)
			await new Promise(resolve => setTimeout(resolve, 3000))
			
			// Mock plan basado en el contenido
			const mockPlan: ActionPlan = {
				id: Date.now().toString(),
				title: `Plan de Acción: ${noteTitle}`,
				description: `Plan generado automáticamente basado en la nota "${noteTitle}". Incluye pasos organizados por prioridad y tiempo estimado.`,
				estimatedTotalTime: "2-3 horas",
				created_at: new Date().toISOString(),
				steps: [
					{
						id: "1",
						title: "Análisis inicial",
						description: "Revisar y analizar el contenido de la nota para identificar objetivos claros",
						priority: "high",
						estimatedTime: "30 min",
						dependencies: [],
						completed: false
					},
					{
						id: "2",
						title: "Definir objetivos específicos",
						description: "Establecer objetivos SMART basados en la información de la nota",
						priority: "high",
						estimatedTime: "45 min",
						dependencies: ["1"],
						completed: false
					},
					{
						id: "3",
						title: "Crear cronograma",
						description: "Organizar las tareas en un cronograma realista con fechas límite",
						priority: "medium",
						estimatedTime: "30 min",
						dependencies: ["2"],
						completed: false
					},
					{
						id: "4",
						title: "Asignar recursos",
						description: "Identificar y asignar los recursos necesarios para cada tarea",
						priority: "medium",
						estimatedTime: "20 min",
						dependencies: ["3"],
						completed: false
					},
					{
						id: "5",
						title: "Implementar seguimiento",
						description: "Establecer sistema de seguimiento y métricas de progreso",
						priority: "low",
						estimatedTime: "15 min",
						dependencies: ["4"],
						completed: false
					}
				]
			}

			setGeneratedPlan(mockPlan)
			toast.success("Plan de acción generado exitosamente")
			
		} catch (error) {
			console.error('Error generating action plan:', error)
			toast.error("Error al generar el plan de acción")
		} finally {
			setIsGenerating(false)
		}
	}

	const toggleStepCompletion = (stepId: string) => {
		if (generatedPlan) {
			const updatedSteps = generatedPlan.steps.map(step =>
				step.id === stepId ? { ...step, completed: !step.completed } : step
			)
			setGeneratedPlan({ ...generatedPlan, steps: updatedSteps })
		}
	}

	const editStep = (step: ActionStep) => {
		setEditingStep(step)
		setIsEditing(true)
	}

	const saveStepEdit = () => {
		if (editingStep && generatedPlan) {
			const updatedSteps = generatedPlan.steps.map(step =>
				step.id === editingStep.id ? editingStep : step
			)
			setGeneratedPlan({ ...generatedPlan, steps: updatedSteps })
			setIsEditing(false)
			setEditingStep(null)
			toast.success("Paso actualizado")
		}
	}

	const deleteStep = (stepId: string) => {
		if (generatedPlan) {
			const updatedSteps = generatedPlan.steps.filter(step => step.id !== stepId)
			setGeneratedPlan({ ...generatedPlan, steps: updatedSteps })
			toast.success("Paso eliminado")
		}
	}

	const savePlan = () => {
		if (generatedPlan) {
			onPlanCreated(generatedPlan)
			toast.success("Plan de acción guardado")
		}
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800'
			case 'medium': return 'bg-yellow-100 text-yellow-800'
			case 'low': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getPriorityLabel = (priority: string) => {
		switch (priority) {
			case 'high': return 'Alta'
			case 'medium': return 'Media'
			case 'low': return 'Baja'
			default: return priority
		}
	}

	const completedSteps = generatedPlan?.steps.filter(step => step.completed).length || 0
	const totalSteps = generatedPlan?.steps.length || 0
	const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Target className="h-4 w-4" />
					Generador de Plan de Acción
				</CardTitle>
			</CardHeader>
			
			<CardContent className="space-y-4">
				{!generatedPlan ? (
					<>
						<div className="text-center py-6">
							<Target className="h-12 w-12 mx-auto mb-4 text-primary" />
							<h3 className="text-lg font-semibold mb-2">Crear Plan de Acción</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Genera un plan de acción estructurado basado en el contenido de tu nota
							</p>
							<Button
								onClick={generateActionPlan}
								disabled={isGenerating || !noteContent.trim()}
								className="gap-2"
							>
								{isGenerating ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Generando...
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />
										Generar Plan
									</>
								)}
							</Button>
						</div>
					</>
				) : (
					<>
						{/* Plan Header */}
						<div className="border-b border-border pb-4">
							<div className="flex items-start justify-between mb-2">
								<div>
									<h3 className="font-semibold">{generatedPlan.title}</h3>
									<p className="text-sm text-muted-foreground">{generatedPlan.description}</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={savePlan}
									className="gap-1"
								>
									<Save className="h-3 w-3" />
									Guardar
								</Button>
							</div>
							
							<div className="flex items-center gap-4 text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									<span>{generatedPlan.estimatedTotalTime}</span>
								</div>
								<div className="flex items-center gap-1">
									<CheckSquare className="h-3 w-3" />
									<span>{completedSteps}/{totalSteps} completados</span>
								</div>
							</div>
							
							{/* Progress Bar */}
							<div className="mt-3">
								<div className="w-full bg-muted rounded-full h-2">
									<div 
										className="bg-primary h-2 rounded-full transition-all duration-300"
										style={{ width: `${progressPercentage}%` }}
									/>
								</div>
							</div>
						</div>

						{/* Steps */}
						<div className="space-y-3">
							{generatedPlan.steps.map((step, index) => (
								<div
									key={step.id}
									className={`p-3 border border-border rounded-lg transition-colors ${
										step.completed ? 'bg-muted/30' : 'bg-background hover:bg-muted/50'
									}`}
								>
									<div className="flex items-start gap-3">
										<button
											onClick={() => toggleStepCompletion(step.id)}
											className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
												step.completed
													? 'bg-primary border-primary text-primary-foreground'
													: 'border-muted-foreground hover:border-primary'
											}`}
										>
											{step.completed && <CheckSquare className="h-3 w-3" />}
										</button>
										
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<span className="text-sm font-medium text-muted-foreground">
													{index + 1}.
												</span>
												<h4 className={`font-medium text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
													{step.title}
												</h4>
												<Badge className={`text-xs ${getPriorityColor(step.priority)}`}>
													{getPriorityLabel(step.priority)}
												</Badge>
												<Badge variant="outline" className="text-xs">
													{step.estimatedTime}
												</Badge>
											</div>
											
											<p className="text-xs text-muted-foreground mb-2">
												{step.description}
											</p>
											
											{step.dependencies.length > 0 && (
												<div className="flex items-center gap-1 text-xs text-muted-foreground">
													<ArrowRight className="h-3 w-3" />
													<span>Depende de: {step.dependencies.join(', ')}</span>
												</div>
											)}
										</div>
										
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => editStep(step)}
												className="h-6 w-6 p-0"
												title="Editar paso"
											>
												<Edit className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => deleteStep(step.id)}
												className="h-6 w-6 p-0 text-destructive hover:text-destructive"
												title="Eliminar paso"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Actions */}
						<div className="flex gap-2 pt-4 border-t border-border">
							<Button
								onClick={() => setGeneratedPlan(null)}
								variant="outline"
								className="flex-1 gap-2"
							>
								<X className="h-4 w-4" />
								Generar Nuevo
							</Button>
							<Button
								onClick={savePlan}
								className="flex-1 gap-2"
							>
								<Save className="h-4 w-4" />
								Guardar Plan
							</Button>
						</div>
					</>
				)}

				{/* Edit Step Modal */}
				{isEditing && editingStep && (
					<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
						<Card className="w-full max-w-md">
							<CardHeader>
								<CardTitle className="text-sm">Editar Paso</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Input
									value={editingStep.title}
									onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
									placeholder="Título del paso"
								/>
								<Input
									value={editingStep.description}
									onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
									placeholder="Descripción"
								/>
								<Input
									value={editingStep.estimatedTime}
									onChange={(e) => setEditingStep({ ...editingStep, estimatedTime: e.target.value })}
									placeholder="Tiempo estimado (ej: 30 min)"
								/>
								<div className="flex gap-2">
									<Button
										onClick={saveStepEdit}
										className="flex-1"
									>
										Guardar
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setIsEditing(false)
											setEditingStep(null)
										}}
										className="flex-1"
									>
										Cancelar
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

