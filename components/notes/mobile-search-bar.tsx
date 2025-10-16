"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileSearchBarProps {
	onSearch: (query: string) => void
	scrollContainerRef?: React.RefObject<HTMLDivElement>
}

export function MobileSearchBar({ onSearch, scrollContainerRef }: MobileSearchBarProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [lastScrollY, setLastScrollY] = useState(0)
	const searchBarRef = useRef<HTMLDivElement>(null)

	// Detectar si es móvil real
	const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

	useEffect(() => {
		console.log('🚀 MobileSearchBar mounted - isMobile:', isMobile)
		
		const handleScroll = () => {
			const currentScrollY = scrollContainerRef?.current?.scrollTop ?? window.scrollY
			
			console.log('📱 Scroll detected:', {
				currentScrollY,
				lastScrollY,
				diff: currentScrollY - lastScrollY,
				isMobile,
				userAgent: navigator.userAgent.substring(0, 50) + '...'
			})
			
			// Lógica simple: mostrar si hay scroll hacia abajo
			if (currentScrollY > lastScrollY && currentScrollY > 5) {
				console.log('📱 Showing search bar')
				setIsVisible(true)
			} else if (currentScrollY < lastScrollY && searchQuery.trim() === '') {
				console.log('📱 Hiding search bar')
				setIsVisible(false)
			}
			
			setLastScrollY(currentScrollY)
		}

		// Eventos para móvil
		const handleTouchStart = (e: TouchEvent) => {
			console.log('📱 Touch start:', e.touches.length)
		}

		const handleTouchMove = (e: TouchEvent) => {
			console.log('📱 Touch move:', e.touches.length)
		}

		// Añadir listeners
		const container = scrollContainerRef?.current ?? window
		
		if (container instanceof HTMLElement) {
			container.addEventListener('scroll', handleScroll, { passive: true })
			container.addEventListener('touchstart', handleTouchStart, { passive: true })
			container.addEventListener('touchmove', handleTouchMove, { passive: true })
			
			return () => {
				container.removeEventListener('scroll', handleScroll)
				container.removeEventListener('touchstart', handleTouchStart)
				container.removeEventListener('touchmove', handleTouchMove)
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
	}, [lastScrollY, searchQuery, scrollContainerRef, isMobile])

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		onSearch(value)
	}

	const handleClearSearch = () => {
		setSearchQuery("")
		onSearch("")
	}

	const forceShow = () => {
		console.log('🔧 Force showing search bar')
		setIsVisible(true)
	}

	// Forzar visibilidad si hay búsqueda activa
	useEffect(() => {
		if (searchQuery.trim()) {
			setIsVisible(true)
		}
	}, [searchQuery])

	return (
		<>
			{/* DEBUG: Indicador visual siempre visible */}
			<div 
				className="fixed top-0 right-0 z-[10000] bg-red-500 text-white text-xs p-2 font-bold"
				style={{
					position: 'fixed',
					top: 0,
					right: 0,
					zIndex: 10000,
					backgroundColor: 'red',
					color: 'white',
					fontSize: '12px',
					padding: '8px',
					fontWeight: 'bold'
				}}
			>
				MOBILE_NEW
			</div>
			
			<div 
				ref={searchBarRef}
				className={cn(
					"fixed left-0 right-0 z-50 transition-all duration-300 ease-out",
					"bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
					"shadow-lg",
					isVisible 
						? "translate-y-0 opacity-100" 
						: "-translate-y-full opacity-0"
				)}
				style={{
					// Forzar estilos para móvil - aparecer debajo del header
					position: 'fixed',
					top: '60px', // Debajo del header
					left: 0,
					right: 0,
					zIndex: 50, // Menor que el header pero visible
					backgroundColor: 'white',
					borderBottom: '1px solid #e5e7eb',
					boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
					transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
					opacity: isVisible ? 1 : 0,
					transition: 'all 0.3s ease-out'
				}}
			>
			<div className="px-4 py-3">
				<div className="relative">
					{/* Ícono de búsqueda */}
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					
					{/* Input de búsqueda */}
					<input
						type="text"
						placeholder="Buscar en notas..."
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						className={cn(
							"w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300",
							"bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none",
							"text-base" // Tamaño de fuente más grande para móvil
						)}
						style={{
							fontSize: '16px', // Prevenir zoom en iOS
							WebkitAppearance: 'none',
							borderRadius: '8px'
						}}
					/>
					
					{/* Botón de limpiar */}
					{searchQuery && (
						<button
							onClick={handleClearSearch}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
						>
							<X className="h-4 w-4 text-gray-400" />
						</button>
					)}
					
					{/* Botón de prueba */}
					<button
						onClick={forceShow}
						className="absolute right-12 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
					>
						TEST
					</button>
				</div>
			</div>
		</>
	)
}
