"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@/components/ui/tooltip'
import { 
	Calendar as CalendarIcon, 
	CheckCircle, 
	AlertCircle,
	ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoogleCalendarSync } from '@/hooks/use-google-calendar-sync'
import { toast } from 'sonner'
import type { Task } from '@/app/actions/tasks'

interface TaskSyncButtonProps {
	task: Task
	onSync?: (task: Task) => void
	onUnsync?: (task: Task) => void
	variant?: 'default' | 'outline' | 'ghost'
	size?: 'default' | 'sm' | 'lg' | 'icon'
	showLabel?: boolean
	className?: string
}

export function TaskSyncButton({
	task,
	onSync,
	onUnsync,
	variant = 'outline',
	size = 'sm',
	showLabel = true,
	className
}: TaskSyncButtonProps) {
	const { isTaskSynced, syncTask, unsyncTask, syncStatus } = useGoogleCalendarSync()
	const [isLoading, setIsLoading] = useState(false)

	const isSynced = isTaskSynced(task)
	const canSync = task.due_date && task.status !== 'cancelled'

	// Manejar sincronización
	const handleSync = async () => {
		if (!canSync) {
			toast.error('La tarea debe tener una fecha de vencimiento para sincronizar')
			return
		}

		setIsLoading(true)
		try {
			await syncTask(task.id)
			onSync?.(task)
		} catch (error) {
			console.error('Error sincronizando tarea:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Manejar desincronización
	const handleUnsync = async () => {
		setIsLoading(true)
		try {
			await unsyncTask(task.id)
			onUnsync?.(task)
		} catch (error) {
			console.error('Error desincronizando tarea:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Obtener estado del botón
	const getButtonState = () => {
		if (isLoading || syncStatus.isSyncing) {
			return {
				icon: Sync,
				label: 'Sincronizando...',
				variant: 'outline' as const,
				disabled: true,
				className: 'animate-pulse'
			}
		}

		if (isSynced) {
			return {
				icon: CheckCircle,
				label: 'Sincronizada',
				variant: 'default' as const,
				disabled: false,
				className: 'bg-green-500 hover:bg-green-600 text-white border-2 border-green-300 shadow-md'
			}
		}

		if (!canSync) {
			return {
				icon: AlertCircle,
				label: 'Sin fecha',
				variant: 'outline' as const,
				disabled: true,
				className: 'opacity-50'
			}
		}

		return {
			icon: CalendarIcon,
			label: 'Sincronizar',
			variant: variant,
			disabled: false,
			className: 'hover:bg-blue-50 hover:text-blue-600 border-blue-200 hover:border-blue-300'
		}
	}

	const buttonState = getButtonState()
	const Icon = buttonState.icon

	// Renderizar botón con tooltip
	const button = (
		<Button
			variant={buttonState.variant}
			size={size}
			disabled={buttonState.disabled}
			onClick={isSynced ? handleUnsync : handleSync}
			className={cn(
				'flex items-center gap-2',
				buttonState.className,
				className
			)}
		>
			<Icon className="h-4 w-4" />
			{showLabel && buttonState.label}
		</Button>
	)

	// Si no se puede sincronizar, mostrar con tooltip explicativo
	if (!canSync && !isSynced) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{button}
					</TooltipTrigger>
					<TooltipContent>
						<p>La tarea debe tener una fecha de vencimiento para sincronizar</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	// Si está sincronizada, mostrar con tooltip de información
	if (isSynced) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{button}
					</TooltipTrigger>
					<TooltipContent>
						<div className="space-y-1">
							<p className="font-medium">Tarea sincronizada</p>
							<p className="text-xs text-muted-foreground">
								Esta tarea está en Google Calendar
							</p>
							<p className="text-xs text-muted-foreground">
								Haz clic para desincronizar
							</p>
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	// Botón normal para sincronizar
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					{button}
				</TooltipTrigger>
				<TooltipContent>
					<p>Sincronizar esta tarea con Google Calendar</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

// Componente compacto para listas
export function TaskSyncBadge({ task }: { task: Task }) {
	const { isTaskSynced } = useGoogleCalendarSync()
	const isSynced = isTaskSynced(task)

	if (!isSynced) return null

	return (
		<Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200">
			<CheckCircle className="h-3 w-3 mr-1" />
			En Google Calendar
		</Badge>
	)
}

// Componente de estado de sincronización
export function TaskSyncStatus({ task }: { task: Task }) {
	const { isTaskSynced } = useGoogleCalendarSync()
	const isSynced = isTaskSynced(task)

	return (
		<div className="flex items-center gap-1 text-xs text-muted-foreground">
			{isSynced ? (
				<>
					<CheckCircle className="h-3 w-3 text-green-500" />
					<span>Sincronizada</span>
				</>
			) : (
				<>
					<CalendarIcon className="h-3 w-3" />
					<span>No sincronizada</span>
				</>
			)}
		</div>
	)
}
