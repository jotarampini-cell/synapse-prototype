'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
	Link, 
	Brain, 
	FileText, 
	Tag, 
	Calendar, 
	TrendingUp,
	Lightbulb,
	ArrowRight,
	RefreshCw,
	Eye,
	EyeOff
} from 'lucide-react'
import { getRelatedNotes } from '@/app/actions/ai-analysis'

interface Note {
	id: string
	title: string
	content: string
	created_at: string
	updated_at: string
	folders?: {
		name: string
		color: string
	}
	tags: string[]
	word_count: number
}

interface Connection {
	note: Note
	similarity: number
	sharedConcepts: string[]
	connectionType: 'semantic' | 'temporal' | 'conceptual'
}

interface ConnectionsPanelProps {
	noteId: string | null
	onNoteSelect?: (noteId: string) => void
	className?: string
}

export function ConnectionsPanel({ noteId, onNoteSelect, className = '' }: ConnectionsPanelProps) {
	const [connections, setConnections] = useState<Connection[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showMiniGraph, setShowMiniGraph] = useState(false)
	const [insights, setInsights] = useState<{
		totalConnections: number
		strongestConnection: Connection | null
		recentConnections: Connection[]
		conceptTrends: string[]
	} | null>(null)

	useEffect(() => {
		if (noteId) {
			loadConnections()
		} else {
			setConnections([])
			setInsights(null)
		}
	}, [noteId])

	const loadConnections = async () => {
		if (!noteId) return

		try {
			setIsLoading(true)
			const relatedNotes = await getRelatedNotes(noteId)
			
			// Simular conexiones con diferentes tipos y similitudes
			const mockConnections: Connection[] = relatedNotes.slice(0, 5).map((note, index) => ({
				note,
				similarity: Math.random() * 0.4 + 0.6, // 60-100% similitud
				sharedConcepts: [
					'IA', 'Machine Learning', 'Datos', 'Análisis', 'Tecnología'
				].slice(0, Math.floor(Math.random() * 3) + 1),
				connectionType: ['semantic', 'temporal', 'conceptual'][index % 3] as 'semantic' | 'temporal' | 'conceptual'
			}))

			setConnections(mockConnections)

			// Generar insights
			const strongestConnection = mockConnections.reduce((prev, current) => 
				prev.similarity > current.similarity ? prev : current
			)

			setInsights({
				totalConnections: mockConnections.length,
				strongestConnection,
				recentConnections: mockConnections.slice(0, 3),
				conceptTrends: ['IA', 'Machine Learning', 'Datos', 'Análisis']
			})

		} catch (error) {
			console.error('Error loading connections:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const getConnectionTypeIcon = (type: string) => {
		switch (type) {
			case 'semantic':
				return <Brain className="h-3 w-3" />
			case 'temporal':
				return <Calendar className="h-3 w-3" />
			case 'conceptual':
				return <Lightbulb className="h-3 w-3" />
			default:
				return <Link className="h-3 w-3" />
		}
	}

	const getConnectionTypeLabel = (type: string) => {
		switch (type) {
			case 'semantic':
				return 'Semántica'
			case 'temporal':
				return 'Temporal'
			case 'conceptual':
				return 'Conceptual'
			default:
				return 'Relacionada'
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			month: 'short',
			day: 'numeric'
		})
	}

	if (!noteId) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Link className="h-5 w-5" />
						Conexiones
					</CardTitle>
					<CardDescription>
						Selecciona una nota para ver sus conexiones
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Header */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Link className="h-5 w-5" />
							Conexiones Inteligentes
						</CardTitle>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowMiniGraph(!showMiniGraph)}
								className="h-8 w-8 p-0"
							>
								{showMiniGraph ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={loadConnections}
								disabled={isLoading}
								className="h-8 w-8 p-0"
							>
								<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
							</Button>
						</div>
					</div>
					<CardDescription>
						Notas relacionadas por similitud semántica y conceptos compartidos
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Insights */}
			{insights && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<TrendingUp className="h-4 w-4" />
							Insights
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">{insights.totalConnections}</div>
								<div className="text-xs text-muted-foreground">Conexiones</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{insights.strongestConnection ? Math.round(insights.strongestConnection.similarity * 100) : 0}%
								</div>
								<div className="text-xs text-muted-foreground">Similitud</div>
							</div>
						</div>
						
						{insights.conceptTrends.length > 0 && (
							<div>
								<div className="text-xs font-medium text-muted-foreground mb-2">Conceptos emergentes</div>
								<div className="flex flex-wrap gap-1">
									{insights.conceptTrends.slice(0, 4).map((concept, index) => (
										<Badge key={index} variant="secondary" className="text-xs">
											{concept}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Mini Knowledge Graph */}
			{showMiniGraph && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Grafo de Conocimiento</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
							<div className="text-center text-muted-foreground">
								<Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<div className="text-sm">Visualización interactiva</div>
								<div className="text-xs">Próximamente</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Connections List */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Notas Relacionadas</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="animate-pulse">
									<div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
									<div className="h-3 bg-muted rounded w-1/2"></div>
								</div>
							))}
						</div>
					) : connections.length > 0 ? (
						<div className="space-y-3">
							{connections.map((connection, index) => (
								<div key={connection.note.id}>
									<div 
										className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
										onClick={() => onNoteSelect?.(connection.note.id)}
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1 min-w-0">
												<h4 className="font-medium text-sm truncate">
													{connection.note.title}
												</h4>
												<div className="flex items-center gap-2 mt-1">
													<Badge variant="outline" className="text-xs">
														{getConnectionTypeIcon(connection.connectionType)}
														<span className="ml-1">{getConnectionTypeLabel(connection.connectionType)}</span>
													</Badge>
													<span className="text-xs text-muted-foreground">
														{Math.round(connection.similarity * 100)}% similitud
													</span>
												</div>
											</div>
											<ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
										</div>
										
										{connection.sharedConcepts.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-2">
												{connection.sharedConcepts.map((concept, conceptIndex) => (
													<Badge key={conceptIndex} variant="secondary" className="text-xs">
														{concept}
													</Badge>
												))}
											</div>
										)}
										
										<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
											<span>{connection.note.word_count} palabras</span>
											<span>•</span>
											<span>{formatDate(connection.note.updated_at)}</span>
											{connection.note.folders && (
												<>
													<span>•</span>
													<div className="flex items-center gap-1">
														<div 
															className="w-2 h-2 rounded-full"
															style={{ backgroundColor: connection.note.folders.color }}
														/>
														<span>{connection.note.folders.name}</span>
													</div>
												</>
											)}
										</div>
									</div>
									{index < connections.length - 1 && <Separator className="mt-3" />}
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground">
							<FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<div className="text-sm">No se encontraron conexiones</div>
							<div className="text-xs">Escribe más contenido para descubrir relaciones</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}





