"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
	Plus, 
	Globe, 
	FileText, 
	Link, 
	Upload,
	X,
	GripVertical,
	ExternalLink,
	Calendar,
	Clock,
	Trash2,
	Edit3
} from "lucide-react"
import { 
	getContentBlocks, 
	createContentBlock, 
	updateContentBlock, 
	deleteContentBlock, 
	reorderContentBlocks,
	type ContentBlock 
} from "@/app/actions/content-blocks"
import { ContentCapture } from "./content-capture"
import { toast } from "sonner"

interface ContentBlocksPanelProps {
	noteId: string | null
	onBlockSelect?: (block: ContentBlock) => void
	className?: string
}

export function ContentBlocksPanel({ noteId, onBlockSelect, className = "" }: ContentBlocksPanelProps) {
	const [blocks, setBlocks] = useState<ContentBlock[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showAddForm, setShowAddForm] = useState(false)
	const [editingBlock, setEditingBlock] = useState<string | null>(null)
	const [editForm, setEditForm] = useState({
		title: "",
		url: "",
		excerpt: ""
	})

	useEffect(() => {
		if (noteId) {
			loadBlocks()
		} else {
			setBlocks([])
		}
	}, [noteId])

	const loadBlocks = async () => {
		if (!noteId) return

		setIsLoading(true)
		try {
			const result = await getContentBlocks(noteId)
			if (result.success && result.blocks) {
				setBlocks(result.blocks)
			} else {
				toast.error(result.error || "Error al cargar bloques")
			}
		} catch (error) {
			console.error('Error loading blocks:', error)
			toast.error("Error al cargar bloques de contenido")
		} finally {
			setIsLoading(false)
		}
	}

	const handleContentExtracted = async (content: string, title: string, source: string) => {
		if (!noteId) return

		try {
			const result = await createContentBlock({
				content_id: noteId,
				type: 'source',
				title: title || 'Fuente capturada',
				url: source,
				excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
				metadata: {
					source_type: 'captured',
					original_length: content.length
				}
			})

			if (result.success) {
				toast.success("Fuente agregada")
				loadBlocks()
				setShowAddForm(false)
			} else {
				toast.error(result.error || "Error al agregar fuente")
			}
		} catch (error) {
			console.error('Error adding source:', error)
			toast.error("Error al agregar fuente")
		}
	}

	const handleDeleteBlock = async (blockId: string) => {
		try {
			const result = await deleteContentBlock(blockId)
			if (result.success) {
				toast.success("Bloque eliminado")
				loadBlocks()
			} else {
				toast.error(result.error || "Error al eliminar bloque")
			}
		} catch (error) {
			console.error('Error deleting block:', error)
			toast.error("Error al eliminar bloque")
		}
	}

	const handleEditBlock = (block: ContentBlock) => {
		setEditingBlock(block.id)
		setEditForm({
			title: block.title,
			url: block.url || "",
			excerpt: block.excerpt
		})
	}

	const handleSaveEdit = async () => {
		if (!editingBlock) return

		try {
			const result = await updateContentBlock(editingBlock, {
				title: editForm.title,
				url: editForm.url,
				excerpt: editForm.excerpt
			})

			if (result.success) {
				toast.success("Bloque actualizado")
				loadBlocks()
				setEditingBlock(null)
				setEditForm({ title: "", url: "", excerpt: "" })
			} else {
				toast.error(result.error || "Error al actualizar bloque")
			}
		} catch (error) {
			console.error('Error updating block:', error)
			toast.error("Error al actualizar bloque")
		}
	}

	const getBlockIcon = (type: string) => {
		switch (type) {
			case 'source':
				return <Globe className="h-4 w-4" />
			case 'related_note':
				return <FileText className="h-4 w-4" />
			case 'file':
				return <Upload className="h-4 w-4" />
			case 'reference':
				return <Link className="h-4 w-4" />
			default:
				return <FileText className="h-4 w-4" />
		}
	}

	const getBlockTypeLabel = (type: string) => {
		switch (type) {
			case 'source':
				return 'Fuente'
			case 'related_note':
				return 'Nota relacionada'
			case 'file':
				return 'Archivo'
			case 'reference':
				return 'Referencia'
			default:
				return type
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('es-ES', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	if (!noteId) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Referencias y Fuentes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Selecciona una nota para ver sus referencias
					</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Header */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm flex items-center gap-2">
							<Plus className="h-4 w-4" />
							Referencias y Fuentes
						</CardTitle>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowAddForm(!showAddForm)}
							className="h-6 w-6 p-0"
						>
							<Plus className="h-3 w-3" />
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* Add Content Form */}
			{showAddForm && (
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm">Agregar contenido</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowAddForm(false)}
								className="h-6 w-6 p-0"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<ContentCapture onContentExtracted={handleContentExtracted} />
					</CardContent>
				</Card>
			)}

			{/* Blocks List */}
			{isLoading ? (
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="animate-pulse">
									<div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
									<div className="h-3 bg-muted rounded w-1/2"></div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			) : blocks.length > 0 ? (
				<ScrollArea className="max-h-96">
					<div className="space-y-2">
						{blocks.map((block) => (
							<Card key={block.id} className="group">
								<CardContent className="p-3">
									{editingBlock === block.id ? (
										<div className="space-y-2">
											<Input
												value={editForm.title}
												onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
												placeholder="Título"
												className="h-7 text-xs"
											/>
											<Input
												value={editForm.url}
												onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
												placeholder="URL"
												className="h-7 text-xs"
											/>
											<Input
												value={editForm.excerpt}
												onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
												placeholder="Descripción"
												className="h-7 text-xs"
											/>
											<div className="flex gap-1">
												<Button
													size="sm"
													onClick={handleSaveEdit}
													className="h-6 text-xs"
												>
													Guardar
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingBlock(null)}
													className="h-6 text-xs"
												>
													Cancelar
												</Button>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<div className="flex items-start justify-between">
												<div className="flex items-start gap-2 flex-1 min-w-0">
													<div className="flex-shrink-0 mt-0.5 text-muted-foreground">
														{getBlockIcon(block.type)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<h4 className="font-medium text-xs truncate">
																{block.title}
															</h4>
															<Badge variant="secondary" className="text-xs px-1.5 py-0.5">
																{getBlockTypeLabel(block.type)}
															</Badge>
														</div>
														{block.excerpt && (
															<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
																{block.excerpt}
															</p>
														)}
														<div className="flex items-center gap-2 text-xs text-muted-foreground">
															<span className="flex items-center gap-1">
																<Clock className="h-3 w-3" />
																{formatDate(block.created_at)}
															</span>
															{block.url && (
																<>
																	<span>•</span>
																	<button
																		onClick={() => window.open(block.url, '_blank')}
																		className="flex items-center gap-1 hover:text-primary transition-colors"
																	>
																		<ExternalLink className="h-3 w-3" />
																		Abrir
																	</button>
																</>
															)}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEditBlock(block)}
														className="h-6 w-6 p-0"
													>
														<Edit3 className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeleteBlock(block.id)}
														className="h-6 w-6 p-0 text-destructive hover:text-destructive"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</ScrollArea>
			) : (
				<Card>
					<CardContent className="pt-6">
						<div className="text-center text-muted-foreground">
							<Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-xs mb-3">No hay referencias aún</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowAddForm(true)}
								className="text-xs"
							>
								Agregar primera referencia
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
