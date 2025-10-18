"use client"

import { UnifiedNavigation } from "@/components/unified-navigation"
import { CommandPalette } from "@/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { useRouter, usePathname } from "next/navigation"
import { WelcomeBanner } from "@/components/responsive-banner"
import { AppFooter } from "@/components/app-footer"
import { NavigationProvider, useNavigation } from "@/contexts/navigation-context"
import { useEffect } from "react"

function AuthenticatedLayoutContent({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const pathname = usePathname()
	const { isOpen: isCommandPaletteOpen, closeCommandPalette } = useCommandPalette()
	const { showBackButton, backButtonText, onBackClick, resetNavigationProps } = useNavigation()
	
	// Solo mostrar banner en la página home
	const isHomePage = pathname === "/home" || pathname === "/"
	
	// Resetear props de navegación cuando se cambie de página (excepto en /notes)
	useEffect(() => {
		if (pathname !== "/notes") {
			resetNavigationProps()
		}
	}, [pathname, resetNavigationProps])

	const handleCreateNote = (title: string, content: string) => {
		// Redirigir a la página de notas para crear la nota
		router.push(`/notes?create=true&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`)
	}

	const handleNoteSelect = (noteId: string) => {
		router.push(`/notes?note=${noteId}`)
	}

	return (
		<div className="page-container bg-background">
			<UnifiedNavigation 
				showBackButton={showBackButton}
				backButtonText={backButtonText}
				onBackClick={onBackClick || undefined}
			/>
			
			<main className="page-main">
				{children}
			</main>
			
			{/* Footer con versión */}
			<AppFooter />
			
			{/* Command Palette global */}
			<CommandPalette
				isOpen={isCommandPaletteOpen}
				onClose={closeCommandPalette}
				onCreateNote={handleCreateNote}
				onNoteSelect={handleNoteSelect}
			/>
		</div>
	)
}

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<NavigationProvider>
			<AuthenticatedLayoutContent>
				{children}
			</AuthenticatedLayoutContent>
		</NavigationProvider>
	)
}
