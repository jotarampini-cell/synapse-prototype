"use client"

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
	getCalendarSyncSettings,
	updateCalendarSyncSettings,
	getGoogleCalendars,
	syncTaskToGoogleCalendar,
	syncAllTasksToCalendar,
	unsyncTaskFromCalendar,
	getTodayCalendarEvents,
	getWeekCalendarEvents,
	getMonthCalendarEvents,
	type CalendarSyncSettings
} from '@/app/actions/calendar'
import type { GoogleCalendar, GoogleCalendarEvent } from '@/lib/google-calendar/client'
import type { Task } from '@/app/actions/tasks'

export interface SyncStatus {
	isLoading: boolean
	isSyncing: boolean
	lastSyncAt: string | null
	error: string | null
}

export interface UseGoogleCalendarSyncOptions {
	autoLoadSettings?: boolean
	pollingInterval?: number // en milisegundos
}

export function useGoogleCalendarSync(options: UseGoogleCalendarSyncOptions = {}) {
	const { autoLoadSettings = true, pollingInterval = 0 } = options

	// Estado de sincronización
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isLoading: false,
		isSyncing: false,
		lastSyncAt: null,
		error: null
	})

	// Configuración de sincronización
	const [syncSettings, setSyncSettings] = useState<CalendarSyncSettings | null>(null)
	const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
	const [selectedCalendar, setSelectedCalendar] = useState<GoogleCalendar | null>(null)

	// Eventos del calendario
	const [todayEvents, setTodayEvents] = useState<GoogleCalendarEvent[]>([])
	const [weekEvents, setWeekEvents] = useState<GoogleCalendarEvent[]>([])
	const [monthEvents, setMonthEvents] = useState<GoogleCalendarEvent[]>([])

	// Cargar configuración de sincronización
	const loadSyncSettings = useCallback(async () => {
		setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }))
		
		try {
			const result = await getCalendarSyncSettings()
			if (result.success) {
				setSyncSettings(result.settings)
				if (result.settings?.last_sync_at) {
					setSyncStatus(prev => ({ ...prev, lastSyncAt: result.settings!.last_sync_at }))
				}
			} else {
				setSyncStatus(prev => ({ ...prev, error: result.error || 'Error cargando configuración' }))
			}
		} catch (error) {
			setSyncStatus(prev => ({ ...prev, error: 'Error interno del servidor' }))
		} finally {
			setSyncStatus(prev => ({ ...prev, isLoading: false }))
		}
	}, [])

	// Cargar calendarios de Google
	const loadCalendars = useCallback(async () => {
		try {
			const result = await getGoogleCalendars()
			if (result.success && result.calendars) {
				setCalendars(result.calendars)
				
				// Seleccionar calendario por defecto o principal
				const defaultCalendar = result.calendars.find(cal => cal.primary) || result.calendars[0]
				if (defaultCalendar) {
					setSelectedCalendar(defaultCalendar)
				}
			}
		} catch (error) {
			console.error('Error cargando calendarios:', error)
		}
	}, [])

	// Actualizar configuración de sincronización
	const updateSettings = useCallback(async (settings: Partial<CalendarSyncSettings>) => {
		setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }))
		
		try {
			const result = await updateCalendarSyncSettings(settings)
			if (result.success) {
				await loadSyncSettings() // Recargar configuración
				toast.success('Configuración actualizada')
			} else {
				setSyncStatus(prev => ({ ...prev, error: result.error || 'Error actualizando configuración' }))
				toast.error(result.error || 'Error actualizando configuración')
			}
		} catch (error) {
			setSyncStatus(prev => ({ ...prev, error: 'Error interno del servidor' }))
			toast.error('Error interno del servidor')
		} finally {
			setSyncStatus(prev => ({ ...prev, isLoading: false }))
		}
	}, [loadSyncSettings])

	// Sincronizar tarea específica
	const syncTask = useCallback(async (taskId: string, calendarId?: string) => {
		setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }))
		
		try {
			const result = await syncTaskToGoogleCalendar(taskId, calendarId)
			if (result.success) {
				toast.success('Tarea sincronizada con Google Calendar')
				// Actualizar última sincronización
				setSyncStatus(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }))
			} else {
				setSyncStatus(prev => ({ ...prev, error: result.error || 'Error sincronizando tarea' }))
				toast.error(result.error || 'Error sincronizando tarea')
			}
		} catch (error) {
			setSyncStatus(prev => ({ ...prev, error: 'Error interno del servidor' }))
			toast.error('Error interno del servidor')
		} finally {
			setSyncStatus(prev => ({ ...prev, isSyncing: false }))
		}
	}, [])

	// Sincronizar todas las tareas
	const syncAllTasks = useCallback(async (calendarId?: string) => {
		setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }))
		
		try {
			const result = await syncAllTasksToCalendar(calendarId)
			if (result.success) {
				toast.success(`${result.syncedCount} tareas sincronizadas`)
				if (result.errors.length > 0) {
					console.warn('Errores durante la sincronización:', result.errors)
				}
				// Actualizar última sincronización
				setSyncStatus(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }))
			} else {
				setSyncStatus(prev => ({ ...prev, error: result.error || 'Error sincronizando tareas' }))
				toast.error(result.error || 'Error sincronizando tareas')
			}
		} catch (error) {
			setSyncStatus(prev => ({ ...prev, error: 'Error interno del servidor' }))
			toast.error('Error interno del servidor')
		} finally {
			setSyncStatus(prev => ({ ...prev, isSyncing: false }))
		}
	}, [])

	// Desincronizar tarea
	const unsyncTask = useCallback(async (taskId: string) => {
		setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }))
		
		try {
			const result = await unsyncTaskFromCalendar(taskId)
			if (result.success) {
				toast.success('Tarea desincronizada de Google Calendar')
			} else {
				setSyncStatus(prev => ({ ...prev, error: result.error || 'Error desincronizando tarea' }))
				toast.error(result.error || 'Error desincronizando tarea')
			}
		} catch (error) {
			setSyncStatus(prev => ({ ...prev, error: 'Error interno del servidor' }))
			toast.error('Error interno del servidor')
		} finally {
			setSyncStatus(prev => ({ ...prev, isSyncing: false }))
		}
	}, [])

	// Cargar eventos del calendario
	const loadTodayEvents = useCallback(async (calendarId: string) => {
		try {
			const result = await getTodayCalendarEvents(calendarId)
			if (result.success && result.events) {
				setTodayEvents(result.events)
			}
		} catch (error) {
			console.error('Error cargando eventos de hoy:', error)
		}
	}, [])

	const loadWeekEvents = useCallback(async (calendarId: string) => {
		try {
			const result = await getWeekCalendarEvents(calendarId)
			if (result.success && result.events) {
				setWeekEvents(result.events)
			}
		} catch (error) {
			console.error('Error cargando eventos de la semana:', error)
		}
	}, [])

	const loadMonthEvents = useCallback(async (calendarId: string) => {
		try {
			const result = await getMonthCalendarEvents(calendarId)
			if (result.success && result.events) {
				setMonthEvents(result.events)
			}
		} catch (error) {
			console.error('Error cargando eventos del mes:', error)
		}
	}, [])

	// Cargar todos los eventos
	const loadAllEvents = useCallback(async (calendarId: string) => {
		await Promise.all([
			loadTodayEvents(calendarId),
			loadWeekEvents(calendarId),
			loadMonthEvents(calendarId)
		])
	}, [loadTodayEvents, loadWeekEvents, loadMonthEvents])

	// Verificar si una tarea está sincronizada
	const isTaskSynced = useCallback((task: Task): boolean => {
		return !!(task.google_event_id)
	}, [])

	// Obtener eventos de una fecha específica
	const getEventsForDate = useCallback((date: Date) => {
		const dateStr = date.toISOString().split('T')[0]
		
		return [
			...todayEvents,
			...weekEvents,
			...monthEvents
		].filter(event => {
			const eventDate = event.start?.dateTime || event.start?.date
			if (!eventDate) return false
			
			const eventDateStr = eventDate.split('T')[0]
			return eventDateStr === dateStr
		})
	}, [todayEvents, weekEvents, monthEvents])

	// Limpiar errores
	const clearError = useCallback(() => {
		setSyncStatus(prev => ({ ...prev, error: null }))
	}, [])

	// Efectos
	useEffect(() => {
		if (autoLoadSettings) {
			loadSyncSettings()
			loadCalendars()
		}
	}, [autoLoadSettings, loadSyncSettings, loadCalendars])

	// Polling para actualizaciones automáticas
	useEffect(() => {
		if (pollingInterval > 0 && selectedCalendar) {
			const interval = setInterval(() => {
				loadAllEvents(selectedCalendar.id)
			}, pollingInterval)

			return () => clearInterval(interval)
		}
	}, [pollingInterval, selectedCalendar, loadAllEvents])

	// Cargar eventos cuando se selecciona un calendario
	useEffect(() => {
		if (selectedCalendar) {
			loadAllEvents(selectedCalendar.id)
		}
	}, [selectedCalendar, loadAllEvents])

	return {
		// Estado
		syncStatus,
		syncSettings,
		calendars,
		selectedCalendar,
		todayEvents,
		weekEvents,
		monthEvents,

		// Acciones
		loadSyncSettings,
		loadCalendars,
		updateSettings,
		syncTask,
		syncAllTasks,
		unsyncTask,
		loadTodayEvents,
		loadWeekEvents,
		loadMonthEvents,
		loadAllEvents,
		clearError,

		// Utilidades
		isTaskSynced,
		getEventsForDate,
		setSelectedCalendar
	}
}
