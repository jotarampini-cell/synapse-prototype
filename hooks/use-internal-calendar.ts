"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export interface CalendarEvent {
	id: string
	title: string
	description?: string
	location?: string
	start_time: string
	end_time: string
	all_day: boolean
	color: string
	type: 'event' | 'task'
	reminder_minutes?: number
	task_id?: string
}

export function useInternalCalendar() {
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [tasks, setTasks] = useState<CalendarEvent[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const supabase = createClient()

	// Cargar eventos del calendario
	const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
		setIsLoading(true)
		try {
			const { data: eventData } = await supabase
				.from('calendar_events')
				.select('*')
				.gte('start_time', startDate.toISOString())
				.lte('start_time', endDate.toISOString())
				.order('start_time', { ascending: true })

			const { data: taskData } = await supabase
				.from('tasks')
				.select('id, title, description, due_date, priority, status')
				.not('due_date', 'is', null)
				.gte('due_date', startDate.toISOString())
				.lte('due_date', endDate.toISOString())
				.neq('status', 'completed')
				.order('due_date', { ascending: true })

			const formattedEvents = eventData?.map(e => ({
				...e,
				type: 'event' as const
			})) || []

			const formattedTasks = taskData?.map(t => ({
				id: t.id,
				title: t.title,
				description: t.description,
				start_time: t.due_date,
				end_time: t.due_date,
				all_day: true,
				color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#3b82f6',
				type: 'task' as const,
				task_id: t.id
			})) || []

			setEvents(formattedEvents)
			setTasks(formattedTasks)
		} catch (error) {
			console.error('Error loading calendar data:', error)
		} finally {
			setIsLoading(false)
		}
	}, [supabase])

	const createEvent = async (eventData: Partial<CalendarEvent>) => {
		// Obtener el usuario actual
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		// Asegurar que user_id esté incluido
		const eventWithUserId = {
			...eventData,
			user_id: user.id
		}

		const { data, error } = await supabase
			.from('calendar_events')
			.insert([eventWithUserId])
			.select()
			.single()
		
		if (error) throw error
		return data
	}

	const updateEvent = async (id: string, eventData: Partial<CalendarEvent>) => {
		// Obtener el usuario actual
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		// Asegurar que user_id esté incluido
		const eventWithUserId = {
			...eventData,
			user_id: user.id
		}

		const { data, error } = await supabase
			.from('calendar_events')
			.update(eventWithUserId)
			.eq('id', id)
			.eq('user_id', user.id) // Asegurar que solo el propietario pueda actualizar
			.select()
			.single()
		
		if (error) throw error
		return data
	}

	const deleteEvent = async (id: string) => {
		// Obtener el usuario actual
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			throw new Error('Usuario no autenticado')
		}

		const { error } = await supabase
			.from('calendar_events')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id) // Asegurar que solo el propietario pueda eliminar
		
		if (error) throw error
	}

	const getAllItems = useCallback(() => {
		return [...events, ...tasks].sort((a, b) => 
			new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
		)
	}, [events, tasks])

	return {
		events,
		tasks,
		allItems: getAllItems(),
		isLoading,
		loadEvents,
		createEvent,
		updateEvent,
		deleteEvent
	}
}
