'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
	const supabase = await createClient()

	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
		options: {
			data: {
				full_name: formData.get('full_name') as string,
			}
		}
	}

	const { error } = await supabase.auth.signUp(data)

	if (error) {
		throw new Error(error.message)
	}

	revalidatePath('/', 'layout')
	redirect('/onboarding')
}

export async function signIn(formData: FormData) {
	const supabase = await createClient()

	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	const { error } = await supabase.auth.signInWithPassword(data)

	if (error) {
		throw new Error(error.message)
	}

	revalidatePath('/', 'layout')
	redirect('/dashboard')
}

export async function signInWithGoogle() {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
		}
	})

	if (error) {
		throw new Error(error.message)
	}

	if (data.url) {
		redirect(data.url)
	}
}

export async function signOut() {
	const supabase = await createClient()
	
	const { error } = await supabase.auth.signOut()
	
	if (error) {
		throw new Error(error.message)
	}

	revalidatePath('/', 'layout')
	redirect('/')
}

export async function updateProfile(formData: FormData) {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	const { error } = await supabase
		.from('profiles')
		.update({
			full_name: formData.get('full_name') as string,
			interests: (formData.get('interests') as string).split(',').map(i => i.trim()).filter(i => i.length > 0),
			updated_at: new Date().toISOString()
		})
		.eq('id', user.id)

	if (error) {
		throw new Error(error.message)
	}

	revalidatePath('/dashboard')
	redirect('/dashboard')
}
