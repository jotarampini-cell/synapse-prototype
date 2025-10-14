'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Brain, Mail, Lock, Chrome } from 'lucide-react'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/app/actions/auth'
import { toast } from 'sonner'

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false)
	const [isGoogleLoading, setIsGoogleLoading] = useState(false)

	const handleSubmit = async (formData: FormData) => {
		setIsLoading(true)
		try {
			await signIn(formData)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
		} finally {
			setIsLoading(false)
		}
	}

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true)
		try {
			await signInWithGoogle()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión con Google')
		} finally {
			setIsGoogleLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div className="text-center">
					<Link href="/" className="inline-flex items-center gap-2 mb-6">
						<Brain className="h-8 w-8 text-primary" />
						<span className="text-2xl font-bold text-foreground">Synapse</span>
					</Link>
					<h1 className="text-3xl font-bold text-foreground">Bienvenido de vuelta</h1>
					<p className="mt-2 text-muted-foreground">
						Inicia sesión en tu cuenta para continuar
					</p>
				</div>

				<Card className="p-6">
					<form action={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Correo electrónico</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="tu@email.com"
									className="pl-10"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Contraseña</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="••••••••"
									className="pl-10"
									required
								/>
							</div>
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
						</Button>
					</form>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									O continúa con
								</span>
							</div>
						</div>

						<Button
							variant="outline"
							className="w-full mt-4 gap-2"
							onClick={handleGoogleSignIn}
							disabled={isGoogleLoading}
						>
							<Chrome className="h-4 w-4" />
							{isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
						</Button>
					</div>

					<div className="mt-6 text-center">
						<p className="text-sm text-muted-foreground">
							¿No tienes una cuenta?{' '}
							<Link href="/auth/signup" className="text-primary hover:underline">
								Regístrate aquí
							</Link>
						</p>
					</div>
				</Card>
			</div>
		</div>
	)
}












