"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
	Plus, 
	Globe, 
	Upload, 
	FileText,
	Mic,
	X
} from "lucide-react"
import { URLCapture } from "./url-capture"
import { FileCapture } from "./file-capture"
import { VoiceCapture } from "./voice-capture"

interface ContentCaptureProps {
	onContentExtracted: (content: string, title: string, source: string) => void
	onClose?: () => void
	className?: string
}

export function ContentCapture({ onContentExtracted, onClose, className = "" }: ContentCaptureProps) {
	const [activeTab, setActiveTab] = useState("url")

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Plus className="h-4 w-4" />
						Capturar Contenido
					</CardTitle>
					{onClose && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-6 w-6 p-0"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
			</CardHeader>
			
			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="url" className="flex items-center gap-1 text-xs">
							<Globe className="h-3 w-3" />
							URL
						</TabsTrigger>
						<TabsTrigger value="file" className="flex items-center gap-1 text-xs">
							<Upload className="h-3 w-3" />
							Archivo
						</TabsTrigger>
						<TabsTrigger value="voice" className="flex items-center gap-1 text-xs">
							<Mic className="h-3 w-3" />
							Voz
						</TabsTrigger>
					</TabsList>
					
					<TabsContent value="url" className="mt-4">
						<URLCapture onContentExtracted={onContentExtracted} />
					</TabsContent>
					
					<TabsContent value="file" className="mt-4">
						<FileCapture onContentExtracted={onContentExtracted} />
					</TabsContent>
					
					<TabsContent value="voice" className="mt-4">
						<VoiceCapture onContentExtracted={onContentExtracted} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	)
}

// Componente para mostrar en el editor de notas
export function ContentCaptureInline({ onContentExtracted }: { onContentExtracted: (content: string, title: string, source: string) => void }) {
	return (
		<div className="border border-border rounded-lg p-4 bg-muted/30">
			<div className="flex items-center gap-2 mb-3">
				<Plus className="h-4 w-4 text-primary" />
				<span className="text-sm font-medium">Agregar contenido</span>
			</div>
			<ContentCapture onContentExtracted={onContentExtracted} />
		</div>
	)
}
