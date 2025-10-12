"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ExternalLink, ArrowRight, Sparkles, Zap, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface BannerProps {
	variant?: "default" | "success" | "warning" | "info" | "premium"
	title: string
	description?: string
	actionText?: string
	actionUrl?: string
	onAction?: () => void
	onClose?: () => void
	dismissible?: boolean
	icon?: React.ReactNode
	className?: string
}

// Componente de icono animado
function AnimatedIcon({ 
	icon, 
	variant, 
	className 
}: { 
	icon: React.ReactNode
	variant: string
	className?: string 
}) {
	return (
		<div className={cn(
			"relative flex items-center justify-center",
			className
		)}>
			{/* Fondo del icono con gradiente animado */}
			<div className={cn(
				"absolute inset-0 rounded-xl bg-gradient-to-br opacity-20 animate-gradient-shift",
				variant === "premium" && "from-purple-500 via-pink-500 to-rose-500",
				variant === "success" && "from-green-500 to-emerald-500",
				variant === "warning" && "from-amber-500 to-yellow-500",
				variant === "info" && "from-cyan-500 to-blue-500",
				variant === "default" && "from-blue-500 to-indigo-500"
			)} />
			
			{/* Contenedor del icono */}
			<div className={cn(
				"relative z-10 p-3 rounded-xl backdrop-blur-sm border border-white/20",
				"bg-white/10 dark:bg-black/10",
				"animate-icon-pulse"
			)}>
				{icon}
			</div>
			
			{/* Efecto de resplandor */}
			<div className={cn(
				"absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
				variant === "premium" && "bg-gradient-to-br from-purple-400/30 to-pink-400/30 animate-glow-pulse",
				variant === "success" && "bg-gradient-to-br from-green-400/30 to-emerald-400/30",
				variant === "warning" && "bg-gradient-to-br from-amber-400/30 to-yellow-400/30",
				variant === "info" && "bg-gradient-to-br from-cyan-400/30 to-blue-400/30",
				variant === "default" && "bg-gradient-to-br from-blue-400/30 to-indigo-400/30"
			)} />
		</div>
	)
}

// Componente de partículas flotantes para variante premium
function FloatingParticles() {
	return (
		<>
			{/* Partícula 1 */}
			<div className="absolute top-4 right-8 w-2 h-2 bg-purple-400/60 rounded-full animate-particle-float" 
				 style={{ animationDelay: "0s", animationDuration: "4s" }} />
			{/* Partícula 2 */}
			<div className="absolute top-8 right-16 w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-particle-float" 
				 style={{ animationDelay: "1s", animationDuration: "5s" }} />
			{/* Partícula 3 */}
			<div className="absolute top-12 right-6 w-1 h-1 bg-rose-400/60 rounded-full animate-particle-float" 
				 style={{ animationDelay: "2s", animationDuration: "6s" }} />
			{/* Partícula 4 */}
			<div className="absolute top-6 right-20 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-particle-float" 
				 style={{ animationDelay: "3s", animationDuration: "4.5s" }} />
		</>
	)
}

export function ResponsiveBanner({
	variant = "default",
	title,
	description,
	actionText,
	actionUrl,
	onAction,
	onClose,
	dismissible = true,
	icon,
	className
}: BannerProps) {
	const [isVisible, setIsVisible] = useState(true)
	const [isAnimating, setIsAnimating] = useState(false)

	useEffect(() => {
		// Trigger entrance animation
		setIsAnimating(true)
	}, [])

	const handleClose = () => {
		setIsAnimating(false)
		setTimeout(() => {
			setIsVisible(false)
			onClose?.()
		}, 300)
	}

	const handleAction = () => {
		if (actionUrl) {
			window.open(actionUrl, "_blank", "noopener,noreferrer")
		}
		onAction?.()
	}

	if (!isVisible) return null

	const variants = {
		default: {
			container: "bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40",
			border: "border-blue-200/50 dark:border-blue-800/50",
			shadow: "shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20",
			icon: "text-blue-600 dark:text-blue-400",
			title: "text-blue-900 dark:text-blue-100",
			description: "text-blue-700 dark:text-blue-300",
			action: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
			badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
		},
		success: {
			container: "bg-gradient-to-r from-green-50/80 via-emerald-50/80 to-green-50/80 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-green-950/40",
			border: "border-green-200/50 dark:border-green-800/50",
			shadow: "shadow-lg shadow-green-500/10 dark:shadow-green-500/20",
			icon: "text-green-600 dark:text-green-400",
			title: "text-green-900 dark:text-green-100",
			description: "text-green-700 dark:text-green-300",
			action: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40",
			badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
		},
		warning: {
			container: "bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-amber-50/80 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-amber-950/40",
			border: "border-amber-200/50 dark:border-amber-800/50",
			shadow: "shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20",
			icon: "text-amber-600 dark:text-amber-400",
			title: "text-amber-900 dark:text-amber-100",
			description: "text-amber-700 dark:text-amber-300",
			action: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
			badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
		},
		info: {
			container: "bg-gradient-to-r from-cyan-50/80 via-blue-50/80 to-cyan-50/80 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-cyan-950/40",
			border: "border-cyan-200/50 dark:border-cyan-800/50",
			shadow: "shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/20",
			icon: "text-cyan-600 dark:text-cyan-400",
			title: "text-cyan-900 dark:text-cyan-100",
			description: "text-cyan-700 dark:text-cyan-300",
			action: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40",
			badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200"
		},
		premium: {
			container: "bg-gradient-to-r from-purple-50/80 via-pink-50/80 to-rose-50/80 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-rose-950/40",
			border: "border-purple-200/50 dark:border-purple-800/50",
			shadow: "shadow-lg shadow-purple-500/20 dark:shadow-purple-500/30",
			icon: "text-purple-600 dark:text-purple-400",
			title: "text-purple-900 dark:text-purple-100",
			description: "text-purple-700 dark:text-purple-300",
			action: "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 animate-shimmer",
			badge: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/50 dark:to-pink-900/50 dark:text-purple-200"
		}
	}

	const currentVariant = variants[variant]

	return (
		<Card className={cn(
			"relative overflow-hidden border-2 backdrop-blur-xl transition-all duration-500 ease-out",
			currentVariant.container,
			currentVariant.border,
			currentVariant.shadow,
			isAnimating ? "animate-slide-in-up" : "opacity-0 translate-y-4",
			className
		)}>
			{/* Efecto de vidrio de fondo */}
			<div className="absolute inset-0 bg-white/5 dark:bg-black/5 backdrop-blur-sm" />
			
			{/* Partículas flotantes para variante premium */}
			{variant === "premium" && <FloatingParticles />}
			
			{/* Borde animado para premium */}
			{variant === "premium" && (
				<div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 animate-gradient-shift opacity-50" />
			)}

			{/* Desktop Layout */}
			<div className="hidden md:block relative z-10">
				<div className="flex items-center justify-between p-6">
					<div className="flex items-center gap-6 flex-1">
						{icon && (
							<AnimatedIcon 
								icon={icon} 
								variant={variant}
								className="group"
							/>
						)}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-3 mb-2">
								<h3 className={cn(
									"font-bold text-lg leading-tight tracking-tight",
									currentVariant.title
								)}>
									{title}
								</h3>
								{variant === "premium" && (
									<Badge className={cn("text-xs font-semibold px-3 py-1", currentVariant.badge)}>
										<Crown className="h-3 w-3 mr-1.5" />
										Premium
									</Badge>
								)}
							</div>
							{description && (
								<p className={cn(
									"text-base leading-relaxed font-medium",
									currentVariant.description
								)}>
									{description}
								</p>
							)}
						</div>
					</div>
					
					<div className="flex items-center gap-4 flex-shrink-0">
						{actionText && (
							<Button
								size="lg"
								className={cn(
									"gap-3 px-6 py-3 font-semibold transition-all duration-300",
									"hover:scale-105 active:scale-95",
									"relative overflow-hidden",
									currentVariant.action
								)}
								onClick={handleAction}
							>
								<span className="relative z-10">{actionText}</span>
								{actionUrl ? (
									<ExternalLink className="h-4 w-4 relative z-10" />
								) : (
									<ArrowRight className="h-4 w-4 relative z-10" />
								)}
								{/* Efecto shimmer en el botón */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
							</Button>
						)}
						{dismissible && (
							<Button
								variant="ghost"
								size="sm"
								className="h-10 w-10 p-0 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 hover:scale-110"
								onClick={handleClose}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="md:hidden relative z-10">
				<div className="p-5">
					<div className="flex items-start gap-4">
						{icon && (
							<AnimatedIcon 
								icon={icon} 
								variant={variant}
								className="group flex-shrink-0"
							/>
						)}
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-3 mb-3">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-2">
										<h3 className={cn(
											"font-bold text-base leading-tight tracking-tight",
											currentVariant.title
										)}>
											{title}
										</h3>
										{variant === "premium" && (
											<Badge className={cn("text-xs font-semibold px-2 py-1", currentVariant.badge)}>
												<Crown className="h-3 w-3 mr-1" />
												Premium
											</Badge>
										)}
									</div>
									{description && (
										<p className={cn(
											"text-sm leading-relaxed font-medium",
											currentVariant.description
										)}>
											{description}
										</p>
									)}
								</div>
								{dismissible && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 rounded-full flex-shrink-0 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 hover:scale-110"
										onClick={handleClose}
									>
										<X className="h-3 w-3" />
									</Button>
								)}
							</div>
							
							{actionText && (
								<Button
									size="lg"
									className={cn(
										"w-full gap-3 px-6 py-3 font-semibold transition-all duration-300",
										"hover:scale-[1.02] active:scale-[0.98]",
										"relative overflow-hidden",
										currentVariant.action
									)}
									onClick={handleAction}
								>
									<span className="relative z-10">{actionText}</span>
									{actionUrl ? (
										<ExternalLink className="h-4 w-4 relative z-10" />
									) : (
										<ArrowRight className="h-4 w-4 relative z-10" />
									)}
									{/* Efecto shimmer en el botón */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</Card>
	)
}

// Banner predefinidos mejorados
export function WelcomeBanner({ onClose }: { onClose?: () => void }) {
	return (
		<ResponsiveBanner
			variant="info"
			title="¡Bienvenido a Synapse!"
			description="Tu segunda mente digital está lista. Comienza creando tu primera nota o explora las funciones de IA."
			actionText="Comenzar"
			onAction={() => {
				window.location.href = "/notes?create=true"
			}}
			onClose={onClose}
			icon={<Zap className="h-6 w-6" />}
		/>
	)
}

export function PremiumBanner({ onClose }: { onClose?: () => void }) {
	return (
		<ResponsiveBanner
			variant="premium"
			title="Desbloquea el poder completo de Synapse"
			description="Obtén análisis avanzados de IA, integraciones premium y almacenamiento ilimitado."
			actionText="Actualizar a Premium"
			actionUrl="https://synapse.app/premium"
			onClose={onClose}
			icon={<Sparkles className="h-6 w-6" />}
		/>
	)
}

export function FeatureBanner({ 
	feature, 
	onClose 
}: { 
	feature: string
	onClose?: () => void 
}) {
	return (
		<ResponsiveBanner
			variant="success"
			title={`Nueva función: ${feature}`}
			description="Descubre cómo esta nueva función puede mejorar tu flujo de trabajo."
			actionText="Explorar"
			onClose={onClose}
			icon={<Star className="h-6 w-6" />}
		/>
	)
}