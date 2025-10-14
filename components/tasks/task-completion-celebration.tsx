"use client"

import { useEffect, useState } from "react"
import { CheckCircle, PartyPopper, Sparkles, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskCompletionCelebrationProps {
	show: boolean
	onAnimationComplete?: () => void
}

export function TaskCompletionCelebration({ 
	show, 
	onAnimationComplete 
}: TaskCompletionCelebrationProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter')

	useEffect(() => {
		if (show) {
			setIsVisible(true)
			setAnimationPhase('enter')
			
			// Secuencia de animaciones
			const timer1 = setTimeout(() => {
				setAnimationPhase('celebrate')
			}, 300)

			const timer2 = setTimeout(() => {
				setAnimationPhase('exit')
			}, 2000)

			const timer3 = setTimeout(() => {
				setIsVisible(false)
				onAnimationComplete?.()
			}, 3000)

			return () => {
				clearTimeout(timer1)
				clearTimeout(timer2)
				clearTimeout(timer3)
			}
		}
	}, [show, onAnimationComplete])

	if (!isVisible) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
			{/* Overlay con gradiente */}
			<div className={cn(
				"absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-500/10 to-teal-600/20",
				"transition-opacity duration-500",
				animationPhase === 'enter' ? "opacity-0" : "opacity-100"
			)} />

			{/* Contenido principal */}
			<div className={cn(
				"relative flex flex-col items-center justify-center text-center",
				"transform transition-all duration-500 ease-out",
				animationPhase === 'enter' && "scale-50 opacity-0 translate-y-8",
				animationPhase === 'celebrate' && "scale-100 opacity-100 translate-y-0",
				animationPhase === 'exit' && "scale-110 opacity-0 translate-y-4"
			)}>
				{/* Ícono principal con animación */}
				<div className="relative mb-6">
					{/* Círculo de fondo con pulso */}
					<div className={cn(
						"absolute inset-0 rounded-full bg-green-500/20",
						"animate-ping"
					)} />
					
					{/* Ícono principal */}
					<div className={cn(
						"relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600",
						"flex items-center justify-center shadow-2xl",
						"transform transition-all duration-300",
						animationPhase === 'celebrate' && "animate-bounce"
					)}>
						<Trophy className="w-12 h-12 text-white" />
					</div>

					{/* Partículas flotantes */}
					{animationPhase === 'celebrate' && (
						<>
							<div className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDelay: '0.1s' }}>
								<Sparkles className="w-4 h-4" />
							</div>
							<div className="absolute -top-1 -right-3 w-3 h-3 text-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }}>
								<Sparkles className="w-3 h-3" />
							</div>
							<div className="absolute -bottom-2 -left-1 w-3 h-3 text-yellow-400 animate-bounce" style={{ animationDelay: '0.5s' }}>
								<Sparkles className="w-3 h-3" />
							</div>
							<div className="absolute -bottom-1 -right-2 w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDelay: '0.7s' }}>
								<Sparkles className="w-4 h-4" />
							</div>
						</>
					)}
				</div>

				{/* Texto de celebración */}
				<div className="space-y-2">
					<h2 className={cn(
						"text-2xl font-bold text-green-600",
						"transform transition-all duration-300",
						animationPhase === 'enter' && "opacity-0 translate-y-4",
						animationPhase === 'celebrate' && "opacity-100 translate-y-0"
					)}>
						¡Todas las tareas completadas!
					</h2>
					<p className={cn(
						"text-lg text-green-500/80 font-medium",
						"transform transition-all duration-300",
						animationPhase === 'enter' && "opacity-0 translate-y-4",
						animationPhase === 'celebrate' && "opacity-100 translate-y-0"
					)}>
						Excelente trabajo 🎉
					</p>
				</div>

				{/* Efectos de confeti */}
				{animationPhase === 'celebrate' && (
					<div className="absolute inset-0 pointer-events-none">
						{/* Confeti animado */}
						{[...Array(12)].map((_, i) => (
							<div
								key={i}
								className={cn(
									"absolute w-2 h-2 rounded-full",
									i % 4 === 0 && "bg-yellow-400",
									i % 4 === 1 && "bg-green-400",
									i % 4 === 2 && "bg-blue-400",
									i % 4 === 3 && "bg-purple-400"
								)}
								style={{
									left: `${20 + (i * 5)}%`,
									top: `${30 + (i % 3) * 20}%`,
									animation: `confettiFall 2s ease-out forwards`,
									animationDelay: `${i * 0.1}s`
								}}
							/>
						))}
					</div>
				)}
			</div>

			{/* Estilos CSS para animaciones personalizadas */}
			<style jsx>{`
				@keyframes confettiFall {
					0% {
						transform: translateY(-100vh) rotate(0deg);
						opacity: 1;
					}
					100% {
						transform: translateY(100vh) rotate(360deg);
						opacity: 0;
					}
				}
			`}</style>
		</div>
	)
}

