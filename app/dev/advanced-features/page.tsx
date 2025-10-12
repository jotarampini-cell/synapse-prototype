"use client"

import { useState, useEffect, useRef } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useTouchGestures, useSwipeActions, useLongPress, usePinchZoom } from "@/hooks/use-touch-gestures"
import { useRealtimeSync, useNotesSync } from "@/hooks/use-realtime-sync"
import { usePushNotifications } from "@/components/notifications/push-notifications"
import { VirtualNotesList, VirtualActionsList } from "@/components/virtual-list"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
	Search,
	Plus,
	Bell,
	Wifi,
	WifiOff,
	RefreshCw,
	AlertTriangle,
	CheckCircle,
	Clock,
	Zap,
	RotateCcw,
	ZoomIn,
	ZoomOut
} from "lucide-react"

// Mock data para virtual scrolling
const generateMockNotes = (count: number) => 
	Array.from({ length: count }, (_, i) => ({
		id: `note-${i}`,
		title: `Nota de ejemplo ${i + 1}`,
		content: `Esta es la descripción de la nota número ${i + 1}. Contiene información relevante y puede ser bastante larga para probar el virtual scrolling.`,
		tags: [`tag${i % 3}`, `categoria${i % 2}`],
		updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
		word_count: Math.floor(Math.random() * 500) + 50
	}))

const generateMockActions = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: `action-${i}`,
		title: `Tarea ${i + 1}`,
		description: `Descripción de la tarea número ${i + 1}. Esta tarea tiene una descripción detallada para probar el virtual scrolling.`,
		status: ['pending', 'in_progress', 'completed'][i % 3] as 'pending' | 'in_progress' | 'completed',
		priority: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
		dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
		project: `Proyecto ${i % 5}`
	}))

export default function TestAdvancedFeaturesPage() {
	const { isMobile, isLoading } = useMobileDetection()
	const [activeTab, setActiveTab] = useState<'virtual' | 'gestures' | 'notifications' | 'sync'>('virtual')
	
	// Forzar detección móvil para testing
	const [forceMobile, setForceMobile] = useState(false)
	const actualIsMobile = forceMobile || isMobile
	const [searchQuery, setSearchQuery] = useState("")
	
	// Virtual scrolling data
	const [notes] = useState(() => generateMockNotes(1000))
	const [actions] = useState(() => generateMockActions(1000))
	
	// Gesture testing
	const [gestureLog, setGestureLog] = useState<string[]>([])
	const [scale, setScale] = useState(1)
	const gestureRef = useRef<HTMLDivElement>(null)
	
	// Push notifications
	const { permission, requestPermission, sendNotification, isSupported } = usePushNotifications()
	
	// Real-time sync
	const { syncStatus, syncData, resolveConflict } = useRealtimeSync({
		onDataChange: (data) => {
			console.log('Data changed:', data)
		},
		onConflict: (conflict) => {
			console.log('Conflict detected:', conflict)
		},
		onError: (error) => {
			console.error('Sync error:', error)
		}
	})

	// Touch gestures
	const { bindTouchEvents } = useTouchGestures({
		onLongPress: () => {
			setGestureLog(prev => [...prev, `Long press detectado - ${new Date().toLocaleTimeString()}`])
		},
		onSwipeLeft: () => {
			setGestureLog(prev => [...prev, `Swipe izquierda - ${new Date().toLocaleTimeString()}`])
		},
		onSwipeRight: () => {
			setGestureLog(prev => [...prev, `Swipe derecha - ${new Date().toLocaleTimeString()}`])
		},
		onSwipeUp: () => {
			setGestureLog(prev => [...prev, `Swipe arriba - ${new Date().toLocaleTimeString()}`])
		},
		onSwipeDown: () => {
			setGestureLog(prev => [...prev, `Swipe abajo - ${new Date().toLocaleTimeString()}`])
		},
		onPinch: (newScale) => {
			setScale(newScale)
			setGestureLog(prev => [...prev, `Pinch zoom: ${newScale.toFixed(2)}x - ${new Date().toLocaleTimeString()}`])
		}
	})

	// Bind touch events
	useEffect(() => {
		if (gestureRef.current) {
			const cleanup = bindTouchEvents(gestureRef.current)
			return cleanup
		}
	}, []) // Removed bindTouchEvents dependency to prevent infinite loop

	// Filter data based on search
	const filteredNotes = notes.filter(note =>
		note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		note.content.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const filteredActions = actions.filter(action =>
		action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		action.description.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Layout móvil
	if (actualIsMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<div className="flex-1">
						<h1 className="text-lg font-bold">Funcionalidades Avanzadas</h1>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						className="touch-target"
					>
						<Bell className="h-5 w-5" />
					</Button>
				</header>

				{/* Tabs */}
				<div className="flex border-b border-border">
					{[
						{ id: 'virtual', label: 'Virtual', icon: Search },
						{ id: 'gestures', label: 'Gestos', icon: Zap },
						{ id: 'notifications', label: 'Push', icon: Bell },
						{ id: 'sync', label: 'Sync', icon: Wifi }
					].map((tab) => {
						const Icon = tab.icon
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id as 'gestures' | 'sync' | 'ai')}
								className={`flex-1 flex flex-col items-center py-3 touch-target ${
									activeTab === tab.id 
										? 'text-primary border-b-2 border-primary' 
										: 'text-muted-foreground'
								}`}
							>
								<Icon className="h-4 w-4 mb-1" />
								<span className="text-xs">{tab.label}</span>
							</button>
						)
					})}
				</div>

				{/* Content */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-4">
						{/* Virtual Scrolling Tab */}
						{activeTab === 'virtual' && (
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<Input 
										placeholder="Buscar en 1000 elementos..." 
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										size="mobile"
									/>
								</div>
								
								<Card className="p-4">
									<h3 className="font-semibold mb-2">Notas ({filteredNotes.length})</h3>
									<div className="h-96">
										<VirtualNotesList
											notes={filteredNotes}
											onNoteSelect={(id) => console.log('Selected note:', id)}
										/>
									</div>
								</Card>

								<Card className="p-4">
									<h3 className="font-semibold mb-2">Acciones ({filteredActions.length})</h3>
									<div className="h-96">
										<VirtualActionsList
											actions={filteredActions}
											onActionSelect={(id) => console.log('Selected action:', id)}
										/>
									</div>
								</Card>
							</div>
						)}

						{/* Gestures Tab */}
						{activeTab === 'gestures' && (
							<div className="space-y-4">
								<Card className="p-4">
									<h3 className="font-semibold mb-4">Área de Prueba de Gestos</h3>
									<div
										ref={gestureRef}
										className="h-64 bg-muted/50 rounded-lg flex items-center justify-center touch-target"
										style={{ transform: `scale(${scale})` }}
									>
										<div className="text-center">
											<p className="text-sm text-muted-foreground mb-2">
												Prueba estos gestos:
											</p>
											<ul className="text-xs text-muted-foreground space-y-1">
												<li>• Long press (500ms)</li>
												<li>• Swipe en cualquier dirección</li>
												<li>• Pinch to zoom (2 dedos)</li>
											</ul>
											<p className="text-xs text-muted-foreground mt-2">
												Escala actual: {scale.toFixed(2)}x
											</p>
										</div>
									</div>
								</Card>

								<Card className="p-4">
									<h3 className="font-semibold mb-2">Log de Gestos</h3>
									<div className="h-32 overflow-y-auto space-y-1">
										{gestureLog.length === 0 ? (
											<p className="text-sm text-muted-foreground">No hay gestos registrados</p>
										) : (
											gestureLog.slice(-10).map((log, index) => (
												<p key={index} className="text-xs text-muted-foreground">
													{log}
												</p>
											))
										)}
									</div>
									<Button 
										variant="outline" 
										size="sm" 
										onClick={() => setGestureLog([])}
										className="mt-2"
									>
										Limpiar log
									</Button>
								</Card>
							</div>
						)}

						{/* Notifications Tab */}
						{activeTab === 'notifications' && (
							<div className="space-y-4">
								<Card className="p-4">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											<Bell className="h-5 w-5" />
											<h3 className="font-semibold">Notificaciones Push</h3>
										</div>
										<Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
											{permission === 'granted' ? 'Habilitadas' : 'Deshabilitadas'}
										</Badge>
									</div>
									
									{!isSupported ? (
										<p className="text-sm text-muted-foreground">
											Las notificaciones no son compatibles con este navegador.
										</p>
									) : permission !== 'granted' ? (
										<Button onClick={requestPermission} className="w-full">
											Habilitar Notificaciones
										</Button>
									) : (
										<div className="space-y-2">
											<Button 
												onClick={() => sendNotification(
													'Notificación de prueba',
													'Esta es una notificación de prueba desde la aplicación.'
												)}
												className="w-full"
											>
												Enviar Notificación de Prueba
											</Button>
											<Button 
												onClick={() => sendNotification(
													'Recordatorio',
													'No olvides revisar tus notas pendientes.',
													{ tag: 'reminder' }
												)}
												variant="outline"
												className="w-full"
											>
												Enviar Recordatorio
											</Button>
										</div>
									)}
								</Card>
							</div>
						)}

						{/* Sync Tab */}
						{activeTab === 'sync' && (
							<div className="space-y-4">
								<Card className="p-4">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											{syncStatus.isOnline ? (
												<Wifi className="h-5 w-5 text-green-500" />
											) : (
												<WifiOff className="h-5 w-5 text-red-500" />
											)}
											<h3 className="font-semibold">Sincronización en Tiempo Real</h3>
										</div>
										<Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
											{syncStatus.isOnline ? 'En línea' : 'Sin conexión'}
										</Badge>
									</div>
									
									<div className="space-y-3">
										<div className="flex items-center justify-between text-sm">
											<span>Estado de sincronización:</span>
											<div className="flex items-center gap-1">
												{syncStatus.isSyncing ? (
													<RefreshCw className="h-4 w-4 animate-spin" />
												) : syncStatus.error ? (
													<AlertTriangle className="h-4 w-4 text-red-500" />
												) : (
													<CheckCircle className="h-4 w-4 text-green-500" />
												)}
												<span className={syncStatus.error ? 'text-red-500' : 'text-green-500'}>
													{syncStatus.isSyncing ? 'Sincronizando...' : 
													 syncStatus.error ? 'Error' : 'Sincronizado'}
												</span>
											</div>
										</div>
										
										{syncStatus.lastSync && (
											<div className="flex items-center justify-between text-sm">
												<span>Última sincronización:</span>
												<span className="text-muted-foreground">
													{syncStatus.lastSync.toLocaleTimeString()}
												</span>
											</div>
										)}
										
										{syncStatus.conflicts > 0 && (
											<div className="flex items-center justify-between text-sm">
												<span>Conflictos:</span>
												<Badge variant="destructive">{syncStatus.conflicts}</Badge>
											</div>
										)}
										
										<div className="flex gap-2">
											<Button 
												onClick={() => syncData({ test: 'data', timestamp: Date.now() })}
												disabled={!syncStatus.isOnline || syncStatus.isSyncing}
												size="sm"
											>
												<RefreshCw className="h-4 w-4 mr-1" />
												Sincronizar
											</Button>
											
											{syncStatus.conflicts > 0 && (
												<Button 
													onClick={() => resolveConflict('local')}
													variant="outline"
													size="sm"
												>
													<RotateCcw className="h-4 w-4 mr-1" />
													Resolver
												</Button>
											)}
										</div>
									</div>
								</Card>
							</div>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center border-b border-border">
				<h1 className="text-2xl font-bold">Funcionalidades Avanzadas - Desktop</h1>
				<div className="ml-auto flex gap-2">
					<Button 
						onClick={() => setForceMobile(!forceMobile)}
						variant={forceMobile ? "default" : "outline"}
						size="sm"
					>
						{forceMobile ? "Vista Desktop" : "Forzar Móvil"}
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-6xl mx-auto">
					<p className="text-muted-foreground mb-6">
						Vista desktop. Cambia el tamaño de la ventana a menos de 768px para ver las funcionalidades móviles.
					</p>
					
					<div className="grid grid-cols-2 gap-6">
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Funcionalidades Implementadas</h3>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Virtual Scrolling para listas largas (1000+ elementos)
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Gestos táctiles (long-press, swipe, pinch-to-zoom)
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Notificaciones push nativas
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Sincronización en tiempo real con WebSocket
								</li>
							</ul>
						</Card>
						
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Tecnologías Utilizadas</h3>
							<ul className="space-y-2 text-sm">
								<li>• react-window para virtual scrolling</li>
								<li>• Touch events nativos para gestos</li>
								<li>• Notification API para push notifications</li>
								<li>• WebSocket para sincronización en tiempo real</li>
								<li>• Conflict resolution automático</li>
								<li>• Offline/online detection</li>
							</ul>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
