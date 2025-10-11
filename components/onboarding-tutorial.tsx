"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
	ArrowRight, 
	ArrowLeft, 
	X, 
	Sparkles, 
	FileText, 
	Target, 
	Globe, 
	Mic,
	Brain,
	CheckCircle,
	Play
} from "lucide-react"

interface TutorialStep {
	id: string
	title: string
	description: string
	icon: React.ReactNode
	action?: string
	highlight?: string
}

interface OnboardingTutorialProps {
	isOpen: boolean
	onClose: () => void
	onComplete: () => void
}

export function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
	const [currentStep, setCurrentStep] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)

	const steps: TutorialStep[] = [
		{
			id: "welcome",
			title: "¡Bienvenido a Synapse!",
			description: "Tu asistente inteligente para organizar ideas y convertirlas en acciones concretas.",
			icon: <Sparkles className="h-8 w-8 text-primary" />,
			action: "Empezar"
		},
		{
			id: "notes",
			title: "Captura tus ideas",
			description: "Escribe notas, captura URLs, sube archivos o graba audio. La IA extraerá automáticamente conceptos clave y tareas.",
			icon: <FileText className="h-8 w-8 text-blue-600" />,
			action: "Crear primera nota",
			highlight: "notes"
		},
		{
			id: "ai",
			title: "Asistente IA inteligente",
			description: "Haz preguntas sobre tus notas, obtén resúmenes automáticos y genera planes de acción estructurados.",
			icon: <Brain className="h-8 w-8 text-purple-600" />,
			action: "Abrir panel IA",
			highlight: "ai-panel"
		},
		{
			id: "actions",
			title: "Convierte ideas en acciones",
			description: "Ve todas las tareas extraídas de tus notas, organizadas por prioridad y fecha. Marca como completadas y sigue tu progreso.",
			icon: <Target className="h-8 w-8 text-green-600" />,
			action: "Ver acciones",
			highlight: "actions"
		},
		{
			id: "sources",
			title: "Gestiona tus fuentes",
			description: "Organiza URLs y archivos capturados. Encuentra rápidamente el contenido que necesitas.",
			icon: <Globe className="h-8 w-8 text-orange-600" />,
			action: "Ver fuentes",
			highlight: "sources"
		},
		{
			id: "projects",
			title: "Organiza en proyectos",
			description: "Agrupa notas relacionadas en proyectos. La IA sugiere agrupaciones automáticas basadas en el contenido.",
			icon: <Mic className="h-8 w-8 text-cyan-600" />,
			action: "Ver proyectos",
			highlight: "projects"
		},
		{
			id: "complete",
			title: "¡Listo para empezar!",
			description: "Ya conoces las funcionalidades principales. Comienza a capturar tus ideas y deja que la IA te ayude a organizarlas.",
			icon: <CheckCircle className="h-8 w-8 text-green-600" />,
			action: "Comenzar a usar"
		}
	]

	const currentStepData = steps[currentStep]
	const isLastStep = currentStep === steps.length - 1
	const isFirstStep = currentStep === 0

	const nextStep = () => {
		if (isLastStep) {
			onComplete()
		} else {
			setIsAnimating(true)
			setTimeout(() => {
				setCurrentStep(prev => prev + 1)
				setIsAnimating(false)
			}, 200)
		}
	}

	const prevStep = () => {
		if (!isFirstStep) {
			setIsAnimating(true)
			setTimeout(() => {
				setCurrentStep(prev => prev - 1)
				setIsAnimating(false)
			}, 200)
		}
	}

	const skipTutorial = () => {
		onComplete()
	}

	// Auto-advance para el primer paso después de 3 segundos
	useEffect(() => {
		if (currentStep === 0) {
			const timer = setTimeout(() => {
				nextStep()
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [currentStep])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-300">
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-muted-foreground">
								Paso {currentStep + 1} de {steps.length}
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={skipTutorial}
							className="h-6 w-6 p-0"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
					
					{/* Progress Bar */}
					<div className="w-full bg-muted rounded-full h-2">
						<div 
							className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
							style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
						/>
					</div>
				</CardHeader>
				
				<CardContent className="space-y-6">
					{/* Step Content */}
					<div className={`text-center transition-all duration-200 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
						<div className="flex justify-center mb-4">
							{currentStepData.icon}
						</div>
						
						<h3 className="text-xl font-semibold mb-2">
							{currentStepData.title}
						</h3>
						
						<p className="text-muted-foreground text-sm leading-relaxed">
							{currentStepData.description}
						</p>
					</div>

					{/* Demo Action */}
					{currentStepData.action && currentStep !== 0 && currentStep !== steps.length - 1 && (
						<div className="p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Play className="h-4 w-4" />
								<span>Demo: {currentStepData.action}</span>
							</div>
						</div>
					)}

					{/* Navigation */}
					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							onClick={prevStep}
							disabled={isFirstStep}
							className="gap-1"
						>
							<ArrowLeft className="h-4 w-4" />
							Anterior
						</Button>
						
						<div className="flex gap-1">
							{steps.map((_, index) => (
								<div
									key={index}
									className={`w-2 h-2 rounded-full transition-colors ${
										index === currentStep 
											? 'bg-primary' 
											: index < currentStep 
												? 'bg-primary/50' 
												: 'bg-muted'
									}`}
								/>
							))}
						</div>
						
						<Button
							onClick={nextStep}
							className="gap-1"
						>
							{isLastStep ? (
								<>
									<CheckCircle className="h-4 w-4" />
									Finalizar
								</>
							) : (
								<>
									Siguiente
									<ArrowRight className="h-4 w-4" />
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

// Hook para manejar el onboarding
export function useOnboarding() {
	const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
	const [showTutorial, setShowTutorial] = useState(false)

	useEffect(() => {
		// Verificar si el usuario ya completó el onboarding
		const completed = localStorage.getItem('synapse-onboarding-completed')
		if (!completed) {
			setShowTutorial(true)
		} else {
			setHasCompletedOnboarding(true)
		}
	}, [])

	const completeOnboarding = () => {
		localStorage.setItem('synapse-onboarding-completed', 'true')
		setHasCompletedOnboarding(true)
		setShowTutorial(false)
	}

	const startTutorial = () => {
		setShowTutorial(true)
	}

	return {
		hasCompletedOnboarding,
		showTutorial,
		completeOnboarding,
		startTutorial,
		closeTutorial: () => setShowTutorial(false)
	}
}

