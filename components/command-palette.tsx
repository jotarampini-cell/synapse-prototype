'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
	FileText, 
	Plus, 
	Search, 
	Settings, 
	Brain, 
	Folder,
	Tag,
	Calendar,
	Lightbulb,
	CheckCircle,
	BookOpen,
	Network,
	TrendingUp,
	HelpCircle,
	Command as CommandIcon,
	Keyboard
} from 'lucide-react'
import { getRecentNotes } from '@/app/actions/smart-suggestions'

interface CommandPaletteProps {
	isOpen: boolean
	onClose: () => void
	onCreateNote?: (title: string, content: string) => void
	onNoteSelect?: (noteId: string) => void
}

interface CommandItem {
	id: string
	title: string
	description: string
	icon: React.ReactNode
	category: string
	action: () => void
	shortcut?: string
}

export function CommandPalette({ 
	isOpen, 
	onClose, 
	onCreateNote, 
	onNoteSelect 
}: CommandPaletteProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [recentNotes, setRecentNotes] = useState<any[]>([])
	const router = useRouter()

	useEffect(() => {
		if (isOpen) {
			loadRecentNotes()
		}
	}, [isOpen])

	const loadRecentNotes = async () => {
		try {
			const notes = await getRecentNotes(10)
			setRecentNotes(notes)
		} catch (error) {
			console.error('Error loading recent notes:', error)
		}
	}

	const handleCreateNote = useCallback((title: string, content: string = '') => {
		if (onCreateNote) {
			onCreateNote(title, content)
		}
		onClose()
	}, [onCreateNote, onClose])

	const handleNoteSelect = useCallback((noteId: string) => {
		if (onNoteSelect) {
			onNoteSelect(noteId)
		}
		onClose()
	}, [onNoteSelect, onClose])

	const handleNavigate = useCallback((path: string) => {
		router.push(path)
		onClose()
	}, [router, onClose])

	const commands: CommandItem[] = [
		// Crear contenido
		{
			id: 'create-note',
			title: 'Nueva nota',
			description: 'Crear una nueva nota',
			icon: <Plus className="h-4 w-4" />,
			category: 'Crear',
			action: () => handleCreateNote('Nueva nota'),
			shortcut: 'Ctrl+N'
		},
		{
			id: 'create-meeting',
			title: 'Nota de reunión',
			description: 'Crear nota usando template de reunión',
			icon: <Calendar className="h-4 w-4" />,
			category: 'Crear',
			action: () => handleCreateNote(
				'Reunión',
				`# Reunión: 
Fecha: ${new Date().toLocaleDateString('es-ES')}
Participantes: 

## Agenda
- 

## Notas principales


## Acciones
- [ ] `
			)
		},
		{
			id: 'create-idea',
			title: 'Nueva idea',
			description: 'Crear nota usando template de idea',
			icon: <Lightbulb className="h-4 w-4" />,
			category: 'Crear',
			action: () => handleCreateNote(
				'Idea',
				`# Idea: 

## Contexto


## Descripción


## Beneficios


## Próximos pasos
- [ ] `
			)
		},
		{
			id: 'create-task',
			title: 'Nueva tarea',
			description: 'Crear nota usando template de tarea',
			icon: <CheckCircle className="h-4 w-4" />,
			category: 'Crear',
			action: () => handleCreateNote(
				'Tarea',
				`# Tarea: 

## Descripción


## Criterios de aceptación
- [ ] 
- [ ] 
- [ ] 

## Notas adicionales


## Fecha límite: `
			)
		},
		{
			id: 'create-learning',
			title: 'Nota de aprendizaje',
			description: 'Crear nota usando template de aprendizaje',
			icon: <BookOpen className="h-4 w-4" />,
			category: 'Crear',
			action: () => handleCreateNote(
				'Aprendizaje',
				`# Aprendizaje: 

## Conceptos clave


## Ejemplos


## Aplicaciones prácticas


## Recursos adicionales
- 
- 

## Resumen personal

`
			)
		},

		// Navegación
		{
			id: 'go-to-notes',
			title: 'Ir a Notas',
			description: 'Abrir la vista principal de notas',
			icon: <FileText className="h-4 w-4" />,
			category: 'Navegación',
			action: () => handleNavigate('/notes'),
			shortcut: 'Ctrl+1'
		},
		{
			id: 'go-to-database',
			title: 'Vista Database',
			description: 'Abrir vista tipo base de datos',
			icon: <Folder className="h-4 w-4" />,
			category: 'Navegación',
			action: () => handleNavigate('/notes/database')
		},
		{
			id: 'go-to-graph',
			title: 'Knowledge Graph',
			description: 'Abrir visualización de grafo de conocimiento',
			icon: <Network className="h-4 w-4" />,
			category: 'Navegación',
			action: () => handleNavigate('/notes/graph')
		},
		{
			id: 'go-to-insights',
			title: 'Dashboard Insights',
			description: 'Abrir dashboard de insights y estadísticas',
			icon: <TrendingUp className="h-4 w-4" />,
			category: 'Navegación',
			action: () => handleNavigate('/notes/insights')
		},

		// IA y Análisis
		{
			id: 'ai-analysis',
			title: 'Análisis con IA',
			description: 'Ejecutar análisis completo de la nota actual',
			icon: <Brain className="h-4 w-4" />,
			category: 'IA',
			action: () => {
				// TODO: Implementar análisis de IA
				onClose()
			}
		},
		{
			id: 'ai-questions',
			title: 'Preguntas de IA',
			description: 'La IA hace preguntas sobre tu contenido',
			icon: <HelpCircle className="h-4 w-4" />,
			category: 'IA',
			action: () => {
				// TODO: Implementar preguntas de IA
				onClose()
			}
		},

		// Configuración
		{
			id: 'settings',
			title: 'Configuración',
			description: 'Abrir configuración de la aplicación',
			icon: <Settings className="h-4 w-4" />,
			category: 'Configuración',
			action: () => handleNavigate('/settings'),
			shortcut: 'Ctrl+,'
		},
		{
			id: 'shortcuts',
			title: 'Atajos de teclado',
			description: 'Ver todos los atajos disponibles',
			icon: <Keyboard className="h-4 w-4" />,
			category: 'Configuración',
			action: () => {
				// TODO: Mostrar modal de atajos
				onClose()
			}
		}
	]

	// Filtrar comandos basado en la búsqueda
	const filteredCommands = commands.filter(command =>
		command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		command.category.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Debug: verificar comandos y filtrado
	if (searchQuery.toLowerCase().includes('nueva')) {
		console.log('🔍 Debug Command Palette:')
		console.log('- Query:', searchQuery)
		console.log('- Total comandos:', commands.length)
		console.log('- Comandos filtrados:', filteredCommands.length)
		console.log('- Comandos que contienen "nueva":', filteredCommands.map(c => ({ id: c.id, title: c.title, category: c.category })))
	}

	// Filtrar notas recientes
	const filteredNotes = recentNotes.filter(note =>
		note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		note.content.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Agrupar comandos por categoría
	const groupedCommands = filteredCommands.reduce((groups, command) => {
		const category = command.category
		if (!groups[category]) {
			groups[category] = []
		}
		groups[category].push(command)
		return groups
	}, {} as Record<string, CommandItem[]>)

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-xl max-h-[70vh] p-0 bg-background/95 backdrop-blur-sm border-border/50">
				<DialogTitle className="sr-only">Command Palette</DialogTitle>
				<Command className="rounded-lg command-palette-custom">
					<div className="flex items-center border-b border-border/50 px-4 py-3 bg-muted/30">
						<CommandIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
						<CommandInput
							placeholder="Buscar comandos, notas o acciones..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="flex h-10 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
						/>
					</div>
					<CommandList className="max-h-[50vh] overflow-y-auto">
						<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
							No se encontraron resultados.
						</CommandEmpty>

						{/* Notas recientes */}
						{filteredNotes.length > 0 && (
							<CommandGroup heading="Notas Recientes" className="px-2 py-1">
								{filteredNotes.slice(0, 5).map((note) => (
									<CommandItem
										key={note.id}
										onSelect={() => handleNoteSelect(note.id)}
										className="command-item group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200"
									>
										<FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
										<div className="flex-1 min-w-0">
											<div className="font-medium truncate text-sm">{note.title}</div>
											<div className="text-xs text-muted-foreground/70 group-hover:text-foreground/80 truncate">
												{note.content.substring(0, 80)}...
											</div>
										</div>
										<Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
											{new Date(note.updated_at).toLocaleDateString('es-ES')}
										</Badge>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{/* Comandos agrupados */}
						{Object.entries(groupedCommands).map(([category, categoryCommands]) => {
							// Debug: verificar comandos por categoría
							if (category === 'Crear' && searchQuery.toLowerCase().includes('nueva')) {
								console.log('📁 Categoría "Crear":', categoryCommands.map(c => ({ id: c.id, title: c.title })))
							}
							return (
							<CommandGroup key={category} heading={category} className="px-2 py-1">
								{categoryCommands.map((command) => (
									<CommandItem
										key={command.id}
										onSelect={command.action}
										className="command-item group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200"
									>
										<div className="text-muted-foreground group-hover:text-primary">{command.icon}</div>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm">{command.title}</div>
											<div className="text-xs text-muted-foreground/70 group-hover:text-foreground/80">
												{command.description}
											</div>
										</div>
										{command.shortcut && (
											<Badge variant="outline" className="text-xs px-2 py-1 bg-muted/30 border-border/50">
												{command.shortcut}
											</Badge>
										)}
									</CommandItem>
								))}
							</CommandGroup>
							)
						})}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	)
}
