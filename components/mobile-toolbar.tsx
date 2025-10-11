"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
	Bold, 
	Italic, 
	List, 
	Link, 
	Type, 
	Quote,
	Code,
	CheckSquare,
	Heading1,
	Heading2,
	Heading3
} from "lucide-react"

interface MobileToolbarProps {
	isVisible: boolean
	position?: { top: number; left: number }
	onFormat: (format: string) => void
	onClose: () => void
	className?: string
}

const formatButtons = [
	{
		id: "bold",
		icon: Bold,
		label: "Negrita",
		format: "**texto**"
	},
	{
		id: "italic", 
		icon: Italic,
		label: "Cursiva",
		format: "*texto*"
	},
	{
		id: "h1",
		icon: Heading1,
		label: "Título 1",
		format: "# texto"
	},
	{
		id: "h2",
		icon: Heading2,
		label: "Título 2", 
		format: "## texto"
	},
	{
		id: "h3",
		icon: Heading3,
		label: "Título 3",
		format: "### texto"
	},
	{
		id: "list",
		icon: List,
		label: "Lista",
		format: "- texto"
	},
	{
		id: "quote",
		icon: Quote,
		label: "Cita",
		format: "> texto"
	},
	{
		id: "code",
		icon: Code,
		label: "Código",
		format: "```\ntexto\n```"
	},
	{
		id: "link",
		icon: Link,
		label: "Enlace",
		format: "[texto](url)"
	},
	{
		id: "checklist",
		icon: CheckSquare,
		label: "Lista de tareas",
		format: "- [ ] texto"
	}
]

export function MobileToolbar({ 
	isVisible, 
	position = { top: 0, left: 0 }, 
	onFormat, 
	onClose,
	className 
}: MobileToolbarProps) {
	const [isAnimating, setIsAnimating] = useState(false)
	const toolbarRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isVisible) {
			setIsAnimating(true)
			// Auto-hide after 5 seconds of inactivity
			const timer = setTimeout(() => {
				onClose()
			}, 5000)
			return () => clearTimeout(timer)
		} else {
			setIsAnimating(false)
		}
	}, [isVisible, onClose])

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
				onClose()
			}
		}

		if (isVisible) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isVisible, onClose])

	if (!isVisible) return null

	return (
		<div
			ref={toolbarRef}
			className={cn(
				"fixed z-50 bg-background border border-border rounded-lg shadow-lg p-2",
				"transform transition-all duration-200 ease-in-out",
				isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0",
				className
			)}
			style={{
				top: position.top,
				left: position.left,
				transform: `translate(-50%, -100%) ${isAnimating ? 'scale(1)' : 'scale(0.95)'}`
			}}
		>
			{/* Header con botón de cerrar */}
			<div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
				<span className="text-xs font-medium text-muted-foreground">Formateo</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-6 w-6 p-0"
				>
					×
				</Button>
			</div>

			{/* Grid de botones de formato */}
			<div className="grid grid-cols-5 gap-1">
				{formatButtons.map((button) => {
					const Icon = button.icon
					return (
						<Button
							key={button.id}
							variant="ghost"
							size="sm"
							onClick={() => onFormat(button.format)}
							className={cn(
								"h-10 w-10 p-0 touch-target",
								"hover:bg-muted/50 transition-colors",
								"flex flex-col items-center justify-center"
							)}
							title={button.label}
						>
							<Icon className="h-4 w-4 mb-1" />
							<span className="text-xs leading-none">{button.label}</span>
						</Button>
					)
				})}
			</div>

			{/* Indicador de tiempo */}
			<div className="mt-2 pt-2 border-t border-border">
				<div className="flex items-center justify-center">
					<div className="w-full h-1 bg-muted rounded-full overflow-hidden">
						<div className="h-full bg-primary rounded-full animate-pulse" />
					</div>
				</div>
			</div>
		</div>
	)
}

// Hook para manejar la toolbar móvil
export function useMobileToolbar() {
	const [isVisible, setIsVisible] = useState(false)
	const [position, setPosition] = useState({ top: 0, left: 0 })
	const [selectedText, setSelectedText] = useState("")

	const showToolbar = (selectionPosition: { top: number; left: number }, text: string) => {
		setPosition(selectionPosition)
		setSelectedText(text)
		setIsVisible(true)
	}

	const hideToolbar = () => {
		setIsVisible(false)
		setSelectedText("")
	}

	const formatText = (format: string) => {
		// Esta función será implementada por el componente padre
		// que maneja el texto seleccionado
		hideToolbar()
	}

	return {
		isVisible,
		position,
		selectedText,
		showToolbar,
		hideToolbar,
		formatText
	}
}
