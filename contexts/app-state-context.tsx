"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

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
	const [homeState, setHomeState] = useState<HomePageState | null>(null)
	const [notesState, setNotesState] = useState<NotesPageState | null>(null)
	const [tareasState, setTareasState] = useState<TareasPageState | null>(null)
	const [fuentesState, setFuentesState] = useState<FuentesPageState | null>(null)
	const [proyectosState, setProyectosState] = useState<ProyectosPageState | null>(null)

	const clearAllStates = () => {
		setHomeState(null)
		setNotesState(null)
		setTareasState(null)
		setFuentesState(null)
		setProyectosState(null)
	}

	return (
		<AppStateContext.Provider value={{
			homeState,
			notesState,
			tareasState,
			fuentesState,
			proyectosState,
			setHomeState,
			setNotesState,
			setTareasState,
			setFuentesState,
			setProyectosState,
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
