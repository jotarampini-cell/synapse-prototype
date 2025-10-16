"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAppState } from '@/contexts/app-state-context'

type PageKey = 'home' | 'notes' | 'tareas' | 'fuentes' | 'proyectos'

export function usePersistedState<T>(
	pageKey: PageKey,
	initialState: T
): [T, (state: T) => void] {
	const appState = useAppState()
	
	// Obtener el estado persistido o usar el inicial
	const getPersistedState = (): T => {
		switch (pageKey) {
			case 'home':
				return (appState.homeState as T) || initialState
			case 'notes':
				return (appState.notesState as T) || initialState
			case 'tareas':
				return (appState.tareasState as T) || initialState
			case 'fuentes':
				return (appState.fuentesState as T) || initialState
			case 'proyectos':
				return (appState.proyectosState as T) || initialState
			default:
				return initialState
		}
	}

	const [state, setState] = useState<T>(getPersistedState)

	// Función para actualizar el estado
	const updateState = useCallback((newState: T) => {
		setState(newState)
		
		// Guardar en el contexto global
		switch (pageKey) {
			case 'home':
				appState.setHomeState(newState as any)
				break
			case 'notes':
				appState.setNotesState(newState as any)
				break
			case 'tareas':
				appState.setTareasState(newState as any)
				break
			case 'fuentes':
				appState.setFuentesState(newState as any)
				break
			case 'proyectos':
				appState.setProyectosState(newState as any)
				break
		}
	}, [pageKey, appState])

	// Restaurar scroll position cuando se monta el componente
	useEffect(() => {
		const persistedState = getPersistedState()
		if (persistedState && typeof persistedState === 'object' && 'scrollPosition' in persistedState) {
			const scrollPos = (persistedState as any).scrollPosition
			if (scrollPos > 0) {
				// Usar setTimeout para asegurar que el DOM esté listo
				setTimeout(() => {
					window.scrollTo(0, scrollPos)
				}, 200)
			}
		}
	}, [])

	// Guardar scroll position periódicamente
	useEffect(() => {
		const handleScroll = () => {
			// Throttle para evitar demasiadas actualizaciones
			clearTimeout((window as any).scrollTimeout)
			;(window as any).scrollTimeout = setTimeout(() => {
				updateState({
					...state,
					scrollPosition: window.scrollY
				} as T)
			}, 1000)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		
		return () => {
			window.removeEventListener('scroll', handleScroll)
			clearTimeout((window as any).scrollTimeout)
		}
	}, [state, updateState])

	return [state, updateState]
}
