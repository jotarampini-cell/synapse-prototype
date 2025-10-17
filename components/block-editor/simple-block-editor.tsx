"use client"

import { useState, useRef, useEffect } from "react"
import { EditorToolbar } from "./editor-toolbar"

interface SimpleBlockEditorProps {
	content?: string
	onUpdate: (data: string) => void
	onSave: (data: string) => void
	placeholder?: string
	readonly?: boolean
}

export function SimpleBlockEditor({ 
	content = "", 
	onUpdate, 
	onSave, 
	placeholder = "Escribe tu contenido aquí...",
	readonly = false 
}: SimpleBlockEditorProps) {
	const [editorContent, setEditorContent] = useState(content)
	const editorRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setEditorContent(content)
	}, [content])

	// Función para manejar comandos del toolbar
	const handleToolbarCommand = async (command: string, value?: unknown) => {
		if (!editorRef.current) return
		
		// Enfocar el editor
		editorRef.current.focus()
		
		// Ejecutar comandos de formato
		document.execCommand(command, false, value as string)
		
		// Actualizar el contenido
		const newContent = editorRef.current.innerHTML
		setEditorContent(newContent)
		onUpdate(newContent)
	}

	const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement
		const newContent = target.innerHTML
		setEditorContent(newContent)
		onUpdate(newContent)
	}

	const handleSave = () => {
		onSave(editorContent)
	}

	return (
		<div className="relative">
			{/* Toolbar horizontal */}
			<EditorToolbar onCommand={handleToolbarCommand} />

			{/* Editor Container */}
			<div
				className="min-h-[200px] border border-t-0 rounded-b-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-4"
			>
				<div
					ref={editorRef}
					contentEditable={!readonly}
					dangerouslySetInnerHTML={{ __html: editorContent }}
					onInput={handleInput}
					className="outline-none min-h-[150px] prose prose-sm max-w-none"
					style={{ whiteSpace: 'pre-wrap' }}
					data-placeholder={placeholder}
				/>
			</div>
		</div>
	)
}



