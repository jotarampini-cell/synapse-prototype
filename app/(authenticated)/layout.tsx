"use client"

import { UnifiedNavigation } from "@/components/unified-navigation"
import { CommandPalette } from "@/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { useRouter, usePathname } from "next/navigation"
import { WelcomeBanner } from "@/components/responsive-banner"
import { AppFooter } from "@/components/app-footer"

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const pathname = usePathname()
	const { isOpen: isCommandPaletteOpen, closeCommandPalette } = useCommandPalette()
	
	// Solo mostrar banner en la página home
	const isHomePage = pathname === "/home" || pathname === "/"

	const handleCreateNote = (title: string, content: string) => {
		// Redirigir a la página de notas para crear la nota
		router.push(`/notes?create=true&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`)
	}

	const handleNoteSelect = (noteId: string) => {
		router.push(`/notes?note=${noteId}`)
	}

	return (
		<div className="min-h-screen bg-background overflow-x-hidden">
			<UnifiedNavigation />
			
			
			<main>
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
