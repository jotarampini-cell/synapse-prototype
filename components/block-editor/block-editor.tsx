"use client"

import { useEffect, useRef, useState } from "react"
import "./editor-styles.css"
import { MobileEditor } from "@/components/mobile-editor/mobile-editor"
import { useMobileEditor } from "@/hooks/use-editor-selection"
import { Button } from "@/components/ui/button"
import { Save, Undo2, Redo2 } from "lucide-react"

// Import Editor.js tools directly
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
	const { shouldUseMobileEditor, isLoading } = useMobileEditor()
	const editorRef = useRef<any>(null)
	const [isMounted, setIsMounted] = useState(false)
	const [editorData, setEditorData] = useState<any>(content)
	const [canUndo, setCanUndo] = useState(false)
	const [canRedo, setCanRedo] = useState(false)

	// Convertir contenido entre formatos
	const convertToMobileFormat = (editorData: any): string => {
		if (typeof editorData === 'string') return editorData
		if (!editorData?.blocks) return ""

		return editorData.blocks
			.map((block: any) => {
				switch (block.type) {
					case 'paragraph':
						return block.data?.text || ''
					case 'header':
						const level = block.data?.level || 1
						const headerText = block.data?.text || ''
						return '#'.repeat(level) + ' ' + headerText
					case 'list':
						return block.data?.items?.map((item: string) => `- ${item}`).join('\n') || ''
					case 'quote':
						return `> ${block.data?.text || ''}`
					case 'code':
						return `\`\`\`\n${block.data?.code || ''}\n\`\`\``
					default:
						return block.data?.text || ''
				}
			})
			.join('\n\n')
	}

	const convertToEditorJSFormat = (text: string): any => {
		if (!text || typeof text !== 'string' || !text.trim()) {
			return {
				time: Date.now(),
				blocks: [
					{
						id: "initial-block",
						type: "paragraph",
						data: { text: "" },
					},
				],
				version: "2.28.2",
			}
		}

		// Conversión básica de Markdown a Editor.js
		const lines = text.split('\n')
		const blocks = []
		let currentBlock: any = { id: `block-${Date.now()}`, type: "paragraph", data: { text: "" } }

		for (const line of lines) {
			if (line.startsWith('# ')) {
				if (currentBlock.data.text) blocks.push(currentBlock)
				currentBlock = { id: `block-${Date.now()}`, type: "header", data: { text: line.slice(2), level: 1 } }
			} else if (line.startsWith('## ')) {
				if (currentBlock.data.text) blocks.push(currentBlock)
				currentBlock = { id: `block-${Date.now()}`, type: "header", data: { text: line.slice(3), level: 2 } }
			} else if (line.startsWith('### ')) {
				if (currentBlock.data.text) blocks.push(currentBlock)
				currentBlock = { id: `block-${Date.now()}`, type: "header", data: { text: line.slice(4), level: 3 } }
			} else if (line.startsWith('- ')) {
				if (currentBlock.data.text) blocks.push(currentBlock)
				currentBlock = { id: `block-${Date.now()}`, type: "list", data: { style: "unordered", items: [line.slice(2)] } }
			} else if (line.startsWith('> ')) {
				if (currentBlock.data.text) blocks.push(currentBlock)
				currentBlock = { id: `block-${Date.now()}`, type: "quote", data: { text: line.slice(2) } }
			} else if (line.trim() === '') {
				if (currentBlock.data.text) {
					blocks.push(currentBlock)
					currentBlock = { id: `block-${Date.now()}`, type: "paragraph", data: { text: "" } }
				}
			} else {
				if (currentBlock.type === "paragraph") {
					currentBlock.data.text += (currentBlock.data.text ? '\n' : '') + line
				} else {
					blocks.push(currentBlock)
					currentBlock = { id: `block-${Date.now()}`, type: "paragraph", data: { text: line } }
				}
			}
		}

		if (currentBlock.data.text) blocks.push(currentBlock)

		return {
			time: Date.now(),
			blocks: blocks.length > 0 ? blocks : [{ id: "initial-block", type: "paragraph", data: { text: "" } }],
			version: "2.28.2",
		}
	}

	useEffect(() => {
		setIsMounted(true)
		return () => {
			if (editorRef.current && !shouldUseMobileEditor) {
				editorRef.current.destroy()
				editorRef.current = null
			}
		}
	}, [shouldUseMobileEditor])

	useEffect(() => {
		if (isMounted && !editorRef.current && !shouldUseMobileEditor) {
			initializeEditor()
		}
	}, [isMounted, shouldUseMobileEditor])

	useEffect(() => {
		if (editorRef.current && editorData !== content && !shouldUseMobileEditor) {
			editorRef.current.destroy()
			editorRef.current = null
			initializeEditor(content)
		}
	}, [content, shouldUseMobileEditor])

	const initializeEditor = (initialData = content) => {
		if (editorRef.current) {
			editorRef.current.destroy()
		}

		// Convert string content to Editor.js format if needed
		let editorData = initialData
		if (typeof initialData === 'string') {
			editorData = {
				time: Date.now(),
				blocks: [
					{
						id: "initial-block",
						type: "paragraph",
						data: {
							text: initialData || placeholder,
						},
					},
				],
				version: "2.28.2",
			}
		}

		editorRef.current = new (EditorJS as any)({
			holder: "editorjs-container",
			placeholder,
			readOnly: readonly,
			data: editorData,
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

	// Handlers para el editor móvil
	const handleMobileUpdate = (text: string) => {
		const editorJSData = convertToEditorJSFormat(text)
		setEditorData(editorJSData)
		onUpdate(editorJSData)
	}

	const handleMobileSave = () => {
		const editorJSData = convertToEditorJSFormat(editorData)
		onSave(editorJSData)
	}

	if (!isMounted || isLoading) {
		return <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">Cargando editor...</div>
	}

	// Renderizar editor móvil
	if (shouldUseMobileEditor) {
		const mobileContent = convertToMobileFormat(content)
		return (
			<MobileEditor
				content={mobileContent}
				onUpdate={handleMobileUpdate}
				onSave={handleMobileSave}
				placeholder={placeholder}
				readonly={readonly}
			/>
		)
	}

	// Renderizar Editor.js para desktop
	return (
		<div className="relative">
			{/* Toolbar */}
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

			{/* Editor Container */}
			<div
				id="editorjs-container"
				className="min-h-[200px] border border-t-0 rounded-b-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary"
			/>
		</div>
	)
}
