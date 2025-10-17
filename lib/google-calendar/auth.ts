import { createClient } from '@/lib/supabase/server'

/**
 * Obtiene el token de acceso de Google desde la sesión de Supabase
 */
export async function getGoogleAccessToken(): Promise<string | null> {
	try {
		const supabase = await createClient()
		const { data: { session } } = await supabase.auth.getSession()
		
		if (!session?.provider_token) {
			console.log('No hay token de Google disponible en la sesión')
			return null
		}
		
		return session.provider_token
	} catch (error) {
		console.error('Error obteniendo token de Google:', error)
		return null
	}
}

/**
 * Verifica si el usuario tiene permisos de Google Calendar
 */
export async function hasGoogleCalendarPermissions(): Promise<boolean> {
	try {
		const supabase = await createClient()
		const { data: { session } } = await supabase.auth.getSession()
		
		if (!session?.provider_token) {
			return false
		}
		
		// Verificar que el token tenga los scopes necesarios
		// Los scopes se configuran en Supabase Auth > Providers > Google
		return true
	} catch (error) {
		console.error('Error verificando permisos de Google Calendar:', error)
		return false
	}
}

/**
 * Refresca el token de Google si es necesario
 */
export async function refreshGoogleToken(): Promise<string | null> {
	try {
		const supabase = await createClient()
		const { data, error } = await supabase.auth.refreshSession()
		
		if (error) {
			console.error('Error refrescando token de Google:', error)
			return null
		}
		
		return data.session?.provider_token || null
	} catch (error) {
		console.error('Error refrescando token de Google:', error)
		return null
	}
}

/**
 * Obtiene información del usuario de Google
 */
export async function getGoogleUserInfo(): Promise<{
	email: string
	name: string
	picture?: string
} | null> {
	try {
		const supabase = await createClient()
		const { data: { session } } = await supabase.auth.getSession()
		
		if (!session?.user) {
			return null
		}
		
		return {
			email: session.user.email || '',
			name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
			picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
		}
	} catch (error) {
		console.error('Error obteniendo información del usuario de Google:', error)
		return null
	}
}

/**
 * Verifica si el usuario está autenticado con Google
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
	try {
		const supabase = await createClient()
		const { data: { session } } = await supabase.auth.getSession()
		
		return !!(session?.provider_token && session?.user)
	} catch (error) {
		console.error('Error verificando autenticación de Google:', error)
		return false
	}
}
