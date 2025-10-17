'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
	Tag, 
	Plus, 
	X, 
	Sparkles, 
	Folder,
	Check,
	Loader2,
	ThumbsUp,
	ThumbsDown
} from 'lucide-react'
import { getAutoTags, getSuggestedFolder } from '@/app/actions/smart-suggestions'
import { log } from '@/lib/logger'

interface AutoTaggingProps {
	content: string
	title?: string
	currentTags: string[]
	currentFolder?: string
	onTagsChange: (tags: string[]) => void
	onFolderChange: (folder: string | null) => void
	className?: string
}

export function AutoTagging({
	content,
	title,
	currentTags,
	currentFolder,
	onTagsChange,
	onFolderChange,
	className = ''
}: AutoTaggingProps) {
	const [suggestedTags, setSuggestedTags] = useState<string[]>([])
	const [suggestedFolder, setSuggestedFolder] = useState<string | null>(null)
	const [isLoadingTags, setIsLoadingTags] = useState(false)
	const [isLoadingFolder, setIsLoadingFolder] = useState(false)
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [feedback, setFeedback] = useState<{[key: string]: 'useful' | 'not-useful' | null}>({})

	useEffect(() => {
		// Auto-sugerir cuando el contenido cambie significativamente
		if (content.length > 50) {
			loadSuggestions()
			// Mostrar sugerencias automáticamente si hay contenido suficiente
			if (content.length > 100 && !showSuggestions) {
				setShowSuggestions(true)
			}
		}
	}, [content, title])

	const loadSuggestions = async () => {
		if (content.length < 50) return

		// Cargar tags sugeridos
		setIsLoadingTags(true)
		try {
			const tags = await getAutoTags(content)
			// Filtrar tags que ya están aplicados
			const newTags = tags.filter(tag => !currentTags.includes(tag))
			setSuggestedTags(newTags)
		} catch (error) {
			log.error('Error loading suggested tags:', error)
		} finally {
			setIsLoadingTags(false)
		}

		// Cargar carpeta sugerida
		setIsLoadingFolder(true)
		try {
			const folder = await getSuggestedFolder(content, title)
			setSuggestedFolder(folder)
		} catch (error) {
			log.error('Error loading suggested folder:', error)
		} finally {
			setIsLoadingFolder(false)
		}
	}

	const addTag = (tag: string) => {
		if (!currentTags.includes(tag)) {
			onTagsChange([...currentTags, tag])
		}
		// Remover de sugerencias
		setSuggestedTags(prev => prev.filter(t => t !== tag))
	}

	const removeTag = (tag: string) => {
		onTagsChange(currentTags.filter(t => t !== tag))
	}

	const applySuggestedFolder = () => {
		if (suggestedFolder) {
			onFolderChange(suggestedFolder)
			setSuggestedFolder(null)
		}
	}

	const handleFeedback = (suggestionId: string, isUseful: boolean) => {
		setFeedback(prev => ({
			...prev,
			[suggestionId]: isUseful ? 'useful' : 'not-useful'
		}))
		
		// Aquí se podría enviar el feedback a la base de datos para mejorar las sugerencias
		log.info(`Feedback para ${suggestionId}: ${isUseful ? 'útil' : 'no útil'}`)
	}

	const hasSuggestions = suggestedTags.length > 0 || suggestedFolder

	if (!hasSuggestions && !showSuggestions) {
		return (
			<div className={className}>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowSuggestions(true)}
					className="gap-2 text-muted-foreground hover:text-foreground"
				>
					<Sparkles className="h-4 w-4" />
					IA puede ayudar
				</Button>
			</div>
		)
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Sparkles className="h-4 w-4" />
						Sugerencias IA
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowSuggestions(!showSuggestions)}
						className="h-6 w-6 p-0"
					>
						{showSuggestions ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
					</Button>
				</div>
			</CardHeader>
			
			{showSuggestions && (
				<CardContent className="space-y-4">
					{/* Tags actuales */}
					{currentTags && currentTags.length > 0 && (
						<div>
							<div className="text-xs font-medium text-muted-foreground mb-2">
								Etiquetas actuales
							</div>
							<div className="flex flex-wrap gap-1">
								{currentTags.map((tag) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
										<button
											onClick={() => removeTag(tag)}
											className="ml-1 hover:text-destructive"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Tags sugeridos */}
					{suggestedTags.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Tag className="h-3 w-3 text-muted-foreground" />
									<span className="text-xs font-medium text-muted-foreground">
										Etiquetas sugeridas
									</span>
									{isLoadingTags && <Loader2 className="h-3 w-3 animate-spin" />}
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleFeedback('tags', true)}
										className={`h-5 w-5 p-0 ${feedback['tags'] === 'useful' ? 'text-green-600' : 'text-muted-foreground'}`}
									>
										<ThumbsUp className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleFeedback('tags', false)}
										className={`h-5 w-5 p-0 ${feedback['tags'] === 'not-useful' ? 'text-red-600' : 'text-muted-foreground'}`}
									>
										<ThumbsDown className="h-3 w-3" />
									</Button>
								</div>
							</div>
							<div className="flex flex-wrap gap-1">
								{suggestedTags.map((tag) => (
									<Badge 
										key={tag} 
										variant="outline" 
										className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
										onClick={() => addTag(tag)}
									>
										<Plus className="h-3 w-3 mr-1" />
										{tag}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Carpeta sugerida */}
					{suggestedFolder && suggestedFolder !== currentFolder && (
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Folder className="h-3 w-3 text-muted-foreground" />
									<span className="text-xs font-medium text-muted-foreground">
										Carpeta sugerida
									</span>
									{isLoadingFolder && <Loader2 className="h-3 w-3 animate-spin" />}
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleFeedback('folder', true)}
										className={`h-5 w-5 p-0 ${feedback['folder'] === 'useful' ? 'text-green-600' : 'text-muted-foreground'}`}
									>
										<ThumbsUp className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleFeedback('folder', false)}
										className={`h-5 w-5 p-0 ${feedback['folder'] === 'not-useful' ? 'text-red-600' : 'text-muted-foreground'}`}
									>
										<ThumbsDown className="h-3 w-3" />
									</Button>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="text-xs">
									{suggestedFolder}
								</Badge>
								<Button
									variant="ghost"
									size="sm"
									onClick={applySuggestedFolder}
									className="h-6 px-2 text-xs"
								>
									<Check className="h-3 w-3 mr-1" />
									Aplicar
								</Button>
							</div>
						</div>
					)}

					{/* Botón para recargar sugerencias */}
					<div className="pt-2 border-t border-border">
						<Button
							variant="ghost"
							size="sm"
							onClick={loadSuggestions}
							disabled={isLoadingTags || isLoadingFolder}
							className="w-full h-8 text-xs"
						>
							{isLoadingTags || isLoadingFolder ? (
								<Loader2 className="h-3 w-3 mr-1 animate-spin" />
							) : (
								<Sparkles className="h-3 w-3 mr-1" />
							)}
							Actualizar sugerencias
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	)
}



