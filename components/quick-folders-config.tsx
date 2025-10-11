'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { 
	FolderOpen, 
	Settings, 
	Check,
	X,
	Plus,
	Command as CommandIcon
} from 'lucide-react'
import { getQuickFolders, updateQuickFolders } from '@/app/actions/folders'
import { toast } from 'sonner'

interface Folder {
	id: string
	name: string
	color: string
}

interface QuickFoldersConfigProps {
	onFoldersUpdated?: () => void
}

export function QuickFoldersConfig({ onFoldersUpdated }: QuickFoldersConfigProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [quickFolders, setQuickFolders] = useState<Folder[]>([])
	const [allFolders, setAllFolders] = useState<Folder[]>([])
	const [selectedFolders, setSelectedFolders] = useState<string[]>([])
	const [searchQuery, setSearchQuery] = useState("")

	useEffect(() => {
		if (isOpen) {
			loadFolders()
		}
	}, [isOpen])

	const loadFolders = async () => {
		try {
			setIsLoading(true)
			const result = await getQuickFolders()
			if (result.success) {
				setQuickFolders(result.quickFolders)
				setAllFolders(result.allFolders)
				setSelectedFolders(result.quickFolders.map(f => f.id))
			} else {
				toast.error('Error al cargar carpetas')
			}
		} catch (error) {
			console.error('Error loading folders:', error)
			toast.error('Error al cargar carpetas')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			setIsLoading(true)
			const result = await updateQuickFolders(selectedFolders)
			if (result.success) {
				toast.success('Carpetas rápidas actualizadas')
				setIsOpen(false)
				onFoldersUpdated?.()
			} else {
				// Mostrar mensaje específico del error
				toast.error(result.error || 'Error al actualizar carpetas rápidas')
			}
		} catch (error) {
			console.error('Error updating quick folders:', error)
			toast.error('Error al actualizar carpetas rápidas')
		} finally {
			setIsLoading(false)
		}
	}

	const toggleFolder = (folderId: string) => {
		setSelectedFolders(prev => {
			if (prev.includes(folderId)) {
				return prev.filter(id => id !== folderId)
			} else if (prev.length < 4) {
				return [...prev, folderId]
			} else {
				toast.error('Máximo 4 carpetas rápidas')
				return prev
			}
		})
	}

	// Filtrar carpetas basado en la búsqueda
	const filteredFolders = allFolders.filter(folder =>
		folder.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Settings className="h-4 w-4" />
					Configurar
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl max-h-[70vh] p-0 bg-background/95 backdrop-blur-sm border-border/50">
				<DialogTitle className="sr-only">Configurar Carpetas Rápidas</DialogTitle>
				<Command className="rounded-lg">
					<div className="flex items-center border-b border-border/50 px-4 py-3 bg-muted/30">
						<CommandIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
						<CommandInput
							placeholder="Buscar carpetas..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="flex h-10 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
						/>
					</div>
					<CommandList className="max-h-[50vh] overflow-y-auto">
						{isLoading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
								<p className="text-muted-foreground">Cargando carpetas...</p>
							</div>
						) : (
							<>
								{/* Información */}
								<div className="px-4 py-3 bg-muted/20 border-b border-border/50">
									<div className="flex items-center justify-between">
										<div className="text-sm text-muted-foreground">
											💡 Selecciona hasta 4 carpetas para acceso rápido
										</div>
										<Badge variant="outline" className="text-xs">
											{selectedFolders.length}/4
										</Badge>
									</div>
								</div>

								{/* Carpetas seleccionadas */}
								{selectedFolders.length > 0 && (
									<CommandGroup heading="Seleccionadas" className="px-2 py-1">
										{selectedFolders.map((folderId) => {
											const folder = allFolders.find(f => f.id === folderId)
											if (!folder) return null
											
											return (
												<CommandItem
													key={`selected-${folderId}`}
													onSelect={() => toggleFolder(folderId)}
													className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer"
												>
													<Check className="h-4 w-4 text-primary" />
													<div 
														className="w-4 h-4 rounded flex items-center justify-center"
														style={{ backgroundColor: `${folder.color}20` }}
													>
														<FolderOpen 
															className="h-2 w-2" 
															style={{ color: folder.color }}
														/>
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm">{folder.name}</div>
														<div className="text-xs text-muted-foreground/70">
															Carpeta rápida
														</div>
													</div>
													<X 
														className="h-4 w-4 cursor-pointer hover:text-destructive"
														onClick={(e) => {
															e.stopPropagation()
															toggleFolder(folderId)
														}}
													/>
												</CommandItem>
											)
										})}
									</CommandGroup>
								)}

								{/* Todas las carpetas */}
								<CommandGroup heading="Todas las carpetas" className="px-2 py-1">
									{filteredFolders.length === 0 ? (
										<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
											No se encontraron carpetas.
										</CommandEmpty>
									) : (
										filteredFolders.map((folder) => {
											const isSelected = selectedFolders.includes(folder.id)
											const isQuickFolder = quickFolders.some(f => f.id === folder.id)
											
											return (
												<CommandItem
													key={folder.id}
													onSelect={() => toggleFolder(folder.id)}
													className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer"
												>
													{isSelected ? (
														<Check className="h-4 w-4 text-primary" />
													) : (
														<div 
															className="w-4 h-4 rounded flex items-center justify-center"
															style={{ backgroundColor: `${folder.color}20` }}
														>
															<FolderOpen 
																className="h-2 w-2" 
																style={{ color: folder.color }}
															/>
														</div>
													)}
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm">{folder.name}</div>
														<div className="text-xs text-muted-foreground/70">
															{isQuickFolder ? 'Carpeta rápida actual' : 'Carpeta disponible'}
														</div>
													</div>
													{isQuickFolder && !isSelected && (
														<Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
															Rápida
														</Badge>
													)}
												</CommandItem>
											)
										})
									)}
								</CommandGroup>
							</>
						)}
					</CommandList>
					
					{/* Botones de acción */}
					<div className="flex justify-end gap-3 p-4 border-t border-border/50 bg-muted/20">
						<Button 
							variant="outline" 
							onClick={() => setIsOpen(false)}
							disabled={isLoading}
						>
							Cancelar
						</Button>
						<Button 
							onClick={handleSave}
							disabled={isLoading}
							className="gap-2"
						>
							<Check className="h-4 w-4" />
							Guardar
						</Button>
					</div>
				</Command>
			</DialogContent>
		</Dialog>
	)
}
