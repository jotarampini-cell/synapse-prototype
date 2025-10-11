"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileToolbar, useMobileToolbar } from "@/components/mobile-toolbar"

interface MobileEditorProps {
	content?: string
	onUpdate: (content: string) => void
	onSave: () => void
	placeholder?: string
	readonly?: boolean
}

export function MobileEditor({ 
	content = "", 
	onUpdate, 
	onSave, 
	placeholder = "Escribe tu nota aquí...",
	readonly = false 
}: MobileEditorProps) {
	const [text, setText] = useState(content)
	const [selection, setSelection] = useState({ start: 0, end: 0 })
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const { isVisible, position, showToolbar, hideToolbar } = useMobileToolbar()

	// Auto-resize textarea
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (textarea) {
			textarea.style.height = 'auto'
			textarea.style.height = `${textarea.scrollHeight}px`
		}
	}, [])

	// Update content when prop changes
	useEffect(() => {
		if (content !== text) {
			setText(content)
		}
	}, [content])

	// Adjust height when text changes
	useEffect(() => {
		adjustTextareaHeight()
	}, [text, adjustTextareaHeight])

	// Handle text change
	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newText = e.target.value
		setText(newText)
		onUpdate(newText)
	}

	// Handle selection change
	const handleSelectionChange = () => {
		const textarea = textareaRef.current
		if (textarea) {
			const start = textarea.selectionStart
			const end = textarea.selectionEnd
			setSelection({ start, end })
			
			// Show toolbar if text is selected
			if (start !== end) {
				const selectedText = text.substring(start, end)
				const rect = textarea.getBoundingClientRect()
				showToolbar(
					{ 
						top: rect.top + window.scrollY, 
						left: rect.left + rect.width / 2 
					}, 
					selectedText
				)
			} else {
				hideToolbar()
			}
		}
	}

	// Format text functions
	const handleFormatText = (format: string) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const { start, end } = selection
		const selectedText = text.substring(start, end)
		
		// Replace placeholder text in format string
		const formattedText = format.replace('texto', selectedText)
		
		const newText = text.substring(0, start) + formattedText + text.substring(end)
		setText(newText)
		onUpdate(newText)

		// Restore focus and selection
		setTimeout(() => {
			textarea.focus()
			const newStart = start + formattedText.length
			textarea.setSelectionRange(newStart, newStart)
		}, 0)
		
		hideToolbar()
	}

	// Handle save
	const handleSave = () => {
		onSave()
	}

	// Handle click outside to hide toolbar
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) &&
				textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
				setShowToolbar(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<div className="relative">
			{/* Mobile Toolbar */}
			{!readonly && (
				<MobileToolbar
					isVisible={isVisible}
					position={position}
					onFormat={handleFormatText}
					onClose={hideToolbar}
				/>
			)}

			{/* Textarea */}
			<textarea
				ref={textareaRef}
				value={text}
				onChange={handleTextChange}
				onSelect={handleSelectionChange}
				placeholder={placeholder}
				readOnly={readonly}
				className={cn(
					"w-full min-h-[200px] p-4 text-base leading-relaxed",
					"border border-input rounded-lg bg-background",
					"focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
					"resize-none overflow-hidden",
					"placeholder:text-muted-foreground",
					"touch-target"
				)}
				style={{ 
					minHeight: '200px',
					lineHeight: '1.6'
				}}
			/>

			{/* Botón de guardar flotante */}
			{!readonly && (
				<div className="absolute bottom-4 right-4">
					<Button
						onClick={handleSave}
						className="h-12 w-12 rounded-full shadow-lg touch-target"
						size="icon"
					>
						<Save className="h-5 w-5" />
					</Button>
				</div>
			)}
		</div>
	)
}
