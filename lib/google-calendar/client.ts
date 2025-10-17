import { google } from 'googleapis'
import { getGoogleAccessToken } from './auth'

// Tipos para los eventos de Google Calendar
export interface GoogleCalendarEvent {
	id?: string
	summary: string
	description?: string
	start: {
		dateTime?: string
		date?: string
		timeZone?: string
	}
	end: {
		dateTime?: string
		date?: string
		timeZone?: string
	}
	colorId?: string
	reminders?: {
		useDefault?: boolean
		overrides?: Array<{
			method: string
			minutes: number
		}>
	}
}

export interface GoogleCalendar {
	id: string
	summary: string
	description?: string
	primary?: boolean
	accessRole: string
	backgroundColor?: string
	foregroundColor?: string
}

export interface GoogleCalendarListResponse {
	items: GoogleCalendar[]
	nextPageToken?: string
}

export interface GoogleCalendarEventsResponse {
	items: GoogleCalendarEvent[]
	nextPageToken?: string
}

/**
 * Inicializa el cliente de Google Calendar autenticado
 */
export async function getCalendarClient() {
	const accessToken = await getGoogleAccessToken()
	
	if (!accessToken) {
		throw new Error('No hay token de acceso de Google disponible')
	}
	
	const auth = new google.auth.OAuth2()
	auth.setCredentials({ access_token: accessToken })
	
	return google.calendar({ version: 'v3', auth })
}

/**
 * Lista todos los calendarios del usuario
 */
export async function listCalendars(): Promise<GoogleCalendar[]> {
	try {
		const calendar = await getCalendarClient()
		const response = await calendar.calendarList.list()
		
		return (response.data.items || []).map(item => ({
			id: item.id || '',
			summary: item.summary || '',
			description: item.description,
			primary: item.primary || false,
			accessRole: item.accessRole || '',
			backgroundColor: item.backgroundColor,
			foregroundColor: item.foregroundColor
		}))
	} catch (error) {
		console.error('Error listando calendarios:', error)
		throw new Error('No se pudieron obtener los calendarios')
	}
}

/**
 * Obtiene eventos de un calendario específico
 */
export async function listEvents(
	calendarId: string,
	timeMin?: string,
	timeMax?: string,
	maxResults: number = 100
): Promise<GoogleCalendarEvent[]> {
	try {
		const calendar = await getCalendarClient()
		const response = await calendar.events.list({
			calendarId,
			timeMin,
			timeMax,
			maxResults,
			singleEvents: true,
			orderBy: 'startTime'
		})
		
		return (response.data.items || []).map(item => ({
			id: item.id || undefined,
			summary: item.summary || '',
			description: item.description,
			start: item.start || { dateTime: '', date: '', timeZone: '' },
			end: item.end || { dateTime: '', date: '', timeZone: '' },
			colorId: item.colorId,
			reminders: item.reminders
		}))
	} catch (error) {
		console.error('Error listando eventos:', error)
		throw new Error('No se pudieron obtener los eventos')
	}
}

/**
 * Crea un nuevo evento en Google Calendar
 */
export async function createEvent(
	calendarId: string,
	eventData: GoogleCalendarEvent
): Promise<GoogleCalendarEvent> {
	try {
		const calendar = await getCalendarClient()
		const response = await calendar.events.insert({
			calendarId,
			requestBody: eventData
		})
		
		return response.data as GoogleCalendarEvent
	} catch (error) {
		console.error('Error creando evento:', error)
		throw new Error('No se pudo crear el evento')
	}
}

/**
 * Actualiza un evento existente en Google Calendar
 */
export async function updateEvent(
	calendarId: string,
	eventId: string,
	eventData: GoogleCalendarEvent
): Promise<GoogleCalendarEvent> {
	try {
		const calendar = await getCalendarClient()
		const response = await calendar.events.update({
			calendarId,
			eventId,
			requestBody: eventData
		})
		
		return response.data as GoogleCalendarEvent
	} catch (error) {
		console.error('Error actualizando evento:', error)
		throw new Error('No se pudo actualizar el evento')
	}
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteEvent(
	calendarId: string,
	eventId: string
): Promise<void> {
	try {
		const calendar = await getCalendarClient()
		await calendar.events.delete({
			calendarId,
			eventId
		})
	} catch (error) {
		console.error('Error eliminando evento:', error)
		throw new Error('No se pudo eliminar el evento')
	}
}

/**
 * Obtiene un evento específico por ID
 */
export async function getEvent(
	calendarId: string,
	eventId: string
): Promise<GoogleCalendarEvent | null> {
	try {
		const calendar = await getCalendarClient()
		const response = await calendar.events.get({
			calendarId,
			eventId
		})
		
		return response.data as GoogleCalendarEvent
	} catch (error) {
		console.error('Error obteniendo evento:', error)
		return null
	}
}

/**
 * Obtiene el calendario principal del usuario
 */
export async function getPrimaryCalendar(): Promise<GoogleCalendar | null> {
	try {
		const calendars = await listCalendars()
		return calendars.find(cal => cal.primary) || calendars[0] || null
	} catch (error) {
		console.error('Error obteniendo calendario principal:', error)
		return null
	}
}

/**
 * Verifica si el usuario tiene acceso a un calendario específico
 */
export async function hasCalendarAccess(calendarId: string): Promise<boolean> {
	try {
		const calendars = await listCalendars()
		return calendars.some(cal => cal.id === calendarId)
	} catch (error) {
		console.error('Error verificando acceso al calendario:', error)
		return false
	}
}

/**
 * Obtiene eventos de hoy
 */
export async function getTodayEvents(calendarId: string): Promise<GoogleCalendarEvent[]> {
	const today = new Date()
	const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
	const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
	
	return listEvents(
		calendarId,
		startOfDay.toISOString(),
		endOfDay.toISOString()
	)
}

/**
 * Obtiene eventos de la semana actual
 */
export async function getWeekEvents(calendarId: string): Promise<GoogleCalendarEvent[]> {
	const today = new Date()
	const startOfWeek = new Date(today)
	startOfWeek.setDate(today.getDate() - today.getDay())
	startOfWeek.setHours(0, 0, 0, 0)
	
	const endOfWeek = new Date(startOfWeek)
	endOfWeek.setDate(startOfWeek.getDate() + 7)
	
	return listEvents(
		calendarId,
		startOfWeek.toISOString(),
		endOfWeek.toISOString()
	)
}

/**
 * Obtiene eventos del mes actual
 */
export async function getMonthEvents(calendarId: string): Promise<GoogleCalendarEvent[]> {
	const today = new Date()
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
	const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
	
	return listEvents(
		calendarId,
		startOfMonth.toISOString(),
		endOfMonth.toISOString()
	)
}
