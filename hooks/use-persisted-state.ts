"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAppState } from '@/contexts/app-state-context'

type PageKey = 'home' | 'notes' | 'tareas' | 'fuentes' | 'proyectos'

export function usePersistedState<T>(
  pageKey: PageKey,
  initialState: T
): [T, (newState: T | ((prev: T) => T)) => void] {
  const appState = useAppState()
  
  // Obtener estado inicial del contexto o usar el default - MEMOIZADO
  const persistedState = useMemo(() => {
    let state = null
    switch (pageKey) {
      case 'home':
        state = appState.homeState as T
        break
      case 'notes':
        state = appState.notesState as T
        break
      case 'tareas':
        state = appState.tareasState as T
        break
      case 'fuentes':
        state = appState.fuentesState as T
        break
      case 'proyectos':
        state = appState.proyectosState as T
        break
      default:
        state = null
    }
    return state
  }, [pageKey, appState.homeState, appState.notesState, appState.tareasState, appState.fuentesState, appState.proyectosState])
  
  // Estado local que se inicializa con el estado persistido o el inicial
  const [state, setState] = useState<T>(() => {
    const initialValue = persistedState || initialState
    return initialValue
  })
  
  // Sincronizar estado local con el persistido cuando cambie
  useEffect(() => {
    if (persistedState) {
      setState(persistedState)
    }
  }, [persistedState, pageKey])
  
  // Setter memoizado que actualiza tanto el estado local como el contexto
  const setPersistedState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState
      
      
      // Actualizar contexto global
      switch (pageKey) {
        case 'home':
          appState.setHomeState(nextState as any)
          break
        case 'notes':
          appState.setNotesState(nextState as any)
          break
        case 'tareas':
          appState.setTareasState(nextState as any)
          break
        case 'fuentes':
          appState.setFuentesState(nextState as any)
          break
        case 'proyectos':
          appState.setProyectosState(nextState as any)
          break
      }
      
      return nextState
    })
  }, [pageKey, appState])
  
  return [state, setPersistedState]
}