"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Keyboard, HelpCircle } from "lucide-react"
import { TASK_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts"

const shortcuts = [
	{
		key: TASK_SHORTCUTS.NEW_TASK,
		description: "Crear nueva tarea",
		keys: ["N"]
	},
	{
		key: TASK_SHORTCUTS.COMPLETE_TASK,
		description: "Completar tarea seleccionada",
		keys: ["Enter"]
	},
	{
		key: TASK_SHORTCUTS.DELETE_TASK,
		description: "Eliminar tarea seleccionada",
		keys: ["Delete"]
	},
	{
		key: TASK_SHORTCUTS.EDIT_TASK,
		description: "Editar tarea seleccionada",
		keys: ["E"]
	},
	{
		key: TASK_SHORTCUTS.SEARCH,
		description: "Buscar tareas",
		keys: ["K"]
	},
	{
		key: TASK_SHORTCUTS.TOGGLE_COMPLETED,
		description: "Mostrar/ocultar tareas completadas",
		keys: ["C"]
	},
	{
		key: TASK_SHORTCUTS.ESCAPE,
		description: "Cancelar acción o cerrar modal",
		keys: ["Esc"]
	},
	{
		key: TASK_SHORTCUTS.MOVE_UP,
		description: "Mover selección hacia arriba",
		keys: ["↑"]
	},
	{
		key: TASK_SHORTCUTS.MOVE_DOWN,
		description: "Mover selección hacia abajo",
		keys: ["↓"]
	}
]

export function KeyboardShortcutsHelp() {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<HelpCircle className="h-4 w-4 mr-2" />
					Atajos
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl w-[95vw] sm:w-full">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Keyboard className="h-5 w-5" />
						Atajos de Teclado
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Usa estos atajos para navegar y gestionar tus tareas más rápidamente.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{shortcuts.map((shortcut) => (
							<div key={shortcut.key} className="flex items-center justify-between p-3 border rounded-lg">
								<span className="text-sm font-medium">{shortcut.description}</span>
								<div className="flex gap-1">
									{shortcut.keys.map((key, index) => (
										<Badge key={index} variant="secondary" className="font-mono text-xs">
											{key}
										</Badge>
									))}
								</div>
							</div>
						))}
					</div>
					<div className="pt-4 border-t">
						<p className="text-xs text-muted-foreground">
							💡 Tip: Los atajos no funcionan cuando estás escribiendo en un campo de texto.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
