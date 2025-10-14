"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MobileModal } from "@/components/mobile-modal"
import { Folder } from "lucide-react"
import { createFolder } from "@/app/actions/folders"
import { toast } from "sonner"

interface CreateFolderModalProps {
	isOpen: boolean
	onClose: () => void
	onFolderCreated?: () => void
	parentId?: string | null
}

const folderColors = [
	{ name: 'Azul', value: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-600' },
	{ name: 'Verde', value: '#10b981', bg: 'bg-green-500/20', text: 'text-green-600' },
	{ name: 'Rojo', value: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-600' },
	{ name: 'Amarillo', value: '#f59e0b', bg: 'bg-yellow-500/20', text: 'text-yellow-600' },
	{ name: 'Púrpura', value: '#8b5cf6', bg: 'bg-purple-500/20', text: 'text-purple-600' },
	{ name: 'Naranja', value: '#f97316', bg: 'bg-orange-500/20', text: 'text-orange-600' },
	{ name: 'Rosa', value: '#ec4899', bg: 'bg-pink-500/20', text: 'text-pink-600' },
	{ name: 'Turquesa', value: '#06b6d4', bg: 'bg-cyan-500/20', text: 'text-cyan-600' },
	{ name: 'Índigo', value: '#6366f1', bg: 'bg-indigo-500/20', text: 'text-indigo-600' },
	{ name: 'Gris', value: '#6b7280', bg: 'bg-gray-500/20', text: 'text-gray-600' }
]

export function CreateFolderModal({ 
	isOpen, 
	onClose, 
	onFolderCreated,
	parentId = null 
}: CreateFolderModalProps) {
	const [folderName, setFolderName] = useState("")
	const [selectedColor, setSelectedColor] = useState(folderColors[0])
	const [isCreating, setIsCreating] = useState(false)

	const handleCreateFolder = async () => {
		if (!folderName.trim()) {
			toast.error("Por favor ingresa un nombre para la carpeta")
			return
		}

		setIsCreating(true)
		try {
			const result = await createFolder({
				name: folderName.trim(),
				color: selectedColor.value,
				parent_id: parentId
			})

			if (result.success) {
				toast.success("Carpeta creada exitosamente")
				setFolderName("")
				setSelectedColor(folderColors[0])
				onFolderCreated?.()
				onClose()
			} else {
				toast.error(result.error || "Error al crear la carpeta")
			}
		} catch (error) {
			console.error('Error creating folder:', error)
			toast.error("Error al crear la carpeta")
		} finally {
			setIsCreating(false)
		}
	}

	const handleClose = () => {
		setFolderName("")
		setSelectedColor(folderColors[0])
		onClose()
	}

	return (
		<MobileModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Nueva Carpeta"
			headerActions={
				<Button 
					onClick={handleCreateFolder}
					disabled={isCreating || !folderName.trim()}
					size="sm"
				>
					{isCreating ? "Creando..." : "Crear"}
				</Button>
			}
		>
			<div className="p-4 space-y-6">
				{/* Input de nombre */}
				<div>
					<label className="block text-sm font-medium mb-2">
						Nombre de la carpeta
					</label>
					<Input
						value={folderName}
						onChange={(e) => setFolderName(e.target.value)}
						placeholder="Ej: Trabajo, Personal, Ideas..."
						className="w-full"
						maxLength={50}
					/>
				</div>

				{/* Selector de color */}
				<div>
					<label className="block text-sm font-medium mb-3">
						Color de la carpeta
					</label>
					<div className="grid grid-cols-5 gap-3">
						{folderColors.map((color) => (
							<button
								key={color.value}
								onClick={() => setSelectedColor(color)}
								className={`
									relative p-3 rounded-xl border-2 transition-all
									${selectedColor.value === color.value 
										? 'border-primary shadow-md scale-105' 
										: 'border-border hover:border-primary/50'
									}
								`}
							>
								<div className={`
									w-8 h-8 rounded-lg flex items-center justify-center
									${color.bg}
								`}>
									<Folder className={`h-5 w-5 ${color.text}`} />
								</div>
								{selectedColor.value === color.value && (
									<div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
										<div className="w-2 h-2 bg-white rounded-full" />
									</div>
								)}
							</button>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						Color seleccionado: {selectedColor.name}
					</p>
				</div>

				{/* Preview */}
				<div className="p-3 bg-muted/30 rounded-xl">
					<div className="flex items-center gap-3">
						<div className={`
							w-10 h-10 rounded-lg flex items-center justify-center
							${selectedColor.bg}
						`}>
							<Folder className={`h-5 w-5 ${selectedColor.text}`} />
						</div>
						<div>
							<p className="font-medium text-sm">
								{folderName || "Nombre de la carpeta"}
							</p>
							<p className="text-xs text-muted-foreground">
								Vista previa
							</p>
						</div>
					</div>
				</div>
			</div>
		</MobileModal>
	)
}
