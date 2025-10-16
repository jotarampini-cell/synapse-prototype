"use client"

import { useAppState } from '@/contexts/app-state-context'
import { usePersistedState } from '@/hooks/use-persisted-state'

export function TestContext() {
  try {
    const appState = useAppState()
    console.log('✅ AppStateProvider está disponible:', appState)
    
    const [testState, setTestState] = usePersistedState('home', { test: 'value' })
    console.log('✅ usePersistedState funciona:', testState)
    
    return (
      <div>
        <h2>Test de Contexto</h2>
        <p>✅ AppStateProvider: Disponible</p>
        <p>✅ usePersistedState: Funcionando</p>
        <p>Estado de prueba: {JSON.stringify(testState)}</p>
      </div>
    )
  } catch (error) {
    console.error('❌ Error en TestContext:', error)
    return (
      <div>
        <h2>Test de Contexto</h2>
        <p>❌ Error: {error.message}</p>
      </div>
    )
  }
}
