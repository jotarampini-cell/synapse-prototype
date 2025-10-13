"use client"

import { Task } from "@/app/actions/tasks"
import { TaskItem } from "./task-item"

interface DragOverlayProps {
	activeTask: Task | null
}

export function TaskDragOverlay({ activeTask }: DragOverlayProps) {
	if (!activeTask) return null

	return (
		<div className="rotate-3 scale-105 shadow-2xl">
			<TaskItem
				task={activeTask}
				onTaskUpdate={() => {}}
				level={0}
			/>
		</div>
	)
}

