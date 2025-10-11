"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X, ChevronDown } from "lucide-react"

interface MobileDrawerProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	className?: string
	height?: "sm" | "md" | "lg" | "full"
	showHandle?: boolean
}

const heightClasses = {
	sm: "max-h-[40vh]",
	md: "max-h-[60vh]", 
	lg: "max-h-[80vh]",
	full: "max-h-[95vh]"
}

export function MobileDrawer({
	isOpen,
	onClose,
	title,
	children,
	className,
	height = "md",
	showHandle = true
}: MobileDrawerProps) {
	const [isAnimating, setIsAnimating] = useState(false)
	const drawerRef = useRef<HTMLDivElement>(null)
	const [dragStart, setDragStart] = useState<{ y: number; startHeight: number } | null>(null)

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true)
			// Prevent body scroll when drawer is open
			document.body.style.overflow = 'hidden'
		} else {
			setIsAnimating(false)
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	// Handle swipe down to close
	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0]
		setDragStart({
			y: touch.clientY,
			startHeight: drawerRef.current?.offsetHeight || 0
		})
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!dragStart || !drawerRef.current) return

		const touch = e.touches[0]
		const deltaY = touch.clientY - dragStart.y
		
		// Only allow downward swipe
		if (deltaY > 0) {
			const newHeight = Math.max(100, dragStart.startHeight - deltaY)
			drawerRef.current.style.height = `${newHeight}px`
		}
	}

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (!dragStart || !drawerRef.current) return

		const touch = e.changedTouches[0]
		const deltaY = touch.clientY - dragStart.y
		const threshold = 100 // Minimum swipe distance to close

		if (deltaY > threshold) {
			onClose()
		} else {
			// Reset height
			drawerRef.current.style.height = ''
		}

		setDragStart(null)
	}

	// Handle backdrop click
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<div 
			className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div
				ref={drawerRef}
				className={cn(
					"absolute bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-lg",
					"transform transition-transform duration-300 ease-out",
					isAnimating ? "translate-y-0" : "translate-y-full",
					heightClasses[height],
					className
				)}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Handle bar */}
				{showHandle && (
					<div className="flex justify-center pt-3 pb-2">
						<div className="w-12 h-1 bg-muted rounded-full" />
					</div>
				)}

				{/* Header */}
				{(title || showHandle) && (
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						{title && (
							<h3 className="text-lg font-semibold">{title}</h3>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="touch-target"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	)
}

// Hook para manejar drawers móviles
export function useMobileDrawer() {
	const [isOpen, setIsOpen] = useState(false)

	const openDrawer = () => setIsOpen(true)
	const closeDrawer = () => setIsOpen(false)
	const toggleDrawer = () => setIsOpen(prev => !prev)

	return {
		isOpen,
		openDrawer,
		closeDrawer,
		toggleDrawer
	}
}

// Componente específico para filtros
export function MobileFiltersDrawer({
	isOpen,
	onClose,
	children
}: {
	isOpen: boolean
	onClose: () => void
	children: React.ReactNode
}) {
	return (
		<MobileDrawer
			isOpen={isOpen}
			onClose={onClose}
			title="Filtros"
			height="md"
		>
			<div className="p-4 space-y-4">
				{children}
			</div>
		</MobileDrawer>
	)
}

// Componente específico para configuración
export function MobileSettingsDrawer({
	isOpen,
	onClose,
	children
}: {
	isOpen: boolean
	onClose: () => void
	children: React.ReactNode
}) {
	return (
		<MobileDrawer
			isOpen={isOpen}
			onClose={onClose}
			title="Configuración"
			height="lg"
		>
			<div className="p-4 space-y-6">
				{children}
			</div>
		</MobileDrawer>
	)
}
