'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
	Brain, 
	Network, 
	TrendingUp, 
	HelpCircle,
	Sparkles,
	RefreshCw
} from 'lucide-react'
import { AIPanel } from './ai-panel'
import { ConnectionsPanel } from './connections-panel'

interface Note {
	id: string
	title: string
	content: string
	content_type: string
	tags?: string[]
	created_at: string
	updated_at: string
}

interface KnowledgePanelProps {
	note: Note | null
	onCreateNote?: (title: string, content: string) => void
	onNoteSelect?: (noteId: string) => void
	className?: string
}

type TabType = 'analysis' | 'connections' | 'insights' | 'questions'

export function KnowledgePanel({ note, onCreateNote, onNoteSelect, className = '' }: KnowledgePanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>('analysis')
	const [isRefreshing, setIsRefreshing] = useState(false)

	const tabs = [
		{
			id: 'analysis' as const,
			label: 'Análisis',
			icon: Brain,
			description: 'Resumen, mapa mental y tareas'
		},
		{
			id: 'connections' as const,
			label: 'Conexiones',
			icon: Network,
			description: 'Notas relacionadas y conceptos'
		},
		{
			id: 'insights' as const,
			label: 'Insights',
			icon: TrendingUp,
			description: 'Patrones y tendencias'
		},
		{
			id: 'questions' as const,
			label: 'Preguntas',
			icon: HelpCircle,
			description: 'IA hace preguntas para profundizar'
		}
	]

	const handleRefresh = async () => {
		setIsRefreshing(true)
		// Simular refresh
		setTimeout(() => {
			setIsRefreshing(false)
		}, 1000)
	}

	const renderTabContent = () => {
		switch (activeTab) {
			case 'analysis':
				return (
					<AIPanel 
						note={note} 
						onCreateNote={onCreateNote}
					/>
				)
			case 'connections':
				return (
					<ConnectionsPanel 
						noteId={note?.id || null}
						onNoteSelect={onNoteSelect}
					/>
				)
			case 'insights':
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								Insights y Patrones
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8 text-muted-foreground">
								<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<h3 className="text-lg font-semibold mb-2">Insights en desarrollo</h3>
								<p className="text-sm">
									Próximamente: análisis de patrones, tendencias de escritura, 
									gaps de conocimiento y recomendaciones personalizadas.
								</p>
							</div>
						</CardContent>
					</Card>
				)
			case 'questions':
				return (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<HelpCircle className="h-5 w-5" />
								Preguntas de IA
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8 text-muted-foreground">
								<HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<h3 className="text-lg font-semibold mb-2">Preguntas inteligentes</h3>
								<p className="text-sm">
									Próximamente: la IA hará preguntas sobre tu contenido 
									para ayudarte a profundizar y expandir tus ideas.
								</p>
							</div>
						</CardContent>
					</Card>
				)
			default:
				return null
		}
	}

	if (!note) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="h-5 w-5" />
						Panel de Conocimiento
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<h3 className="text-lg font-semibold mb-2">Selecciona una nota</h3>
						<p className="text-sm">
							Elige una nota para ver su análisis, conexiones y insights
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Header compacto */}
			<div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
				<div className="flex items-center gap-2">
					<Brain className="h-4 w-4 text-primary" />
					<span className="font-medium text-sm">Panel de Conocimiento</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="h-6 w-6 p-0"
				>
					<RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
				</Button>
			</div>

			{/* Tabs compactos */}
			<div className="flex bg-muted/20 rounded-lg p-1">
				{tabs.map((tab) => {
					const Icon = tab.icon
					const isActive = activeTab === tab.id
					
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
								isActive
									? 'bg-background text-primary shadow-sm'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
							}`}
						>
							<Icon className="h-3 w-3" />
							<span className="font-medium">{tab.label}</span>
						</button>
					)
				})}
			</div>

			{/* Tab Content compacto */}
			<div className="min-h-[300px]">
				{renderTabContent()}
			</div>
		</div>
	)
}

