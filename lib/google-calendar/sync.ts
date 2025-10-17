import { GoogleCalendarEvent } from './client'
import type { Task } from '@/app/actions/tasks'

/**
 * Mapeo de prioridades de tareas a colores de Google Calendar
 */
export const PRIORITY_COLOR_MAP = {
	high: '11',    // Rojo
	medium: '5',   // Amarillo
	low: '10'      // Verde
} as const

/**
 * Convierte una tarea de Synapse a un evento de Google Calendar
 */
export function syncTaskToCalendar(task: Task): GoogleCalendarEvent {
	const startDate = task.due_date ? new Date(task.due_date) : new Date()
	const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 hora por defecto
	
	// Agregar etiqueta [Synapse] al título para identificación
	const title = task.title.startsWith('[Synapse]') ? task.title : `[Synapse] ${task.title}`
	
	// Construir descripción con información adicional
	let description = task.description || ''
	if (task.estimated_time) {
		description += `\n\n⏱️ Tiempo estimado: ${task.estimated_time}`
	}
	if (task.tags && task.tags.length > 0) {
		description += `\n\n🏷️ Etiquetas: ${task.tags.join(', ')}`
	}
	if (task.notes) {
		description += `\n\n📝 Notas: ${task.notes}`
	}
	description += `\n\n🔗 Creado desde Synapse - ID: ${task.id}`
	
	const event: GoogleCalendarEvent = {
		summary: title,
		description: description.trim(),
		start: {
			dateTime: startDate.toISOString(),
			timeZone: 'America/Mexico_City' // Ajustar según zona horaria del usuario
		},
		end: {
			dateTime: endDate.toISOString(),
			timeZone: 'America/Mexico_City'
		},
		colorId: PRIORITY_COLOR_MAP[task.priority] || PRIORITY_COLOR_MAP.medium,
		reminders: {
			useDefault: false,
			overrides: [
				{ method: 'popup', minutes: 15 },
				{ method: 'email', minutes: 30 }
			]
		}
	}
	
	return event
}

/**
 * Convierte un evento de Google Calendar a una tarea de Synapse
 */
export function calendarEventToTask(event: GoogleCalendarEvent): Partial<Task> {
	// Extraer información de la descripción si es un evento de Synapse
	const isSynapseEvent = event.summary?.startsWith('[Synapse]')
	
	if (!isSynapseEvent) {
		// Si no es un evento de Synapse, crear una tarea básica
		return {
			title: event.summary || 'Evento sin título',
			description: event.description || '',
			due_date: event.start?.dateTime || event.start?.date,
			priority: 'medium' as const,
			status: 'pending' as const
		}
	}
	
	// Extraer título sin la etiqueta [Synapse]
	const title = event.summary?.replace(/^\[Synapse\]\s*/, '') || 'Tarea sin título'
	
	// Extraer información adicional de la descripción
	const description = event.description || ''
	const estimatedTimeMatch = description.match(/⏱️ Tiempo estimado: (.+)/)
	const tagsMatch = description.match(/🏷️ Etiquetas: (.+)/)
	const notesMatch = description.match(/📝 Notas: (.+)/)
	
	// Determinar prioridad basada en el color
	let priority: 'high' | 'medium' | 'low' = 'medium'
	if (event.colorId) {
		const colorPriority = Object.entries(PRIORITY_COLOR_MAP).find(
			([, colorId]) => colorId === event.colorId
		)?.[0] as 'high' | 'medium' | 'low'
		if (colorPriority) {
			priority = colorPriority
		}
	}
	
	return {
		title,
		description: description.split('\n\n')[0] || '', // Solo la descripción principal
		due_date: event.start?.dateTime || event.start?.date,
		priority,
		status: 'pending' as const,
		estimated_time: estimatedTimeMatch?.[1],
		tags: tagsMatch?.[1]?.split(', ').map(tag => tag.trim()) || [],
		notes: notesMatch?.[1]
	}
}

/**
 * Obtiene el mapeo de campos entre tareas y eventos
 */
export function getTaskEventMapping() {
	return {
		task: {
			title: 'summary',
			description: 'description',
			due_date: 'start.dateTime',
			priority: 'colorId',
			estimated_time: 'description (parsed)',
			tags: 'description (parsed)',
			notes: 'description (parsed)'
		},
		event: {
			summary: 'title',
			description: 'description',
			start: 'due_date',
			colorId: 'priority',
			reminders: 'auto-generated'
		}
	}
}

/**
 * Valida si una tarea puede ser sincronizada
 */
export function canSyncTask(task: Task): { canSync: boolean; reason?: string } {
	if (!task.due_date) {
		return { canSync: false, reason: 'La tarea debe tener una fecha de vencimiento' }
	}
	
	if (task.status === 'cancelled') {
		return { canSync: false, reason: 'No se pueden sincronizar tareas canceladas' }
	}
	
	return { canSync: true }
}

/**
 * Filtra tareas que pueden ser sincronizadas
 */
export function filterSyncableTasks(tasks: Task[]): Task[] {
	return tasks.filter(task => canSyncTask(task).canSync)
}

/**
 * Genera un ID único para eventos de Synapse
 */
export function generateSynapseEventId(taskId: string): string {
	return `synapse-${taskId}`
}

/**
 * Verifica si un evento es de Synapse
 */
export function isSynapseEvent(event: GoogleCalendarEvent): boolean {
	return event.summary?.startsWith('[Synapse]') || false
}

/**
 * Extrae el ID de tarea de un evento de Synapse
 */
export function extractTaskIdFromEvent(event: GoogleCalendarEvent): string | null {
	if (!isSynapseEvent(event)) {
		return null
	}
	
	const description = event.description || ''
	const idMatch = description.match(/ID: ([a-f0-9-]+)/)
	return idMatch?.[1] || null
}

/**
 * Calcula la duración estimada de un evento basado en la tarea
 */
export function calculateEventDuration(task: Task): number {
	if (task.estimated_time) {
		// Parsear tiempo estimado (ej: "2h", "30min", "1.5h")
		const timeStr = task.estimated_time.toLowerCase()
		const hoursMatch = timeStr.match(/(\d+(?:\.\d+)?)h/)
		const minutesMatch = timeStr.match(/(\d+)min/)
		
		if (hoursMatch) {
			return parseFloat(hoursMatch[1]) * 60 * 60 * 1000 // Convertir a milisegundos
		} else if (minutesMatch) {
			return parseInt(minutesMatch[1]) * 60 * 1000 // Convertir a milisegundos
		}
	}
	
	// Duración por defecto: 1 hora
	return 60 * 60 * 1000
}

/**
 * Actualiza un evento existente con datos de una tarea
 */
export function updateEventFromTask(existingEvent: GoogleCalendarEvent, task: Task): GoogleCalendarEvent {
	const updatedEvent = syncTaskToCalendar(task)
	
	// Mantener el ID del evento existente
	updatedEvent.id = existingEvent.id
	
	// Si el evento ya tiene recordatorios personalizados, mantenerlos
	if (existingEvent.reminders && !existingEvent.reminders.useDefault) {
		updatedEvent.reminders = existingEvent.reminders
	}
	
	return updatedEvent
}
