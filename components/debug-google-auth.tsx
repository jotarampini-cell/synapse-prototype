"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export function DebugGoogleAuth() {
    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const runDiagnostic = async () => {
        setIsLoading(true)
        const info: any = {
            timestamp: new Date().toISOString(),
            steps: []
        }

        try {
            // Paso 1: Verificar cliente Supabase
            info.steps.push({ step: 1, name: 'Crear cliente Supabase', status: 'running' })
            const supabase = createClient()
            info.steps.push({ step: 1, name: 'Crear cliente Supabase', status: 'success' })

            // Paso 2: Verificar sesión
            info.steps.push({ step: 2, name: 'Verificar sesión actual', status: 'running' })
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
                info.steps.push({ step: 2, name: 'Verificar sesión actual', status: 'error', error: sessionError.message })
                setDebugInfo(info)
                return
            }

            if (!session) {
                info.steps.push({ step: 2, name: 'Verificar sesión actual', status: 'warning', message: 'No hay sesión activa' })
                setDebugInfo(info)
                return
            }

            info.session = {
                user: session.user?.email,
                provider: session.user?.app_metadata?.provider,
                hasProviderToken: !!session.provider_token,
                hasRefreshToken: !!session.provider_refresh_token,
                tokenLength: session.provider_token?.length || 0
            }
            info.steps.push({ step: 2, name: 'Verificar sesión actual', status: 'success' })

            // Paso 3: Analizar token
            if (session.provider_token) {
                info.steps.push({ step: 3, name: 'Analizar token de Google', status: 'running' })
                try {
                    const tokenParts = session.provider_token.split('.')
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]))
                        info.tokenInfo = {
                            scopes: payload.scope || 'No especificados',
                            expires: new Date(payload.exp * 1000).toLocaleString(),
                            audience: payload.aud,
                            issuer: payload.iss
                        }
                    }
                    info.steps.push({ step: 3, name: 'Analizar token de Google', status: 'success' })
                } catch (error: any) {
                    info.steps.push({ step: 3, name: 'Analizar token de Google', status: 'error', error: error.message })
                }
            } else {
                info.steps.push({ step: 3, name: 'Analizar token de Google', status: 'warning', message: 'No hay token de proveedor' })
            }

            // Paso 4: Probar Google Calendar API
            if (session.provider_token) {
                info.steps.push({ step: 4, name: 'Probar Google Calendar API', status: 'running' })
                try {
                    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                        headers: {
                            'Authorization': `Bearer ${session.provider_token}`,
                            'Content-Type': 'application/json'
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()
                        info.calendarInfo = {
                            success: true,
                            calendarCount: data.items?.length || 0,
                            calendars: data.items?.slice(0, 3).map((cal: any) => ({
                                name: cal.summary,
                                id: cal.id,
                                primary: cal.primary
                            })) || []
                        }
                        info.steps.push({ step: 4, name: 'Probar Google Calendar API', status: 'success' })
                    } else {
                        const errorText = await response.text()
                        info.steps.push({ step: 4, name: 'Probar Google Calendar API', status: 'error', error: `${response.status}: ${errorText}` })
                    }
                } catch (error: any) {
                    info.steps.push({ step: 4, name: 'Probar Google Calendar API', status: 'error', error: error.message })
                }
            } else {
                info.steps.push({ step: 4, name: 'Probar Google Calendar API', status: 'warning', message: 'No hay token para probar' })
            }

        } catch (error: any) {
            info.steps.push({ step: 0, name: 'Error general', status: 'error', error: error.message })
        }

        setDebugInfo(info)
        setIsLoading(false)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-800'
            case 'error': return 'bg-red-100 text-red-800'
            case 'warning': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-blue-100 text-blue-800'
        }
    }

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Diagnóstico de Google OAuth
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={runDiagnostic} disabled={isLoading} className="w-full">
                    {isLoading ? 'Ejecutando diagnóstico...' : 'Ejecutar Diagnóstico'}
                </Button>

                {debugInfo && (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Ejecutado: {new Date(debugInfo.timestamp).toLocaleString()}
                        </div>

                        {/* Pasos del diagnóstico */}
                        <div className="space-y-2">
                            <h3 className="font-medium">Pasos del diagnóstico:</h3>
                            {debugInfo.steps.map((step: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                                    {getStatusIcon(step.status)}
                                    <div className="flex-1">
                                        <div className="font-medium">{step.name}</div>
                                        {step.error && <div className="text-sm text-red-600">{step.error}</div>}
                                        {step.message && <div className="text-sm text-yellow-600">{step.message}</div>}
                                    </div>
                                    <Badge className={getStatusColor(step.status)}>
                                        {step.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {/* Información de sesión */}
                        {debugInfo.session && (
                            <div className="space-y-2">
                                <h3 className="font-medium">Información de sesión:</h3>
                                <div className="p-3 rounded-lg border bg-muted/50">
                                    <div><strong>Usuario:</strong> {debugInfo.session.user}</div>
                                    <div><strong>Proveedor:</strong> {debugInfo.session.provider}</div>
                                    <div><strong>Token presente:</strong> {debugInfo.session.hasProviderToken ? '✅' : '❌'}</div>
                                    <div><strong>Refresh token:</strong> {debugInfo.session.hasRefreshToken ? '✅' : '❌'}</div>
                                    <div><strong>Longitud del token:</strong> {debugInfo.session.tokenLength}</div>
                                </div>
                            </div>
                        )}

                        {/* Información del token */}
                        {debugInfo.tokenInfo && (
                            <div className="space-y-2">
                                <h3 className="font-medium">Información del token:</h3>
                                <div className="p-3 rounded-lg border bg-muted/50">
                                    <div><strong>Scopes:</strong> {debugInfo.tokenInfo.scopes}</div>
                                    <div><strong>Expira:</strong> {debugInfo.tokenInfo.expires}</div>
                                    <div><strong>Audiencia:</strong> {debugInfo.tokenInfo.audience}</div>
                                    <div><strong>Emisor:</strong> {debugInfo.tokenInfo.issuer}</div>
                                </div>
                            </div>
                        )}

                        {/* Información de calendarios */}
                        {debugInfo.calendarInfo && (
                            <div className="space-y-2">
                                <h3 className="font-medium">Acceso a Google Calendar:</h3>
                                <div className="p-3 rounded-lg border bg-muted/50">
                                    <div><strong>Estado:</strong> {debugInfo.calendarInfo.success ? '✅ Exitoso' : '❌ Fallido'}</div>
                                    <div><strong>Calendarios encontrados:</strong> {debugInfo.calendarInfo.calendarCount}</div>
                                    {debugInfo.calendarInfo.calendars.length > 0 && (
                                        <div>
                                            <strong>Primeros calendarios:</strong>
                                            <ul className="ml-4 mt-1">
                                                {debugInfo.calendarInfo.calendars.map((cal: any, index: number) => (
                                                    <li key={index} className="text-sm">
                                                        {cal.name} {cal.primary && '(Principal)'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
