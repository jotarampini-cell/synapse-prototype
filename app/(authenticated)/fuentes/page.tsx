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
import { DebugGoogleAuth } from "@/components/debug-google-auth"
import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync"
import { useCalendar } from "@/hooks/use-calendar"
import type { GoogleCalendarEvent } from "@/lib/google-calendar/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CalendarPage() {
	const { isMobile } = useMobileDetection()
	const [showEventModal, setShowEventModal] = useState(false)
	const [showSyncSettings, setShowSyncSettings] = useState(false)
	const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null)
	const [eventToEdit, setEventToEdit] = useState<GoogleCalendarEvent | null>(null)

	const {
		selectedDate,
		selectDate
	} = useCalendar()

	const {
		calendars,
		selectedCalendar,
		todayEvents,
		weekEvents,
		monthEvents,
		syncStatus,
		syncSettings,
		loadAllEvents,
		loadCalendars
	} = useGoogleCalendarSync()

	// Detectar cuando el usuario regresa del OAuth
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('connected') === 'true') {
			// Verificar si la sesión tiene los permisos correctos
			const checkSession = async () => {
				try {
					const { createClient } = await import('@/lib/supabase/client');
					const supabase = createClient();
					const { data: { session } } = await supabase.auth.getSession();
					
					if (session?.provider_token) {
						toast.success("¡Conectado con Google Calendar!");
						// Recargar calendarios después de la conexión
						setTimeout(() => {
							loadCalendars();
						}, 1000);
					} else {
						toast.error("No se pudo obtener el token de Google. Intenta de nuevo.");
					}
				} catch (error) {
					console.error("Error verificando sesión:", error);
					toast.error("Error al verificar la conexión con Google");
				}
			};
			
			checkSession();
			// Limpiar la URL
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, [loadCalendars]);

	// Obtener eventos del día seleccionado
	const selectedDayEvents = selectedDate ? todayEvents.filter(event => {
		const eventDate = new Date(event.start.dateTime || event.start.date || '')
		return eventDate.toDateString() === selectedDate.toDateString()
	}) : []

	// Manejar eventos
	const handleDateSelect = (date: Date) => {
		selectDate(date)
	}

	const handleEventClick = (event: GoogleCalendarEvent) => {
		setSelectedEvent(event)
	}

	const handleEditEvent = (event: GoogleCalendarEvent) => {
		setEventToEdit(event)
		setShowEventModal(true)
	}

	const handleDeleteEvent = (event: GoogleCalendarEvent) => {
		// Implementar eliminación de evento
		console.log('Eliminar evento:', event)
	}

	const handleAddEvent = (date: Date | null) => {
		setEventToEdit(null)
		setShowEventModal(true)
	}

	const handleEventSaved = (event: GoogleCalendarEvent) => {
		// Recargar eventos
		if (selectedCalendar) {
			loadAllEvents(selectedCalendar.id)
		}
	}

	const handleEventDeleted = (eventId: string) => {
		// Recargar eventos
		if (selectedCalendar) {
			loadAllEvents(selectedCalendar.id)
		}
	}

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top min-w-0">
					<div className="flex items-center gap-2 min-w-0 flex-shrink-0">
						<CalendarIcon className="h-5 w-5 text-primary flex-shrink-0" />
						<h1 className="text-lg font-semibold truncate">Calendario</h1>
					</div>
					<div className="flex-1 min-w-0" />
					<div className="flex items-center gap-1 min-w-0 flex-shrink-0">
						{/* Botón temporal para probar */}
						<Button
							variant="outline"
							size="sm"
							onClick={async () => {
								try {
									// Verificar si hay configuración de sincronización
									if (!syncSettings) {
										toast.info("Configurando Google Calendar...");
										// Abrir modal de configuración
										setShowSyncSettings(true);
										return;
									}
									
									// Si ya hay configuración, mostrar estado
									toast.success("¡Google Calendar configurado!");
									console.log("Estado de sincronización:", syncStatus);
									console.log("Calendarios disponibles:", calendars.length);
									console.log("Configuración actual:", syncSettings);
								} catch (error) {
									toast.error("Error al verificar configuración");
									console.error("Error:", error);
								}
							}}
							className="text-xs px-2 py-1 h-8 flex-shrink-0"
						>
							🧪 Test
						</Button>
					<Button 
						variant="ghost" 
						size="icon-mobile" 
							onClick={() => setShowSyncSettings(true)}
							className="touch-target flex-shrink-0"
					>
							<Settings className="h-5 w-5" />
					</Button>
					<Button 
						variant="ghost" 
						size="icon-mobile"
							onClick={() => selectedCalendar && loadAllEvents(selectedCalendar.id)}
							className="touch-target flex-shrink-0"
							disabled={syncStatus.isSyncing}
					>
							<RefreshCw className={cn("h-5 w-5", syncStatus.isSyncing && "animate-spin")} />
					</Button>
					</div>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-4">
						{/* Vista del calendario */}
						<CalendarView
							onDateSelect={handleDateSelect}
							onEventClick={handleEventClick}
							onAddEvent={handleAddEvent}
						/>

						{/* Lista de eventos del día seleccionado */}
						{selectedDate && (
							<EventList
								events={selectedDayEvents}
								selectedDate={selectedDate}
								onEventClick={handleEventClick}
								onEditEvent={handleEditEvent}
								onDeleteEvent={handleDeleteEvent}
							/>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB para agregar evento */}
				<Button
					onClick={() => handleAddEvent(selectedDate)}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 touch-target"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Modales */}
				<EventModal
					isOpen={showEventModal}
					onClose={() => setShowEventModal(false)}
					event={eventToEdit}
					calendars={calendars}
					selectedDate={selectedDate || undefined}
					onEventSaved={handleEventSaved}
					onEventDeleted={handleEventDeleted}
				/>

				<SyncSettingsModal
					isOpen={showSyncSettings}
					onClose={() => setShowSyncSettings(false)}
				/>
				
				{/* Componente de diagnóstico temporal */}
				<div className="mt-6">
					<DebugGoogleAuth />
				</div>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center justify-between border-b border-border">
				<div className="flex items-center gap-3">
					<CalendarIcon className="h-6 w-6 text-primary" />
					<h1 className="text-2xl font-bold">Calendario</h1>
					{syncStatus.isSyncing && (
						<Badge variant="outline" className="animate-pulse">
							<RefreshCw className="h-3 w-3 mr-1 animate-spin" />
							Sincronizando...
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-4">
					{/* Botón temporal para probar */}
					<Button
						variant="secondary"
						onClick={async () => {
							try {
								// Verificar si hay configuración de sincronización
								if (!syncSettings) {
									toast.info("Configurando Google Calendar...");
									// Abrir modal de configuración
									setShowSyncSettings(true);
									return;
								}
								
								// Si ya hay configuración, mostrar estado
								toast.success("¡Google Calendar configurado!");
								console.log("Estado de sincronización:", syncStatus);
								console.log("Calendarios disponibles:", calendars.length);
								console.log("Configuración actual:", syncSettings);
							} catch (error) {
								toast.error("Error al verificar configuración");
								console.error("Error:", error);
							}
						}}
						className="bg-green-100 text-green-700 hover:bg-green-200"
					>
						🧪 Test Google Calendar
					</Button>
					<Button 
						variant="outline"
						onClick={() => setShowSyncSettings(true)}
					>
						<Settings className="h-4 w-4 mr-2" />
						Configuración
					</Button>
					<Button 
						variant="outline"
						onClick={() => selectedCalendar && loadAllEvents(selectedCalendar.id)}
						disabled={syncStatus.isSyncing}
					>
						<RefreshCw className={cn("h-4 w-4 mr-2", syncStatus.isSyncing && "animate-spin")} />
						Actualizar
					</Button>
					<Button onClick={() => handleAddEvent(selectedDate || new Date())}>
						<Plus className="h-4 w-4 mr-2" />
						Nuevo Evento
					</Button>
				</div>
			</header>
			
			<main className="flex-1 p-6 overflow-hidden">
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
				<EventModal
					isOpen={showEventModal}
					onClose={() => setShowEventModal(false)}
					event={eventToEdit}
					calendars={calendars}
					selectedDate={selectedDate || undefined}
					onEventSaved={handleEventSaved}
					onEventDeleted={handleEventDeleted}
				/>

				<SyncSettingsModal
					isOpen={showSyncSettings}
					onClose={() => setShowSyncSettings(false)}
				/>
				
				{/* Componente de diagnóstico temporal */}
				<div className="p-4">
					<DebugGoogleAuth />
				</div>
			</div>
	)
}