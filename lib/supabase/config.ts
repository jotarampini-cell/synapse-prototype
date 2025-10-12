/**
 * Configuración centralizada de Supabase
 * Este archivo proporciona valores por defecto para evitar problemas de configuración
 */

export const SUPABASE_CONFIG = {
	// URLs y claves hardcodeadas como fallback
	url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyirmouqrptuvsxffxlv.supabase.co',
	anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXJtb3VxcnB0dXZzeGZmeGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODYzOTgsImV4cCI6MjA3NTM2MjM5OH0.tYBJWtIbTeI54OJKBeh58uiAq5hO3faFo06ujf_5CyE',
	siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://synapse-ai-ten.vercel.app'
} as const;

/**
 * Verifica si la configuración de Supabase está completa
 */
export function validateSupabaseConfig(): { isValid: boolean; missing: string[] } {
	const missing: string[] = [];
	
	if (!SUPABASE_CONFIG.url) {
		missing.push('NEXT_PUBLIC_SUPABASE_URL');
	}
	
	if (!SUPABASE_CONFIG.anonKey) {
		missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
	}
	
	return {
		isValid: missing.length === 0,
		missing
	};
}

/**
 * Obtiene la configuración de Supabase con validación
 */
export function getSupabaseConfig() {
	const validation = validateSupabaseConfig();
	
	if (!validation.isValid) {
		console.warn('⚠️ Variables de entorno de Supabase faltantes:', validation.missing.join(', '));
		console.warn('🔧 Usando configuración por defecto. Ejecuta "npm run setup" para configurar correctamente.');
	}
	
	return SUPABASE_CONFIG;
}




