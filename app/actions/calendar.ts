"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { 
	listCalendars, 
	listEvents, 
	createEvent, 
	updateEvent, 
	deleteEvent, 
	getEvent,
	getPrimaryCalendar,
	hasCalendarAccess,
	getTodayEvents,
	getWeekEvents,
	getMonthEvents,
	type GoogleCalendar,
	type GoogleCalendarEvent
} from "@/lib/google-calendar/client"
import { 
	syncTaskToCalendar, 
	calendarEventToTask,
	canSyncTask,
	filterSyncableTasks,
	isSynapseEvent,
	extractTaskIdFromEvent,
	updateEventFromTask
} from "@/lib/google-calendar/sync"
import { hasGoogleCalendarPermissions } from "@/lib/google-calendar/auth"
import type { Task } from "./tasks"

// =====================================================
// CONFIGURACIÓN DE SINCRONIZACIÓN
// =====================================================

export interface CalendarSyncSettings {
	id: string
	user_id: string
	google_calendar_id: string | null
	auto_sync_enabled: boolean
	sync_completed_tasks: boolean
	default_calendar_id: string | null
	last_sync_at: string | null
	created_at: string
	updated_at: string
}

export interface TaskCalendarEvent {
	id: string
	task_id: string
	calendar_id: string
	google_event_id: string
	last_synced_at: string
	created_at: string
	updated_at: string
}

/**
 * Obtiene la configuración de sincronización del usuario
 */
export async function getCalendarSyncSettings(): Promise<{ 
	success: boolean; 
	settings?: CalendarSyncSettings; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		const { data: settings, error } = await supabase
			.from('calendar_sync_settings')
			.select('*')
			.eq('user_id', user.id)
			.maybeSingle()

		if (error) {
			console.error('Error obteniendo configuración de sincronización:', error)
			return { success: false, error: error.message }
		}

		return { success: true, settings: settings || null }
	} catch (error) {
		console.error('Error obteniendo configuración de sincronización:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

/**
 * Actualiza la configuración de sincronización
 */
export async function updateCalendarSyncSettings(data: {
	google_calendar_id?: string
	auto_sync_enabled?: boolean
	sync_completed_tasks?: boolean
	default_calendar_id?: string
}): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Verificar permisos de Google Calendar
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		// Upsert la configuración
		const { error } = await supabase
			.from('calendar_sync_settings')
			.upsert({
				user_id: user.id,
				...data,
				updated_at: new Date().toISOString()
			})

		if (error) {
			console.error('Error actualizando configuración de sincronización:', error)
			return { success: false, error: error.message }
		}

		revalidatePath('/fuentes')
		return { success: true }
	} catch (error) {
		console.error('Error actualizando configuración de sincronización:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// OPERACIONES DE GOOGLE CALENDAR
// =====================================================

/**
 * Obtiene la lista de calendarios de Google del usuario
 */
export async function getGoogleCalendars(): Promise<{ 
	success: boolean; 
	calendars?: GoogleCalendar[]; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const calendars = await listCalendars()
		return { success: true, calendars }
	} catch (error) {
		console.error('Error obteniendo calendarios de Google:', error)
		return { success: false, error: "No se pudieron obtener los calendarios" }
	}
}

/**
 * Obtiene eventos de un calendario específico
 */
export async function getCalendarEvents(
	calendarId: string,
	timeMin?: string,
	timeMax?: string
): Promise<{ 
	success: boolean; 
	events?: GoogleCalendarEvent[]; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const hasAccess = await hasCalendarAccess(calendarId)
		if (!hasAccess) {
			return { success: false, error: "No tienes acceso a este calendario" }
		}

		const events = await listEvents(calendarId, timeMin, timeMax)
		return { success: true, events }
	} catch (error) {
		console.error('Error obteniendo eventos del calendario:', error)
		return { success: false, error: "No se pudieron obtener los eventos" }
	}
}

/**
 * Crea un nuevo evento en Google Calendar
 */
export async function createCalendarEvent(
	calendarId: string,
	eventData: Omit<GoogleCalendarEvent, 'id'>
): Promise<{ 
	success: boolean; 
	event?: GoogleCalendarEvent; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const hasAccess = await hasCalendarAccess(calendarId)
		if (!hasAccess) {
			return { success: false, error: "No tienes acceso a este calendario" }
		}

		const event = await createEvent(calendarId, eventData)
		return { success: true, event }
	} catch (error) {
		console.error('Error creando evento en Google Calendar:', error)
		return { success: false, error: "No se pudo crear el evento" }
	}
}

/**
 * Actualiza un evento existente en Google Calendar
 */
export async function updateCalendarEvent(
	calendarId: string,
	eventId: string,
	eventData: Partial<GoogleCalendarEvent>
): Promise<{ 
	success: boolean; 
	event?: GoogleCalendarEvent; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const hasAccess = await hasCalendarAccess(calendarId)
		if (!hasAccess) {
			return { success: false, error: "No tienes acceso a este calendario" }
		}

		const event = await updateEvent(calendarId, eventId, eventData)
		return { success: true, event }
	} catch (error) {
		console.error('Error actualizando evento en Google Calendar:', error)
		return { success: false, error: "No se pudo actualizar el evento" }
	}
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteCalendarEvent(
	calendarId: string,
	eventId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const hasAccess = await hasCalendarAccess(calendarId)
		if (!hasAccess) {
			return { success: false, error: "No tienes acceso a este calendario" }
		}

		await deleteEvent(calendarId, eventId)
		return { success: true }
	} catch (error) {
		console.error('Error eliminando evento de Google Calendar:', error)
		return { success: false, error: "No se pudo eliminar el evento" }
	}
}

// =====================================================
// SINCRONIZACIÓN DE TAREAS
// =====================================================

/**
 * Sincroniza una tarea específica a Google Calendar
 */
export async function syncTaskToGoogleCalendar(
	taskId: string,
	calendarId?: string
): Promise<{ success: boolean; event?: GoogleCalendarEvent; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener la tarea
		const { data: task, error: taskError } = await supabase
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.eq('user_id', user.id)
			.single()

		if (taskError || !task) {
			return { success: false, error: "Tarea no encontrada" }
		}

		// Verificar si la tarea puede ser sincronizada
		const { canSync, reason } = canSyncTask(task)
		if (!canSync) {
			return { success: false, error: reason }
		}

		// Obtener calendario de destino
		let targetCalendarId = calendarId
		if (!targetCalendarId) {
			const { data: settings } = await supabase
				.from('calendar_sync_settings')
				.select('default_calendar_id')
				.eq('user_id', user.id)
				.single()
			
			targetCalendarId = settings?.default_calendar_id
		}

		if (!targetCalendarId) {
			// Usar calendario principal
			const primaryCalendar = await getPrimaryCalendar()
			if (!primaryCalendar) {
				return { success: false, error: "No se encontró un calendario disponible" }
			}
			targetCalendarId = primaryCalendar.id
		}

		// Verificar acceso al calendario
		const hasAccess = await hasCalendarAccess(targetCalendarId)
		if (!hasAccess) {
			return { success: false, error: "No tienes acceso a este calendario" }
		}

		// Convertir tarea a evento
		const eventData = syncTaskToCalendar(task)

		// Verificar si ya existe un evento para esta tarea
		const { data: existingMapping } = await supabase
			.from('task_calendar_events')
			.select('google_event_id')
			.eq('task_id', taskId)
			.single()

		let event: GoogleCalendarEvent

		if (existingMapping) {
			// Actualizar evento existente
			const existingEvent = await getEvent(targetCalendarId, existingMapping.google_event_id)
			if (existingEvent) {
				event = await updateEvent(targetCalendarId, existingMapping.google_event_id, eventData)
			} else {
				// El evento fue eliminado, crear uno nuevo
				event = await createEvent(targetCalendarId, eventData)
				// Actualizar el mapeo
				await supabase
					.from('task_calendar_events')
					.update({ google_event_id: event.id, last_synced_at: new Date().toISOString() })
					.eq('task_id', taskId)
			}
		} else {
			// Crear nuevo evento
			event = await createEvent(targetCalendarId, eventData)
			
			// Crear mapeo en la base de datos
			await supabase
				.from('task_calendar_events')
				.insert({
					task_id: taskId,
					calendar_id: targetCalendarId,
					google_event_id: event.id!
				})
		}

		// Actualizar la tarea con el ID del evento
		await supabase
			.from('tasks')
			.update({ google_event_id: event.id })
			.eq('id', taskId)

		revalidatePath('/tareas')
		revalidatePath('/fuentes')
		return { success: true, event }
	} catch (error) {
		console.error('Error sincronizando tarea a Google Calendar:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

/**
 * Sincroniza todas las tareas pendientes a Google Calendar
 */
export async function syncAllTasksToCalendar(
	calendarId?: string
): Promise<{ 
	success: boolean; 
	syncedCount: number; 
	errors: string[]; 
	error?: string 
}> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, syncedCount: 0, errors: [], error: "No autenticado" }
		}

		// Obtener configuración de sincronización
		const { data: settings } = await supabase
			.from('calendar_sync_settings')
			.select('*')
			.eq('user_id', user.id)
			.single()

		// Obtener tareas que necesitan sincronización
		const { data: tasks, error: tasksError } = await supabase
			.from('tasks')
			.select('*')
			.eq('user_id', user.id)
			.not('due_date', 'is', null)
			.neq('status', 'cancelled')

		if (tasksError) {
			return { success: false, syncedCount: 0, errors: [], error: "Error obteniendo tareas" }
		}

		// Filtrar tareas que pueden ser sincronizadas
		const syncableTasks = filterSyncableTasks(tasks || [])
		
		// Si no se incluyen tareas completadas, filtrarlas
		const tasksToSync = settings?.sync_completed_tasks 
			? syncableTasks 
			: syncableTasks.filter(task => task.status !== 'completed')

		let syncedCount = 0
		const errors: string[] = []

		// Sincronizar cada tarea
		for (const task of tasksToSync) {
			try {
				const result = await syncTaskToGoogleCalendar(task.id, calendarId)
				if (result.success) {
					syncedCount++
				} else {
					errors.push(`${task.title}: ${result.error}`)
				}
			} catch (error) {
				errors.push(`${task.title}: Error interno`)
			}
		}

		// Actualizar última sincronización
		if (settings) {
			await supabase
				.from('calendar_sync_settings')
				.update({ last_sync_at: new Date().toISOString() })
				.eq('id', settings.id)
		}

		revalidatePath('/tareas')
		revalidatePath('/fuentes')
		return { success: true, syncedCount, errors }
	} catch (error) {
		console.error('Error sincronizando todas las tareas:', error)
		return { success: false, syncedCount: 0, errors: [], error: "Error interno del servidor" }
	}
}

/**
 * Desincroniza una tarea de Google Calendar
 */
export async function unsyncTaskFromCalendar(taskId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return { success: false, error: "No autenticado" }
		}

		// Obtener mapeo de la tarea
		const { data: mapping, error: mappingError } = await supabase
			.from('task_calendar_events')
			.select('*')
			.eq('task_id', taskId)
			.single()

		if (mappingError || !mapping) {
			return { success: false, error: "No se encontró sincronización para esta tarea" }
		}

		// Eliminar evento de Google Calendar
		try {
			await deleteEvent(mapping.calendar_id, mapping.google_event_id)
		} catch (error) {
			console.warn('No se pudo eliminar el evento de Google Calendar:', error)
		}

		// Eliminar mapeo de la base de datos
		await supabase
			.from('task_calendar_events')
			.delete()
			.eq('id', mapping.id)

		// Limpiar referencia en la tarea
		await supabase
			.from('tasks')
			.update({ google_event_id: null })
			.eq('id', taskId)

		revalidatePath('/tareas')
		revalidatePath('/fuentes')
		return { success: true }
	} catch (error) {
		console.error('Error desincronizando tarea:', error)
		return { success: false, error: "Error interno del servidor" }
	}
}

// =====================================================
// OBTENER EVENTOS POR PERÍODO
// =====================================================

/**
 * Obtiene eventos de hoy
 */
export async function getTodayCalendarEvents(calendarId: string): Promise<{ 
	success: boolean; 
	events?: GoogleCalendarEvent[]; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const events = await getTodayEvents(calendarId)
		return { success: true, events }
	} catch (error) {
		console.error('Error obteniendo eventos de hoy:', error)
		return { success: false, error: "No se pudieron obtener los eventos" }
	}
}

/**
 * Obtiene eventos de la semana actual
 */
export async function getWeekCalendarEvents(calendarId: string): Promise<{ 
	success: boolean; 
	events?: GoogleCalendarEvent[]; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const events = await getWeekEvents(calendarId)
		return { success: true, events }
	} catch (error) {
		console.error('Error obteniendo eventos de la semana:', error)
		return { success: false, error: "No se pudieron obtener los eventos" }
	}
}

/**
 * Obtiene eventos del mes actual
 */
export async function getMonthCalendarEvents(calendarId: string): Promise<{ 
	success: boolean; 
	events?: GoogleCalendarEvent[]; 
	error?: string 
}> {
	try {
		const hasPermissions = await hasGoogleCalendarPermissions()
		if (!hasPermissions) {
			return { success: false, error: "No tienes permisos de Google Calendar" }
		}

		const events = await getMonthEvents(calendarId)
		return { success: true, events }
	} catch (error) {
		console.error('Error obteniendo eventos del mes:', error)
		return { success: false, error: "No se pudieron obtener los eventos" }
	}
}
