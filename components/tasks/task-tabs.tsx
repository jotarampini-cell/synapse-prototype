"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskListWithStats } from "@/app/actions/tasks"

interface TaskTabsProps {
	taskLists: TaskListWithStats[]
	selectedListId: string
	onListSelect: (listId: string) => void
	onCreateNewList: () => void
	showStarred: boolean
	onToggleStarred: () => void
}

export function TaskTabs({
	taskLists,
	selectedListId,
	onListSelect,
	onCreateNewList,
	showStarred,
	onToggleStarred
}: TaskTabsProps) {
	const [isScrolling, setIsScrolling] = useState(false)

	return (
		<div className="relative">
			{/* Tabs container */}
			<div 
				className="flex gap-1 overflow-x-auto scrollbar-hide pb-1"
				onScroll={() => setIsScrolling(true)}
				onScrollEnd={() => setIsScrolling(false)}
			>
				{/* Tab de Destacadas */}
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleStarred}
					className={cn(
						"flex-shrink-0 h-9 px-3 rounded-lg transition-all",
						"hover:bg-muted/50 active:scale-95",
						showStarred 
							? "bg-primary/10 text-primary border border-primary/20" 
							: "text-muted-foreground hover:text-foreground"
					)}
				>
					<span className="text-sm font-medium">⭐ Destacadas</span>
				</Button>

				{/* Separador */}
				<div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

				{/* Tab principal "Mis tareas" */}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onListSelect(taskLists[0]?.id || "")}
					className={cn(
						"flex-shrink-0 h-9 px-3 rounded-lg transition-all",
						"hover:bg-muted/50 active:scale-95",
						selectedListId === taskLists[0]?.id && !showStarred
							? "bg-primary/10 text-primary border border-primary/20" 
							: "text-muted-foreground hover:text-foreground"
					)}
				>
					<span className="text-sm font-medium">Mis tareas</span>
					{taskLists[0] && (
						<span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
							{taskLists[0].pending_tasks}
						</span>
					)}
				</Button>

				{/* Tabs de listas personalizadas */}
				{taskLists.slice(1).map((list) => (
					<Button
						key={list.id}
						variant="ghost"
						size="sm"
						onClick={() => onListSelect(list.id)}
						className={cn(
							"flex-shrink-0 h-9 px-3 rounded-lg transition-all",
							"hover:bg-muted/50 active:scale-95",
							selectedListId === list.id && !showStarred
								? "bg-primary/10 text-primary border border-primary/20" 
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						<span className="text-sm font-medium truncate max-w-[120px]">
							{list.name}
						</span>
						<span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
							{list.pending_tasks}
						</span>
					</Button>
				))}

				{/* Botón + Nueva lista */}
				<Button
					variant="ghost"
					size="sm"
					onClick={onCreateNewList}
					className="flex-shrink-0 h-9 px-3 rounded-lg transition-all hover:bg-muted/50 active:scale-95 text-muted-foreground hover:text-foreground"
				>
					<Plus className="h-4 w-4 mr-1" />
					<span className="text-sm font-medium">Nueva lista</span>
				</Button>
			</div>

			{/* Indicador de scroll (derecha) */}
			{isScrolling && (
				<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
			)}
		</div>
	)
}
