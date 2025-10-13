"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Clock, FileText, CheckSquare, Link, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchSuggestion {
	id: string
	title: string
	type: 'note' | 'task' | 'source' | 'project'
	description?: string
	url: string
}

interface SearchInputProps {
	placeholder?: string
	className?: string
	onSearch?: (query: string) => void
}

export function SearchInput({ 
	placeholder = "Buscar o crear algo nuevo...", 
	className,
	onSearch 
}: SearchInputProps) {
	const [query, setQuery] = useState("")
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionsRef = useRef<HTMLDivElement>(null)

	// Sugerencias de ejemplo (en una implementación real, esto vendría de la API)
	const mockSuggestions: SearchSuggestion[] = [
		{
			id: "1",
			title: "Nota de reunión",
			type: "note",
			description: "Reunión del equipo de desarrollo",
			url: "/notes?note=1"
		},
		{
			id: "2", 
			title: "Completar documentación",
			type: "task",
			description: "Tarea pendiente en Trabajo",
			url: "/tareas"
		},
		{
			id: "3",
			title: "Artículo sobre React",
			type: "source",
			description: "Fuente guardada",
			url: "/sources?source=3"
		},
		{
			id: "4",
			title: "Proyecto Synapse",
			type: "project",
			description: "Proyecto principal",
			url: "/projects?project=4"
		}
	]

	// Filtrar sugerencias basadas en la consulta
	useEffect(() => {
		if (query.trim().length > 0) {
			const filtered = mockSuggestions.filter(item =>
				item.title.toLowerCase().includes(query.toLowerCase()) ||
				item.description?.toLowerCase().includes(query.toLowerCase())
			)
			setSuggestions(filtered)
			setIsOpen(true)
		} else {
			setSuggestions([])
			setIsOpen(false)
		}
		setSelectedIndex(-1)
	}, [query])

	// Manejar teclas del teclado
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault()
				setSelectedIndex(prev => 
					prev < suggestions.length - 1 ? prev + 1 : prev
				)
				break
			case 'ArrowUp':
				e.preventDefault()
				setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
				break
			case 'Enter':
				e.preventDefault()
				if (selectedIndex >= 0 && suggestions[selectedIndex]) {
					handleSuggestionClick(suggestions[selectedIndex])
				} else if (query.trim()) {
					handleSearch()
				}
				break
			case 'Escape':
				setIsOpen(false)
				setSelectedIndex(-1)
				break
		}
	}

	const handleSuggestionClick = (suggestion: SearchSuggestion) => {
		setQuery("")
		setIsOpen(false)
		setSelectedIndex(-1)
		window.location.href = suggestion.url
	}

	const handleSearch = () => {
		if (query.trim()) {
			onSearch?.(query)
			// Aquí podrías implementar una búsqueda global
			console.log('Búsqueda:', query)
		}
	}

	const getIcon = (type: string) => {
		switch (type) {
			case 'note':
				return <FileText className="h-4 w-4 text-blue-600" />
			case 'task':
				return <CheckSquare className="h-4 w-4 text-green-600" />
			case 'source':
				return <Link className="h-4 w-4 text-purple-600" />
			case 'project':
				return <Briefcase className="h-4 w-4 text-orange-600" />
			default:
				return <Clock className="h-4 w-4 text-muted-foreground" />
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'note':
				return 'Nota'
			case 'task':
				return 'Tarea'
			case 'source':
				return 'Fuente'
			case 'project':
				return 'Proyecto'
			default:
				return 'Elemento'
		}
	}

	return (
		<div className="relative">
			<div className="relative group">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
				<Input
					ref={inputRef}
					placeholder={placeholder}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => query.trim() && setIsOpen(true)}
					onBlur={() => {
						// Delay para permitir clicks en sugerencias
						setTimeout(() => setIsOpen(false), 150)
					}}
					className={cn(
						"pl-9 h-12 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card transition-all",
						className
					)}
				/>
				<div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
					⌘K
				</div>
			</div>

			{/* Dropdown de sugerencias */}
			{isOpen && suggestions.length > 0 && (
				<div
					ref={suggestionsRef}
					className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
				>
					<div className="p-2">
						<div className="text-xs font-medium text-muted-foreground mb-2 px-2">
							Resultados para "{query}"
						</div>
						{suggestions.map((suggestion, index) => (
							<button
								key={suggestion.id}
								onClick={() => handleSuggestionClick(suggestion)}
								className={cn(
									"w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
									"hover:bg-accent focus:bg-accent focus:outline-none",
									selectedIndex === index && "bg-accent"
								)}
							>
								<div className="flex-shrink-0">
									{getIcon(suggestion.type)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm truncate">
										{suggestion.title}
									</div>
									{suggestion.description && (
										<div className="text-xs text-muted-foreground truncate">
											{suggestion.description}
										</div>
									)}
								</div>
								<div className="flex-shrink-0">
									<span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
										{getTypeLabel(suggestion.type)}
									</span>
								</div>
							</button>
						))}
					</div>
					
					{/* Acción de búsqueda */}
					<div className="border-t border-border p-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSearch}
							className="w-full justify-start gap-2"
						>
							<Search className="h-4 w-4" />
							Buscar "{query}" en todo
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
