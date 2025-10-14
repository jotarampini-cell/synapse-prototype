import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
	// Temporalmente deshabilitado para debug
	console.log('🔍 Middleware interceptando:', request.nextUrl.pathname)
	
	// BYPASS TEMPORAL PARA PRUEBAS - Permitir acceso sin autenticación
	if (request.nextUrl.pathname.startsWith('/notes') || 
		request.nextUrl.pathname.startsWith('/home') ||
		request.nextUrl.pathname.startsWith('/proyectos') ||
		request.nextUrl.pathname.startsWith('/fuentes') ||
		request.nextUrl.pathname.startsWith('/acciones')) {
		console.log('🚧 BYPASS: Permitiendo acceso sin autenticación para pruebas')
		return NextResponse.next()
	}
	
	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}

