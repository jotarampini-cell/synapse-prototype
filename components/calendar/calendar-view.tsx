"use client"

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useCalendar } from '@/hooks/use-calendar'
import { useGoogleCalendarSync } from '@/hooks/use-google-calendar-sync'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
	ChevronLeft, 
	ChevronRight, 
	Calendar as CalendarIcon,
	Plus,
	MoreHorizontal
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/client'

interface CalendarViewProps {
	onDateSelect?: (date: Date) => void
	onEventClick?: (event: GoogleCalendarEvent) => void
	onAddEvent?: (date: Date) => void
	className?: string
}

export function CalendarView({ 
	onDateSelect, 
	onEventClick, 
	onAddEvent,
	className 
}: CalendarViewProps) {
	const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
	
	const {
		currentDate,
		selectedDate,
		calendarView,
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		selectDate,
		formatDate,
		isDateToday,
		isDateSelected,
		weekDays
	} = useCalendar()

	const {
		selectedCalendar,
		todayEvents,
		weekEvents,
		monthEvents,
		getEventsForDate,
		syncStatus
	} = useGoogleCalendarSync()

	// Obtener eventos para cada día del calendario
	const eventsByDate = useMemo(() => {
		const eventsMap = new Map<string, GoogleCalendarEvent[]>()
		
		// Combinar todos los eventos
		const allEvents = [...todayEvents, ...weekEvents, ...monthEvents]
		
		allEvents.forEach(event => {
			const eventDate = event.start?.dateTime || event.start?.date
			if (eventDate) {
				const dateKey = eventDate.split('T')[0]
				if (!eventsMap.has(dateKey)) {
					eventsMap.set(dateKey, [])
				}
				eventsMap.get(dateKey)!.push(event)
			}
		})
		
		return eventsMap
	}, [todayEvents, weekEvents, monthEvents])

	// Obtener eventos para una fecha específica
	const getEventsForDateKey = (date: Date) => {
		const dateKey = format(date, 'yyyy-MM-dd')
		return eventsByDate.get(dateKey) || []
	}

	// Manejar clic en un día
	const handleDayClick = (date: Date) => {
		selectDate(date)
		onDateSelect?.(date)
	}

	// Manejar clic en agregar evento
	const handleAddEvent = (date: Date, event: React.MouseEvent) => {
		event.stopPropagation()
		onAddEvent?.(date)
	}

	// Renderizar indicadores de eventos
	const renderEventIndicators = (date: Date) => {
		const events = getEventsForDateKey(date)
		if (events.length === 0) return null

		const synapseEvents = events.filter(event => event.summary?.startsWith('[Synapse]'))
		const otherEvents = events.filter(event => !event.summary?.startsWith('[Synapse]'))

		return (
			<div className="flex flex-wrap gap-0.5 mt-1">
				{synapseEvents.length > 0 && (
					<div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title={`${synapseEvents.length} tarea(s) de Synapse`} />
				)}
				{otherEvents.length > 0 && (
					<div className="w-1.5 h-1.5 bg-gray-400 rounded-full" title={`${otherEvents.length} evento(s)`} />
				)}
			</div>
		)
	}

	// Renderizar día del calendario
	const renderCalendarDay = (day: any) => {
		const events = getEventsForDateKey(day.date)
		const isToday = isDateToday(day.date)
		const isSelected = isDateSelected(day.date)
		const hasEvents = events.length > 0

		return (
			<Card
				key={day.date.toISOString()}
				className={cn(
					"relative p-2 h-20 cursor-pointer transition-all duration-200 hover:shadow-md",
					"flex flex-col justify-between",
					!day.isCurrentMonth && "opacity-40",
					isToday && "ring-2 ring-primary ring-offset-1",
					isSelected && "bg-primary/10 border-primary",
					hasEvents && "bg-muted/30"
				)}
				onClick={() => handleDayClick(day.date)}
			>
				{/* Número del día */}
				<div className="flex items-center justify-between">
					<span className={cn(
						"text-sm font-medium",
						isToday && "text-primary font-bold",
						isSelected && "text-primary"
					)}>
						{day.dayNumber}
					</span>
					
					{/* Botón agregar evento */}
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => handleAddEvent(day.date, e)}
					>
						<Plus className="h-3 w-3" />
					</Button>
				</div>

				{/* Indicadores de eventos */}
				{renderEventIndicators(day.date)}

				{/* Contador de eventos */}
				{events.length > 0 && (
					<Badge 
						variant="secondary" 
						className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
					>
						{events.length}
					</Badge>
				)}
			</Card>
		)
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Header del calendario */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<h2 className="text-2xl font-bold">
						{calendarView.monthName} {calendarView.yearString}
					</h2>
					
					{/* Indicador de sincronización */}
					{syncStatus.isSyncing && (
						<Badge variant="outline" className="animate-pulse">
							<CalendarIcon className="h-3 w-3 mr-1" />
							Sincronizando...
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Navegación */}
					<Button variant="outline" size="icon" onClick={goToPreviousMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					
					<Button variant="outline" onClick={goToToday}>
						Hoy
					</Button>
					
					<Button variant="outline" size="icon" onClick={goToNextMonth}>
						<ChevronRight className="h-4 w-4" />
					</Button>

					{/* Selector de vista */}
					<div className="flex border rounded-md">
						<Button
							variant={viewMode === 'month' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('month')}
							className="rounded-r-none"
						>
							Mes
						</Button>
						<Button
							variant={viewMode === 'week' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('week')}
							className="rounded-none"
						>
							Semana
						</Button>
						<Button
							variant={viewMode === 'day' ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setViewMode('day')}
							className="rounded-l-none"
						>
							Día
						</Button>
					</div>
				</div>
			</div>

			{/* Calendario */}
			<Card className="p-4">
				{viewMode === 'month' && (
					<div className="space-y-2">
						{/* Días de la semana */}
						<div className="grid grid-cols-7 gap-2 mb-2">
							{weekDays.map((day) => (
								<div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
									{day}
								</div>
							))}
						</div>

						{/* Días del mes */}
						<div className="grid grid-cols-7 gap-2">
							{calendarView.days.map((day) => renderCalendarDay(day))}
						</div>
					</div>
				)}

				{viewMode === 'week' && (
					<div className="text-center py-8 text-muted-foreground">
						Vista semanal - Próximamente
					</div>
				)}

				{viewMode === 'day' && (
					<div className="text-center py-8 text-muted-foreground">
						Vista diaria - Próximamente
					</div>
				)}
			</Card>

			{/* Información del calendario seleccionado */}
			{selectedCalendar && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<CalendarIcon className="h-4 w-4" />
					<span>Calendario: {selectedCalendar.summary}</span>
					{syncStatus.lastSyncAt && (
						<span>• Última sincronización: {format(new Date(syncStatus.lastSyncAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
					)}
				</div>
			)}
		</div>
	)
}
