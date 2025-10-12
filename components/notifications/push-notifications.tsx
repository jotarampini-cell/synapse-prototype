"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, X } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPermission {
	permission: NotificationPermission
	requested: boolean
}

interface PushNotification {
	id: string
	title: string
	body: string
	icon?: string
	badge?: string
	tag?: string
	data?: Record<string, unknown>
	timestamp: number
	read: boolean
}

export function PushNotificationManager() {
	const [permission, setPermission] = useState<NotificationPermission>({
		permission: 'default',
		requested: false
	})
	const [notifications, setNotifications] = useState<PushNotification[]>([])
	const [isSupported, setIsSupported] = useState(false)

	// Check if notifications are supported
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			setIsSupported(true)
			setPermission({
				permission: Notification.permission,
				requested: Notification.permission !== 'default'
			})
		}
	}, [])

	// Request notification permission
	const requestPermission = useCallback(async () => {
		if (!isSupported) return

		try {
			const result = await Notification.requestPermission()
			setPermission({
				permission: result,
				requested: true
			})

			if (result === 'granted') {
				toast.success('Notificaciones habilitadas', {
					description: 'Recibirás notificaciones de la aplicación.'
				})
			} else {
				toast.error('Notificaciones denegadas', {
					description: 'No podrás recibir notificaciones push.'
				})
			}
		} catch (error) {
			console.error('Error requesting notification permission:', error)
			toast.error('Error al solicitar permisos')
		}
	}, [isSupported])

	// Send a test notification
	const sendTestNotification = useCallback(() => {
		if (permission.permission !== 'granted') {
			toast.error('Permisos de notificación no concedidos')
			return
		}

		const notification = new Notification('Synapse - Notificación de prueba', {
			body: 'Esta es una notificación de prueba de la aplicación.',
			icon: '/favicon.ico',
			badge: '/favicon.ico',
			tag: 'test-notification'
		})

		notification.onclick = () => {
			window.focus()
			notification.close()
		}

		// Add to local notifications list
		const newNotification: PushNotification = {
			id: Date.now().toString(),
			title: 'Synapse - Notificación de prueba',
			body: 'Esta es una notificación de prueba de la aplicación.',
			timestamp: Date.now(),
			read: false
		}

		setNotifications(prev => [newNotification, ...prev])
	}, [permission.permission])

	// Schedule a notification
	const scheduleNotification = useCallback((
		title: string,
		body: string,
		delay: number = 0
	) => {
		if (permission.permission !== 'granted') return

		setTimeout(() => {
			const notification = new Notification(title, {
				body,
				icon: '/favicon.ico',
				badge: '/favicon.ico'
			})

			notification.onclick = () => {
				window.focus()
				notification.close()
			}

			// Add to local notifications list
			const newNotification: PushNotification = {
				id: Date.now().toString(),
				title,
				body,
				timestamp: Date.now(),
				read: false
			}

			setNotifications(prev => [newNotification, ...prev])
		}, delay)
	}, [permission.permission])

	// Mark notification as read
	const markAsRead = useCallback((id: string) => {
		setNotifications(prev =>
			prev.map(notification =>
				notification.id === id
					? { ...notification, read: true }
					: notification
			)
		)
	}, [])

	// Clear all notifications
	const clearAllNotifications = useCallback(() => {
		setNotifications([])
	}, [])

	// Get unread count
	const unreadCount = notifications.filter(n => !n.read).length

	if (!isSupported) {
		return (
			<Card className="p-4">
				<div className="flex items-center gap-2 text-muted-foreground">
					<BellOff className="h-5 w-5" />
					<span>Las notificaciones no son compatibles con este navegador.</span>
				</div>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{/* Permission Status */}
			<Card className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Bell className="h-5 w-5" />
						<div>
							<h3 className="font-semibold">Notificaciones Push</h3>
							<p className="text-sm text-muted-foreground">
								{permission.permission === 'granted' 
									? 'Notificaciones habilitadas'
									: permission.permission === 'denied'
									? 'Notificaciones denegadas'
									: 'Permisos no solicitados'
								}
							</p>
						</div>
					</div>
					{permission.permission !== 'granted' && (
						<Button onClick={requestPermission} size="sm">
							{permission.permission === 'denied' ? 'Revisar configuración' : 'Habilitar'}
						</Button>
					)}
				</div>
			</Card>

			{/* Test Notification */}
			{permission.permission === 'granted' && (
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold">Notificación de prueba</h3>
							<p className="text-sm text-muted-foreground">
								Envía una notificación de prueba
							</p>
						</div>
						<Button onClick={sendTestNotification} size="sm">
							Enviar prueba
						</Button>
					</div>
				</Card>
			)}

			{/* Notifications List */}
			{notifications.length > 0 && (
				<Card className="p-4">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold">Notificaciones</h3>
							{unreadCount > 0 && (
								<Badge variant="destructive">{unreadCount}</Badge>
							)}
						</div>
						<Button 
							variant="ghost" 
							size="sm" 
							onClick={clearAllNotifications}
						>
							Limpiar todas
						</Button>
					</div>
					
					<div className="space-y-2 max-h-64 overflow-y-auto">
						{notifications.map((notification) => (
							<div
								key={notification.id}
								className={`p-3 rounded-lg border ${
									notification.read 
										? 'bg-muted/30' 
										: 'bg-background border-primary/20'
								}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h4 className="font-medium text-sm">
											{notification.title}
										</h4>
										<p className="text-xs text-muted-foreground mt-1">
											{notification.body}
										</p>
										<span className="text-xs text-muted-foreground">
											{new Date(notification.timestamp).toLocaleString()}
										</span>
									</div>
									{!notification.read && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => markAsRead(notification.id)}
											className="h-6 w-6 p-0"
										>
											<X className="h-3 w-3" />
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	)
}

// Hook para usar notificaciones en otros componentes
export function usePushNotifications() {
	// Funcionalidad desactivada por defecto para estabilidad
	const isEnabled = process.env.NODE_ENV === 'development' && process.env.ENABLE_PUSH_NOTIFICATIONS === 'true'
	
	const [permission, setPermission] = useState<NotificationPermission>('default')

	useEffect(() => {
		if (isEnabled && typeof window !== 'undefined' && 'Notification' in window) {
			setPermission(Notification.permission)
		}
	}, [isEnabled])

	const requestPermission = useCallback(async () => {
		if (isEnabled && typeof window !== 'undefined' && 'Notification' in window) {
			const result = await Notification.requestPermission()
			setPermission(result)
			return result
		}
		return 'denied'
	}, [isEnabled])

	const sendNotification = useCallback((
		title: string,
		body: string,
		options?: NotificationOptions
	) => {
		if (isEnabled && permission === 'granted') {
			const notification = new Notification(title, {
				body,
				icon: '/favicon.ico',
				badge: '/favicon.ico',
				...options
			})

			notification.onclick = () => {
				window.focus()
				notification.close()
			}

			return notification
		}
		return null
	}, [isEnabled, permission])

	const scheduleNotification = useCallback((
		title: string,
		body: string,
		delay: number = 0
	) => {
		if (isEnabled && permission === 'granted') {
			setTimeout(() => {
				sendNotification(title, body)
			}, delay)
		}
	}, [isEnabled, permission, sendNotification])

	return {
		permission: isEnabled ? permission : 'denied',
		requestPermission,
		sendNotification,
		scheduleNotification,
		isSupported: isEnabled && typeof window !== 'undefined' && 'Notification' in window
	}
}
