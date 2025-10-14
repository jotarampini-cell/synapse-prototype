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
			
			// Mostrar al hacer scroll hacia abajo
			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				setIsVisible(true)
			} 
			// Ocultar al hacer scroll hacia arriba
			else if (currentScrollY < lastScrollY) {
				setIsVisible(false)
			}
			
			setLastScrollY(currentScrollY)
		}
		
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollY])

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
			"fixed top-0 left-0 right-0 z-40 transition-transform duration-300",
			"bg-background/95 backdrop-blur-lg border-b border-border/50",
			isVisible ? "translate-y-0" : "-translate-y-full"
		)}>
			<div className="p-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={placeholder}
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="pl-10 pr-10"
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
							onClick={handleClearSearch}
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
