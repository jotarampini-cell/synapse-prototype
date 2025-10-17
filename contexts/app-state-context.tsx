"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos de estado para cada página
interface HomePageState {
	scrollPosition: number
	searchQuery: string
	selectedCategory?: string
}

interface NotesPageState {
	scrollPosition: number
	currentView: 'folders' | 'notes' | 'editor'
	selectedFolder: string | null
	selectedFolderName: string
	selectedNote: string | null
	searchQuery: string
	viewMode: 'grid' | 'list'
}

interface TareasPageState {
	scrollPosition: number
	searchQuery: string
	selectedFilter: string
	viewMode: 'grid' | 'list'
}

interface FuentesPageState {
	scrollPosition: number
	searchQuery: string
	selectedCategory: string
	viewMode: 'grid' | 'list'
}

interface ProyectosPageState {
	scrollPosition: number
	searchQuery: string
	selectedFilter: string
	viewMode: 'grid' | 'list'
}

interface AppStateContextType {
	// Estados de cada página
	homeState: HomePageState | null
	notesState: NotesPageState | null
	tareasState: TareasPageState | null
	fuentesState: FuentesPageState | null
	proyectosState: ProyectosPageState | null
	
	// Setters para cada estado
	setHomeState: (state: HomePageState) => void
	setNotesState: (state: NotesPageState) => void
	setTareasState: (state: TareasPageState) => void
	setFuentesState: (state: FuentesPageState) => void
	setProyectosState: (state: ProyectosPageState) => void
	
	// Función para limpiar todos los estados
	clearAllStates: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
	// Función para cargar estado desde localStorage
	const loadStateFromStorage = <T,>(key: string, defaultValue: T): T => {
		if (typeof window === 'undefined') return defaultValue
		try {
			const stored = localStorage.getItem(key)
			return stored ? JSON.parse(stored) : defaultValue
		} catch (error) {
			console.error(`Error loading state for ${key}:`, error)
			return defaultValue
		}
	}

	// Función para guardar estado en localStorage
	const saveStateToStorage = <T,>(key: string, state: T) => {
		if (typeof window === 'undefined') return
		try {
			localStorage.setItem(key, JSON.stringify(state))
		} catch (error) {
			console.error(`Error saving state for ${key}:`, error)
		}
	}

	const [homeState, setHomeState] = useState<HomePageState | null>(() => 
		loadStateFromStorage('app-state-home', null)
	)
	const [notesState, setNotesState] = useState<NotesPageState | null>(() => 
		loadStateFromStorage('app-state-notes', null)
	)
	const [tareasState, setTareasState] = useState<TareasPageState | null>(() => 
		loadStateFromStorage('app-state-tareas', null)
	)
	const [fuentesState, setFuentesState] = useState<FuentesPageState | null>(() => 
		loadStateFromStorage('app-state-fuentes', null)
	)
	const [proyectosState, setProyectosState] = useState<ProyectosPageState | null>(() => 
		loadStateFromStorage('app-state-proyectos', null)
	)


	const clearAllStates = () => {
		setHomeState(null)
		setNotesState(null)
		setTareasState(null)
		setFuentesState(null)
		setProyectosState(null)
		
		// Limpiar localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem('app-state-home')
			localStorage.removeItem('app-state-notes')
			localStorage.removeItem('app-state-tareas')
			localStorage.removeItem('app-state-fuentes')
			localStorage.removeItem('app-state-proyectos')
		}
	}

	// Wrapped setters with localStorage persistence
	const wrappedSetHomeState = (state: HomePageState) => {
		setHomeState(state)
		saveStateToStorage('app-state-home', state)
	}

	const wrappedSetNotesState = (state: NotesPageState) => {
		setNotesState(state)
		saveStateToStorage('app-state-notes', state)
	}

	const wrappedSetTareasState = (state: TareasPageState) => {
		setTareasState(state)
		saveStateToStorage('app-state-tareas', state)
	}

	const wrappedSetFuentesState = (state: FuentesPageState) => {
		setFuentesState(state)
		saveStateToStorage('app-state-fuentes', state)
	}

	const wrappedSetProyectosState = (state: ProyectosPageState) => {
		setProyectosState(state)
		saveStateToStorage('app-state-proyectos', state)
	}

	return (
		<AppStateContext.Provider value={{
			homeState,
			notesState,
			tareasState,
			fuentesState,
			proyectosState,
			setHomeState: wrappedSetHomeState,
			setNotesState: wrappedSetNotesState,
			setTareasState: wrappedSetTareasState,
			setFuentesState: wrappedSetFuentesState,
			setProyectosState: wrappedSetProyectosState,
			clearAllStates
		}}>
			{children}
		</AppStateContext.Provider>
	)
}

export function useAppState() {
	const context = useContext(AppStateContext)
	if (context === undefined) {
		throw new Error('useAppState must be used within an AppStateProvider')
	}
	return context
}

// Exportar tipos para uso en otros archivos
export type {
	HomePageState,
	NotesPageState,
	TareasPageState,
	FuentesPageState,
	ProyectosPageState
}
