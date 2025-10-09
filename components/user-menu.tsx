'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'
import { toast } from 'sonner'

interface User {
	id: string
	email?: string
	full_name?: string
}

export function UserMenu() {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const supabase = createClient()

		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				setUser({
					id: user.id,
					email: user.email,
					full_name: user.user_metadata?.full_name
				})
			}
			setIsLoading(false)
		}

		getUser()

		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(event, session) => {
				if (session?.user) {
					setUser({
						id: session.user.id,
						email: session.user.email,
						full_name: session.user.user_metadata?.full_name
					})
				} else {
					setUser(null)
				}
				setIsLoading(false)
			}
		)

		return () => subscription.unsubscribe()
	}, [])

	const handleSignOut = async () => {
		try {
			await signOut()
			toast.success('Sesión cerrada correctamente')
		} catch (error) {
			toast.error('Error al cerrar sesión')
		}
	}

	if (isLoading) {
		return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
	}

	if (!user) {
		return (
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<a href="/auth/login">Iniciar Sesión</a>
				</Button>
				<Button size="sm" asChild>
					<a href="/auth/signup">Registrarse</a>
				</Button>
			</div>
		)
	}

	const initials = user.full_name
		? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
		: user.email?.[0].toUpperCase() || 'U'

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage src="" alt={user.full_name || user.email} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{user.full_name || 'Usuario'}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<User className="mr-2 h-4 w-4" />
					<span>Perfil</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Settings className="mr-2 h-4 w-4" />
					<span>Configuración</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Cerrar sesión</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
