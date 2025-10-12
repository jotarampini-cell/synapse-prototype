"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { log } from '@/lib/logger'

interface SyncStatus {
	isOnline: boolean
	isSyncing: boolean
	lastSync: Date | null
	conflicts: number
	error: string | null
}

interface RealtimeSyncOptions {
	onDataChange?: (data: Record<string, unknown>) => void
	onConflict?: (conflict: Record<string, unknown>) => void
	onError?: (error: Error) => void
	syncInterval?: number
	retryAttempts?: number
	retryDelay?: number
}

// Simulación de WebSocket para demo
class MockWebSocket {
	private url: string
	private onOpen?: () => void
	private onMessage?: (event: MessageEvent) => void
	private onClose?: () => void
	private onError?: (error: Event) => void
	private isConnected: boolean = false
	private reconnectTimer?: NodeJS.Timeout

	constructor(url: string) {
		this.url = url
		this.connect()
	}

	private connect() {
		// Simular conexión
		setTimeout(() => {
			this.isConnected = true
			this.onOpen?.()
		}, 1000)
	}

	send(data: string) {
		if (this.isConnected) {
			// Simular envío de datos
			console.log('Sending data:', data)
		}
	}

	close() {
		this.isConnected = false
		this.onClose?.()
	}

	set onopen(callback: () => void) {
		this.onOpen = callback
	}

	set onmessage(callback: (event: MessageEvent) => void) {
		this.onMessage = callback
	}

	set onclose(callback: () => void) {
		this.onClose = callback
	}

	set onerror(callback: (error: Event) => void) {
		this.onError = callback
	}

	get readyState() {
		return this.isConnected ? 1 : 0
	}
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
	// Funcionalidad desactivada por defecto para estabilidad
	const isEnabled = process.env.NODE_ENV === 'development' && process.env.ENABLE_REALTIME_SYNC === 'true'
	
	// Todos los hooks deben estar al inicio, sin importar las condiciones
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
		isSyncing: false,
		lastSync: null,
		conflicts: 0,
		error: null
	})

	const wsRef = useRef<MockWebSocket | null>(null)
	const retryCountRef = useRef(0)
	const syncTimerRef = useRef<NodeJS.Timeout | null>(null)

	// Simular datos para demo
	const [localData, setLocalData] = useState<Record<string, unknown>>({
		notes: [],
		lastModified: Date.now()
	})

	// Todos los useCallback y useEffect deben estar aquí también
	const connectWebSocket = useCallback(() => {
		if (!isEnabled) return
		
		try {
			wsRef.current = new MockWebSocket('ws://localhost:3001/sync')
			
			wsRef.current.onopen = () => {
				setSyncStatus(prev => ({
					...prev,
					isOnline: true,
					error: null
				}))
				retryCountRef.current = 0
				toast.success('Conectado en tiempo real')
			}

			wsRef.current.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data)
					
					if (data.type === 'data') {
						// Simular conflicto ocasional
						if (Math.random() < 0.1) {
							options.onConflict?.(data)
							setSyncStatus(prev => ({
								...prev,
								conflicts: prev.conflicts + 1
							}))
							toast.warning('Conflicto de sincronización detectado')
						} else {
							options.onDataChange?.(data.payload)
							setLocalData(data.payload)
							toast.success('Datos sincronizados')
						}
					}
				} catch (error) {
					log.error('Error parsing WebSocket message:', { error })
					options.onError?.(error as Error)
				}
			}

			wsRef.current.onclose = () => {
				setSyncStatus(prev => ({
					...prev,
					isOnline: false
				}))
				
				// Intentar reconectar
				if (retryCountRef.current < (options.retryAttempts || 3)) {
					retryCountRef.current++
					setTimeout(() => {
						connectWebSocket()
					}, (options.retryDelay || 1000) * retryCountRef.current)
				}
			}

			wsRef.current.onerror = (error) => {
				setSyncStatus(prev => ({
					...prev,
					error: 'Error de conexión'
				}))
				options.onError?.(error as Error)
			}
		} catch (error) {
			setSyncStatus(prev => ({
				...prev,
				error: 'Error al conectar'
			}))
			options.onError?.(error as Error)
		}
	}, [isEnabled, options])

	const disconnectWebSocket = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		if (syncTimerRef.current) {
			clearInterval(syncTimerRef.current)
			syncTimerRef.current = null
		}
	}, [])

	const syncData = useCallback(async (data: Record<string, unknown>) => {
		if (!isEnabled || !syncStatus.isOnline) {
			toast.error('Sin conexión a internet')
			return
		}

		setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }))

		try {
			// Simular envío de datos
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			if (wsRef.current && wsRef.current.readyState === 1) {
				wsRef.current.send(JSON.stringify({
					type: 'sync',
					payload: data,
					timestamp: Date.now()
				}))
			}

			setSyncStatus(prev => ({
				...prev,
				isSyncing: false,
				lastSync: new Date()
			}))

			toast.success('Datos sincronizados')
		} catch (error) {
			setSyncStatus(prev => ({
				...prev,
				isSyncing: false,
				error: 'Error al sincronizar'
			}))
			options.onError?.(error as Error)
			toast.error('Error al sincronizar datos')
		}
	}, [isEnabled, syncStatus.isOnline, options])

	const resolveConflict = useCallback((resolution: 'local' | 'remote' | 'merge', data?: Record<string, unknown>) => {
		setSyncStatus(prev => ({
			...prev,
			conflicts: Math.max(0, prev.conflicts - 1)
		}))

		if (resolution === 'local') {
			toast.success('Conflicto resuelto: usando datos locales')
		} else if (resolution === 'remote') {
			toast.success('Conflicto resuelto: usando datos remotos')
		} else if (resolution === 'merge') {
			toast.success('Conflicto resuelto: datos fusionados')
		}
	}, [])

	// Detectar cambios en conectividad
	useEffect(() => {
		if (!isEnabled) return

		const handleOnline = () => {
			setSyncStatus(prev => ({ ...prev, isOnline: true }))
		}

		const handleOffline = () => {
			setSyncStatus(prev => ({ ...prev, isOnline: false }))
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('online', handleOnline)
			window.addEventListener('offline', handleOffline)
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('online', handleOnline)
				window.removeEventListener('offline', handleOffline)
			}
		}
	}, [isEnabled])

	// Inicializar conexión
	useEffect(() => {
		if (!isEnabled) return

		if (typeof window !== 'undefined' && navigator.onLine) {
			connectWebSocket()
		}

		return () => {
			disconnectWebSocket()
		}
	}, [isEnabled, connectWebSocket, disconnectWebSocket])

	// Sincronización periódica
	useEffect(() => {
		if (!isEnabled) return

		if (syncStatus.isOnline && !syncTimerRef.current) {
			syncTimerRef.current = setInterval(() => {
				syncData(localData)
			}, options.syncInterval || 30000)
		}

		return () => {
			if (syncTimerRef.current) {
				clearInterval(syncTimerRef.current)
			}
		}
	}, [isEnabled, syncStatus.isOnline, syncData, localData, options.syncInterval])
	
	if (!isEnabled) {
		return {
			syncStatus,
			syncData: () => Promise.resolve(),
			resolveConflict: () => {},
			connectWebSocket: () => {},
			disconnectWebSocket: () => {},
			localData,
			setLocalData
		}
	}

	return {
		syncStatus,
		syncData,
		resolveConflict,
		connectWebSocket,
		disconnectWebSocket,
		localData,
		setLocalData
	}
}

// Hook específico para sincronización de notas
export function useNotesSync() {
	const { syncStatus, syncData, resolveConflict, localData, setLocalData } = useRealtimeSync({
		onDataChange: (data) => {
			console.log('Notes data updated:', data)
		},
		onConflict: (conflict) => {
			console.log('Notes conflict detected:', conflict)
		},
		onError: (error) => {
			console.error('Notes sync error:', error)
		}
	})

	const syncNotes = useCallback((notes: unknown[]) => {
		const notesData = {
			notes,
			lastModified: Date.now()
		}
		setLocalData(notesData)
		syncData(notesData)
	}, [syncData, setLocalData])

	return {
		syncStatus,
		syncNotes,
		resolveConflict,
		notes: localData.notes || []
	}
}
