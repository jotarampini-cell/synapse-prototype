"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProject } from "@/app/actions/projects"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

interface CreateProjectModalProps {
	trigger?: React.ReactNode
	onProjectCreated?: () => void
}

const colors = [
	{ name: "Azul", value: "#3B82F6" },
	{ name: "Rojo", value: "#EF4444" },
	{ name: "Verde", value: "#10B981" },
	{ name: "Amarillo", value: "#F59E0B" },
	{ name: "Púrpura", value: "#8B5CF6" },
	{ name: "Naranja", value: "#F97316" },
	{ name: "Cian", value: "#06B6D4" },
	{ name: "Rosa", value: "#EC4899" }
]

const statusOptions = [
	{ label: "Activo", value: "active" },
	{ label: "En pausa", value: "paused" },
	{ label: "Completado", value: "completed" },
	{ label: "Archivado", value: "archived" }
]

export function CreateProjectModal({ trigger, onProjectCreated }: CreateProjectModalProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		color: "#3B82F6",
		status: "active"
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.name.trim()) {
			toast.error("El nombre del proyecto es requerido")
			return
		}

		setIsCreating(true)
		try {
			const result = await createProject({
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				color: formData.color
			})

			if (result.success) {
				toast.success("Proyecto creado exitosamente")
				setIsOpen(false)
				setFormData({ name: "", description: "", color: "#3B82F6", status: "active" })
				onProjectCreated?.()
			} else {
				toast.error(result.error || "Error al crear proyecto")
			}
		} catch (error) {
			toast.error("Error al crear proyecto")
		} finally {
			setIsCreating(false)
		}
	}

	const handleColorChange = (color: string) => {
		setFormData(prev => ({ ...prev, color }))
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Nuevo Proyecto
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md w-[95vw] sm:w-full">
				<DialogHeader>
					<DialogTitle>Crear Nuevo Proyecto</DialogTitle>
				</DialogHeader>
				
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nombre del proyecto *</Label>
						<Input
							id="name"
							placeholder="Ej: Lanzamiento de producto"
							value={formData.name}
							onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							placeholder="Describe brevemente el proyecto..."
							value={formData.description}
							onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2">
							{colors.map((color) => (
								<button
									key={color.value}
									type="button"
									onClick={() => handleColorChange(color.value)}
									className={`w-8 h-8 rounded-full border-2 transition-all ${
										formData.color === color.value 
											? 'border-foreground scale-110' 
											: 'border-transparent hover:scale-105'
									}`}
									style={{ backgroundColor: color.value }}
									title={color.name}
								/>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="status">Estado</Label>
						<Select 
							value={formData.status} 
							onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
							className="flex-1"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isCreating}
							className="flex-1"
						>
							{isCreating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Creando...
								</>
							) : (
								"Crear Proyecto"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
