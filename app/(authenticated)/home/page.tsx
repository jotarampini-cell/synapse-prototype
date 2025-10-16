"use client"

import { useState, useEffect, useRef } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileModal, useMobileModal } from "@/components/mobile-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleBlockEditor } from "@/components/block-editor/simple-block-editor"
import ContentEditable from "react-contenteditable"
import "./note-editor.css"
import { createBasicTextContent } from "@/app/actions/content"
import { getRecentActivity } from "@/app/actions/activity"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SearchInput } from "@/components/search/search-input"
import { FileUpload } from "@/components/file-upload/file-upload"
import { VoiceRecorder } from "@/components/voice-recorder/voice-recorder"
import { WelcomeBanner } from "@/components/responsive-banner"
import { AppFooter } from "@/components/app-footer"
import { usePersistedState } from "@/hooks/use-persisted-state"
import { TestContext } from "../../../test-context-simple"
import { 
	Search,
	Plus,
	Clock,
	FileText,
	CheckSquare,
	Link,
	Briefcase,
	TrendingUp,
	Bell
} from "lucide-react"

// Mock data
const recentNotes = [
	{ id: "1", title: "Ideas para el proyecto", updated: "2h", type: "idea" },
	{ id: "2", title: "Reunión con el equipo", updated: "4h", type: "meeting" },
	{ id: "3", title: "Lista de tareas pendientes", updated: "1d", type: "task" }
]

const quickActions = [
	{ icon: FileText, label: "Nueva Nota", color: "bg-blue-500" },
	{ icon: CheckSquare, label: "Nueva Tarea", color: "bg-green-500" },
	{ icon: Link, label: "Nueva Fuente", color: "bg-purple-500" },
	{ icon: Briefcase, label: "Nuevo Proyecto", color: "bg-orange-500" }
]

const stats = [
	{ label: "Notas", value: "24", icon: FileText, change: "+3" },
	{ label: "Tareas", value: "8", icon: CheckSquare, change: "+1" },
	{ label: "Proyectos", value: "3", icon: Briefcase, change: "0" },
	{ label: "Fuentes", value: "12", icon: Link, change: "+2" }
]

export default function HomePage() {
	const { isMobile } = useMobileDetection()
	const quickNoteModal = useMobileModal()
	const templatesModal = useMobileModal()

	// Estado persistido
	const [pageState, setPageState] = usePersistedState('home', {
		scrollPosition: 0,
		searchQuery: '',
		selectedCategory: undefined as string | undefined
	})

	// Estados para la nota rápida
	const [noteTitle, setNoteTitle] = useState("")
	const [noteContent, setNoteContent] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [attachedFiles, setAttachedFiles] = useState<any[]>([])
	
	// Estados para editor unificado
	const [unifiedContent, setUnifiedContent] = useState("")
	const unifiedEditorRef = useRef<HTMLElement>(null)

	// Estados para actividad reciente
	const [recentActivities, setRecentActivities] = useState([])
	const [isLoadingRecent, setIsLoadingRecent] = useState(true)

	// Cargar actividad reciente
	useEffect(() => {
		async function loadRecentActivity() {
			try {
				const result = await getRecentActivity()
				if (result.success && result.activities) {
					setRecentActivities(result.activities)
				}
			} catch (error) {
				console.error('Error loading recent activity:', error)
			} finally {
				setIsLoadingRecent(false)
			}
		}
		loadRecentActivity()
	}, [])

	// Función para manejar contenido unificado
	const handleUnifiedContentChange = (evt: any) => {
		const content = evt.target.value
		setUnifiedContent(content)
		
		// Extraer título (primera línea) y contenido (resto)
		const lines = content.split('\n')
		const title = lines[0] || ''
		const restContent = lines.slice(1).join('\n').trim()
		
		setNoteTitle(title)
		setNoteContent(restContent)
	}

	// Función para guardar nota
	const handleSaveNote = async () => {
		if (!noteTitle.trim()) return
		
		setIsSaving(true)
		try {
			const formData = new FormData()
			formData.append('title', noteTitle.trim())
			
			// Manejar el contenido correctamente
			let contentToSave = ""
			if (typeof noteContent === 'string') {
				contentToSave = noteContent
			} else if (noteContent && typeof noteContent === 'object') {
				// Si es un objeto con blocks, extraer el texto
				if (noteContent.blocks && Array.isArray(noteContent.blocks)) {
					contentToSave = noteContent.blocks
						.map((block: any) => {
							if (block.type === 'paragraph' && block.data?.text) {
								return block.data.text
							}
							return ''
						})
						.filter(Boolean)
						.join('\n\n')
				} else {
					contentToSave = JSON.stringify(noteContent)
				}
			}
			
			formData.append('content', contentToSave || '')
			
			await createBasicTextContent(formData)
			
			// Limpiar y cerrar
			setNoteTitle("")
			setNoteContent("")
			quickNoteModal.closeModal()
			
			// Recargar actividad reciente
			const result = await getRecentActivity()
			if (result.success && result.activities) {
				setRecentActivities(result.activities)
			}
		} catch (error) {
			console.error('Error saving note:', error)
			alert('Error al guardar la nota. Por favor, inténtalo de nuevo.')
		} finally {
			setIsSaving(false)
		}
	}

	// Función para formatear timestamp
	function formatTimestamp(timestamp: string) {
		const date = new Date(timestamp)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMins / 60)
		const diffDays = Math.floor(diffHours / 24)
		
		if (diffMins < 1) return 'Ahora'
		if (diffMins < 60) return `Hace ${diffMins}m`
		if (diffHours < 24) return `Hace ${diffHours}h`
		if (diffDays < 7) return `Hace ${diffDays}d`
		return date.toLocaleDateString()
	}

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
				{/* Header simplificado */}
				<header className="h-16 px-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl safe-area-top">
					<div>
						<h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
							Inicio
						</h1>
						<p className="text-xs text-muted-foreground">
							{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
						</p>
					</div>
					<Button 
						variant="ghost" 
						size="icon"
						className="touch-target active:scale-95 transition-transform"
					>
						<Bell className="h-5 w-5" />
					</Button>
				</header>

				{/* Contenido principal con scroll unificado */}
				<main className="flex-1 overflow-y-auto pb-20 safe-area-left safe-area-right">
					{/* Banner integrado */}
					<div className="p-4">
						<WelcomeBanner />
					</div>

					{/* Test de Contexto - Temporal */}
					<div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mx-4 mb-4">
						<TestContext />
					</div>

					<div className="px-4 space-y-6">
						{/* Búsqueda rápida con sugerencias */}
						<SearchInput 
							placeholder="Buscar o crear algo nuevo..." 
							onSearch={(query) => {
								console.log('Búsqueda global:', query)
								// Aquí implementarías la búsqueda global
							}}
						/>

						{/* Quick Actions Grid Moderno */}
						<div>
							<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
								Crear nuevo
							</h2>
							<div className="grid grid-cols-2 gap-3">
								{/* Nueva Nota */}
								<button
									onClick={() => quickNoteModal.openModal()}
									className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 text-left transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-500/20"
								>
									<div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
									<div className="relative">
										<div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
											<FileText className="h-5 w-5 text-blue-600" />
										</div>
										<div className="font-semibold text-sm mb-1">Nueva Nota</div>
										<div className="text-xs text-muted-foreground">Captura tus ideas</div>
									</div>
								</button>

								{/* Nueva Tarea */}
								<button
									onClick={() => window.location.href = '/tareas?create=true'}
									className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 text-left transition-all active:scale-95 hover:shadow-lg hover:shadow-green-500/20"
								>
									<div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
									<div className="relative">
										<div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
											<CheckSquare className="h-5 w-5 text-green-600" />
										</div>
										<div className="font-semibold text-sm mb-1">Nueva Tarea</div>
										<div className="text-xs text-muted-foreground">Organiza tu día</div>
									</div>
								</button>

								{/* Nueva Fuente - Preparada para futuro */}
								<button
									onClick={() => console.log('Fuentes - próximamente')}
									className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 text-left transition-all active:scale-95 opacity-60"
								>
									<div className="relative">
										<div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
											<Link className="h-5 w-5 text-purple-600" />
										</div>
										<div className="font-semibold text-sm mb-1">Nueva Fuente</div>
										<div className="text-xs text-muted-foreground">Próximamente</div>
									</div>
								</button>

								{/* Nuevo Proyecto - Preparado para futuro */}
								<button
									onClick={() => console.log('Proyectos - próximamente')}
									className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 text-left transition-all active:scale-95 opacity-60"
								>
									<div className="relative">
										<div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3">
											<Briefcase className="h-5 w-5 text-orange-600" />
										</div>
										<div className="font-semibold text-sm mb-1">Nuevo Proyecto</div>
										<div className="text-xs text-muted-foreground">Próximamente</div>
									</div>
								</button>
							</div>
						</div>

						{/* Actividad Reciente con datos reales */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									Actividad Reciente
								</h2>
								<Button variant="ghost" size="sm" className="h-8 text-xs">
									Ver todo
								</Button>
							</div>
							
							{isLoadingRecent ? (
								<div className="space-y-2">
									{[1, 2, 3].map((i) => (
										<div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
									))}
								</div>
							) : recentActivities.length === 0 ? (
								<div className="text-center py-8 px-4 bg-card/30 rounded-2xl border border-dashed border-border">
									<Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
									<p className="text-sm text-muted-foreground">Aún no tienes actividad</p>
									<p className="text-xs text-muted-foreground/70 mt-1">Crea tu primera nota o tarea</p>
								</div>
							) : (
								<div className="space-y-2">
									{recentActivities.map((activity) => (
										<button
											key={activity.id}
											onClick={() => {
												if (activity.type === 'task') {
													window.location.href = '/tareas'
												} else {
													window.location.href = `/notes?note=${activity.id}`
												}
											}}
											className="w-full group bg-card/50 backdrop-blur-sm rounded-xl p-3 text-left transition-all active:scale-98 hover:bg-card hover:shadow-md border border-border/50"
										>
											<div className="flex items-start gap-3">
												<div className={cn(
													"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
													activity.type === 'task' && "bg-green-500/20",
													activity.type === 'note' && "bg-blue-500/20"
												)}>
													{activity.type === 'task' ? (
														<CheckSquare className="h-5 w-5 text-green-600" />
													) : (
														<FileText className="h-5 w-5 text-blue-600" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
														{activity.title}
													</h3>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<span className="capitalize">{activity.action}</span>
														<span>•</span>
														<span>{formatTimestamp(activity.timestamp)}</span>
													</div>
												</div>
												<Badge 
													variant="secondary" 
													className="text-xs flex-shrink-0"
												>
													{activity.type}
												</Badge>
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Espaciador para el bottom nav */}
						<div className="h-4" />
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB con animación */}
				<Button
					onClick={templatesModal.openModal}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-40 touch-target hover:scale-110 active:scale-95 transition-transform"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Modals */}
				{/* Modal de Nota Rápida con BlockEditor */}
				<MobileModal
					isOpen={quickNoteModal.isOpen}
					onClose={() => {
						quickNoteModal.closeModal()
						setNoteTitle("")
						setNoteContent("")
						setAttachedFiles([])
						setUnifiedContent("")
					}}
					title="Nueva Nota"
					headerActions={
						<Button 
							onClick={handleSaveNote}
							disabled={isSaving || !noteTitle.trim()}
						>
							{isSaving ? "Guardando..." : "Guardar"}
						</Button>
					}
				>
					<div className="p-4">
						{/* Editor unificado */}
						<div className="min-h-[400px]">
							<ContentEditable
								innerRef={unifiedEditorRef as any}
								html={unifiedContent}
								onChange={handleUnifiedContentChange}
								className="unified-note-input"
								data-placeholder="Título de la nota..."
							/>
						</div>
					</div>
				</MobileModal>

				{/* Modal de Templates */}
				<MobileModal
					isOpen={templatesModal.isOpen}
					onClose={templatesModal.closeModal}
					title="Crear Nuevo"
				>
					<div className="p-4 space-y-2">
						<Button 
							variant="outline" 
							className="w-full h-16 justify-start gap-3 touch-target hover:bg-accent active:scale-98 transition-all"
							onClick={() => {
								quickNoteModal.openModal()
								templatesModal.closeModal()
							}}
						>
							<div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
								<FileText className="h-5 w-5 text-blue-600" />
							</div>
							<div className="text-left">
								<div className="font-medium">Nueva Nota</div>
								<div className="text-sm text-muted-foreground">Captura tus ideas rápidamente</div>
							</div>
						</Button>
						
						<Button 
							variant="outline" 
							className="w-full h-16 justify-start gap-3 touch-target hover:bg-accent active:scale-98 transition-all"
							onClick={() => {
								window.location.href = '/tareas?create=true'
								templatesModal.closeModal()
							}}
						>
							<div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
								<CheckSquare className="h-5 w-5 text-green-600" />
							</div>
							<div className="text-left">
								<div className="font-medium">Nueva Tarea</div>
								<div className="text-sm text-muted-foreground">Organiza tu trabajo</div>
							</div>
						</Button>
					</div>
				</MobileModal>

				{/* Footer */}
				<AppFooter />
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center border-b border-border">
				<h1 className="text-2xl font-bold">Home</h1>
				<div className="ml-auto flex gap-2">
					<Button variant="outline" size="sm">
						<Bell className="h-4 w-4 mr-2" />
						Notificaciones
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-6xl mx-auto">
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<FileText className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">24</p>
									<p className="text-sm text-muted-foreground">Notas</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">8</p>
									<p className="text-sm text-muted-foreground">Tareas</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-purple-100 rounded-lg">
									<Link className="h-6 w-6 text-purple-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">12</p>
									<p className="text-sm text-muted-foreground">Fuentes</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-orange-100 rounded-lg">
									<Briefcase className="h-6 w-6 text-orange-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">3</p>
									<p className="text-sm text-muted-foreground">Proyectos</p>
								</div>
							</div>
						</Card>
					</div>
					
					<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Elementos Recientes</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<FileText className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Nota de reunión</p>
										<p className="text-sm text-muted-foreground">Hace 2 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<CheckSquare className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Revisar propuesta</p>
										<p className="text-sm text-muted-foreground">Hace 4 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<Link className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Artículo sobre IA</p>
										<p className="text-sm text-muted-foreground">Ayer</p>
									</div>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<p className="text-sm">Nueva nota creada</p>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<p className="text-sm">Tarea completada</p>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
									<p className="text-sm">Fuente agregada</p>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}