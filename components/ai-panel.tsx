"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
	Brain, 
	X, 
	Send,
	Sparkles,
	Lightbulb,
	CheckSquare,
	RefreshCw,
	MessageSquare,
	Zap,
	FileText
} from "lucide-react"
import { analyzeNote } from "@/app/actions/ai-analysis"
import { generateSocraticQuestions } from '@/lib/gemini/client'
import { RelatedNotesPanel } from "@/components/related-notes"
import { ActionPlanGenerator } from "@/components/action-plan-generator"

interface AIPanelProps {
	isOpen: boolean
	onClose: () => void
	noteId: string | null
	noteContent?: string
	noteTitle?: string
}

interface ChatMessage {
	id: string
	type: 'user' | 'ai' | 'system'
	content: string
	timestamp: Date
	isLoading?: boolean
}

interface AnalysisData {
	summary?: string
	tasks?: Array<{ task: string; priority: 'high' | 'medium' | 'low'; dueDate?: string }>
	concepts?: Array<{ concept: string; definition: string; relevance: number }>
	connections?: Array<{ source: string; target: string; type: string; strength: number }>
}

interface QuickSuggestion {
	id: string
	text: string
	icon: React.ReactNode
	action: () => void
}

export function AIPanel({ isOpen, onClose, noteId, noteContent = "", noteTitle = "" }: AIPanelProps) {
	const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
	const [inputValue, setInputValue] = useState("")
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [socraticQuestions, setSocraticQuestions] = useState<string[]>([])
	const [, setIsLoadingQuestions] = useState(false)
	
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [chatMessages])

	// Focus input when panel opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isOpen])

	// Cargar datos de análisis existentes cuando se abre el panel
	useEffect(() => {
		if (isOpen && noteId && !analysisData) {
			loadExistingAnalysis()
		}
	}, [isOpen, noteId])

	// Cerrar con ESC
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown)
			return () => document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	const loadExistingAnalysis = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			// Cargar análisis existente desde la base de datos
			const response = await fetch(`/api/ai-analysis/${noteId}`)
			if (response.ok) {
				const data = await response.json()
				if (data.analysis) {
					setAnalysisData({
						summary: data.analysis.summary,
						tasks: data.analysis.extracted_tasks,
						concepts: data.analysis.key_concepts,
						connections: data.analysis.connections
					})
					
					// Agregar mensaje del sistema con el análisis
					addSystemMessage("Análisis cargado. Puedes preguntarme sobre esta nota.")
					
					// Load socratic questions
					await loadSocraticQuestions(data.analysis.summary || '')
				} else {
					// Si no hay análisis, hacer uno nuevo
					await handleAnalyze()
				}
			} else {
				// Si no hay análisis, hacer uno nuevo
				await handleAnalyze()
			}
		} catch (error) {
			console.error('Error loading existing analysis:', error)
			// Si hay error, hacer análisis nuevo
			await handleAnalyze()
		} finally {
			setIsLoading(false)
		}
	}

	const handleAnalyze = async () => {
		if (!noteId) return

		setIsAnalyzing(true)
		addSystemMessage("Analizando tu nota...")
		
		try {
			const result = await analyzeNote(noteId, 'full')
			if (result.success) {
				setAnalysisData(result.data)
				addSystemMessage("¡Análisis completado! He encontrado conceptos clave, tareas y conexiones.")
				// Load socratic questions after analysis
				await loadSocraticQuestions(result.data?.content || '')
			} else {
				addSystemMessage("Hubo un error al analizar la nota. Inténtalo de nuevo.")
			}
		} catch (error) {
			console.error('Error analyzing note:', error)
			addSystemMessage("Error al analizar la nota. Verifica tu conexión.")
		} finally {
			setIsAnalyzing(false)
		}
	}

	const loadSocraticQuestions = async (content: string) => {
		if (!content || content.length < 50) return

		try {
			setIsLoadingQuestions(true)
			const questions = await generateSocraticQuestions(content)
			setSocraticQuestions(questions)
		} catch (error) {
			console.error("Error loading socratic questions:", error)
		} finally {
			setIsLoadingQuestions(false)
		}
	}

	const addSystemMessage = (content: string) => {
		const message: ChatMessage = {
			id: Date.now().toString(),
			type: 'system',
			content,
			timestamp: new Date()
		}
		setChatMessages(prev => [...prev, message])
	}

	const addUserMessage = (content: string) => {
		const message: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content,
			timestamp: new Date()
		}
		setChatMessages(prev => [...prev, message])
	}

	const addAIMessage = (content: string, isLoading = false) => {
		const message: ChatMessage = {
			id: Date.now().toString(),
			type: 'ai',
			content,
			timestamp: new Date(),
			isLoading
		}
		setChatMessages(prev => [...prev, message])
	}

	const handleSendMessage = async () => {
		if (!inputValue.trim() || !noteId) return

		const userMessage = inputValue.trim()
		setInputValue("")
		addUserMessage(userMessage)

		// Agregar mensaje de carga de IA
		const loadingMessageId = Date.now().toString()
		addAIMessage("Pensando...", true)

		try {
			// Simular respuesta de IA (aquí iría la lógica real de chat)
			await new Promise(resolve => setTimeout(resolve, 1500))
			
			// Remover mensaje de carga
			setChatMessages(prev => prev.filter(msg => msg.id !== loadingMessageId))
			
			// Generar respuesta basada en el mensaje del usuario
			const response = generateAIResponse(userMessage)
			addAIMessage(response)
			
		} catch (error) {
			console.error('Error processing message:', error)
			setChatMessages(prev => prev.filter(msg => msg.id !== loadingMessageId))
			addAIMessage("Lo siento, hubo un error procesando tu mensaje. Inténtalo de nuevo.")
		}
	}

	const generateAIResponse = (userMessage: string): string => {
		const message = userMessage.toLowerCase()
		
		if (message.includes('resumen') || message.includes('resume')) {
			return analysisData?.summary || "No tengo un resumen disponible para esta nota. Intenta analizarla primero."
		}
		
		if (message.includes('tarea') || message.includes('tareas')) {
			if (analysisData?.tasks && analysisData.tasks.length > 0) {
				const tasksList = analysisData.tasks.map((task, i) => `${i + 1}. ${task.task} (${task.priority})`).join('\n')
				return `He encontrado estas tareas en tu nota:\n\n${tasksList}`
			}
			return "No he encontrado tareas específicas en esta nota."
		}
		
		if (message.includes('concepto') || message.includes('conceptos')) {
			if (analysisData?.concepts && analysisData.concepts.length > 0) {
				const conceptsList = analysisData.concepts.map(concept => `• ${concept.concept}`).join('\n')
				return `Los conceptos clave que he identificado son:\n\n${conceptsList}`
			}
			return "No he identificado conceptos específicos en esta nota."
		}
		
		if (message.includes('conexión') || message.includes('relacion')) {
			if (analysisData?.connections && analysisData.connections.length > 0) {
				const connectionsList = analysisData.connections.map(conn => `• ${conn.source} → ${conn.target}`).join('\n')
				return `He encontrado estas conexiones:\n\n${connectionsList}`
			}
			return "No he encontrado conexiones específicas en esta nota."
		}
		
		// Respuesta genérica
		return "Interesante pregunta. ¿Podrías ser más específico? Puedo ayudarte con resúmenes, tareas, conceptos o conexiones de esta nota."
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	const quickSuggestions: QuickSuggestion[] = [
		{
			id: 'analyze',
			text: 'Analizar nota',
			icon: <Sparkles className="h-4 w-4" />,
			action: handleAnalyze
		},
		{
			id: 'summary',
			text: 'Ver resumen',
			icon: <FileText className="h-4 w-4" />,
			action: () => {
				if (analysisData?.summary) {
					addUserMessage("Resume esta nota")
					setTimeout(() => {
						addAIMessage(analysisData.summary || "No hay resumen disponible")
					}, 500)
				} else {
					addUserMessage("Resume esta nota")
					setTimeout(() => {
						addAIMessage("No hay resumen disponible. Primero analiza la nota.")
					}, 500)
				}
			}
		},
		{
			id: 'tasks',
			text: 'Ver tareas',
			icon: <CheckSquare className="h-4 w-4" />,
			action: () => {
				addUserMessage("¿Qué tareas hay en esta nota?")
				setTimeout(() => {
					const response = generateAIResponse("¿Qué tareas hay en esta nota?")
					addAIMessage(response)
				}, 500)
			}
		},
		{
			id: 'concepts',
			text: 'Ver conceptos',
			icon: <Lightbulb className="h-4 w-4" />,
			action: () => {
				addUserMessage("¿Cuáles son los conceptos clave?")
				setTimeout(() => {
					const response = generateAIResponse("¿Cuáles son los conceptos clave?")
					addAIMessage(response)
				}, 500)
			}
		},
		{
			id: 'action-plan',
			text: 'Crear plan',
			icon: <CheckSquare className="h-4 w-4" />,
			action: () => {
				addUserMessage("Crea un plan de acción para esta nota")
				setTimeout(() => {
					addAIMessage("¡Excelente idea! He generado un plan de acción estructurado basado en el contenido de tu nota. Puedes verlo en la sección de abajo.")
				}, 500)
			}
		}
	]

	// const getPriorityColor = (priority: string) => {
	// 	switch (priority) {
	// 		case 'high': return 'bg-red-100 text-red-800'
	// 		case 'medium': return 'bg-yellow-100 text-yellow-800'
	// 		case 'low': return 'bg-green-100 text-green-800'
	// 		default: return 'bg-gray-100 text-gray-800'
	// 	}
	// }

	// const getPriorityLabel = (priority: string) => {
	// 	switch (priority) {
	// 		case 'high': return 'Alta'
	// 		case 'medium': return 'Media'
	// 		case 'low': return 'Baja'
	// 		default: return priority
	// 	}
	// }

	// log.info('AIPanel renderizado:', { isOpen, noteId })
	
	return (
		<>
			{/* Botón flotante trigger */}
			{!isOpen && (
				<button 
					className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-6 rounded-l-full shadow-lg hover:bg-primary/90 transition-colors z-40"
					onClick={() => onClose()}
					title="Asistente de IA"
				>
					<Brain className="h-5 w-5" />
				</button>
			)}
			
			{/* Panel deslizable */}
			<div className={`fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border shadow-xl transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex items-center gap-2">
						<Brain className="h-5 w-5 text-primary" />
						<h2 className="font-semibold text-foreground">Asistente IA</h2>
						{isAnalyzing && (
							<RefreshCw className="h-4 w-4 animate-spin text-primary" />
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
								<p className="text-sm text-muted-foreground">Cargando análisis...</p>
							</div>
						</div>
					) : (
						<>
							{/* Sugerencias rápidas */}
							<div className="p-4 border-b border-border">
								<div className="flex items-center gap-2 mb-3">
									<Zap className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">Acciones rápidas</span>
								</div>
								<div className="space-y-2">
									{/* Primera fila - Acciones principales */}
									<div className="grid grid-cols-2 gap-2">
										<Button
											variant="default"
											size="sm"
											onClick={quickSuggestions[0].action}
											className="h-8 text-xs gap-1"
											disabled={isAnalyzing}
										>
											{quickSuggestions[0].icon}
											{quickSuggestions[0].text}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={quickSuggestions[1].action}
											className="h-8 text-xs gap-1"
											disabled={isAnalyzing}
										>
											{quickSuggestions[1].icon}
											{quickSuggestions[1].text}
										</Button>
									</div>
									{/* Segunda fila - Acciones secundarias */}
									<div className="grid grid-cols-2 gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={quickSuggestions[2].action}
											className="h-8 text-xs gap-1"
											disabled={isAnalyzing}
										>
											{quickSuggestions[2].icon}
											{quickSuggestions[2].text}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={quickSuggestions[3].action}
											className="h-8 text-xs gap-1"
											disabled={isAnalyzing}
										>
											{quickSuggestions[3].icon}
											{quickSuggestions[3].text}
										</Button>
									</div>
									{/* Tercera fila - Plan de acción */}
									<div className="grid grid-cols-1 gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={quickSuggestions[4].action}
											className="h-8 text-xs gap-1"
											disabled={isAnalyzing}
										>
											{quickSuggestions[4].icon}
											{quickSuggestions[4].text}
										</Button>
									</div>
								</div>
							</div>

							{/* Chat Messages */}
							<ScrollArea className="flex-1 p-4">
								<div className="space-y-4">
									{chatMessages.map((message) => (
										<div
											key={message.id}
											className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
										>
											<div
												className={`max-w-[80%] rounded-lg px-3 py-2 ${
													message.type === 'user'
														? 'bg-primary text-primary-foreground'
														: message.type === 'system'
														? 'bg-muted text-muted-foreground text-xs'
														: 'bg-muted/50 text-foreground'
												}`}
											>
												{message.isLoading ? (
													<div className="flex items-center gap-2">
														<div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
														<span className="text-sm">{message.content}</span>
													</div>
												) : (
													<div className="text-sm whitespace-pre-wrap">{message.content}</div>
												)}
												<div className="text-xs opacity-70 mt-1">
													{message.timestamp.toLocaleTimeString()}
												</div>
											</div>
										</div>
									))}
									<div ref={messagesEndRef} />
								</div>
							</ScrollArea>

							{/* Preguntas socráticas */}
							{socraticQuestions.length > 0 && (
								<div className="p-4 border-t border-border">
									<div className="flex items-center gap-2 mb-3">
										<MessageSquare className="h-4 w-4 text-primary" />
										<span className="text-sm font-medium">Preguntas para profundizar</span>
									</div>
									<div className="space-y-2">
										{socraticQuestions.slice(0, 2).map((question, index) => (
											<button
												key={index}
												onClick={() => {
													setInputValue(question)
													inputRef.current?.focus()
												}}
												className="w-full text-left p-2 bg-muted/30 rounded text-xs hover:bg-muted/50 transition-colors"
											>
												{question}
											</button>
										))}
									</div>
								</div>
							)}

							{/* Notas relacionadas */}
							{noteId && noteContent && (
								<div className="p-4 border-t border-border">
									<RelatedNotesPanel 
										noteId={noteId}
										noteContent={noteContent}
										noteTitle={noteTitle}
									/>
								</div>
							)}

							{/* Generador de Plan de Acción */}
							{noteId && noteContent && (
								<div className="p-4 border-t border-border">
									<ActionPlanGenerator 
										noteContent={noteContent}
										noteTitle={noteTitle}
										onPlanCreated={(plan) => {
											addSystemMessage(`Plan de acción "${plan.title}" creado exitosamente`)
										}}
									/>
								</div>
							)}

							{/* Input */}
							<div className="p-4 border-t border-border">
								<div className="flex gap-2">
									<Input
										ref={inputRef}
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Pregúntame sobre esta nota..."
										className="flex-1"
										disabled={isAnalyzing}
									/>
									<Button
										onClick={handleSendMessage}
										size="sm"
										disabled={!inputValue.trim() || isAnalyzing}
									>
										<Send className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
			
			{/* Backdrop */}
			{isOpen && (
				<div 
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
					onClick={onClose}
				/>
			)}
		</>
	)
}