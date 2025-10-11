"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BlockEditor } from "@/components/block-editor"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { AutoTagging } from "@/components/auto-tagging"
import { AIEditorStatus } from "@/components/ai-status-indicator"
import { ContentBlocksPanel } from "@/components/content-blocks-panel"
import { AIInsightsPanel } from "@/components/ai-insights-panel"
import { 
	Save, 
	Minimize2,
	Maximize2,
	MoreHorizontal,
	Folder,
	Tag,
	Calendar,
	Clock,
	FileText,
	Upload,
	Mic,
	Brain,
	Sparkles,
	X
} from "lucide-react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger,
	DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { 
	updateContent, 
	getContentById 
} from "@/app/actions/content"
import { getFolderTree } from "@/app/actions/folders"
import { analyzeNote, analyzeNoteInBackground } from "@/app/actions/ai-analysis"
import { toast } from "sonner"

interface Note {
	id: string
	title: string
	content: string
	content_type: string
	tags: string[]
	created_at: string
	updated_at: string
	folder_id: string | null
	is_pinned: boolean
	is_archived: boolean
	word_count: number
	reading_time: number
	folders?: {
		name: string
		color: string
	}
}

interface Folder {
	id: string
	name: string
	color: string
}

interface NoteEditorProps {
	noteId: string | null
	onNoteUpdate?: (note: Note) => void
	onClose?: () => void
	onToggleAIPanel?: () => void
}

export function NoteEditor({ noteId, onNoteUpdate, onClose, onToggleAIPanel }: NoteEditorProps) {
	const { isMobile } = useMobileDetection()
	const [note, setNote] = useState<Note | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [folders, setFolders] = useState<Folder[]>([])
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [aiAnalysisStatus, setAiAnalysisStatus] = useState<'pending' | 'analyzing' | 'completed' | 'error'>('pending')
	const [sources, setSources] = useState<string[]>([])
	const [showInsightsPanel, setShowInsightsPanel] = useState(false)
	const [insightsPanelCollapsed, setInsightsPanelCollapsed] = useState(false)
	
	const titleRef = useRef<HTMLInputElement>(null)
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Auto-save timeout (3 seconds after last change)
	const AUTO_SAVE_DELAY = 3000

	useEffect(() => {
		if (noteId) {
			loadNote()
		} else {
			setNote(null)
		}
		loadFolders()
	}, [noteId])

	useEffect(() => {
		// Auto-save when content changes
		if (hasUnsavedChanges && note) {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
			
			saveTimeoutRef.current = setTimeout(() => {
				saveNote()
			}, AUTO_SAVE_DELAY)
		}

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
		}
	}, [hasUnsavedChanges, note])

	const loadNote = async () => {
		if (!noteId) return
		
		try {
			setIsLoading(true)
			const noteData = await getContentById(noteId)
			setNote(noteData)
			setHasUnsavedChanges(false)
		} catch (error) {
			toast.error("Error al cargar la nota")
			console.error("Error loading note:", error)
		} finally {
			setIsLoading(false)
		}
	}

	const loadFolders = async () => {
		try {
			const folderTree = await getFolderTree()
			// Flatten the tree for the dropdown
			const flattenFolders = (folders: Folder[]): Folder[] => {
				const result: Folder[] = []
				folders.forEach(folder => {
					result.push({
						id: folder.id,
						name: folder.name,
						color: folder.color
					})
					if (folder.children) {
						result.push(...flattenFolders(folder.children))
					}
				})
				return result
			}
			setFolders(flattenFolders(folderTree))
		} catch (error) {
			console.error("Error loading folders:", error)
		}
	}

	const saveNote = useCallback(async (skipAI: boolean = true) => {
		if (!note || !hasUnsavedChanges) return

		try {
			setIsSaving(true)
			
			const formData = new FormData()
			formData.set('title', note.title)
			formData.set('content', note.content)
			formData.set('tags', note.tags.join(','))
			if (note.folder_id && note.folder_id !== 'none') {
				formData.set('folder_id', note.folder_id)
			}

			await updateContent(note.id, formData, { skipAI })
			setHasUnsavedChanges(false)
			
			if (onNoteUpdate) {
				onNoteUpdate(note)
			}
			
			if (!skipAI) {
				toast.success("Nota guardada y analizada", { duration: 2000 })
			} else {
				toast.success("Nota guardada", { duration: 1000 })
			}

			// Auto-análisis en background después de guardar (solo si no se hizo análisis manual)
			if (skipAI && note.content.length > 100) { // Solo para notas con contenido sustancial
				setAiAnalysisStatus('analyzing')
				setTimeout(async () => {
					try {
						const result = await analyzeNoteInBackground(note.id)
						if (result.success) {
							setAiAnalysisStatus('completed')
							console.log('Auto-análisis completado para nota:', note.id)
						} else {
							setAiAnalysisStatus('error')
							console.log('Auto-análisis falló:', result.message)
						}
					} catch (error) {
						setAiAnalysisStatus('error')
						console.log('Auto-análisis falló (no crítico):', error)
					}
				}, 2000) // Esperar 2 segundos después del guardado
			}
		} catch (error) {
			toast.error("Error al guardar la nota")
			console.error("Error saving note:", error)
		} finally {
			setIsSaving(false)
		}
	}, [note, hasUnsavedChanges, onNoteUpdate])

	const handleTitleChange = (value: string) => {
		if (note) {
			setNote({ ...note, title: value })
			setHasUnsavedChanges(true)
		}
	}

	const handleContentChange = (value: string) => {
		if (note) {
			setNote({ ...note, content: value })
			setHasUnsavedChanges(true)
		}
	}

	const handleTagsChange = (value: string) => {
		if (note) {
			const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
			setNote({ ...note, tags })
			setHasUnsavedChanges(true)
		}
	}

	const handleFolderChange = (folderId: string) => {
		if (note) {
			setNote({ ...note, folder_id: folderId === 'none' ? null : folderId })
			setHasUnsavedChanges(true)
		}
	}

	const handleAIAnalysis = async () => {
		if (!note) return

		try {
			setIsAnalyzing(true)
			await analyzeNote(note.id, 'full')
			toast.success("Análisis de IA completado")
			// Abrir el panel de insights
			setShowInsightsPanel(true)
		} catch (error) {
			toast.error("Error al analizar la nota")
			console.error("Error analyzing note:", error)
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleContentExtracted = (content: string, title: string, source: string) => {
		if (note) {
			// Agregar el contenido extraído al final de la nota
			const newContent = note.content + (note.content ? '\n\n' : '') + content
			setNote({ ...note, content: newContent })
			setHasUnsavedChanges(true)
			
			// Agregar la fuente a la lista de fuentes
			if (!sources.includes(source)) {
				setSources([...sources, source])
			}
		}
	}


	const getContentTypeIcon = (contentType: string) => {
		switch (contentType) {
			case 'text':
				return <FileText className="w-4 h-4" />
			case 'file':
				return <Upload className="w-4 h-4" />
			case 'voice':
				return <Mic className="w-4 h-4" />
			default:
				return <FileText className="w-4 h-4" />
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	if (!noteId) {
		return (
			<div className="h-full flex items-center justify-center text-muted-foreground">
				<div className="text-center">
					<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
					<h3 className="text-lg font-semibold mb-2">Selecciona una nota</h3>
					<p className="text-sm">Elige una nota de la lista para editarla</p>
				</div>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="animate-pulse text-center">
					<div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4"></div>
					<div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
					<div className="h-3 bg-muted rounded w-24 mx-auto"></div>
				</div>
			</div>
		)
	}

	if (!note) {
		return (
			<div className="h-full flex items-center justify-center text-muted-foreground">
				<div className="text-center">
					<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
					<h3 className="text-lg font-semibold mb-2">Nota no encontrada</h3>
					<p className="text-sm">La nota que buscas no existe o no tienes permisos para verla</p>
				</div>
			</div>
		)
	}

	// Layout móvil
	if (isMobile) {
		return (
			<div className="fixed inset-0 z-50 bg-background">
				{/* Header sticky para móvil */}
				<header className="h-14 flex items-center px-4 border-b border-border bg-background safe-area-top">
					<Button 
						variant="ghost" 
						size="icon" 
						onClick={onClose}
						className="touch-target"
					>
						<X className="h-5 w-5" />
					</Button>
					<Input 
						ref={titleRef}
						value={note.title}
						onChange={(e) => handleTitleChange(e.target.value)}
						placeholder="Título de la nota..."
						className="flex-1 mx-2 text-lg font-semibold mobile-input"
					/>
					<Button 
						onClick={() => saveNote(true)}
						disabled={isSaving}
						className="touch-target"
					>
						{isSaving ? "..." : "Guardar"}
					</Button>
				</header>
				
				{/* Editor */}
				<div className="flex-1 overflow-y-auto p-4">
					<BlockEditor
						content={note.content}
						onUpdate={handleContentChange}
						onSave={() => saveNote(true)}
						placeholder="Escribe tu nota aquí..."
					/>
				</div>

				{/* Metadata simplificada en móvil */}
				<div className="border-t border-border p-4 bg-muted/30">
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<div className="flex items-center gap-4">
							<span>{note.word_count} palabras</span>
							<span>{note.reading_time} min</span>
						</div>
						<div className="flex items-center gap-2">
							{note.tags.slice(0, 2).map((tag) => (
								<Badge key={tag} variant="secondary" className="text-xs">
									{tag}
								</Badge>
							))}
							{note.tags.length > 2 && (
								<Badge variant="secondary" className="text-xs">
									+{note.tags.length - 2}
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Layout desktop (original)
	return (
		<div className={`h-full flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
			{/* Header simplificado */}
			<div className="flex-shrink-0 mb-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						{getContentTypeIcon(note.content_type)}
						<div className="text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Calendar className="w-3 h-3" />
								{formatDate(note.created_at)}
							</span>
						</div>
					</div>
					
					<div className="flex items-center gap-2">
						{hasUnsavedChanges && (
							<Badge variant="outline" className="text-xs">
								Sin guardar
							</Badge>
						)}
						{isSaving && (
							<Badge variant="secondary" className="text-xs">
								Guardando...
							</Badge>
						)}
						{aiAnalysisStatus === 'analyzing' && (
							<Badge variant="secondary" className="text-xs">
								<Brain className="w-3 h-3 mr-1 animate-pulse" />
								Analizando...
							</Badge>
						)}
						{aiAnalysisStatus === 'completed' && (
							<Badge variant="default" className="text-xs bg-green-100 text-green-800">
								<Brain className="w-3 h-3 mr-1" />
								✓ Analizado
							</Badge>
						)}
						{aiAnalysisStatus === 'error' && (
							<Badge variant="destructive" className="text-xs">
								<Brain className="w-3 h-3 mr-1" />
								Error IA
							</Badge>
						)}
						
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsFullscreen(!isFullscreen)}
							className="h-8 w-8 p-0"
						>
							{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
						</Button>
						
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<MoreHorizontal className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => saveNote(false)}>
									<Save className="w-4 h-4 mr-2" />
									Guardar y analizar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => saveNote(true)}>
									<Save className="w-4 h-4 mr-2" />
									Guardar solo
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleAIAnalysis} disabled={isAnalyzing}>
									<Brain className="w-4 h-4 mr-2" />
									Analizar nota
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => {
									console.log('Botón Ver insights clickeado')
									setShowInsightsPanel(true)
								}}>
									<Sparkles className="w-4 h-4 mr-2" />
									Ver insights
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={onClose}>
									Cerrar editor
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Title Input */}
				<Input
					ref={titleRef}
					value={note.title}
					onChange={(e) => handleTitleChange(e.target.value)}
					placeholder="Título de la nota..."
					className="text-3xl font-bold border-none bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
				/>
			</div>

			{/* Metadata Bar simplificada */}
			<div className="flex-shrink-0 mb-6 pb-4 border-b border-border/50">
				<div className="flex items-center gap-4 flex-wrap">
					{/* Metadata */}
					<div className="flex items-center gap-3">
						<Select value={note.folder_id || 'none'} onValueChange={handleFolderChange}>
							<SelectTrigger className="w-40 h-8">
								<SelectValue placeholder="Sin carpeta" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Sin carpeta</SelectItem>
								{folders.map((folder) => (
									<SelectItem key={folder.id} value={folder.id}>
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: folder.color }}
											/>
											{folder.name}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Input
							value={note.tags.join(', ')}
							onChange={(e) => handleTagsChange(e.target.value)}
							placeholder="Etiquetas..."
							className="w-32 h-8 text-sm"
						/>
					</div>

					<div className="flex-1"></div>

					{/* Auto Tagging */}
					<AutoTagging
						content={note.content}
						title={note.title}
						currentTags={note.tags}
						currentFolder={note.folder_id || undefined}
						onTagsChange={(tags) => setNote({ ...note, tags })}
						onFolderChange={(folderId) => setNote({ ...note, folder_id: folderId })}
						className="mr-2"
					/>

					{/* AI Status Indicator */}
					<AIEditorStatus 
						noteId={noteId}
						onAnalyze={handleAIAnalysis}
					/>

					{/* Stats */}
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span>{note.word_count} palabras</span>
						<span>{note.reading_time} min lectura</span>
					</div>
				</div>
			</div>

			{/* Content Editor */}
			<div className="flex-1 p-4 overflow-hidden min-h-0">
				<BlockEditor
					content={note.content}
					onUpdate={handleContentChange}
					onSave={() => saveNote(true)}
					placeholder="Escribe tu nota aquí... Usa / para comandos rápidos."
				/>
			</div>

			{/* Referencias y Fuentes */}
			<div className="border-t border-border/50 p-4">
				<ContentBlocksPanel 
					noteId={noteId}
					onBlockSelect={(block) => {
						// Insertar referencia en el texto
						const reference = `[${block.title}]`
						const newContent = note.content + (note.content ? '\n\n' : '') + reference
						setNote({ ...note, content: newContent })
						setHasUnsavedChanges(true)
					}}
				/>
			</div>
			{/* AI Insights Panel */}
			<AIInsightsPanel
				noteId={noteId}
				noteContent={note?.content}
				noteTitle={note?.title}
				isOpen={showInsightsPanel}
				onClose={() => setShowInsightsPanel(false)}
				onToggleCollapse={() => setInsightsPanelCollapsed(!insightsPanelCollapsed)}
				isCollapsed={insightsPanelCollapsed}
			/>
		</div>
	)
}
