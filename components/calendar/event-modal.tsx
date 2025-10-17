"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
	Calendar as CalendarIcon, 
	Clock, 
	MapPin, 
	Palette,
	Save,
	X
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar'
import { toast } from 'sonner'
import type { GoogleCalendarEvent, GoogleCalendar } from '@/lib/google-calendar/client'

interface EventModalProps {
	isOpen: boolean
	onClose: () => void
	event?: GoogleCalendarEvent | null
	calendars: GoogleCalendar[]
	selectedDate?: Date
	onEventSaved?: (event: GoogleCalendarEvent) => void
	onEventDeleted?: (eventId: string) => void
}

interface EventFormData {
	title: string
	description: string
	location: string
	startDate: Date
	endDate: Date
	allDay: boolean
	calendarId: string
	colorId: string
	reminders: boolean
}

const COLOR_OPTIONS = [
	{ id: '1', name: 'Azul', color: 'bg-blue-500' },
	{ id: '2', name: 'Verde', color: 'bg-green-500' },
	{ id: '3', name: 'Púrpura', color: 'bg-purple-500' },
	{ id: '4', name: 'Rojo', color: 'bg-red-500' },
	{ id: '5', name: 'Amarillo', color: 'bg-yellow-500' },
	{ id: '6', name: 'Naranja', color: 'bg-orange-500' },
	{ id: '7', name: 'Verde azulado', color: 'bg-teal-500' },
	{ id: '8', name: 'Gris', color: 'bg-gray-500' },
	{ id: '9', name: 'Índigo', color: 'bg-indigo-500' },
	{ id: '10', name: 'Verde claro', color: 'bg-green-400' },
	{ id: '11', name: 'Rojo claro', color: 'bg-red-400' }
]

export function EventModal({
	isOpen,
	onClose,
	event,
	calendars,
	selectedDate,
	onEventSaved,
	onEventDeleted
}: EventModalProps) {
	const [formData, setFormData] = useState<EventFormData>({
		title: '',
		description: '',
		location: '',
		startDate: new Date(),
		endDate: new Date(Date.now() + 60 * 60 * 1000), // +1 hora
		allDay: false,
		calendarId: '',
		colorId: '1',
		reminders: true
	})
	
	const [isLoading, setIsLoading] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showStartCalendar, setShowStartCalendar] = useState(false)
	const [showEndCalendar, setShowEndCalendar] = useState(false)

	// Inicializar formulario
	useEffect(() => {
		if (event) {
			// Editar evento existente
			const startDate = event.start?.dateTime ? parseISO(event.start.dateTime) : 
							 event.start?.date ? parseISO(event.start.date) : new Date()
			const endDate = event.end?.dateTime ? parseISO(event.end.dateTime) : 
						   event.end?.date ? parseISO(event.end.date) : new Date(Date.now() + 60 * 60 * 1000)
			
			setFormData({
				title: event.summary || '',
				description: event.description || '',
				location: event.location || '',
				startDate,
				endDate,
				allDay: !event.start?.dateTime,
				calendarId: '', // Se determinará por el contexto
				colorId: event.colorId || '1',
				reminders: !!(event.reminders && !event.reminders.useDefault)
			})
		} else if (selectedDate) {
			// Nuevo evento
			setFormData(prev => ({
				...prev,
				startDate: selectedDate,
				endDate: new Date(selectedDate.getTime() + 60 * 60 * 1000),
				calendarId: calendars.find(cal => cal.primary)?.id || calendars[0]?.id || ''
			}))
		}
	}, [event, selectedDate, calendars])

	// Manejar cambios en el formulario
	const handleInputChange = (field: keyof EventFormData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	// Manejar cambio de fecha de inicio
	const handleStartDateChange = (date: Date) => {
		setFormData(prev => {
			const newEndDate = new Date(date.getTime() + (prev.endDate.getTime() - prev.startDate.getTime()))
			return { ...prev, startDate: date, endDate: newEndDate }
		})
		setShowStartCalendar(false)
	}

	// Manejar cambio de fecha de fin
	const handleEndDateChange = (date: Date) => {
		setFormData(prev => ({ ...prev, endDate: date }))
		setShowEndCalendar(false)
	}

	// Manejar cambio de evento de día completo
	const handleAllDayChange = (allDay: boolean) => {
		setFormData(prev => {
			if (allDay) {
				// Convertir a evento de día completo
				const startOfDay = new Date(prev.startDate)
				startOfDay.setHours(0, 0, 0, 0)
				const endOfDay = new Date(prev.startDate)
				endOfDay.setHours(23, 59, 59, 999)
				return { ...prev, allDay, startDate: startOfDay, endDate: endOfDay }
			} else {
				// Convertir a evento con hora
				const startTime = new Date(prev.startDate)
				startTime.setHours(9, 0, 0, 0)
				const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
				return { ...prev, allDay, startDate: startTime, endDate: endTime }
			}
		})
	}

	// Guardar evento
	const handleSave = async () => {
		if (!formData.title.trim()) {
			toast.error('El título es obligatorio')
			return
		}

		if (!formData.calendarId) {
			toast.error('Selecciona un calendario')
			return
		}

		setIsLoading(true)

		try {
			const eventData: Omit<GoogleCalendarEvent, 'id'> = {
				summary: formData.title,
				description: formData.description,
				location: formData.location,
				start: formData.allDay 
					? { date: format(formData.startDate, 'yyyy-MM-dd') }
					: { dateTime: formData.startDate.toISOString() },
				end: formData.allDay 
					? { date: format(formData.endDate, 'yyyy-MM-dd') }
					: { dateTime: formData.endDate.toISOString() },
				colorId: formData.colorId,
				reminders: formData.reminders ? {
					useDefault: false,
					overrides: [
						{ method: 'popup', minutes: 15 },
						{ method: 'email', minutes: 30 }
					]
				} : { useDefault: true }
			}

			let result
			if (event?.id) {
				// Actualizar evento existente
				result = await updateCalendarEvent(formData.calendarId, event.id, eventData)
			} else {
				// Crear nuevo evento
				result = await createCalendarEvent(formData.calendarId, eventData)
			}

			if (result.success && result.event) {
				toast.success(event?.id ? 'Evento actualizado' : 'Evento creado')
				onEventSaved?.(result.event)
				onClose()
			} else {
				toast.error(result.error || 'Error guardando evento')
			}
		} catch (error) {
			console.error('Error guardando evento:', error)
			toast.error('Error interno del servidor')
		} finally {
			setIsLoading(false)
		}
	}

	// Eliminar evento
	const handleDelete = async () => {
		if (!event?.id) return

		setIsDeleting(true)

		try {
			const result = await deleteCalendarEvent(formData.calendarId, event.id)
			if (result.success) {
				toast.success('Evento eliminado')
				onEventDeleted?.(event.id)
				onClose()
			} else {
				toast.error(result.error || 'Error eliminando evento')
			}
		} catch (error) {
			console.error('Error eliminando evento:', error)
			toast.error('Error interno del servidor')
		} finally {
			setIsDeleting(false)
		}
	}

	// Cerrar modal
	const handleClose = () => {
		if (!isLoading && !isDeleting) {
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<CalendarIcon className="h-5 w-5" />
						{event ? 'Editar Evento' : 'Nuevo Evento'}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Título */}
					<div className="space-y-2">
						<Label htmlFor="title">Título *</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={(e) => handleInputChange('title', e.target.value)}
							placeholder="Título del evento"
						/>
					</div>

					{/* Descripción */}
					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => handleInputChange('description', e.target.value)}
							placeholder="Descripción del evento"
							rows={3}
						/>
					</div>

					{/* Ubicación */}
					<div className="space-y-2">
						<Label htmlFor="location" className="flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							Ubicación
						</Label>
						<Input
							id="location"
							value={formData.location}
							onChange={(e) => handleInputChange('location', e.target.value)}
							placeholder="Ubicación del evento"
						/>
					</div>

					{/* Calendario */}
					<div className="space-y-2">
						<Label>Calendario *</Label>
						<Select value={formData.calendarId} onValueChange={(value) => handleInputChange('calendarId', value)}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un calendario" />
							</SelectTrigger>
							<SelectContent>
								{calendars.map((calendar) => (
									<SelectItem key={calendar.id} value={calendar.id}>
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-full" 
												style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
											/>
											{calendar.summary}
											{calendar.primary && (
												<Badge variant="secondary" className="text-xs">Principal</Badge>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Evento de día completo */}
					<div className="flex items-center space-x-2">
						<Switch
							id="allDay"
							checked={formData.allDay}
							onCheckedChange={handleAllDayChange}
						/>
						<Label htmlFor="allDay">Evento de día completo</Label>
					</div>

					{/* Fechas y horas */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Fecha de inicio */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								{formData.allDay ? 'Fecha de inicio' : 'Inicio'}
							</Label>
							<Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!formData.startDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.allDay 
											? format(formData.startDate, 'dd/MM/yyyy', { locale: es })
											: format(formData.startDate, 'dd/MM/yyyy HH:mm', { locale: es })
										}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={formData.startDate}
										onSelect={(date) => date && handleStartDateChange(date)}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* Fecha de fin */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								{formData.allDay ? 'Fecha de fin' : 'Fin'}
							</Label>
							<Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!formData.endDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.allDay 
											? format(formData.endDate, 'dd/MM/yyyy', { locale: es })
											: format(formData.endDate, 'dd/MM/yyyy HH:mm', { locale: es })
										}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={formData.endDate}
										onSelect={(date) => date && handleEndDateChange(date)}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					{/* Color */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Palette className="h-4 w-4" />
							Color
						</Label>
						<div className="flex flex-wrap gap-2">
							{COLOR_OPTIONS.map((color) => (
								<Button
									key={color.id}
									variant={formData.colorId === color.id ? "default" : "outline"}
									size="sm"
									className="flex items-center gap-2"
									onClick={() => handleInputChange('colorId', color.id)}
								>
									<div className={cn("w-3 h-3 rounded-full", color.color)} />
									{color.name}
								</Button>
							))}
						</div>
					</div>

					{/* Recordatorios */}
					<div className="flex items-center space-x-2">
						<Switch
							id="reminders"
							checked={formData.reminders}
							onCheckedChange={(checked) => handleInputChange('reminders', checked)}
						/>
						<Label htmlFor="reminders">Activar recordatorios</Label>
					</div>
				</div>

				<DialogFooter className="flex justify-between">
					<div>
						{event && (
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={isLoading || isDeleting}
							>
								<X className="h-4 w-4 mr-2" />
								{isDeleting ? 'Eliminando...' : 'Eliminar'}
							</Button>
						)}
					</div>
					
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleClose} disabled={isLoading || isDeleting}>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={isLoading || isDeleting}>
							<Save className="h-4 w-4 mr-2" />
							{isLoading ? 'Guardando...' : 'Guardar'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
