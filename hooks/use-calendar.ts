"use client"

import { useState, useCallback, useMemo } from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format, getDay, Locale } from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarDay {
	date: Date
	isCurrentMonth: boolean
	isToday: boolean
	isSelected: boolean
	dayNumber: number
	hasEvents: boolean
	eventCount: number
}

export interface CalendarView {
	month: number
	year: number
	days: CalendarDay[]
	monthName: string
	yearString: string
}

export interface UseCalendarOptions {
	initialDate?: Date
	locale?: Locale
	weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function useCalendar(options: UseCalendarOptions = {}) {
	const {
		initialDate = new Date(),
		locale = es,
		weekStartsOn = 1 // Lunes
	} = options

	const [currentDate, setCurrentDate] = useState(initialDate)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)

	// Navegación del calendario
	const goToPreviousMonth = useCallback(() => {
		setCurrentDate(prev => subMonths(prev, 1))
	}, [])

	const goToNextMonth = useCallback(() => {
		setCurrentDate(prev => addMonths(prev, 1))
	}, [])

	const goToToday = useCallback(() => {
		const today = new Date()
		setCurrentDate(today)
		setSelectedDate(today)
	}, [])

	const goToDate = useCallback((date: Date) => {
		setCurrentDate(date)
		setSelectedDate(date)
	}, [])

	// Selección de fechas
	const selectDate = useCallback((date: Date) => {
		setSelectedDate(date)
	}, [])

	const clearSelection = useCallback(() => {
		setSelectedDate(null)
	}, [])

	// Cálculo de días del calendario
	const calendarView = useMemo((): CalendarView => {
		const monthStart = startOfMonth(currentDate)
		const monthEnd = endOfMonth(currentDate)
		const calendarStart = startOfWeek(monthStart, { weekStartsOn })
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn })

		const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

		const calendarDays: CalendarDay[] = days.map(date => ({
			date,
			isCurrentMonth: isSameMonth(date, currentDate),
			isToday: isToday(date),
			isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
			dayNumber: date.getDate(),
			hasEvents: false, // Se actualizará con datos de eventos
			eventCount: 0 // Se actualizará con datos de eventos
		}))

		return {
			month: currentDate.getMonth(),
			year: currentDate.getFullYear(),
			days: calendarDays,
			monthName: format(currentDate, 'MMMM', { locale }),
			yearString: format(currentDate, 'yyyy')
		}
	}, [currentDate, selectedDate, locale, weekStartsOn])

	// Utilidades de formato
	const formatDate = useCallback((date: Date, formatStr: string = 'dd/MM/yyyy') => {
		return format(date, formatStr, { locale })
	}, [locale])

	const formatTime = useCallback((date: Date) => {
		return format(date, 'HH:mm', { locale })
	}, [locale])

	const formatDateTime = useCallback((date: Date) => {
		return format(date, 'dd/MM/yyyy HH:mm', { locale })
	}, [locale])

	// Verificaciones de fecha
	const isDateInRange = useCallback((date: Date, startDate: Date, endDate: Date) => {
		return date >= startDate && date <= endDate
	}, [])

	const isDateInCurrentMonth = useCallback((date: Date) => {
		return isSameMonth(date, currentDate)
	}, [currentDate])

	const isDateToday = useCallback((date: Date) => {
		return isToday(date)
	}, [])

	const isDateSelected = useCallback((date: Date) => {
		return selectedDate ? isSameDay(date, selectedDate) : false
	}, [selectedDate])

	// Obtener información del día actual
	const today = useMemo(() => new Date(), [])
	const isCurrentMonthToday = useMemo(() => isSameMonth(today, currentDate), [today, currentDate])

	// Navegación rápida
	const goToMonth = useCallback((month: number, year: number) => {
		const newDate = new Date(year, month, 1)
		setCurrentDate(newDate)
	}, [])

	const goToYear = useCallback((year: number) => {
		const newDate = new Date(year, currentDate.getMonth(), 1)
		setCurrentDate(newDate)
	}, [currentDate])

	// Obtener días de la semana
	const weekDays = useMemo(() => {
		const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
		if (weekStartsOn === 0) {
			return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
		}
		return days
	}, [weekStartsOn])

	// Obtener información del mes actual
	const currentMonthInfo = useMemo(() => ({
		month: currentDate.getMonth(),
		year: currentDate.getFullYear(),
		monthName: format(currentDate, 'MMMM', { locale }),
		yearString: format(currentDate, 'yyyy'),
		daysInMonth: endOfMonth(currentDate).getDate(),
		firstDayOfMonth: getDay(startOfMonth(currentDate)),
		lastDayOfMonth: getDay(endOfMonth(currentDate))
	}), [currentDate, locale])

	return {
		// Estado
		currentDate,
		selectedDate,
		calendarView,
		today,
		isCurrentMonthToday,
		currentMonthInfo,
		weekDays,

		// Navegación
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		goToDate,
		goToMonth,
		goToYear,

		// Selección
		selectDate,
		clearSelection,

		// Utilidades
		formatDate,
		formatTime,
		formatDateTime,
		isDateInRange,
		isDateInCurrentMonth,
		isDateToday,
		isDateSelected
	}
}
