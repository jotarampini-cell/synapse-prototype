"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskItem } from "./task-item"
import { Task } from "@/app/actions/tasks"

interface SortableTaskItemProps {
	task: Task
	onTaskUpdate: () => void
	onAddSubtask?: (parentTaskId: string) => void
	level?: number
	onOpenDetails?: (task: Task) => void
	isSelected?: boolean
	onSelect?: () => void
}

export function SortableTaskItem({
	task,
	onTaskUpdate,
	onAddSubtask,
	level = 0,
	onOpenDetails,
	isSelected = false,
	onSelect
}: SortableTaskItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ 
		id: task.id,
		disabled: level > 0 // Deshabilitar drag para subtareas
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${isDragging ? 'z-50' : ''}`}
		>
			<TaskItem
				task={task}
				onTaskUpdate={onTaskUpdate}
				onAddSubtask={onAddSubtask}
				level={level}
				onOpenDetails={onOpenDetails}
				dragHandleProps={level === 0 ? { ...attributes, ...listeners } : undefined}
				onSelect={onSelect}
			/>
		</div>
	)
}
