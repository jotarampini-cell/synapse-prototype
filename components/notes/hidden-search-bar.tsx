"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HiddenSearchBarProps {
	onSearch: (query: string) => void
	placeholder?: string
}

export function HiddenSearchBar({ 
	onSearch,
	placeholder = "Buscar notas..."
}: HiddenSearchBarProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [searchQuery, setSearchQuery] = useState("")

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY
			
			// Solo procesar si hay scroll significativo (>10px para evitar jitter)
			if (Math.abs(currentScrollY - lastScrollY) < 10) return
			
			// Mostrar al hacer scroll hacia ABAJO
			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				setIsVisible(true)
			} 
			// Ocultar al hacer scroll hacia ARRIBA (pero mantener si hay búsqueda activa)
			else if (currentScrollY < lastScrollY) {
				if (searchQuery.trim() === '') {
					// Sin búsqueda activa: ocultar
					setIsVisible(false)
				}
				// Con búsqueda activa: mantener visible (no hacer nada)
			}
			
			setLastScrollY(currentScrollY)
		}
		
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollY, searchQuery])

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		onSearch(value)
	}

	const handleClearSearch = () => {
		setSearchQuery("")
		onSearch("")
	}

	return (
		<div className={cn(
			"fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
			"bg-background/98 backdrop-blur-xl",
			"border-b border-border/30 shadow-sm",
			isVisible 
				? "translate-y-0 opacity-100" 
				: "-translate-y-full opacity-0"
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
				</div>
			</div>
		</div>
	)
}


