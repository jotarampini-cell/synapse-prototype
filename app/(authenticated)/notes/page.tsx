"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useAppKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav, MobileBottomNavSpacer } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
	Search, 
	Plus, 
	Grid3X3, 
	List, 
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Menu,
	X,
	Archive,
	Star,
	Clock,
	FolderOpen,
	Brain,
	FolderPlus
} from "lucide-react"
import { 
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { FolderTree } from "@/components/folder-tree"
import { NotesList } from "@/components/notes-list"
import { NoteEditor } from "@/components/note-editor"
import { AIPanel } from "@/components/ai-panel"
import { AIHeaderStatus } from "@/components/ai-status-indicator"
import { OnboardingTutorial, useOnboarding } from "@/components/onboarding-tutorial"
import { ContentCaptureFAB } from "@/components/content-capture-fab"
import { CommandPalette } from "@/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { log } from "@/lib/logger"
import { createContent } from "@/app/actions/content"
import { createFolder, createDefaultFolders, getFolderTree } from "@/app/actions/folders"
import { toast } from "sonner"
import { useNavigation } from "@/contexts/navigation-context"
// Nuevos componentes para UI móvil
import { FoldersGalleryView } from "@/components/notes/folders-gallery-view"
import { NotesGalleryView } from "@/components/notes/notes-gallery-view"
import { SmartSearchBar } from "@/components/notes/smart-search-bar"
import { NotesFabMenu } from "@/components/notes/notes-fab-menu"
import { CreateFolderModal } from "@/components/notes/create-folder-modal"
import { QuickNoteModal } from "@/components/notes/quick-note-modal"

// interface Note {
// 	id: string
// 	title: string
// 	content: string
// 	content_type: string
// 	tags: string[]
// 	created_at: string
// 	updated_at: string
// 	folder_id: string | null
// 	is_pinned: boolean
// 	is_archived: boolean
// 	word_count: number
// 	reading_time: number
// 	folders?: {
// 		name: string
// 		color: string
// 	}
// }

// interface Folder {
// 	id: string
// 	name: string
// 	color: string
// 	parent_id: string | null
// 	children?: Folder[]
// }

export default function NotesPage() {
	const { user, loading } = useAuth()
	const searchParams = useSearchParams()
	const { setNavigationProps } = useNavigation()
	
	// State
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
	const [selectedNote, setSelectedNote] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
	const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at')
	// const [sortOrder] = useState<'asc' | 'desc'>('desc')
	const [filterBy, setFilterBy] = useState<'all' | 'pinned' | 'archived'>('all')
	
	// Refs
	const mainScrollRef = useRef<HTMLDivElement>(null)
	
	const [showDefaultFoldersPrompt, setShowDefaultFoldersPrompt] = useState(false)
	
	// Layout state
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [aiPanelOpen, setAiPanelOpen] = useState(false)
	const [filesSectionCollapsed, setFilesSectionCollapsed] = useState(false)
	const [isFocusMode, setIsFocusMode] = useState(false)
	
	// Mobile navigation state
	const [currentView, setCurrentView] = useState<'folders' | 'notes' | 'editor'>('folders')
	const [selectedFolderName, setSelectedFolderName] = useState<string>('')
	
	// Modal states
	const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
	const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false)
	
	// Mobile detection usando hook personalizado
	const { isMobile, isLoading: isMobileLoading } = useMobileDetection()
	
	
	// Debug: Log mobile detection
	useEffect(() => {
		console.log('Notes page - isMobile:', isMobile)
	}, [isMobile])
	
	// Actualizar props de navegación según currentView
	useEffect(() => {
		if (isMobile) {
			if (currentView === 'notes') {
				setNavigationProps({
					showBackButton: true,
					backButtonText: selectedFolderName || 'Carpeta',
					onBackClick: () => {
						setCurrentView('folders')
						setSelectedFolder(null)
						setSelectedFolderName('')
					}
				})
			} else if (currentView === 'editor') {
				setNavigationProps({
					showBackButton: true,
					backButtonText: 'Nota',
					onBackClick: () => {
						setCurrentView('notes')
						setSelectedNote(null)
					}
				})
			} else {
				// Vista folders - sin botón back
				setNavigationProps({
					showBackButton: false,
					backButtonText: '',
					onBackClick: undefined
				})
			}
		}
	}, [isMobile, currentView, selectedFolderName])
	
	
	// Command palette
	const { isOpen: isCommandPaletteOpen, closeCommandPalette, openCommandPalette } = useCommandPalette()
	
	// Onboarding
	const { showTutorial, completeOnboarding, closeTutorial } = useOnboarding()

	// Redirigir al login si no está autenticado (TEMPORALMENTE DESHABILITADO)
	// useEffect(() => {
	// 	if (!loading && !user) {
	// 		router.push('/auth/login')
	// 	}
	// }, [user, loading, router])

	// Manejar parámetros de URL (TEMPORALMENTE SIN VERIFICACIÓN DE USUARIO)
	useEffect(() => {
		if (!loading) { // Removida verificación de user
			const folderParam = searchParams.get('folder')
			const noteParam = searchParams.get('note')
			const searchParam = searchParams.get('search')
			
			if (folderParam) {
				setSelectedFolder(folderParam)
			}
			
			if (noteParam) {
				setSelectedNote(noteParam)
			}
			
			if (searchParam) {
				setSearchQuery(searchParam)
			}
		}
	}, [loading, user, searchParams])

	// Verificar si el usuario tiene carpetas y mostrar prompt si no las tiene (TEMPORALMENTE SIN VERIFICACIÓN DE USUARIO)
	useEffect(() => {
		if (!loading) { // Removida verificación de user
			// Verificar si hay carpetas después de un breve delay para permitir que se carguen
			const timer = setTimeout(async () => {
				try {
					// Verificar directamente en la base de datos si el usuario tiene carpetas
					const response = await fetch('/api/folders/count')
					if (response.ok) {
						const data = await response.json()
						if (data.count === 0) {
							setShowDefaultFoldersPrompt(true)
						}
					}
				} catch (error) {
					log.error('Error checking folder count:', { error })
				}
			}, 2000)

			return () => clearTimeout(timer)
		}
	}, [loading, user])

	// Keyboard shortcuts usando hook personalizado
	useAppKeyboardShortcuts({
		onToggleSearch: () => {
			document.getElementById('search-input')?.focus()
		},
		onNewNote: () => {
			handleCreateNote('Nueva nota', 'Escribe tu nota aquí...')
		},
		onToggleSidebar: () => {
			setSidebarCollapsed(!sidebarCollapsed)
		},
		onToggleAIPanel: () => {
			setAiPanelOpen(!aiPanelOpen)
		},
		onClosePanels: () => {
			if (isMobile) {
				setSidebarCollapsed(false)
				setAiPanelOpen(false)
			}
		},
	})

	// Atajos de teclado adicionales (TEMPORALMENTE SIN VERIFICACIÓN DE USUARIO)
	useEffect(() => {
		if (loading) return // Removida verificación de user

		const handleKeyDown = (e: KeyboardEvent) => {
			// Modo focus (Ctrl+Shift+F)
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
				e.preventDefault()
				setIsFocusMode(!isFocusMode)
			}
			
			// Salir del modo focus con Escape
			if (e.key === 'Escape' && isFocusMode) {
				e.preventDefault()
				setIsFocusMode(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isFocusMode, loading, user])

	// Mostrar loading mientras se verifica la autenticación (TEMPORALMENTE DESHABILITADO)
	// if (loading) {
	// 	return (
	// 		<div className="flex items-center justify-center min-h-screen">
	// 			<div className="text-center">
	// 				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
	// 				<p className="text-muted-foreground">Verificando autenticación...</p>
	// 			</div>
	// 		</div>
	// 	)
	// }

	// No mostrar nada si no está autenticado (TEMPORALMENTE DESHABILITADO)
	// if (!user) {
	// 	return null
	// }

	// Handle note selection
	const handleNoteSelect = (noteId: string | null) => {
		setSelectedNote(noteId)
		if (noteId && isMobile) {
			// On mobile, hide the notes list when a note is selected
			setSidebarCollapsed(true)
		}
	}

	// Handle folder selection
	const handleFolderSelect = (folderId: string | null) => {
		setSelectedFolder(folderId)
		setSelectedNote(null) // Clear selected note when changing folders
	}

	// Función para obtener o crear carpeta "Notas" predeterminada
	const getOrCreateDefaultNotesFolder = async (): Promise<string | null> => {
		try {
			// Buscar carpeta "Notas" existente
			const result = await getFolderTree()
			if (result.success && result.folders) {
				const notesFolder = result.folders.find(folder => folder.name === 'Notas')
				if (notesFolder) {
					return notesFolder.id
				}
			}
			
			// Si no existe, crear carpeta "Notas"
			const createResult = await createFolder({
				name: 'Notas',
				color: '#3b82f6'
			})
			
			if (createResult.success && createResult.folderId) {
				return createResult.folderId
			}
			
			return null
		} catch (error) {
			console.error('Error getting/creating default notes folder:', error)
			return null
		}
	}

	// Handle note creation
	const handleCreateNote = async (title: string, content: string) => {
		try {
			const formData = new FormData()
			formData.set('title', title)
			formData.set('content', content)
			formData.set('content_type', 'text')
			
			// Usar carpeta seleccionada o crear/obtener carpeta "Notas" predeterminada
			let folderId = selectedFolder
			if (!folderId) {
				// Buscar o crear carpeta "Notas" predeterminada
				folderId = await getOrCreateDefaultNotesFolder()
			}
			
			if (folderId) {
				formData.set('folder_id', folderId)
			}

			const result = await createContent(formData)
			if (result.success && result.contentId) {
				setSelectedNote(result.contentId)
			}
			toast.success("Nota creada")
			
			// Forzar actualización de la lista de notas
			// Esto se puede hacer mejor con un estado compartido o context
			window.dispatchEvent(new CustomEvent('notesUpdated'))
		} catch (error) {
			toast.error("Error al crear la nota")
			log.error("Error creating note:", { error })
		}
	}

	// Handle default folders creation
	const handleCreateDefaultFolders = async () => {
		try {
			const result = await createDefaultFolders()
			if (result.success) {
				if (result.created > 0) {
					toast.success(result.message)
				} else {
					toast.info(result.message)
				}
				setShowDefaultFoldersPrompt(false)
				// Recargar la página para actualizar la lista de carpetas
				window.location.reload()
			} else {
				toast.error("Error al crear carpetas predeterminadas")
			}
		} catch (error) {
			toast.error("Error al crear carpetas predeterminadas")
			log.error("Error creating default folders:", { error })
		}
	}

	// Wrapper para FolderTree que solo recibe folderId
	const handleCreateNoteFromFolder = async (folderId: string | null) => {
		// Temporalmente cambiar la carpeta seleccionada si se especifica una
		const originalFolder = selectedFolder
		if (folderId) {
			setSelectedFolder(folderId)
		}
		
		// Crear la nota con contenido por defecto
		await handleCreateNote('Nueva nota', 'Escribe tu nota aquí...')
		
		// Restaurar la carpeta original si era diferente
		if (folderId && folderId !== originalFolder) {
			setSelectedFolder(originalFolder)
		}
	}

	// Handle note update
	const handleNoteUpdate = () => {
		// This will trigger a re-render of the notes list
		// The actual update is handled by the NoteEditor component
	}

	log.info('Estado de la página:', { isFocusMode, selectedNote, aiPanelOpen })
	
	// Mostrar loading mientras se detecta el dispositivo
	if (isMobileLoading) {
		return (
			<div className="h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Cargando...</p>
				</div>
			</div>
		)
	}
	
	// Layout móvil - Nuevo sistema estilo Apple Notes
	if (isMobile) {
		console.log('Mobile layout - currentView:', currentView, 'viewMode:', viewMode, 'selectedFolder:', selectedFolder)
		return (
			<div key="mobile-view" className="h-screen flex flex-col bg-background">
				
				{/* Contenido según vista */}
				<main ref={mainScrollRef} className="flex-1 overflow-y-auto pb-20">
					
					{/* Search bar condicional - Solo en vistas de carpetas y notas */}
					{(currentView === 'folders' || currentView === 'notes') && (
						<SmartSearchBar 
							onSearch={setSearchQuery}
							scrollContainerRef={mainScrollRef}
							searchContext={currentView === 'folders' ? 'folders' : 'notes'}
							onFolderSelect={(folderId) => {
								setSelectedFolder(folderId)
								setSelectedFolderName('Carpeta')
								setCurrentView('notes')
							}}
							onNoteSelect={(noteId) => {
								setSelectedNote(noteId)
								setCurrentView('editor')
							}}
						/>
					)}
					{currentView === 'folders' && (
						<FoldersGalleryView
							onFolderSelect={(id) => {
								setSelectedFolder(id)
								// Obtener el nombre de la carpeta desde los datos reales
								// Por ahora usar un nombre genérico, se puede mejorar después
								setSelectedFolderName('Carpeta')
								setCurrentView('notes')
							}}
						onCreateFolder={() => {
							setCreateFolderModalOpen(true)
						}}
						/>
					)}
					
					{currentView === 'notes' && (
						<NotesGalleryView
							folderId={selectedFolder}
							onNoteSelect={(id) => {
								setSelectedNote(id)
								setCurrentView('editor')
							}}
							searchQuery={searchQuery}
							viewMode={viewMode === 'grid' ? 'gallery' : 'list'}
							filterBy={filterBy}
							sortBy={sortBy}
							onCreateNote={(folderId) => {
								// Crear nota vacía en la carpeta seleccionada
								handleCreateNote(folderId)
							}}
						/>
					)}
					
					{currentView === 'editor' && selectedNote && (
						<div className="h-full">
							<NoteEditor
								noteId={selectedNote}
								onNoteUpdate={handleNoteUpdate}
								onClose={() => {
									setCurrentView('notes')
									setSelectedNote(null)
								}}
								onToggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
							/>
						</div>
					)}
				</main>
				
				{/* Spacer para evitar que el contenido se oculte detrás del bottom nav */}
				<MobileBottomNavSpacer />
				
				{/* MobileBottomNav siempre visible */}
				<MobileBottomNav />
				
				{/* FAB Izquierdo - Crear Carpeta (solo en vista folders) */}
				{currentView === 'folders' && (
					<Button
						onClick={() => setCreateFolderModalOpen(true)}
						className="fixed bottom-20 left-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 touch-target hover:scale-110 active:scale-95 transition-transform"
						size="icon"
					>
						<FolderPlus className="h-6 w-6" />
					</Button>
				)}
				
					{/* FAB Derecho - Crear Nota (visible en folders y notes, oculto en editor) */}
					{(currentView === 'folders' || currentView === 'notes') && (
						<Button
							onClick={() => setQuickNoteModalOpen(true)}
							className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 touch-target hover:scale-110 active:scale-95 transition-transform"
							size="icon"
						>
							<Plus className="h-6 w-6" />
						</Button>
					)}
				
				{/* FAB condicional - Solo chevron y acciones en vista notes */}
				{currentView === 'notes' && (
					<NotesFabMenu
						onCreateNote={() => setQuickNoteModalOpen(true)}
						currentView={currentView}
						onFilterChange={(filter) => setFilterBy(filter as any)}
						onSortChange={(sort) => {
							// Mapear valores del menú a valores del estado
							if (sort === 'updated_desc' || sort === 'updated_asc') {
								setSortBy('updated_at')
							} else if (sort === 'title_asc') {
								setSortBy('title')
							} else {
								setSortBy('updated_at')
							}
						}}
						onViewModeChange={(mode) => setViewMode(mode as any)}
						currentViewMode={viewMode === 'grid' ? 'gallery' : 'list'}
					/>
				)}

				{/* AI Panel móvil */}
				{aiPanelOpen && (
					<div className="fixed inset-0 z-50 bg-background">
						<div className="h-full flex flex-col">
							<div className="h-14 px-4 flex items-center border-b border-border">
								<span className="font-semibold">IA</span>
								<Button 
									variant="ghost" 
									size="icon"
									onClick={() => setAiPanelOpen(false)}
									className="ml-auto touch-target"
								>
									<X className="h-5 w-5" />
								</Button>
							</div>
							<div className="flex-1 overflow-y-auto">
								<AIPanel
									isOpen={true}
									onClose={() => setAiPanelOpen(false)}
									noteId={selectedNote}
									noteContent=""
									noteTitle=""
								/>
							</div>
						</div>
					</div>
				)}

				{/* Modal de creación de carpeta */}
				<CreateFolderModal
					isOpen={createFolderModalOpen}
					onClose={() => setCreateFolderModalOpen(false)}
					onFolderCreated={() => {
						// Recargar la lista de carpetas
						window.location.reload()
					}}
					parentId={null}
				/>

				{/* Modal de nota rápida */}
				<QuickNoteModal
					isOpen={quickNoteModalOpen}
					onClose={() => setQuickNoteModalOpen(false)}
					onNoteCreated={() => {
						// Recargar la lista de notas
						window.location.reload()
					}}
					defaultFolderId={selectedFolder}
				/>
			</div>
		)
	}

	// Layout desktop (original)
	return (
		<div key="desktop-view" className={`h-screen flex flex-col bg-background ${isFocusMode ? 'fixed inset-0 z-50' : ''}`}>
			{/* Breadcrumbs cuando hay nota abierta */}
			{!isFocusMode && selectedNote && (
				<div className="border-b border-border bg-card/50 backdrop-blur-sm">
					<div className="container mx-auto px-6 py-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<button 
								onClick={() => setSelectedNote(null)}
								className="flex items-center gap-1 hover:text-foreground transition-colors"
							>
								<ChevronLeft className="h-4 w-4" />
								Todas las notas
							</button>
							<ChevronRight className="h-3 w-3" />
							<span className="text-foreground font-medium truncate max-w-xs">
								{/* Aquí se mostraría el título de la nota actual */}
								Nota actual
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Search and Controls Bar */}
			{!isFocusMode && !selectedNote && (
				<div className="border-b border-border bg-card/50 backdrop-blur-sm">
					<div className="container mx-auto px-6 py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="search-input"
										placeholder="Buscar notas... (⌘K)"
										onClick={openCommandPalette}
										className="w-64 pl-9 h-9 cursor-pointer"
										readOnly
									/>
								</div>
								
								<Select value={sortBy} onValueChange={(value: 'updated_at' | 'created_at' | 'title') => setSortBy(value)}>
									<SelectTrigger className="w-32 h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="updated_at">Modificada</SelectItem>
										<SelectItem value="created_at">Creada</SelectItem>
										<SelectItem value="title">Título</SelectItem>
									</SelectContent>
								</Select>

								<Select value={filterBy} onValueChange={(value: 'all' | 'pinned' | 'archived') => setFilterBy(value)}>
									<SelectTrigger className="w-24 h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas</SelectItem>
										<SelectItem value="pinned">Fijadas</SelectItem>
										<SelectItem value="archived">Archivadas</SelectItem>
									</SelectContent>
								</Select>

								<div className="flex items-center border border-border rounded-md">
									<Button
										variant={viewMode === 'list' ? 'default' : 'ghost'}
										size="sm"
										onClick={() => setViewMode('list')}
										className="h-9 w-9 p-0 rounded-r-none"
									>
										<List className="w-4 h-4" />
									</Button>
									<Button
										variant={viewMode === 'grid' ? 'default' : 'ghost'}
										size="sm"
										onClick={() => setViewMode('grid')}
										className="h-9 w-9 p-0 rounded-l-none"
									>
										<Grid3X3 className="w-4 h-4" />
									</Button>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
									className="h-9 w-9 p-0"
								>
									{sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
								</Button>
								<AIHeaderStatus onOpenAIPanel={() => {
									log.info('Abriendo panel de IA desde header')
									setAiPanelOpen(true)
								}} />
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar izquierda - siempre visible pero colapsable */}
				{!sidebarCollapsed && !isFocusMode && (
					<div className={`${isMobile ? 'absolute inset-y-0 left-0 z-50 w-64' : 'w-64'} border-r border-border bg-card flex flex-col`}>
						<div className="p-4 border-b border-border">
							<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
								Carpetas
							</h2>
						</div>
						<div className="flex-1 overflow-y-auto">
							<FolderTree
								selectedFolderId={selectedFolder}
								onFolderSelect={handleFolderSelect}
								onCreateNote={handleCreateNoteFromFolder}
							/>
						</div>
					</div>
				)}
				
				{/* Área principal */}
				<main className="flex-1 overflow-auto">
					{selectedNote ? (
						// Editor centrado estilo Google Docs
						<div className="max-w-[800px] mx-auto px-8 py-12">
							<NoteEditor
								noteId={selectedNote}
								onNoteUpdate={handleNoteUpdate}
								onClose={() => setSelectedNote(null)}
								onToggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
							/>
						</div>
					) : (
						// Lista de notas completa
						<div className="w-full max-w-md border-r border-border bg-card flex flex-col">
							<Collapsible open={!filesSectionCollapsed} onOpenChange={(open) => setFilesSectionCollapsed(!open)}>
								<CollapsibleTrigger asChild>
									<div className="p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors">
										<div className="flex items-center justify-between mb-3">
											<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
												{selectedFolder ? 'Notas' : 'Todas las notas'}
											</h2>
											<div className="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation()
														handleCreateNote('Nueva nota', 'Escribe tu nota aquí...')
													}}
													className="h-6 w-6 p-0"
												>
													<Plus className="w-4 h-4" />
												</Button>
												{filesSectionCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
											</div>
										</div>
										
										{/* Quick Stats */}
										<div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
											<Badge variant="outline" className="text-xs px-2 py-1">
												<Star className="w-3 h-3 mr-1" />
												Fijadas
											</Badge>
											<Badge variant="outline" className="text-xs px-2 py-1">
												<Clock className="w-3 h-3 mr-1" />
												Recientes
											</Badge>
											<Badge variant="outline" className="text-xs px-2 py-1">
												<Archive className="w-3 h-3 mr-1" />
												Archivadas
											</Badge>
										</div>
									</div>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="flex-1 overflow-y-auto">
										<NotesList
											selectedFolderId={selectedFolder}
											selectedNoteId={selectedNote}
											onNoteSelect={handleNoteSelect}
											onCreateNote={handleCreateNoteFromFolder}
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					)}
				</main>
				
				{/* Panel IA deslizable desde la derecha */}
				{!isFocusMode && (
					<AIPanel
						isOpen={aiPanelOpen}
						onClose={() => setAiPanelOpen(false)}
						noteId={selectedNote}
						noteContent=""
						noteTitle=""
					/>
				)}
			</div>

			{/* FAB for creating content */}
			{!isFocusMode && (
				<ContentCaptureFAB
					onContentSaved={() => {
						// Refresh the notes list when content is saved
						// This will be handled by the component's internal logic
					}}
				/>
			)}

			{/* Focus Mode Indicator */}
			{isFocusMode && (
				<div className="fixed top-4 right-4 z-50 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span>Modo Focus</span>
						<kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
					</div>
				</div>
			)}

			{/* Mobile Overlay */}
			{isMobile && (sidebarCollapsed || aiPanelOpen) && (
				<div 
					className="fixed inset-0 bg-black/50 z-40"
					onClick={() => {
						setSidebarCollapsed(false)
						setAiPanelOpen(false)
					}}
				/>
			)}

			{/* Command Palette */}
			<CommandPalette
				isOpen={isCommandPaletteOpen}
				onClose={closeCommandPalette}
				onCreateNote={handleCreateNote}
				onNoteSelect={setSelectedNote}
			/>

			{/* Default Folders Prompt */}
			{showDefaultFoldersPrompt && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div className="bg-background border border-border rounded-lg p-6 max-w-md w-full shadow-lg">
						<div className="text-center mb-6">
							<FolderOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
							<h3 className="text-lg font-semibold mb-2">¡Organiza tus notas!</h3>
							<p className="text-sm text-muted-foreground">
								¿Te gustaría crear carpetas predeterminadas para organizar mejor tus notas?
							</p>
						</div>
						
						<div className="space-y-3 mb-6">
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-amber-500"></div>
									<span>Inbox</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-purple-500"></div>
									<span>Ideas</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-blue-500"></div>
									<span>Proyectos</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-green-500"></div>
									<span>Aprendizaje</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-orange-500"></div>
									<span>Tareas</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-cyan-500"></div>
									<span>Reuniones</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-pink-500"></div>
									<span>Personal</span>
								</div>
								<div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
									<div className="w-3 h-3 rounded-full bg-gray-500"></div>
									<span>Archivo</span>
								</div>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setShowDefaultFoldersPrompt(false)}
								className="flex-1"
							>
								Ahora no
							</Button>
							<Button
								onClick={handleCreateDefaultFolders}
								className="flex-1"
							>
								Crear carpetas
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Onboarding Tutorial */}
			<OnboardingTutorial
				isOpen={showTutorial}
				onClose={closeTutorial}
				onComplete={completeOnboarding}
			/>

			{/* Modal de creación de carpeta */}
			<CreateFolderModal
				isOpen={createFolderModalOpen}
				onClose={() => setCreateFolderModalOpen(false)}
				onFolderCreated={() => {
					// Recargar la lista de carpetas
					window.location.reload()
				}}
				parentId={null}
			/>

			{/* Modal de nota rápida */}
			<QuickNoteModal
				isOpen={quickNoteModalOpen}
				onClose={() => setQuickNoteModalOpen(false)}
				onNoteCreated={() => {
					// Recargar la lista de notas
					window.location.reload()
				}}
				defaultFolderId={selectedFolder}
			/>
		</div>
	)
}
