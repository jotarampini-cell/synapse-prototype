"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, MapPin, Palette, Save, X } from 'lucide-react'
import { format, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { useInternalCalendar } from '@/hooks/use-internal-calendar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InternalEventModalProps {
	isOpen: boolean
	onClose: () => void
	event?: any | null
	selectedDate?: Date
	onEventSaved?: (event: any) => void
	onEventDeleted?: (eventId: string) => void
}

interface EventFormData {
	title: string
	description: string
	location: string
	startDate: Date
	endDate: Date
	allDay: boolean
	color: string
	reminderMinutes: number
}

const COLOR_OPTIONS = [
	{ id: '#3b82f6', name: 'Azul', color: 'bg-blue-500' },
	{ id: '#10b981', name: 'Verde', color: 'bg-green-500' },
	{ id: '#8b5cf6', name: 'Púrpura', color: 'bg-purple-500' },
	{ id: '#ef4444', name: 'Rojo', color: 'bg-red-500' },
	{ id: '#f59e0b', name: 'Amarillo', color: 'bg-yellow-500' },
	{ id: '#f97316', name: 'Naranja', color: 'bg-orange-500' },
	{ id: '#14b8a6', name: 'Verde azulado', color: 'bg-teal-500' },
	{ id: '#6b7280', name: 'Gris', color: 'bg-gray-500' }
]

export function InternalEventModal({
	isOpen,
	onClose,
	event,
	selectedDate,
	onEventSaved,
	onEventDeleted
}: InternalEventModalProps) {
	const [formData, setFormData] = useState<EventFormData>({
		title: '',
		description: '',
		location: '',
		startDate: new Date(),
		endDate: addHours(new Date(), 1),
		allDay: false,
		color: '#3b82f6',
		reminderMinutes: 15
	})
	
	const [isLoading, setIsLoading] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const { createEvent, updateEvent, deleteEvent } = useInternalCalendar()

	// Inicializar formulario
	useEffect(() => {
		if (event) {
			// Editar evento existente
			const startDate = new Date(event.start_time)
			const endDate = new Date(event.end_time)
			
			setFormData({
				title: event.title || '',
				description: event.description || '',
				location: event.location || '',
				startDate,
				endDate,
				allDay: event.all_day || false,
				color: event.color || '#3b82f6',
				reminderMinutes: event.reminder_minutes || 15
			})
		} else if (selectedDate) {
			// Nuevo evento con fecha seleccionada
			const startDate = selectedDate
			const endDate = addHours(selectedDate, 1)
			
			setFormData(prev => ({
				...prev,
				startDate,
				endDate
			}))
		} else {
			// Nuevo evento sin fecha específica
			const now = new Date()
			setFormData(prev => ({
				...prev,
				startDate: now,
				endDate: addHours(now, 1)
			}))
		}
	}, [event, selectedDate])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.title.trim()) {
			toast.error('El título es obligatorio')
			return
		}

		setIsLoading(true)
		try {
			const eventData = {
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				location: formData.location.trim() || null,
				start_time: formData.startDate.toISOString(),
				end_time: formData.endDate.toISOString(),
				all_day: formData.allDay,
				color: formData.color,
				reminder_minutes: formData.reminderMinutes
			}

			let savedEvent
			if (event) {
				savedEvent = await updateEvent(event.id, eventData)
				toast.success('Evento actualizado correctamente')
			} else {
				savedEvent = await createEvent(eventData)
				toast.success('Evento creado correctamente')
			}

			onEventSaved?.(savedEvent)
			onClose()
		} catch (error) {
			console.error('Error saving event:', error)
			toast.error('Error al guardar el evento')
		} finally {
			setIsLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!event) return

		setIsDeleting(true)
		try {
			await deleteEvent(event.id)
			toast.success('Evento eliminado correctamente')
			onEventDeleted?.(event.id)
			onClose()
		} catch (error) {
			console.error('Error deleting event:', error)
			toast.error('Error al eliminar el evento')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleAllDayChange = (checked: boolean) => {
		setFormData(prev => {
			if (checked) {
				// Todo el día: establecer inicio a las 00:00 y fin a las 23:59
				const start = new Date(prev.startDate)
				start.setHours(0, 0, 0, 0)
				const end = new Date(prev.startDate)
				end.setHours(23, 59, 59, 999)
				return { ...prev, allDay: checked, startDate: start, endDate: end }
			} else {
				// Con horario: mantener fecha pero agregar 1 hora de duración
				const end = addHours(prev.startDate, 1)
				return { ...prev, allDay: checked, endDate: end }
			}
		})
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md mx-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						{event ? 'Editar Evento' : 'Nuevo Evento'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Título */}
					<div>
						<Label htmlFor="title">Título *</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
							placeholder="Nombre del evento"
							required
						/>
					</div>

					{/* Descripción */}
					<div>
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
							placeholder="Detalles del evento"
							rows={3}
						/>
					</div>

					{/* Ubicación */}
					<div>
						<Label htmlFor="location">Ubicación</Label>
						<Input
							id="location"
							value={formData.location}
							onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
							placeholder="Lugar del evento"
						/>
					</div>

					{/* Todo el día */}
					<div className="flex items-center space-x-2">
						<Switch
							id="allDay"
							checked={formData.allDay}
							onCheckedChange={handleAllDayChange}
						/>
						<Label htmlFor="allDay">Todo el día</Label>
					</div>

					{/* Fecha y hora de inicio */}
					<div>
						<Label>Fecha y hora de inicio</Label>
						<div className="flex gap-2">
							<Input
								type="date"
								value={format(formData.startDate, 'yyyy-MM-dd')}
								onChange={(e) => {
									const newDate = new Date(e.target.value)
									if (!formData.allDay) {
										newDate.setHours(formData.startDate.getHours(), formData.startDate.getMinutes())
									}
									setFormData(prev => ({ ...prev, startDate: newDate }))
								}}
								className="flex-1"
							/>
							{!formData.allDay && (
								<Input
									type="time"
									value={format(formData.startDate, 'HH:mm')}
									onChange={(e) => {
										const [hours, minutes] = e.target.value.split(':').map(Number)
										const newDate = new Date(formData.startDate)
										newDate.setHours(hours, minutes)
										setFormData(prev => ({ ...prev, startDate: newDate }))
									}}
									className="w-24"
								/>
							)}
						</div>
					</div>

					{/* Fecha y hora de fin */}
					<div>
						<Label>Fecha y hora de fin</Label>
						<div className="flex gap-2">
							<Input
								type="date"
								value={format(formData.endDate, 'yyyy-MM-dd')}
								onChange={(e) => {
									const newDate = new Date(e.target.value)
									if (!formData.allDay) {
										newDate.setHours(formData.endDate.getHours(), formData.endDate.getMinutes())
									}
									setFormData(prev => ({ ...prev, endDate: newDate }))
								}}
								className="flex-1"
							/>
							{!formData.allDay && (
								<Input
									type="time"
									value={format(formData.endDate, 'HH:mm')}
									onChange={(e) => {
										const [hours, minutes] = e.target.value.split(':').map(Number)
										const newDate = new Date(formData.endDate)
										newDate.setHours(hours, minutes)
										setFormData(prev => ({ ...prev, endDate: newDate }))
									}}
									className="w-24"
								/>
							)}
						</div>
					</div>

					{/* Color */}
					<div>
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2 mt-2">
							{COLOR_OPTIONS.map((color) => (
								<button
									key={color.id}
									type="button"
									onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
									className={cn(
										"w-8 h-8 rounded-full border-2 transition-all",
										color.color,
										formData.color === color.id ? "border-foreground scale-110" : "border-transparent"
									)}
									title={color.name}
								/>
							))}
						</div>
					</div>

					{/* Recordatorio */}
					<div>
						<Label htmlFor="reminder">Recordatorio (minutos antes)</Label>
						<Input
							id="reminder"
							type="number"
							min="0"
							max="1440"
							value={formData.reminderMinutes}
							onChange={(e) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) || 0 }))}
						/>
					</div>

					<DialogFooter className="flex gap-2">
						{event && (
							<Button
								type="button"
								variant="destructive"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								<X className="h-4 w-4 mr-2" />
								{isDeleting ? 'Eliminando...' : 'Eliminar'}
							</Button>
						)}
						<Button type="button" variant="outline" onClick={onClose}>
							Cancelar
						</Button>
						<Button type="submit" disabled={isLoading}>
							<Save className="h-4 w-4 mr-2" />
							{isLoading ? 'Guardando...' : 'Guardar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
