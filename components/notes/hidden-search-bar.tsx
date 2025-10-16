"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HiddenSearchBarProps {
	onSearch: (query: string) => void
	placeholder?: string
	scrollContainerRef?: React.RefObject<HTMLDivElement>
}

export function HiddenSearchBar({ 
	onSearch,
	placeholder = "Buscar notas...",
	scrollContainerRef
}: HiddenSearchBarProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [searchQuery, setSearchQuery] = useState("")
	

	useEffect(() => {
		const handleScroll = () => {
			// Obtener scroll del contenedor correcto (no del window)
			const currentScrollY = scrollContainerRef?.current?.scrollTop ?? window.scrollY
			
			// DEBUG: Log para móvil real
			console.log('🔍 Mobile Scroll Debug:', {
				currentScrollY,
				lastScrollY,
				diff: currentScrollY - lastScrollY,
				threshold: 10,
				searchQuery: searchQuery.trim(),
				isVisible,
				userAgent: navigator.userAgent,
				isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
			})
			
			// Solo procesar si hay scroll significativo (>5px para móvil - más sensible)
			if (Math.abs(currentScrollY - lastScrollY) < 5) return
			
			// Mostrar al hacer scroll hacia ABAJO (threshold más bajo para móvil)
			if (currentScrollY > lastScrollY && currentScrollY > 10) {
				console.log('📱 Showing search bar - scroll down')
				setIsVisible(true)
			} 
			// Ocultar al hacer scroll hacia ARRIBA (pero mantener si hay búsqueda activa)
			else if (currentScrollY < lastScrollY) {
				if (searchQuery.trim() === '') {
					// Sin búsqueda activa: ocultar
					console.log('📱 Hiding search bar - scroll up, no search')
					setIsVisible(false)
				} else {
					console.log('📱 Keeping search bar - scroll up, but search active')
				}
				// Con búsqueda activa: mantener visible (no hacer nada)
			}
			
			setLastScrollY(currentScrollY)
		}
		
		// Escuchar scroll del contenedor o del window como fallback
		const scrollContainer = scrollContainerRef?.current ?? window
		
		// Añadir eventos táctiles para móvil
		const handleTouchStart = () => {
			console.log('📱 Touch start detected')
		}
		
		const handleTouchMove = () => {
			console.log('📱 Touch move detected')
		}
		
		if (scrollContainer instanceof HTMLElement) {
			scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
			scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true })
			scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true })
			return () => {
				scrollContainer.removeEventListener('scroll', handleScroll)
				scrollContainer.removeEventListener('touchstart', handleTouchStart)
				scrollContainer.removeEventListener('touchmove', handleTouchMove)
			}
		} else {
			window.addEventListener('scroll', handleScroll, { passive: true })
			window.addEventListener('touchstart', handleTouchStart, { passive: true })
			window.addEventListener('touchmove', handleTouchMove, { passive: true })
			return () => {
				window.removeEventListener('scroll', handleScroll)
				window.removeEventListener('touchstart', handleTouchStart)
				window.removeEventListener('touchmove', handleTouchMove)
			}
		}
	}, [lastScrollY, searchQuery, scrollContainerRef])

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		onSearch(value)
	}

	const handleClearSearch = () => {
		setSearchQuery("")
		onSearch("")
	}
	
	// DEBUG: Función para forzar visibilidad (temporal)
	const forceShow = () => {
		console.log('🔧 Forcing search bar to show')
		setIsVisible(true)
	}

	return (
		<div className={cn(
			"fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
			"bg-background/98 backdrop-blur-xl",
			"border-b border-border/30 shadow-sm",
			// DEBUG: Indicador visual temporal para móvil
			"before:content-['MOBILE_DEBUG'] before:absolute before:top-0 before:right-0 before:bg-red-500 before:text-white before:text-xs before:p-1 before:z-10",
			isVisible 
				? "translate-y-0 opacity-100 pointer-events-auto" 
				: "-translate-y-full opacity-0 pointer-events-none"
		)}>
			<div className="max-w-2xl mx-auto px-4 py-3">
				<div className="relative group">
					{/* Ícono de búsqueda animado */}
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200">
						<Search className={cn(
							"h-4 w-4 transition-colors duration-200",
							searchQuery 
								? "text-primary" 
								: "text-muted-foreground group-focus-within:text-primary"
						)} />
					</div>
					
					{/* Input con animación */}
					<Input
						placeholder="Buscar en notas..."
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						className={cn(
							"pl-10 pr-10 h-11 rounded-xl border-border/50",
							"bg-muted/30 backdrop-blur-sm",
							"transition-all duration-200",
							"focus:bg-background focus:border-primary/50 focus:shadow-md",
							"placeholder:text-muted-foreground/70",
							searchQuery && "bg-background border-primary/30"
						)}
					/>
					
					{/* Botón de limpiar con animación */}
					{searchQuery && (
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"absolute right-1 top-1/2 transform -translate-y-1/2",
								"h-8 w-8 rounded-full",
								"bg-muted/50 hover:bg-muted transition-all duration-200",
								"animate-in fade-in zoom-in-95"
							)}
							onClick={handleClearSearch}
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					)}
					
					{/* DEBUG: Botón temporal para forzar visibilidad */}
					<button
						onClick={forceShow}
						className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-blue-500 text-white text-xs"
					>
						TEST
					</button>
				</div>
			</div>
		</div>
	)
}


