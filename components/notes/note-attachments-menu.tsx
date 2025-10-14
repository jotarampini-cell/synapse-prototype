"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { 
	Upload, 
	Mic, 
	FileText,
	Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteAttachmentsMenuProps {
	onDocumentUpload: () => void
	onTranscribe: () => void
	onAudioAttach: () => void
}

interface ActionCardProps {
	icon: React.ReactNode
	label: string
	description: string
	onClick: () => void
}

function ActionCard({ icon, label, description, onClick }: ActionCardProps) {
	return (
		<Button
			variant="ghost"
			onClick={onClick}
			className={cn(
				"h-auto p-4 flex flex-col items-center gap-3",
				"hover:bg-muted/50 transition-colors",
				"border border-border/50 rounded-lg"
			)}
		>
			<div className="p-3 rounded-full bg-primary/10 text-primary">
				{icon}
			</div>
			<div className="text-center">
				<div className="font-medium text-sm">{label}</div>
				<div className="text-xs text-muted-foreground mt-1">
					{description}
				</div>
			</div>
		</Button>
	)
}

export function NoteAttachmentsMenu({ 
	onDocumentUpload, 
	onTranscribe, 
	onAudioAttach 
}: NoteAttachmentsMenuProps) {
	const [isOpen, setIsOpen] = useState(false)

	const handleAction = (action: () => void) => {
		action()
		setIsOpen(false)
	}

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0 hover:bg-muted/50"
					aria-label="Adjuntar archivo"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</SheetTrigger>
			<SheetContent side="bottom" className="h-auto">
				<SheetHeader className="text-center pb-4">
					<SheetTitle className="text-lg">Adjuntar contenido</SheetTitle>
					<SheetDescription>
						Selecciona el tipo de contenido que quieres añadir a tu nota
					</SheetDescription>
				</SheetHeader>
				
				<div className="grid grid-cols-3 gap-4 p-4">
					<ActionCard
						icon={<Upload className="h-5 w-5" />}
						label="Documento"
						description="Subir archivo"
						onClick={() => handleAction(onDocumentUpload)}
					/>
					<ActionCard
						icon={<Mic className="h-5 w-5" />}
						label="Transcribir"
						description="Audio a texto"
						onClick={() => handleAction(onTranscribe)}
					/>
					<ActionCard
						icon={<FileText className="h-5 w-5" />}
						label="Audio"
						description="Adjuntar audio"
						onClick={() => handleAction(onAudioAttach)}
					/>
				</div>
			</SheetContent>
		</Sheet>
	)
}
