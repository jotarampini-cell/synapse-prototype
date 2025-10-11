"use client"

import { useState, useCallback } from 'react'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { cn } from '@/lib/utils'

// Simulación de virtual scrolling para demo
interface VirtualListProps<T> {
	items: T[]
	itemHeight: number
	renderItem: (item: T, index: number) => React.ReactElement
	className?: string
	height?: number
}

export function VirtualList<T>({
	items,
	itemHeight,
	renderItem,
	className,
	height = 400
}: VirtualListProps<T>) {
	const { isMobile } = useMobileDetection()
	
	// Para demo, mostramos solo los primeros 20 elementos
	// En una implementación real usaríamos react-window
	const visibleItems = items.slice(0, 20)
	
	return (
		<div className={cn("w-full overflow-y-auto", className)} style={{ height }}>
			<div className="space-y-2">
				{visibleItems.map((item, index) => (
					<div key={index} style={{ height: itemHeight }}>
						{renderItem(item, index)}
					</div>
				))}
				{items.length > 20 && (
					<div className="text-center py-4 text-muted-foreground">
						Mostrando 20 de {items.length} elementos
						<br />
						<small>(Virtual scrolling simulado para demo)</small>
					</div>
				)}
			</div>
		</div>
	)
}

// Componente específico para notas con virtual scrolling
interface VirtualNotesListProps {
	notes: Array<{
		id: string
		title: string
		content: string
		tags: string[]
		updated_at: string
		word_count: number
	}>
	onNoteSelect: (noteId: string) => void
	onNoteEdit?: (noteId: string) => void
	onNoteDelete?: (noteId: string) => void
}

export function VirtualNotesList({
	notes,
	onNoteSelect,
	onNoteEdit,
	onNoteDelete
}: VirtualNotesListProps) {
	const { isMobile } = useMobileDetection()

	const renderNoteItem = (note: typeof notes[0], index: number) => {
		return (
			<div 
				className={cn(
					"p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
					isMobile ? "touch-target" : ""
				)}
				onClick={() => onNoteSelect(note.id)}
			>
				<div className="flex items-start justify-between mb-2">
					<h3 className={cn(
						"font-semibold line-clamp-2 flex-1",
						isMobile ? "text-base" : "text-sm"
					)}>
						{note.title}
					</h3>
					<div className="ml-2 flex-shrink-0">
						<span className="text-xs text-muted-foreground">
							{new Date(note.updated_at).toLocaleDateString()}
						</span>
					</div>
				</div>
				
				<p className={cn(
					"text-muted-foreground mb-2 line-clamp-2",
					isMobile ? "text-sm" : "text-xs"
				)}>
					{note.content}
				</p>
				
				<div className="flex items-center justify-between">
					<div className="flex gap-1 flex-wrap">
						{note.tags.slice(0, 2).map((tag) => (
							<span 
								key={tag}
								className={cn(
									"px-2 py-1 bg-muted rounded text-xs",
									isMobile ? "text-xs" : "text-xs"
								)}
							>
								{tag}
							</span>
						))}
						{note.tags.length > 2 && (
							<span className="px-2 py-1 bg-muted rounded text-xs">
								+{note.tags.length - 2}
							</span>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{note.word_count} palabras
					</span>
				</div>
			</div>
		)
	}

	return (
		<VirtualList
			items={notes}
			itemHeight={isMobile ? 120 : 100}
			renderItem={renderNoteItem}
			className="virtual-notes-list"
		/>
	)
}

// Componente para acciones con virtual scrolling
interface VirtualActionsListProps {
	actions: Array<{
		id: string
		title: string
		description: string
		status: 'pending' | 'in_progress' | 'completed'
		priority: 'high' | 'medium' | 'low'
		dueDate: string
		project: string
	}>
	onActionSelect: (actionId: string) => void
	onActionEdit?: (actionId: string) => void
	onActionComplete?: (actionId: string) => void
}

export function VirtualActionsList({
	actions,
	onActionSelect,
	onActionEdit,
	onActionComplete
}: VirtualActionsListProps) {
	const { isMobile } = useMobileDetection()

	const priorityColors = {
		high: "bg-red-500",
		medium: "bg-yellow-500",
		low: "bg-green-500"
	}

	const statusColors = {
		pending: "bg-gray-500",
		in_progress: "bg-blue-500",
		completed: "bg-green-500"
	}

	const renderActionItem = (action: typeof actions[0], index: number) => {
		return (
			<div 
				className={cn(
					"p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
					isMobile ? "touch-target" : ""
				)}
				onClick={() => onActionSelect(action.id)}
			>
				<div className="flex items-start justify-between mb-2">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<h3 className={cn(
								"font-semibold line-clamp-1",
								isMobile ? "text-base" : "text-sm"
							)}>
								{action.title}
							</h3>
							<div className={`w-2 h-2 rounded-full ${priorityColors[action.priority]}`} />
						</div>
						<p className={cn(
							"text-muted-foreground line-clamp-2",
							isMobile ? "text-sm" : "text-xs"
						)}>
							{action.description}
						</p>
					</div>
				</div>
				
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className={cn(
							"px-2 py-1 rounded text-xs text-white",
							statusColors[action.status]
						)}>
							{action.status === "pending" ? "Pendiente" : 
							 action.status === "in_progress" ? "En curso" : "Completada"}
						</span>
						<span className="px-2 py-1 bg-muted rounded text-xs">
							{action.project}
						</span>
					</div>
					<span className="text-xs text-muted-foreground">
						{new Date(action.dueDate).toLocaleDateString()}
					</span>
				</div>
			</div>
		)
	}

	return (
		<VirtualList
			items={actions}
			itemHeight={isMobile ? 110 : 90}
			renderItem={renderActionItem}
			className="virtual-actions-list"
		/>
	)
}

// Hook para manejar virtual scrolling con infinite loading
export function useVirtualInfiniteLoading<T>(
	initialItems: T[],
	loadMore: () => Promise<T[]>,
	hasNextPage: boolean = true
) {
	const [items, setItems] = useState<T[]>(initialItems)
	const [isLoading, setIsLoading] = useState(false)
	const [hasMore, setHasMore] = useState(hasNextPage)

	const loadMoreItems = useCallback(async () => {
		if (isLoading || !hasMore) return

		setIsLoading(true)
		try {
			const newItems = await loadMore()
			setItems(prev => [...prev, ...newItems])
			setHasMore(newItems.length > 0)
		} catch (error) {
			console.error('Error loading more items:', error)
		} finally {
			setIsLoading(false)
		}
	}, [isLoading, hasMore, loadMore])

	return {
		items,
		isLoading,
		hasMore,
		loadMoreItems
	}
}