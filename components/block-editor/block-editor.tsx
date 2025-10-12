"use client"

import { useEffect, useRef, useState } from "react"
import "./editor-styles.css"
import { MobileEditor } from "@/components/mobile-editor/mobile-editor"
import { useMobileEditor } from "@/hooks/use-editor-selection"
import { Button } from "@/components/ui/button"
import { Save, Undo2, Redo2 } from "lucide-react"
import { log } from "@/lib/logger"

// Dynamic imports para evitar SSR issues
// import dynamic from "next/dynamic"

interface BlockEditorProps {
	content?: { blocks?: Array<{ type: string; data?: Record<string, unknown> }> } | string
	onUpdate: (data: { blocks?: Array<{ type: string; data?: Record<string, unknown> }> } | string) => void
	onSave: (data: { blocks?: Array<{ type: string; data?: Record<string, unknown> }> } | string) => void
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
	const editorRef = useRef<HTMLDivElement | null>(null)
	const [isMounted, setIsMounted] = useState(false)
	const [editorData, setEditorData] = useState<{ blocks?: Array<{ type: string; data?: Record<string, unknown> }> } | string>(content)
	const [canUndo, setCanUndo] = useState(false)
	const [canRedo, setCanRedo] = useState(false)

	// Convertir contenido entre formatos
	const convertToMobileFormat = (editorData: { blocks?: Array<{ type: string; data?: Record<string, unknown> }> } | string): string => {
		if (typeof editorData === 'string') return editorData
		if (!editorData?.blocks) return ""

		return editorData.blocks
			.map((block: { type: string; data?: Record<string, unknown> }) => {
				switch (block.type) {
					case 'paragraph':
						return block.data?.text || ''
					case 'header': {
						const level = block.data?.level || 1
						const headerText = block.data?.text || ''
						return '#'.repeat(level) + ' ' + headerText
					}
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

	const convertToEditorJSFormat = (text: string): { blocks: Array<{ type: string; data?: Record<string, unknown> }> } => {
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
		let currentBlock: { id: string; type: string; data: { text: string } } = { id: `block-${Date.now()}`, type: "paragraph", data: { text: "" } }

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
			// Only update if external content changes and editor is not currently saving
			// This prevents an infinite loop
			// TODO: Implement a more robust way to handle external content updates without re-initializing
			// For now, we'll just re-initialize if content changes significantly
			editorRef.current.destroy()
			editorRef.current = null
			initializeEditor(content)
		}
	}, [content, shouldUseMobileEditor])

	const initializeEditor = async (initialData = content) => {
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

		try {
			// Wait for dynamic imports to load
			const [EditorJSModule, HeaderModule, ListModule, QuoteModule, CodeModule, TableModule, LinkToolModule, ChecklistModule, MarkerModule, UnderlineModule, InlineCodeModule, DelimiterModule, WarningModule, ParagraphModule] = await Promise.all([
				import("@editorjs/editorjs"),
				import("@editorjs/header"),
				import("@editorjs/list"),
				import("@editorjs/quote"),
				import("@editorjs/code"),
				import("@editorjs/table"),
				import("@editorjs/link"),
				import("@editorjs/checklist"),
				import("@editorjs/marker"),
				import("@editorjs/underline"),
				import("@editorjs/inline-code"),
				import("@editorjs/delimiter"),
				import("@editorjs/warning"),
				import("@editorjs/paragraph")
			])

			const EditorJS = EditorJSModule.default
			const Header = HeaderModule.default
			const List = ListModule.default
			const Quote = QuoteModule.default
			const Code = CodeModule.default
			const Table = TableModule.default
			const LinkTool = LinkToolModule.default
			const Checklist = ChecklistModule.default
			const Marker = MarkerModule.default
			const Underline = UnderlineModule.default
			const InlineCode = InlineCodeModule.default
			const Delimiter = DelimiterModule.default
			const Warning = WarningModule.default
			const Paragraph = ParagraphModule.default

			editorRef.current = new (EditorJS as { new (config: Record<string, unknown>): { save: () => Promise<{ blocks: Array<{ type: string; data?: Record<string, unknown> }> }> } })({
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
							// TODO: Implement undo/redo stack for Editor.js
							setCanUndo(true)
							setCanRedo(false)
						} catch (e) {
							log.error("Error saving editor data:", { error: e })
						}
					}
				},
				onReady: () => {
					log.info("Editor.js is ready to work!")
				},
			})
		} catch (error) {
			log.error("Error initializing Editor.js:", { error })
		}
	}

	const handleSave = async () => {
		if (editorRef.current) {
			try {
				const outputData = await editorRef.current.save()
				onSave(outputData)
			} catch (e) {
				log.error("Error saving editor data:", { error: e })
			}
		}
	}

	const handleUndo = () => {
		// Editor.js does not have a built-in undo/redo. This would require custom implementation.
		log.info("Undo not implemented for Editor.js yet.")
	}

	const handleRedo = () => {
		// Editor.js does not have a built-in undo/redo. This would require custom implementation.
		log.info("Redo not implemented for Editor.js yet.")
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