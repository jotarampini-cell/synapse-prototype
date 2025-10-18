"use client"

import { useState, useEffect } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Calendar as CalendarIcon,
	Plus,
	Settings,
	RefreshCw
} from "lucide-react"
import { CalendarView } from "@/components/calendar/calendar-view"
import { EventList } from "@/components/calendar/event-list"
import { EventModal } from "@/components/calendar/event-modal"
import { SyncSettingsModal } from "@/components/calendar/sync-settings-modal"
import { InternalEventModal } from "@/components/calendar/internal-event-modal"
import { MobileMonthView } from "@/components/calendar/mobile-month-view"
import { MobileAgendaView } from "@/components/calendar/mobile-agenda-view"
import '@/styles/calendar-mobile.css'
import { DebugGoogleAuth } from "@/components/debug-google-auth"
// import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync"
import { useCalendar } from "@/hooks/use-calendar"
import { useInternalCalendar } from "@/hooks/use-internal-calendar"
// import type { GoogleCalendarEvent } from "@/lib/google-calendar/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CalendarPage() {
	const { isMobile } = useMobileDetection()
	const [showEventModal, setShowEventModal] = useState(false)
	const [showSyncSettings, setShowSyncSettings] = useState(false)
	const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
	const [eventToEdit, setEventToEdit] = useState<any | null>(null)
	const [view, setView] = useState<'month' | 'agenda'>('month')

	const {
		selectedDate,
		selectDate
	} = useCalendar()

	const {
		allItems,
		isLoading,
		loadEvents,
		createEvent,
		updateEvent,
		deleteEvent
	} = useInternalCalendar()

	// Cargar eventos al montar el componente
	useEffect(() => {
		const startDate = new Date()
		startDate.setMonth(startDate.getMonth() - 1)
		const endDate = new Date()
		endDate.setMonth(endDate.getMonth() + 2)
		loadEvents(startDate, endDate)
	}, [loadEvents])

	// Obtener eventos del día seleccionado
	const selectedDayEvents = selectedDate ? allItems.filter(event => {
		const eventDate = new Date(event.start_time)
		return eventDate.toDateString() === selectedDate.toDateString()
	}) : []

	// Manejar eventos
	const handleDateSelect = (date: Date) => {
		selectDate(date)
	}

	const handleEventClick = (event: any) => {
		setSelectedEvent(event)
	}

	const handleEditEvent = (event: any) => {
		setEventToEdit(event)
		setShowEventModal(true)
	}

	const handleDeleteEvent = (event: any) => {
		// Implementar eliminación de evento
		console.log('Eliminar evento:', event)
	}

	const handleAddEvent = (date: Date | null) => {
		setEventToEdit(null)
		setShowEventModal(true)
	}

	const handleEventSaved = (event: any) => {
		// Recargar eventos
		const startDate = new Date()
		startDate.setMonth(startDate.getMonth() - 1)
		const endDate = new Date()
		endDate.setMonth(endDate.getMonth() + 2)
		loadEvents(startDate, endDate)
	}

	const handleEventDeleted = (eventId: string) => {
		// Recargar eventos
		const startDate = new Date()
		startDate.setMonth(startDate.getMonth() - 1)
		const endDate = new Date()
		endDate.setMonth(endDate.getMonth() + 2)
		loadEvents(startDate, endDate)
	}


	// Layout móvil
	if (isMobile) {
		return (
			<div className="mobile-page-container bg-background calendar-mobile-container">
				{/* Header moderno con tabs */}
				<header className="border-b border-border bg-background safe-area-top">
					<div className="h-14 px-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-5 w-5 text-primary" />
							<h1 className="text-lg font-semibold">Calendario</h1>
						</div>
						<div className="flex items-center gap-1">
							<Badge variant="outline" className="text-xs text-muted-foreground">
								Google Calendar próximamente
							</Badge>
							<Button 
								variant="ghost" 
								size="icon-mobile"
								onClick={() => handleAddEvent(selectedDate)}
								className="touch-target"
							>
								<Plus className="h-5 w-5" />
							</Button>
						</div>
					</div>
					
					{/* Tabs para cambiar vista */}
					<div className="flex border-t border-border">
						<button
							onClick={() => setView('month')}
							className={cn(
								"flex-1 py-3 text-sm font-medium transition-colors",
								view === 'month' 
									? "text-primary border-b-2 border-primary" 
									: "text-muted-foreground"
							)}
						>
							Mes
						</button>
						<button
							onClick={() => setView('agenda')}
							className={cn(
								"flex-1 py-3 text-sm font-medium transition-colors",
								view === 'agenda' 
									? "text-primary border-b-2 border-primary" 
									: "text-muted-foreground"
							)}
						>
							Agenda
						</button>
					</div>
				</header>

				{/* Contenido según vista seleccionada */}
				<main className="mobile-page-main calendar-mobile-main">
					{view === 'month' ? (
						<MobileMonthView
							onDateSelect={handleDateSelect}
							onEventClick={handleEventClick}
						/>
					) : (
						<MobileAgendaView
							events={allItems}
							onEventClick={handleEventClick}
							onEditEvent={handleEditEvent}
							onDeleteEvent={handleDeleteEvent}
						/>
					)}
				</main>

				<MobileBottomNav />
				
				{/* Modales */}
				<InternalEventModal
					isOpen={showEventModal}
					onClose={() => setShowEventModal(false)}
					event={eventToEdit}
					selectedDate={selectedDate}
					onEventSaved={handleEventSaved}
					onEventDeleted={handleEventDeleted}
				/>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="desktop-page-container bg-background">
			<header className="h-16 px-6 flex items-center justify-between border-b border-border">
				<div className="flex items-center gap-3">
					<CalendarIcon className="h-6 w-6 text-primary" />
					<h1 className="text-2xl font-bold">Calendario</h1>
				</div>
				<div className="flex items-center gap-4">
					<Badge variant="outline" className="text-sm">
						Google Calendar próximamente
					</Badge>
					<Button onClick={() => handleAddEvent(selectedDate || new Date())}>
						<Plus className="h-4 w-4 mr-2" />
						Nuevo Evento
					</Button>
				</div>
			</header>
			
			<main className="desktop-page-main p-6">
				<div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Calendario - 2/3 del ancho */}
					<div className="lg:col-span-2">
						<CalendarView
							onDateSelect={handleDateSelect}
							onEventClick={handleEventClick}
							onAddEvent={handleAddEvent}
							className="h-full"
						/>
					</div>

					{/* Panel de eventos - 1/3 del ancho */}
					<div className="lg:col-span-1">
						{selectedDate ? (
							<EventList
								events={selectedDayEvents}
								selectedDate={selectedDate}
								onEventClick={handleEventClick}
								onEditEvent={handleEditEvent}
								onDeleteEvent={handleDeleteEvent}
								className="h-full"
							/>
						) : (
							<Card className="h-full p-6 flex items-center justify-center">
								<div className="text-center">
									<CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
									<h3 className="text-lg font-semibold mb-2">Selecciona un día</h3>
									<p className="text-muted-foreground">
										Haz clic en un día del calendario para ver sus eventos
									</p>
									</div>
								</Card>
						)}
					</div>
				</div>
			</main>

			{/* Modales */}
				<InternalEventModal
					isOpen={showEventModal}
					onClose={() => setShowEventModal(false)}
					event={eventToEdit}
					selectedDate={selectedDate}
					onEventSaved={handleEventSaved}
					onEventDeleted={handleEventDeleted}
				/>
			</div>
	)
}