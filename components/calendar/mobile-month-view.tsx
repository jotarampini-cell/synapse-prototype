"use client"

import { useMemo } from 'react'
import { useCalendar } from '@/hooks/use-calendar'
import { useInternalCalendar } from '@/hooks/use-internal-calendar'
import { cn } from '@/lib/utils'
import { format, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from 'date-fns/locale'

interface MobileMonthViewProps {
	onDateSelect: (date: Date) => void
	onEventClick: (event: any) => void
}

export function MobileMonthView({ onDateSelect, onEventClick }: MobileMonthViewProps) {
	const {
		calendarView,
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		selectDate,
		selectedDate,
		weekDays
	} = useCalendar()

	const { allItems } = useInternalCalendar()

	// Contar eventos por día
	const eventCountByDate = useMemo(() => {
		const counts = new Map<string, number>()
		allItems.forEach(item => {
			const dateKey = format(new Date(item.start_time), 'yyyy-MM-dd')
			counts.set(dateKey, (counts.get(dateKey) || 0) + 1)
		})
		return counts
	}, [allItems])

	const handleDayClick = (day: any) => {
		selectDate(day.date)
		onDateSelect(day.date)
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header de navegación */}
			<div className="px-4 py-3 flex items-center justify-between border-b border-border">
				<Button
					variant="ghost"
					size="sm"
					onClick={goToPreviousMonth}
					className="h-8 w-8 p-0"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				
				<div className="flex items-center gap-2">
					<h2 className="text-base font-semibold capitalize">
						{calendarView.monthName} {calendarView.yearString}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={goToToday}
						className="h-7 px-2 text-xs"
					>
						Hoy
					</Button>
				</div>
				
				<Button
					variant="ghost"
					size="sm"
					onClick={goToNextMonth}
					className="h-8 w-8 p-0"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Calendario compacto */}
			<div className="flex-1 p-4">
				{/* Días de la semana */}
				<div className="grid grid-cols-7 gap-1 mb-2">
					{weekDays.map((day) => (
						<div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
							{day}
						</div>
					))}
				</div>

				{/* Grid de días */}
				<div className="grid grid-cols-7 gap-1">
					{calendarView.days.map((day, index) => {
						const dateKey = format(day.date, 'yyyy-MM-dd')
						const eventCount = eventCountByDate.get(dateKey) || 0
						const isSelected = selectedDate && isSameDay(day.date, selectedDate)

						return (
							<button
								key={index}
								onClick={() => handleDayClick(day)}
								className={cn(
									"aspect-square rounded-lg p-1 text-sm transition-all relative",
									"flex flex-col items-center justify-center",
									day.isCurrentMonth ? "text-foreground" : "text-muted-foreground",
									day.isToday && "bg-primary text-primary-foreground font-semibold",
									isSelected && !day.isToday && "bg-accent ring-2 ring-primary",
									!day.isToday && !isSelected && "hover:bg-accent"
								)}
							>
								<span>{day.dayNumber}</span>
								{eventCount > 0 && (
									<div className="flex gap-0.5 mt-0.5">
										{Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
											<div
												key={i}
												className={cn(
													"w-1 h-1 rounded-full",
													day.isToday ? "bg-primary-foreground" : "bg-primary"
												)}
											/>
										))}
									</div>
								)}
							</button>
						)
					})}
				</div>

				{/* Lista de eventos del día seleccionado */}
				{selectedDate && (
					<div className="mt-6">
						<h3 className="text-sm font-semibold mb-3">
							{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
						</h3>
						<DayEventsList
							date={selectedDate}
							events={allItems.filter(item =>
								isSameDay(new Date(item.start_time), selectedDate)
							)}
							onEventClick={onEventClick}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

// Componente para mostrar eventos del día seleccionado
function DayEventsList({ date, events, onEventClick }: { date: Date, events: any[], onEventClick: (event: any) => void }) {
	if (events.length === 0) {
		return (
			<div className="text-center py-4">
				<p className="text-sm text-muted-foreground">Sin eventos este día</p>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{events.map((event) => (
				<div
					key={event.id}
					onClick={() => onEventClick(event)}
					className="p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent transition-colors"
					style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
				>
					<div className="flex items-start gap-2">
						<div className="flex-1 min-w-0">
							<h4 className="font-medium text-sm truncate">{event.title}</h4>
							{event.description && (
								<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
									{event.description}
								</p>
							)}
							{event.type === 'task' && (
								<span className="inline-block mt-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
									Tarea
								</span>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
