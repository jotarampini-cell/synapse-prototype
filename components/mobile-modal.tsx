"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X, ChevronLeft } from "lucide-react"

interface MobileModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	className?: string
	showBackButton?: boolean
	onBack?: () => void
	headerActions?: React.ReactNode
}

export function MobileModal({
	isOpen,
	onClose,
	title,
	children,
	className,
	showBackButton = false,
	onBack,
	headerActions
}: MobileModalProps) {
	const [isAnimating, setIsAnimating] = useState(false)
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true)
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden'
		} else {
			setIsAnimating(false)
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	// Handle backdrop click
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			return () => document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div 
			className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div
				ref={modalRef}
				className={cn(
					"fixed inset-0 bg-background",
					"transform transition-transform duration-300 ease-out",
					isAnimating ? "translate-y-0" : "translate-y-full",
					className
				)}
			>
				{/* Header */}
				<header className="h-14 flex items-center px-4 border-b border-border bg-background safe-area-top">
					{showBackButton ? (
						<Button 
							variant="ghost" 
							size="icon" 
							onClick={onBack}
							className="touch-target"
						>
							<ChevronLeft className="h-5 w-5" />
						</Button>
					) : (
						<div className="w-10" /> // Spacer
					)}
					
					{title && (
						<h2 className="flex-1 text-center text-lg font-semibold truncate px-2">
							{title}
						</h2>
					)}
					
					<div className="flex items-center gap-2">
						{headerActions}
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="touch-target"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</header>

				{/* Content */}
				<div className="flex-1 overflow-y-auto safe-area-bottom">
					{children}
				</div>
			</div>
		</div>
	)
}

// Hook para manejar modals móviles
export function useMobileModal() {
	const [isOpen, setIsOpen] = useState(false)

	const openModal = () => setIsOpen(true)
	const closeModal = () => setIsOpen(false)
	const toggleModal = () => setIsOpen(prev => !prev)

	return {
		isOpen,
		openModal,
		closeModal,
		toggleModal
	}
}

// Componente específico para Quick Note
export function MobileQuickNoteModal({
	isOpen,
	onClose,
	onSave
}: {
	isOpen: boolean
	onClose: () => void
	onSave: (content: string) => void
}) {
	const [content, setContent] = useState("")

	const handleSave = () => {
		onSave(content)
		setContent("")
		onClose()
	}

	return (
		<MobileModal
			isOpen={isOpen}
			onClose={onClose}
			title="Nota Rápida"
			headerActions={
				<Button onClick={handleSave} disabled={!content.trim()}>
					Guardar
				</Button>
			}
		>
			<div className="p-4">
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Escribe tu nota rápida aquí..."
					className="w-full h-64 p-4 border border-input rounded-lg resize-none text-base focus:outline-none focus:ring-2 focus:ring-primary"
					autoFocus
				/>
			</div>
		</MobileModal>
	)
}

// Componente específico para Templates
export function MobileTemplatesModal({
	isOpen,
	onClose,
	onSelectTemplate
}: {
	isOpen: boolean
	onClose: () => void
	onSelectTemplate: (template: { id: string; name: string; content: string }) => void
}) {
	const templates = [
		{
			id: "meeting",
			title: "Reunión",
			content: "# Reunión\n\n**Fecha:** \n**Participantes:** \n\n## Agenda\n- \n\n## Acciones\n- [ ] \n\n## Notas\n"
		},
		{
			id: "idea",
			title: "Idea",
			content: "# Idea\n\n**Concepto:** \n\n## Descripción\n\n## Beneficios\n- \n\n## Próximos pasos\n- [ ] "
		},
		{
			id: "project",
			title: "Proyecto",
			content: "# Proyecto\n\n**Objetivo:** \n**Fecha límite:** \n\n## Tareas\n- [ ] \n\n## Recursos\n- \n\n## Notas\n"
		},
		{
			id: "daily",
			title: "Daily Log",
			content: "# Daily Log - \n\n## Logros de hoy\n- \n\n## Desafíos\n- \n\n## Plan para mañana\n- [ ] "
		}
	]

	return (
		<MobileModal
			isOpen={isOpen}
			onClose={onClose}
			title="Plantillas"
		>
			<div className="p-4">
				<div className="grid grid-cols-2 gap-4">
					{templates.map((template) => (
						<button
							key={template.id}
							onClick={() => {
								onSelectTemplate(template)
								onClose()
							}}
							className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left touch-target"
						>
							<h3 className="font-semibold mb-2">{template.title}</h3>
							<p className="text-sm text-muted-foreground line-clamp-3">
								{template.content.substring(0, 100)}...
							</p>
						</button>
					))}
				</div>
			</div>
		</MobileModal>
	)
}
