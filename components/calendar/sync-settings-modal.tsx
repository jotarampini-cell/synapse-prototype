"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
	Settings, 
	Calendar as CalendarIcon, 
	CheckCircle, 
	AlertCircle,
	RefreshCw,
	ExternalLink,
	RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useGoogleCalendarSync } from '@/hooks/use-google-calendar-sync'
import { toast } from 'sonner'

interface SyncSettingsModalProps {
	isOpen: boolean
	onClose: () => void
}

export function SyncSettingsModal({ isOpen, onClose }: SyncSettingsModalProps) {
	const {
		syncStatus,
		syncSettings,
		calendars,
		selectedCalendar,
		updateSettings,
		syncAllTasks,
		loadSyncSettings,
		loadCalendars,
		setSelectedCalendar
	} = useGoogleCalendarSync()

	const [localSettings, setLocalSettings] = useState({
		auto_sync_enabled: false,
		sync_completed_tasks: false,
		default_calendar_id: ''
	})

	const [isSaving, setIsSaving] = useState(false)
	const [isSyncing, setIsSyncing] = useState(false)

	// Inicializar configuración local
	useEffect(() => {
		if (syncSettings) {
			setLocalSettings({
				auto_sync_enabled: syncSettings.auto_sync_enabled,
				sync_completed_tasks: syncSettings.sync_completed_tasks,
				default_calendar_id: syncSettings.default_calendar_id || ''
			})
		}
	}, [syncSettings])

	// Manejar cambios en la configuración
	const handleSettingChange = (key: keyof typeof localSettings, value: boolean | string) => {
		setLocalSettings(prev => ({ ...prev, [key]: value }))
	}

	// Guardar configuración
	const handleSaveSettings = async () => {
		setIsSaving(true)

		try {
			const result = await updateSettings({
				auto_sync_enabled: localSettings.auto_sync_enabled,
				sync_completed_tasks: localSettings.sync_completed_tasks,
				default_calendar_id: localSettings.default_calendar_id
			})

			if (result) {
				toast.success('Configuración guardada')
			}
		} catch (error) {
			console.error('Error guardando configuración:', error)
		} finally {
			setIsSaving(false)
		}
	}

	// Sincronizar todas las tareas
	const handleSyncAll = async () => {
		setIsSyncing(true)

		try {
			await syncAllTasks(localSettings.default_calendar_id || undefined)
		} catch (error) {
			console.error('Error sincronizando tareas:', error)
		} finally {
			setIsSyncing(false)
		}
	}

	// Recargar configuración
	const handleRefresh = async () => {
		await Promise.all([
			loadSyncSettings(),
			loadCalendars()
		])
		toast.success('Configuración actualizada')
	}

	// Obtener estado de conexión
	const getConnectionStatus = () => {
		if (syncStatus.isLoading) {
			return { status: 'loading', message: 'Cargando...', color: 'text-yellow-500' }
		}
		if (syncStatus.error) {
			return { status: 'error', message: syncStatus.error, color: 'text-red-500' }
		}
		if (calendars.length === 0) {
			return { status: 'warning', message: 'No hay calendarios disponibles', color: 'text-yellow-500' }
		}
		return { status: 'success', message: 'Conectado a Google Calendar', color: 'text-green-500' }
	}

	const connectionStatus = getConnectionStatus()

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Configuración de Sincronización
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Estado de conexión */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<CalendarIcon className="h-5 w-5" />
								<div>
									<h3 className="font-medium">Estado de Conexión</h3>
									<p className={cn("text-sm", connectionStatus.color)}>
										{connectionStatus.message}
									</p>
								</div>
							</div>
							<Button variant="outline" size="sm" onClick={handleRefresh}>
								<RefreshCw className="h-4 w-4 mr-2" />
								Actualizar
							</Button>
						</div>
						
						{/* Botón para conectar con Google OAuth si no hay calendarios */}
						{calendars.length === 0 && !syncStatus.isLoading && (
							<div className="mt-4 pt-4 border-t">
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<AlertCircle className="h-4 w-4 text-orange-600" />
										<p className="text-sm text-orange-700">
											Para usar Google Calendar, necesitas conectarte con tu cuenta de Google.
										</p>
									</div>
									<Button
										onClick={async () => {
											try {
												// Usar Supabase OAuth directamente para Google
												const { createClient } = await import('@/lib/supabase/client');
												const supabase = createClient();
												
												toast.info("Conectando con Google...");
												
												const { data, error } = await supabase.auth.signInWithOAuth({
													provider: 'google',
													options: {
														queryParams: {
															access_type: 'offline',
															prompt: 'consent',
															scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
														},
														redirectTo: `${window.location.origin}/fuentes?connected=true`
													}
												});
												
												if (error) {
													console.error('Error con OAuth:', error);
													toast.error('Error al conectar con Google');
												} else {
													toast.success("Redirigiendo a Google...");
												}
											} catch (error) {
												console.error('Error:', error);
												toast.error('Error al conectar con Google');
											}
										}}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Conectar con Google
									</Button>
								</div>
							</div>
						)}
					</Card>

					{/* Calendario predeterminado */}
					<div className="space-y-2">
						<Label>Calendario Predeterminado</Label>
						<Select 
							value={localSettings.default_calendar_id} 
							onValueChange={(value) => handleSettingChange('default_calendar_id', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un calendario" />
							</SelectTrigger>
							<SelectContent>
								{calendars.map((calendar) => (
									<SelectItem key={calendar.id} value={calendar.id}>
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-full" 
												style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
											/>
											{calendar.summary}
											{calendar.primary && (
												<Badge variant="secondary" className="text-xs">Principal</Badge>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							Este calendario se usará para sincronizar tareas y crear nuevos eventos
						</p>
					</div>

					{/* Configuraciones de sincronización */}
					<div className="space-y-4">
						<h3 className="font-medium">Configuraciones de Sincronización</h3>
						
						{/* Sincronización automática */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label htmlFor="auto-sync">Sincronización Automática</Label>
								<p className="text-sm text-muted-foreground">
									Sincronizar automáticamente las tareas nuevas con Google Calendar
								</p>
							</div>
							<Switch
								id="auto-sync"
								checked={localSettings.auto_sync_enabled}
								onCheckedChange={(checked) => handleSettingChange('auto_sync_enabled', checked)}
							/>
						</div>

						{/* Incluir tareas completadas */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label htmlFor="sync-completed">Incluir Tareas Completadas</Label>
								<p className="text-sm text-muted-foreground">
									Sincronizar también las tareas que ya están marcadas como completadas
								</p>
							</div>
							<Switch
								id="sync-completed"
								checked={localSettings.sync_completed_tasks}
								onCheckedChange={(checked) => handleSettingChange('sync_completed_tasks', checked)}
							/>
						</div>
					</div>

					{/* Información de última sincronización */}
					{syncStatus.lastSyncAt && (
						<Card className="p-4">
							<div className="flex items-center gap-3">
								<CheckCircle className="h-5 w-5 text-green-500" />
								<div>
									<h3 className="font-medium">Última Sincronización</h3>
									<p className="text-sm text-muted-foreground">
										{format(new Date(syncStatus.lastSyncAt), 'dd/MM/yyyy HH:mm', { locale: es })}
									</p>
								</div>
							</div>
						</Card>
					)}

					{/* Sincronización manual */}
					<Card className="p-4">
						<div className="space-y-3">
							<h3 className="font-medium">Sincronización Manual</h3>
							<p className="text-sm text-muted-foreground">
								Sincroniza todas las tareas pendientes con Google Calendar
							</p>
							<Button 
								onClick={handleSyncAll}
								disabled={isSyncing || syncStatus.isSyncing || calendars.length === 0}
								className="w-full"
							>
								<RotateCcw className="h-4 w-4 mr-2" />
								{isSyncing || syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Todo Ahora'}
							</Button>
						</div>
					</Card>

					{/* Información adicional */}
					<Card className="p-4 bg-muted/30">
						<div className="space-y-2">
							<h3 className="font-medium flex items-center gap-2">
								<AlertCircle className="h-4 w-4" />
								Información Importante
							</h3>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• Las tareas se sincronizan solo si tienen una fecha de vencimiento</li>
								<li>• Los eventos creados desde Synapse tendrán el prefijo "[Synapse]"</li>
								<li>• Los cambios en Google Calendar no se reflejan automáticamente en Synapse</li>
								<li>• Puedes desincronizar tareas individuales desde la vista de tareas</li>
							</ul>
						</div>
					</Card>

					{/* Enlaces útiles */}
					<div className="flex gap-2">
						<Button variant="outline" size="sm" asChild>
							<a 
								href="https://calendar.google.com" 
								target="_blank" 
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<ExternalLink className="h-4 w-4" />
								Abrir Google Calendar
							</a>
						</Button>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cerrar
					</Button>
					<Button onClick={handleSaveSettings} disabled={isSaving}>
						{isSaving ? 'Guardando...' : 'Guardar Configuración'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
