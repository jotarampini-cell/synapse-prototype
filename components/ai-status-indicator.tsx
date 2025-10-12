"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
	Brain, 
	Sparkles, 
	CheckCircle, 
	AlertCircle, 
	Loader2,
	Zap,
	Eye,
	EyeOff
} from "lucide-react"
import { log } from '@/lib/logger'

interface AIStatusIndicatorProps {
	status: 'idle' | 'analyzing' | 'completed' | 'error' | 'suggesting'
	message?: string
	showDetails?: boolean
	onToggleDetails?: () => void
	className?: string
}

export function AIStatusIndicator({ 
	status, 
	message, 
	showDetails = false, 
	onToggleDetails,
	className = "" 
}: AIStatusIndicatorProps) {
	const [isVisible, setIsVisible] = useState(true)

	const getStatusConfig = () => {
		switch (status) {
			case 'idle':
				return {
					icon: <Brain className="h-3 w-3" />,
					text: "IA Lista",
					variant: "secondary" as const,
					color: "text-muted-foreground",
					bgColor: "bg-muted"
				}
			case 'analyzing':
				return {
					icon: <Loader2 className="h-3 w-3 animate-spin" />,
					text: "Analizando...",
					variant: "default" as const,
					color: "text-primary",
					bgColor: "bg-primary/10"
				}
			case 'suggesting':
				return {
					icon: <Sparkles className="h-3 w-3 animate-pulse" />,
					text: "Sugiriendo...",
					variant: "default" as const,
					color: "text-purple-600",
					bgColor: "bg-purple-100"
				}
			case 'completed':
				return {
					icon: <CheckCircle className="h-3 w-3" />,
					text: "Completado",
					variant: "default" as const,
					color: "text-green-600",
					bgColor: "bg-green-100"
				}
			case 'error':
				return {
					icon: <AlertCircle className="h-3 w-3" />,
					text: "Error",
					variant: "destructive" as const,
					color: "text-red-600",
					bgColor: "bg-red-100"
				}
			default:
				return {
					icon: <Brain className="h-3 w-3" />,
					text: "IA",
					variant: "secondary" as const,
					color: "text-muted-foreground",
					bgColor: "bg-muted"
				}
		}
	}

	const config = getStatusConfig()

	if (!isVisible && status === 'idle') {
		return (
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setIsVisible(true)}
				className={`h-6 w-6 p-0 ${className}`}
				title="Mostrar estado de IA"
			>
				<Eye className="h-3 w-3" />
			</Button>
		)
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Badge 
				variant={config.variant}
				className={`flex items-center gap-1 text-xs ${config.bgColor} ${config.color} border-0`}
			>
				{config.icon}
				<span>{config.text}</span>
			</Badge>
			
			{message && showDetails && (
				<span className="text-xs text-muted-foreground max-w-32 truncate">
					{message}
				</span>
			)}
			
			{onToggleDetails && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleDetails}
					className="h-5 w-5 p-0"
					title={showDetails ? "Ocultar detalles" : "Mostrar detalles"}
				>
					{showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
				</Button>
			)}
			
			{status === 'idle' && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsVisible(false)}
					className="h-5 w-5 p-0"
					title="Ocultar indicador"
				>
					<EyeOff className="h-3 w-3" />
				</Button>
			)}
		</div>
	)
}

// Componente para mostrar el estado de IA en el header
export function AIHeaderStatus({ onOpenAIPanel }: { onOpenAIPanel?: () => void }) {
	const [_aiStatus, _setAiStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle')
	const [_lastActivity, _setLastActivity] = useState<string>("")

	useEffect(() => {
		// Simular cambios de estado de IA
		const interval = setInterval(() => {
			// En una implementación real, esto vendría de un contexto global o store
			// Por ahora, simulamos algunos cambios
		}, 5000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className="flex items-center gap-2">
			<AIStatusIndicator 
				status={aiStatus}
				message={lastActivity}
				showDetails={true}
			/>
			{onOpenAIPanel && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						log.info('Botón Insights AI clickeado en header')
						onOpenAIPanel()
					}}
					className="gap-1 text-xs h-8"
				>
					<Brain className="h-3 w-3" />
					Insights AI
				</Button>
			)}
		</div>
	)
}

// Componente para mostrar el estado de IA en el editor
export function AIEditorStatus({ 
	onAnalyze 
}: { 
	noteId?: string | null
	onAnalyze: () => void 
}) {
	const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle')
	const [showDetails, setShowDetails] = useState(false)

	const handleAnalyze = async () => {
		setAiStatus('analyzing')
		try {
			await onAnalyze()
			setAiStatus('completed')
			setTimeout(() => setAiStatus('idle'), 3000)
		} catch {
			setAiStatus('error')
			setTimeout(() => setAiStatus('idle'), 5000)
		}
	}

	return (
		<div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
			<AIStatusIndicator 
				status={aiStatus}
				message={aiStatus === 'analyzing' ? 'Procesando nota...' : ''}
				showDetails={showDetails}
				onToggleDetails={() => setShowDetails(!showDetails)}
			/>
			
			{aiStatus === 'idle' && (
				<Button
					variant="outline"
					size="sm"
					onClick={handleAnalyze}
					className="gap-1 text-xs"
				>
					<Zap className="h-3 w-3" />
					Analizar
				</Button>
			)}
		</div>
	)
}

