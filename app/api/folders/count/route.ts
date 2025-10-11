import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		// Contar carpetas del usuario
		const { count, error } = await supabase
			.from('folders')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)

		if (error) {
			console.error('Error counting folders:', error)
			return NextResponse.json({ error: 'Error al contar carpetas' }, { status: 500 })
		}

		return NextResponse.json({ count: count || 0 })
	} catch (error) {
		console.error('Error in folders count API:', error)
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
	}
}




