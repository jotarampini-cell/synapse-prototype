import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const supabase = await createClient()
		
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
		}

		const { noteId } = await params

		// Obtener análisis existente
		const { data: analysis, error } = await supabase
			.from('ai_analyses')
			.select('*')
			.eq('content_id', noteId)
			.eq('user_id', user.id)
			.single()

		if (error && error.code !== 'PGRST116') {
			console.error('Error fetching analysis:', error)
			return NextResponse.json({ error: 'Error al obtener análisis' }, { status: 500 })
		}

		return NextResponse.json({ analysis })
	} catch (error) {
		console.error('Error in AI analysis API:', error)
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
	}
}


