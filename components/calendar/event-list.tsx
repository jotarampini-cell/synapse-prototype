"use client"

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
	Clock, 
	MapPin, 
	Edit, 
	Trash2, 
	ExternalLink,
	Calendar as CalendarIcon,
	CheckSquare
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/client'

interface EventListProps {
	events: GoogleCalendarEvent[]
	selectedDate?: Date
	onEventClick?: (event: GoogleCalendarEvent) => void
	onEditEvent?: (event: GoogleCalendarEvent) => void
	onDeleteEvent?: (event: GoogleCalendarEvent) => void
	className?: string
}

export function EventList({ 
	events, 
	selectedDate,
	onEventClick, 
	onEditEvent, 
	onDeleteEvent,
	className 
}: EventListProps) {
	const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

	// Ordenar eventos por hora
	const sortedEvents = useMemo(() => {
		return [...events].sort((a, b) => {
			const timeA = a.start?.dateTime || a.start?.date || ''
			const timeB = b.start?.dateTime || b.start?.date || ''
			return timeA.localeCompare(timeB)
		})
	}, [events])

	// Verificar si un evento es de Synapse
	const isSynapseEvent = (event: GoogleCalendarEvent) => {
		return event.summary?.startsWith('[Synapse]') || false
	}

	// Obtener color del evento
	const getEventColor = (event: GoogleCalendarEvent) => {
		if (isSynapseEvent(event)) {
			return 'bg-blue-500'
		}
		
		// Mapeo de colores de Google Calendar
		const colorMap: Record<string, string> = {
			'1': 'bg-blue-500',    // Azul
			'2': 'bg-green-500',   // Verde
			'3': 'bg-purple-500',  // Púrpura
			'4': 'bg-red-500',     // Rojo
			'5': 'bg-yellow-500',  // Amarillo
			'6': 'bg-orange-500',  // Naranja
			'7': 'bg-teal-500',    // Verde azulado
			'8': 'bg-gray-500',    // Gris
			'9': 'bg-indigo-500',  // Índigo
			'10': 'bg-green-500',  // Verde
			'11': 'bg-red-500'     // Rojo
		}
		
		return colorMap[event.colorId || '1'] || 'bg-blue-500'
	}

	// Formatear fecha y hora
	const formatEventTime = (event: GoogleCalendarEvent) => {
		const startTime = event.start?.dateTime || event.start?.date
		if (!startTime) return 'Sin hora'

		const date = parseISO(startTime)
		
		// Si es un evento de día completo
		if (event.start?.date && !event.start?.dateTime) {
			if (isToday(date)) return 'Hoy'
			if (isTomorrow(date)) return 'Mañana'
			if (isYesterday(date)) return 'Ayer'
			return format(date, 'dd/MM/yyyy', { locale: es })
		}

		// Evento con hora específica
		if (isToday(date)) {
			return format(date, 'HH:mm', { locale: es })
		}
		
		return format(date, 'dd/MM HH:mm', { locale: es })
	}

	// Obtener duración del evento
	const getEventDuration = (event: GoogleCalendarEvent) => {
		const startTime = event.start?.dateTime || event.start?.date
		const endTime = event.end?.dateTime || event.end?.date
		
		if (!startTime || !endTime) return null

		const start = parseISO(startTime)
		const end = parseISO(endTime)
		const durationMs = end.getTime() - start.getTime()
		const durationHours = durationMs / (1000 * 60 * 60)

		if (durationHours < 1) {
			const minutes = Math.round(durationMs / (1000 * 60))
			return `${minutes} min`
		} else if (durationHours < 24) {
			return `${Math.round(durationHours * 10) / 10}h`
		} else {
			const days = Math.round(durationHours / 24)
			return `${days} día${days > 1 ? 's' : ''}`
		}
	}

	// Alternar expansión de evento
	const toggleEventExpansion = (eventId: string) => {
		setExpandedEvents(prev => {
			const newSet = new Set(prev)
			if (newSet.has(eventId)) {
				newSet.delete(eventId)
			} else {
				newSet.add(eventId)
			}
			return newSet
		})
	}

	// Renderizar evento individual
	const renderEvent = (event: GoogleCalendarEvent) => {
		const eventId = event.id || Math.random().toString()
		const isExpanded = expandedEvents.has(eventId)
		const isSynapse = isSynapseEvent(event)
		const eventColor = getEventColor(event)
		const duration = getEventDuration(event)

		return (
			<Card
				key={eventId}
				className={cn(
					"p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
					"border-l-4",
					eventColor
				)}
				onClick={() => onEventClick?.(event)}
			>
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						{/* Título del evento */}
						<div className="flex items-center gap-2 mb-1">
							{isSynapse ? (
								<CheckSquare className="h-4 w-4 text-blue-600" />
							) : (
								<CalendarIcon className="h-4 w-4 text-gray-600" />
							)}
							<h3 className="font-medium text-sm line-clamp-1">
								{isSynapse ? event.summary?.replace(/^\[Synapse\]\s*/, '') : event.summary}
							</h3>
							{isSynapse && (
								<Badge variant="secondary" className="text-xs">
									Synapse
								</Badge>
							)}
						</div>

						{/* Hora y duración */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
							<Clock className="h-3 w-3" />
							<span>{formatEventTime(event)}</span>
							{duration && (
								<>
									<span>•</span>
									<span>{duration}</span>
								</>
							)}
						</div>

						{/* Descripción (si está expandido) */}
						{isExpanded && event.description && (
							<div className="text-xs text-muted-foreground mb-2 line-clamp-3">
								{event.description}
							</div>
						)}

						{/* Ubicación (si existe) */}
						{event.location && (
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<MapPin className="h-3 w-3" />
								<span className="line-clamp-1">{event.location}</span>
							</div>
						)}
					</div>

					{/* Acciones */}
					<div className="flex items-center gap-1 ml-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={(e) => {
								e.stopPropagation()
								toggleEventExpansion(eventId)
							}}
						>
							<ExternalLink className="h-3 w-3" />
						</Button>
						
						{onEditEvent && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={(e) => {
									e.stopPropagation()
									onEditEvent(event)
								}}
							>
								<Edit className="h-3 w-3" />
							</Button>
						)}
						
						{onDeleteEvent && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-destructive hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation()
									onDeleteEvent(event)
								}}
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>
			</Card>
		)
	}

	// Agrupar eventos por hora
	const eventsByTime = useMemo(() => {
		const groups: { [key: string]: GoogleCalendarEvent[] } = {}
		
		sortedEvents.forEach(event => {
			const time = event.start?.dateTime || event.start?.date || ''
			const timeKey = time.split('T')[0] // Agrupar por día
			
			if (!groups[timeKey]) {
				groups[timeKey] = []
			}
			groups[timeKey].push(event)
		})
		
		return groups
	}, [sortedEvents])

	if (events.length === 0) {
		return (
			<Card className={cn("p-8 text-center", className)}>
				<CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
				<h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
				<p className="text-muted-foreground">
					{selectedDate 
						? `No hay eventos programados para ${format(selectedDate, 'dd/MM/yyyy', { locale: es })}`
						: 'No hay eventos en este período'
					}
				</p>
			</Card>
		)
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">
					Eventos {selectedDate && `- ${format(selectedDate, 'dd/MM/yyyy', { locale: es })}`}
				</h3>
				<Badge variant="outline">
					{events.length} evento{events.length !== 1 ? 's' : ''}
				</Badge>
			</div>

			{/* Lista de eventos */}
			<div className="space-y-2">
				{Object.entries(eventsByTime).map(([dateKey, dayEvents]) => (
					<div key={dateKey} className="space-y-2">
						{dayEvents.length > 1 && (
							<div className="text-sm font-medium text-muted-foreground">
								{format(parseISO(dateKey), 'dd/MM/yyyy', { locale: es })}
							</div>
						)}
						{dayEvents.map(renderEvent)}
					</div>
				))}
			</div>
		</div>
	)
}
