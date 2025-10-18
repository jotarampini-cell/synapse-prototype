"use client"

import { useMemo } from 'react'
import { format, isSameDay, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface MobileAgendaViewProps {
	events: any[]
	onEventClick: (event: any) => void
	onEditEvent: (event: any) => void
	onDeleteEvent: (event: any) => void
}

export function MobileAgendaView({
	events,
	onEventClick,
	onEditEvent,
	onDeleteEvent
}: MobileAgendaViewProps) {
	// Agrupar eventos por día
	const eventsByDay = useMemo(() => {
		const grouped = new Map<string, any[]>()
		events.forEach(event => {
			const dateKey = format(startOfDay(new Date(event.start_time)), 'yyyy-MM-dd')
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, [])
			}
			grouped.get(dateKey)!.push(event)
		})
		return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
	}, [events])

	if (eventsByDay.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-center">
				<Calendar className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
				<h3 className="text-lg font-semibold mb-2">Sin eventos</h3>
				<p className="text-sm text-muted-foreground">
					No tienes eventos ni tareas programadas
				</p>
			</div>
		)
	}

	return (
		<div className="p-4 space-y-6">
			{eventsByDay.map(([dateKey, dayEvents]) => {
				const date = new Date(dateKey)
				const isCurrentDay = isToday(date)

				return (
					<div key={dateKey}>
						{/* Encabezado del día */}
						<div className={cn(
							"sticky top-0 bg-background z-10 pb-3 mb-3",
							isCurrentDay && "text-primary font-semibold"
						)}>
							<div className="flex items-center gap-2">
								<span className="text-sm uppercase tracking-wide">
									{format(date, "EEEE", { locale: es })}
								</span>
								<span className={cn(
									"flex items-center justify-center w-8 h-8 rounded-full text-sm",
									isCurrentDay 
										? "bg-primary text-primary-foreground font-bold" 
										: "text-muted-foreground"
								)}>
									{format(date, "d")}
								</span>
							</div>
						</div>

						{/* Lista de eventos del día */}
						<div className="space-y-2">
							{dayEvents.map((event) => (
								<AgendaEventCard
									key={event.id}
									event={event}
									onClick={() => onEventClick(event)}
									onEdit={() => onEditEvent(event)}
									onDelete={() => onDeleteEvent(event)}
								/>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}

function AgendaEventCard({ event, onClick, onEdit, onDelete }: any) {
	const isTask = event.type === 'task'
	const startTime = new Date(event.start_time)

	return (
		<Card
			className={cn(
				"p-4 cursor-pointer transition-all hover:shadow-md",
				"border-l-4"
			)}
			style={{ borderLeftColor: event.color }}
			onClick={onClick}
		>
			<div className="flex items-start gap-3">
				{!event.all_day && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground min-w-fit">
						<Clock className="h-3 w-3" />
						<span>{format(startTime, "HH:mm")}</span>
					</div>
				)}

				<div className="flex-1 min-w-0">
					<h4 className="font-medium text-sm truncate">{event.title}</h4>
					{event.description && (
						<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
							{event.description}
						</p>
					)}
					<div className="flex items-center gap-2 mt-2">
						{isTask && (
							<Badge variant="secondary" className="text-xs">
								<CheckCircle2 className="h-3 w-3 mr-1" />
								Tarea
							</Badge>
						)}
						{event.location && (
							<span className="text-xs text-muted-foreground truncate">
								📍 {event.location}
							</span>
						)}
					</div>
				</div>
			</div>
		</Card>
	)
}
