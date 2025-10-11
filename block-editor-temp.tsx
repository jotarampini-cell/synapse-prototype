"use client"

import { useEffect, useRef, useState } from "react"
import "./editor-styles.css"
import EditorJS from "@editorjs/editorjs"
import Header from "@editorjs/header"
import List from "@editorjs/list"
import Quote from "@editorjs/quote"
import Code from "@editorjs/code"
import Table from "@editorjs/table"
import LinkTool from "@editorjs/link"
import Checklist from "@editorjs/checklist"
import Marker from "@editorjs/marker"
import Underline from "@editorjs/underline"
import InlineCode from "@editorjs/inline-code"
import Delimiter from "@editorjs/delimiter"
import Warning from "@editorjs/warning"
import Paragraph from "@editorjs/paragraph"
import { Button } from "@/components/ui/button"
import { Save, Undo2, Redo2 } from "lucide-react"

interface BlockEditorProps {
	content?: any
	onUpdate: (data: any) => void
	onSave: (data: any) => void
	placeholder?: string
	readonly?: boolean
}

export function BlockEditor({ 
	content = "", 
	onUpdate, 
	onSave, 
	placeholder = "Escribe tu contenido aquí...",
	readonly = false 
}: BlockEditorProps) {
	const editorRef = useRef<EditorJS | null>(null)
	const [isMounted, setIsMounted] = useState(false)
	const [editorData, setEditorData] = useState<any>(content)
	const [canUndo, setCanUndo] = useState(false)
	const [canRedo, setCanRedo] = useState(false)

	useEffect(() => {
		setIsMounted(true)
		return () => {
			if (editorRef.current) {
				editorRef.current.destroy()
				editorRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (isMounted && !editorRef.current) {
			initializeEditor()
		}
	}, [isMounted])

	useEffect(() => {
		if (editorRef.current && editorData !== content) {
			editorRef.current.destroy()
			editorRef.current = null
			initializeEditor(content)
		}
	}, [content])

	const initializeEditor = (initialData = content) => {
		if (editorRef.current) {
			editorRef.current.destroy()
		}

		editorRef.current = new EditorJS({
			holder: "editorjs-container",
			placeholder,
			readOnly: readonly,
			data: initialData,
			tools: {
				header: Header,
				paragraph: Paragraph,
				list: List,
				checklist: Checklist,
				quote: Quote,
				code: Code,
				table: Table,
				linkTool: LinkTool,
				marker: Marker,
				underline: Underline,
				inlineCode: InlineCode,
				delimiter: Delimiter,
				warning: Warning
			},
			onChange: async () => {
				if (editorRef.current) {
					try {
						const outputData = await editorRef.current.save()
						setEditorData(outputData)
						onUpdate(outputData)
						setCanUndo(true) 
						setCanRedo(false)
					} catch (e) {
						console.error("Error saving editor data:", e)
					}
				}
			},
			onReady: () => {
				console.log("Editor.js is ready to work!")
			},
		})
	}

	const handleSave = async () => {
		if (editorRef.current) {
			try {
				const outputData = await editorRef.current.save()
				onSave(outputData)
			} catch (e) {
				console.error("Error saving editor data:", e)
			}
		}
	}

	const handleUndo = () => {
		console.log("Undo not implemented for Editor.js yet.")
	}

	const handleRedo = () => {
		console.log("Redo not implemented for Editor.js yet.")
	}

	if (!isMounted) {
		return <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">Cargando editor...</div>
	}

	return (
		<div className="relative">
			<div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 rounded-t-lg">
				<div className="flex items-center gap-1">
					<Button 
						variant="ghost" 
						size="sm" 
						onClick={handleSave}
						className="h-8 px-2"
					>
						<Save className="h-4 w-4 mr-1" /> Guardar
					</Button>
					<Button 
						variant="ghost" 
						size="sm" 
						onClick={handleUndo} 
						disabled={!canUndo}
						className="h-8 px-2"
					>
						<Undo2 className="h-4 w-4" />
					</Button>
					<Button 
						variant="ghost" 
						size="sm" 
						onClick={handleRedo} 
						disabled={!canRedo}
						className="h-8 px-2"
					>
						<Redo2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
			<div 
				id="editorjs-container"
				className="min-h-[200px] border border-t-0 rounded-b-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary"
			/>
		</div>
	)
}
