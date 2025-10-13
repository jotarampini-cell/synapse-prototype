"use client"

import { useState } from "react"
import {
	DndContext,
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	closestCenter,
	KeyboardSensor,
	useSensor as useSensorBase,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { createSortableItem } from "@dnd-kit/sortable"

export interface DragDropItem {
	id: string
	position: number
}

export interface DragDropList {
	id: string
	items: DragDropItem[]
}

export function useDragDrop<T extends DragDropItem>(
	initialItems: T[],
	onReorder: (items: T[]) => void,
	onMoveBetweenLists?: (itemId: string, fromListId: string, toListId: string, newPosition: number) => void
) {
	const [items, setItems] = useState<T[]>(initialItems)
	const [activeId, setActiveId] = useState<string | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string)
	}

	const handleDragOver = (event: DragOverEvent) => {
		// Aquí podemos manejar el drag over entre listas si es necesario
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (!over || active.id === over.id) {
			setActiveId(null)
			return
		}

		const oldIndex = items.findIndex((item) => item.id === active.id)
		const newIndex = items.findIndex((item) => item.id === over.id)

		if (oldIndex !== -1 && newIndex !== -1) {
			const newItems = arrayMove(items, oldIndex, newIndex)
			
			// Actualizar posiciones
			const updatedItems = newItems.map((item, index) => ({
				...item,
				position: index
			}))

			setItems(updatedItems)
			onReorder(updatedItems)
		}

		setActiveId(null)
	}

	const updateItems = (newItems: T[]) => {
		setItems(newItems)
	}

	return {
		items,
		activeId,
		sensors,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		updateItems,
		DndContext,
		SortableContext,
		DragOverlay,
		verticalListSortingStrategy,
		closestCenter,
	}
}

