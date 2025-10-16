"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Folder, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFolderTree } from "@/app/actions/folders"
import { getUserContents } from "@/app/actions/content"

interface SmartSearchBarProps {
	onSearch: (query: string) => void
	scrollContainerRef?: React.RefObject<HTMLDivElement>
	searchContext: 'folders' | 'notes'
	onFolderSelect?: (folderId: string) => void
	onNoteSelect?: (noteId: string) => void
}

interface SearchResult {
	id: string
	title: string
	type: 'folder' | 'note'
	description?: string
}

export function SmartSearchBar({ 
	onSearch, 
	scrollContainerRef, 
	searchContext,
	onFolderSelect,
	onNoteSelect
}: SmartSearchBarProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [lastScrollY, setLastScrollY] = useState(0)
	const [searchResults, setSearchResults] = useState<SearchResult[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const searchBarRef = useRef<HTMLDivElement>(null)

	// Detectar si es móvil real
	const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

	useEffect(() => {
		console.log('🚀 SmartSearchBar mounted - isMobile:', isMobile, 'context:', searchContext)
		
		const handleScroll = () => {
			const currentScrollY = scrollContainerRef?.current?.scrollTop ?? window.scrollY
			
			// Lógica simple: mostrar si hay scroll hacia abajo
			if (currentScrollY > lastScrollY && currentScrollY > 5) {
				setIsVisible(true)
			} else if (currentScrollY < lastScrollY && searchQuery.trim() === '') {
				setIsVisible(false)
			}
			
			setLastScrollY(currentScrollY)
		}

		// Añadir listeners
		const container = scrollContainerRef?.current ?? window
		
		if (container instanceof HTMLElement) {
			container.addEventListener('scroll', handleScroll, { passive: true })
			return () => {
				container.removeEventListener('scroll', handleScroll)
			}
		} else {
			window.addEventListener('scroll', handleScroll, { passive: true })
			return () => {
				window.removeEventListener('scroll', handleScroll)
			}
		}
	}, [lastScrollY, searchQuery, scrollContainerRef, isMobile, searchContext])

	// Búsqueda contextual
	useEffect(() => {
		if (searchQuery.trim().length > 2) {
			setIsSearching(true)
			performSearch(searchQuery.trim())
		} else {
			setSearchResults([])
			setIsSearching(false)
		}
	}, [searchQuery, searchContext])

	const performSearch = async (query: string) => {
		try {
			if (searchContext === 'folders') {
				// Buscar carpetas
				const result = await getFolderTree()
				if (result.success && result.folders) {
					const filteredFolders = result.folders.filter(folder =>
						folder.name.toLowerCase().includes(query.toLowerCase())
					)
					setSearchResults(filteredFolders.map(folder => ({
						id: folder.id,
						title: folder.name,
						type: 'folder' as const,
						description: `Carpeta con ${folder.children?.length || 0} subcarpetas`
					})))
				}
			} else if (searchContext === 'notes') {
				// Buscar notas
				const result = await getUserContents()
				if (result.success && result.contents) {
					const filteredNotes = result.contents.filter(content =>
						content.title.toLowerCase().includes(query.toLowerCase()) ||
						content.content.toLowerCase().includes(query.toLowerCase())
					)
					setSearchResults(filteredNotes.map(note => ({
						id: note.id,
						title: note.title,
						type: 'note' as const,
						description: note.content.substring(0, 100) + '...'
					})))
				}
			}
		} catch (error) {
			console.error('Error performing search:', error)
		} finally {
			setIsSearching(false)
		}
	}

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		onSearch(value)
	}

	const handleClearSearch = () => {
		setSearchQuery("")
		setSearchResults([])
		onSearch("")
	}

	const handleResultClick = (result: SearchResult) => {
		if (result.type === 'folder' && onFolderSelect) {
			onFolderSelect(result.id)
		} else if (result.type === 'note' && onNoteSelect) {
			onNoteSelect(result.id)
		}
		handleClearSearch()
	}

	// Forzar visibilidad si hay búsqueda activa
	useEffect(() => {
		if (searchQuery.trim()) {
			setIsVisible(true)
		}
	}, [searchQuery])

	const getPlaceholder = () => {
		return searchContext === 'folders' 
			? "Buscar carpetas..." 
			: "Buscar en notas..."
	}

	const getIcon = (type: 'folder' | 'note') => {
		return type === 'folder' ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />
	}

	return (
		<>
			<div 
				ref={searchBarRef}
				className={cn(
					"fixed left-0 right-0 z-[100] transition-all duration-300 ease-out",
					"bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
					"shadow-lg",
					isVisible 
						? "translate-y-0 opacity-100" 
						: "-translate-y-full opacity-0"
				)}
				style={{
					position: 'fixed',
					top: '48px', // Debajo del header (h-12 = 48px)
					left: 0,
					right: 0,
					zIndex: 100,
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
							placeholder={getPlaceholder()}
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							className={cn(
								"w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300",
								"bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none",
								"text-base"
							)}
							style={{
								fontSize: '16px',
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
					</div>

					{/* Resultados de búsqueda */}
					{searchQuery.trim() && (
						<div className="mt-2 max-h-64 overflow-y-auto">
							{isSearching ? (
								<div className="text-center py-4 text-gray-500">
									Buscando...
								</div>
							) : searchResults.length > 0 ? (
								<div className="space-y-1">
									{searchResults.map((result) => (
										<button
											key={result.id}
											onClick={() => handleResultClick(result)}
											className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-gray-100 transition-colors"
										>
											<div className="flex-shrink-0">
												{getIcon(result.type)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm truncate">
													{result.title}
												</div>
												{result.description && (
													<div className="text-xs text-gray-500 truncate">
														{result.description}
													</div>
												)}
											</div>
										</button>
									))}
								</div>
							) : (
								<div className="text-center py-4 text-gray-500">
									No se encontraron resultados
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)
}
