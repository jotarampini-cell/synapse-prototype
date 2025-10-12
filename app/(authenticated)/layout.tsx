"use client"

import { UnifiedNavigation } from "@/components/unified-navigation"
import { CommandPalette } from "@/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { useRouter } from "next/navigation"
import { WelcomeBanner } from "@/components/responsive-banner"

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const { isOpen: isCommandPaletteOpen, closeCommandPalette } = useCommandPalette()

	const handleCreateNote = (title: string, content: string) => {
		// Redirigir a la página de notas para crear la nota
		router.push(`/notes?create=true&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`)
	}

	const handleNoteSelect = (noteId: string) => {
		router.push(`/notes?note=${noteId}`)
	}

	return (
		<div className="min-h-screen bg-background">
			<UnifiedNavigation />
			
			{/* Banner responsive */}
			<div className="px-4 py-2 md:px-6">
				<WelcomeBanner />
			</div>
			
			<main>
				{children}
			</main>
			
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
