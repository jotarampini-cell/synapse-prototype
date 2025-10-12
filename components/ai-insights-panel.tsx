"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
	Brain, 
	ChevronDown, 
	ChevronRight,
	FileText,
	CheckSquare,
	Lightbulb,
	Link,
	RefreshCw,
	Clock,
	X,
	ArrowRight
} from "lucide-react"
import { analyzeNote } from "@/app/actions/ai-analysis"
import { generateSocraticQuestions } from '@/lib/gemini/client'
import { log } from '@/lib/logger'

interface AIInsightsPanelProps {
	noteId: string | null
	noteContent?: string
	noteTitle?: string
	isOpen: boolean
	onClose: () => void
	onToggleCollapse: () => void
	isCollapsed: boolean
	className?: string
}

interface AnalysisData {
	summary?: string
	tasks?: Array<{ task: string; priority: 'high' | 'medium' | 'low'; dueDate?: string }>
	concepts?: Array<{ concept: string; definition: string; relevance: number }>
	connections?: Array<{ source: string; target: string; type: string; strength: number }>
}

export function AIInsightsPanel({
	noteId,
	isOpen,
	onClose,
	onToggleCollapse,
	isCollapsed,
	className = ""
}: AIInsightsPanelProps) {
	const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))
	const [socraticQuestions, setSocraticQuestions] = useState<string[]>([])
	const [, setIsLoadingQuestions] = useState(false)

	useEffect(() => {
		if (isOpen && noteId && !analysisData) {
			loadExistingAnalysis()
		}
	}, [isOpen, noteId])

	const loadExistingAnalysis = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			const response = await fetch(`/api/ai-analysis/${noteId}`)
			if (response.ok) {
			const data = await response.json()
			if (data.analysis) {
				// Debug: ver qué datos están llegando
				log.info('Datos de análisis recibidos:', {
					summary: data.analysis.summary,
					tasks: data.analysis.extracted_tasks,
					concepts: data.analysis.key_concepts,
					connections: data.analysis.connections
				})
				
				setAnalysisData({
					summary: data.analysis.summary,
					tasks: data.analysis.extracted_tasks,
					concepts: data.analysis.key_concepts,
					connections: data.analysis.connections
				})
				setLastAnalyzed(new Date(data.analysis.updated_at || data.analysis.created_at))
				
				// Cargar preguntas socráticas si hay resumen
				if (data.analysis.summary) {
					loadSocraticQuestions(data.analysis.summary)
				}
			}
			}
		} catch (error) {
			log.error('Error loading existing analysis:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleAnalyze = async () => {
		if (!noteId) return

		setIsAnalyzing(true)
		try {
			const result = await analyzeNote(noteId, 'full')
			if (result.success) {
				setAnalysisData(result.data)
				setLastAnalyzed(new Date())
				
				// Cargar preguntas socráticas después del análisis
				if (result.data?.summary) {
					loadSocraticQuestions(result.data.summary)
				}
			}
		} catch (error) {
			log.error('Error analyzing note:', error)
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
			log.error("Error loading socratic questions:", error)
		} finally {
			setIsLoadingQuestions(false)
		}
	}

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections)
		if (newExpanded.has(section)) {
			newExpanded.delete(section)
		} else {
			newExpanded.add(section)
		}
		setExpandedSections(newExpanded)
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800 border-red-200'
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
			case 'low': return 'bg-green-100 text-green-800 border-green-200'
			default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

	const formatTimeAgo = (date: Date) => {
		const now = new Date()
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
		
		if (diffInMinutes < 1) return 'Ahora'
		if (diffInMinutes < 60) return `${diffInMinutes}m`
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
		return `${Math.floor(diffInMinutes / 1440)}d`
	}

	return (
		<div className={`fixed right-0 top-0 h-full bg-card border-l border-border shadow-xl transition-all duration-300 z-50 ${
			isOpen ? (isCollapsed ? 'w-12' : 'w-80') : 'w-0 translate-x-full'
		} ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-border">
				{!isCollapsed && (
					<div className="flex items-center gap-2">
						<Brain className="h-5 w-5 text-primary" />
						<h2 className="font-semibold text-sm">Insights IA</h2>
						{isAnalyzing && (
							<RefreshCw className="h-4 w-4 animate-spin text-primary" />
						)}
					</div>
				)}
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={onToggleCollapse}
						className="h-6 w-6 p-0"
					>
						{isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-6 w-6 p-0"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{!isCollapsed && (
				<ScrollArea className="h-[calc(100vh-60px)]">
					<div className="p-3 space-y-3">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-center">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
									<p className="text-xs text-muted-foreground">Cargando análisis...</p>
								</div>
							</div>
						) : !analysisData ? (
							<div className="text-center py-8">
								<Brain className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
								<p className="text-sm text-muted-foreground mb-3">No hay análisis disponible</p>
								<Button
									onClick={handleAnalyze}
									disabled={isAnalyzing}
									size="sm"
									className="w-full"
								>
									{isAnalyzing ? (
										<>
											<RefreshCw className="h-3 w-3 mr-2 animate-spin" />
											Analizando...
										</>
									) : (
										<>
											<Brain className="h-3 w-3 mr-2" />
											Analizar nota
										</>
									)}
								</Button>
							</div>
						) : (
							<>
								{/* Resumen ejecutivo */}
								{analysisData.summary && (
									<Collapsible 
										open={expandedSections.has('summary')} 
										onOpenChange={() => toggleSection('summary')}
									>
										<CollapsibleTrigger asChild>
											<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
												<CardHeader className="pb-2">
													<CardTitle className="text-sm flex items-center justify-between">
														<div className="flex items-center gap-2">
															<FileText className="h-4 w-4" />
															Resumen
														</div>
														{expandedSections.has('summary') ? 
															<ChevronDown className="h-3 w-3" /> : 
															<ChevronRight className="h-3 w-3" />
														}
													</CardTitle>
												</CardHeader>
											</Card>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<Card className="mt-1">
												<CardContent className="pt-3">
													<p className="text-xs text-muted-foreground leading-relaxed">
														{analysisData.summary}
													</p>
												</CardContent>
											</Card>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Tareas */}
								{analysisData.tasks && analysisData.tasks.length > 0 && (
									<Collapsible 
										open={expandedSections.has('tasks')} 
										onOpenChange={() => toggleSection('tasks')}
									>
										<CollapsibleTrigger asChild>
											<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
												<CardHeader className="pb-2">
													<CardTitle className="text-sm flex items-center justify-between">
														<div className="flex items-center gap-2">
															<CheckSquare className="h-4 w-4" />
															Tareas ({analysisData.tasks.length})
														</div>
														{expandedSections.has('tasks') ? 
															<ChevronDown className="h-3 w-3" /> : 
															<ChevronRight className="h-3 w-3" />
														}
													</CardTitle>
												</CardHeader>
											</Card>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<Card className="mt-1">
												<CardContent className="pt-3">
													<div className="space-y-2">
														{analysisData.tasks.map((task, index) => {
															// Manejar tanto strings como objetos
															const taskText = typeof task === 'string' ? task : task.task || task
															const taskPriority = typeof task === 'object' ? task.priority : 'medium'
															
															return (
																<div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
																	<input 
																		type="checkbox" 
																		className="mt-0.5" 
																		disabled 
																	/>
																	<div className="flex-1">
																		<p className="font-medium">{taskText}</p>
																		<Badge 
																			variant="outline" 
																			className={`text-xs ${getPriorityColor(taskPriority)}`}
																		>
																			{getPriorityLabel(taskPriority)}
																		</Badge>
																	</div>
																</div>
															)
														})}
													</div>
												</CardContent>
											</Card>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Conceptos */}
								{analysisData.concepts && analysisData.concepts.length > 0 && (
									<Collapsible 
										open={expandedSections.has('concepts')} 
										onOpenChange={() => toggleSection('concepts')}
									>
										<CollapsibleTrigger asChild>
											<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
												<CardHeader className="pb-2">
													<CardTitle className="text-sm flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Lightbulb className="h-4 w-4" />
															Conceptos ({analysisData.concepts.length})
														</div>
														{expandedSections.has('concepts') ? 
															<ChevronDown className="h-3 w-3" /> : 
															<ChevronRight className="h-3 w-3" />
														}
													</CardTitle>
												</CardHeader>
											</Card>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<Card className="mt-1">
												<CardContent className="pt-3">
													<div className="flex flex-wrap gap-1">
														{analysisData.concepts.map((concept, index) => {
															// Manejar tanto strings como objetos
															const conceptText = typeof concept === 'string' ? concept : concept.concept || concept
															const conceptDefinition = typeof concept === 'object' ? concept.definition : null
															
															return (
																<Badge 
																	key={index} 
																	variant="secondary" 
																	className="text-xs cursor-pointer hover:bg-primary/20"
																	title={conceptDefinition || conceptText}
																>
																	{conceptText}
																</Badge>
															)
														})}
													</div>
												</CardContent>
											</Card>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Conexiones */}
								{analysisData.connections && analysisData.connections.length > 0 && (
									<Collapsible 
										open={expandedSections.has('connections')} 
										onOpenChange={() => toggleSection('connections')}
									>
										<CollapsibleTrigger asChild>
											<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
												<CardHeader className="pb-2">
													<CardTitle className="text-sm flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Link className="h-4 w-4" />
															Conexiones ({analysisData.connections.length})
														</div>
														{expandedSections.has('connections') ? 
															<ChevronDown className="h-3 w-3" /> : 
															<ChevronRight className="h-3 w-3" />
														}
													</CardTitle>
												</CardHeader>
											</Card>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<Card className="mt-1">
												<CardContent className="pt-3">
													<div className="space-y-2">
														{analysisData.connections.map((connection, index) => {
															// Manejar tanto strings como objetos
															// const connectionText = typeof connection === 'string' ? connection : connection
															const source = typeof connection === 'object' ? connection.source : 'Origen'
															const target = typeof connection === 'object' ? connection.target : 'Destino'
															const type = typeof connection === 'object' ? connection.type : 'Relación'
															
															return (
																<div key={index} className="p-2 bg-muted/30 rounded text-xs">
																	<div className="flex items-center gap-2 mb-1">
																		<span className="font-medium">{source}</span>
																		<ArrowRight className="h-3 w-3" />
																		<span className="font-medium">{target}</span>
																	</div>
																	<Badge variant="outline" className="text-xs">
																		{type}
																	</Badge>
																</div>
															)
														})}
													</div>
												</CardContent>
											</Card>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Preguntas Socráticas */}
								{socraticQuestions.length > 0 && (
									<Collapsible 
										open={expandedSections.has('questions')} 
										onOpenChange={() => toggleSection('questions')}
									>
										<CollapsibleTrigger asChild>
											<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
												<CardHeader className="pb-2">
													<CardTitle className="text-sm flex items-center justify-between">
														<div className="flex items-center gap-2">
															<Lightbulb className="h-4 w-4" />
															Preguntas para profundizar ({socraticQuestions.length})
														</div>
														{expandedSections.has('questions') ? 
															<ChevronDown className="h-3 w-3" /> : 
															<ChevronRight className="h-3 w-3" />
														}
													</CardTitle>
												</CardHeader>
											</Card>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<Card className="mt-1">
												<CardContent className="pt-3">
													<div className="space-y-2">
														{socraticQuestions.map((question, index) => (
															<div key={index} className="p-2 bg-muted/30 rounded text-xs hover:bg-muted/50 transition-colors cursor-pointer">
																{question}
															</div>
														))}
													</div>
												</CardContent>
											</Card>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Footer */}
								<div className="pt-3 border-t border-border">
									<div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
										<div className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{lastAnalyzed ? `Analizado ${formatTimeAgo(lastAnalyzed)}` : 'Sin analizar'}
										</div>
									</div>
									<Button
										onClick={handleAnalyze}
										disabled={isAnalyzing}
										size="sm"
										variant="outline"
										className="w-full text-xs"
									>
										{isAnalyzing ? (
											<>
												<RefreshCw className="h-3 w-3 mr-2 animate-spin" />
												Re-analizando...
											</>
										) : (
											<>
												<RefreshCw className="h-3 w-3 mr-2" />
												Re-analizar
											</>
										)}
									</Button>
								</div>
							</>
						)}
					</div>
				</ScrollArea>
			)}
		</div>
	)
}
