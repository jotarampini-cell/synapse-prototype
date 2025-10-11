'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
	Calendar, 
	Lightbulb, 
	CheckCircle, 
	BookOpen, 
	FileText, 
	Plus,
	Search,
	X
} from 'lucide-react'

interface Template {
	id: string
	name: string
	description: string
	icon: React.ReactNode
	content: string
	category: string
	isDefault: boolean
}

interface TemplatesModalProps {
	onSelectTemplate: (template: Template) => void
	children?: React.ReactNode
}

const defaultTemplates: Template[] = [
	{
		id: 'meeting',
		name: 'Reunión',
		description: 'Plantilla para notas de reunión',
		icon: <Calendar className="h-5 w-5" />,
		category: 'Productividad',
		isDefault: true,
		content: `# Reunión: {{título}}
Fecha: {{fecha}}
Participantes: {{participantes}}

## Agenda
- 

## Notas principales


## Acciones
- [ ] `
	},
	{
		id: 'idea',
		name: 'Idea',
		description: 'Plantilla para capturar ideas',
		icon: <Lightbulb className="h-5 w-5" />,
		category: 'Creatividad',
		isDefault: true,
		content: `# Idea: 

## Contexto


## Descripción


## Beneficios


## Próximos pasos
- [ ] `
	},
	{
		id: 'task',
		name: 'Tarea',
		description: 'Plantilla para tareas y proyectos',
		icon: <CheckCircle className="h-5 w-5" />,
		category: 'Productividad',
		isDefault: true,
		content: `# Tarea: 

## Descripción


## Criterios de aceptación
- [ ] 
- [ ] 
- [ ] 

## Notas adicionales


## Fecha límite: `
	},
	{
		id: 'learning',
		name: 'Aprendizaje',
		description: 'Plantilla para notas de aprendizaje',
		icon: <BookOpen className="h-5 w-5" />,
		category: 'Educación',
		isDefault: true,
		content: `# Aprendizaje: 

## Conceptos clave


## Ejemplos


## Aplicaciones prácticas


## Recursos adicionales
- 
- 

## Resumen personal

`
	},
	{
		id: 'daily-note',
		name: 'Nota Diaria',
		description: 'Plantilla para notas diarias',
		icon: <FileText className="h-5 w-5" />,
		category: 'Personal',
		isDefault: true,
		content: `# Nota Diaria - {{fecha}}

## Objetivos del día
- [ ] 
- [ ] 
- [ ] 

## Logros


## Reflexiones


## Mañana
- [ ] 
- [ ] 
- [ ] `
	},
	{
		id: 'project',
		name: 'Proyecto',
		description: 'Plantilla para gestión de proyectos',
		icon: <CheckCircle className="h-5 w-5" />,
		category: 'Productividad',
		isDefault: true,
		content: `# Proyecto: 

## Objetivo


## Alcance


## Tareas principales
- [ ] 
- [ ] 
- [ ] 

## Recursos necesarios


## Fechas importantes
- Inicio: 
- Entrega: 

## Notas adicionales

`
	}
]

export function TemplatesModal({ onSelectTemplate, children }: TemplatesModalProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [customTemplates, setCustomTemplates] = useState<Template[]>([])
	const [isCreating, setIsCreating] = useState(false)
	const [newTemplate, setNewTemplate] = useState({
		name: '',
		description: '',
		content: '',
		category: 'Personal'
	})

	const allTemplates = [...defaultTemplates, ...customTemplates]
	
	const filteredTemplates = allTemplates.filter(template =>
		template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		template.category.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const categories = Array.from(new Set(allTemplates.map(t => t.category)))

	const handleSelectTemplate = (template: Template) => {
		onSelectTemplate(template)
		setIsOpen(false)
	}

	const handleCreateTemplate = () => {
		if (!newTemplate.name || !newTemplate.content) return

		const template: Template = {
			id: `custom-${Date.now()}`,
			name: newTemplate.name,
			description: newTemplate.description,
			icon: <FileText className="h-5 w-5" />,
			content: newTemplate.content,
			category: newTemplate.category,
			isDefault: false
		}

		setCustomTemplates(prev => [...prev, template])
		setNewTemplate({ name: '', description: '', content: '', category: 'Personal' })
		setIsCreating(false)
	}

	const handleDeleteTemplate = (templateId: string) => {
		setCustomTemplates(prev => prev.filter(t => t.id !== templateId))
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{children || (
					<Button variant="outline" className="gap-2">
						<FileText className="h-4 w-4" />
						Templates
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle>Plantillas de Notas</DialogTitle>
					<DialogDescription>
						Selecciona una plantilla para crear una nueva nota o crea tu propia plantilla personalizada.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 h-full">
					{/* Search and Create */}
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar plantillas..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsCreating(true)}
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							Nueva
						</Button>
					</div>

					{/* Create Template Form */}
					{isCreating && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Crear Plantilla Personalizada</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="template-name">Nombre</Label>
										<Input
											id="template-name"
											value={newTemplate.name}
											onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
											placeholder="Nombre de la plantilla"
										/>
									</div>
									<div>
										<Label htmlFor="template-category">Categoría</Label>
										<Input
											id="template-category"
											value={newTemplate.category}
											onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
											placeholder="Categoría"
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="template-description">Descripción</Label>
									<Input
										id="template-description"
										value={newTemplate.description}
										onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Descripción de la plantilla"
									/>
								</div>
								<div>
									<Label htmlFor="template-content">Contenido</Label>
									<Textarea
										id="template-content"
										value={newTemplate.content}
										onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
										placeholder="Contenido de la plantilla (usa {{variable}} para placeholders)"
										rows={8}
									/>
								</div>
								<div className="flex gap-2">
									<Button onClick={handleCreateTemplate}>
										Crear Plantilla
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setIsCreating(false)
											setNewTemplate({ name: '', description: '', content: '', category: 'Personal' })
										}}
									>
										Cancelar
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Templates Grid */}
					<div className="flex-1 overflow-y-auto">
						{categories.map(category => {
							const categoryTemplates = filteredTemplates.filter(t => t.category === category)
							if (categoryTemplates.length === 0) return null

							return (
								<div key={category} className="mb-6">
									<h3 className="text-lg font-semibold mb-3 text-foreground">{category}</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{categoryTemplates.map(template => (
											<Card
												key={template.id}
												className="cursor-pointer hover:shadow-md transition-shadow"
												onClick={() => handleSelectTemplate(template)}
											>
												<CardHeader className="pb-3">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															{template.icon}
															<CardTitle className="text-base">{template.name}</CardTitle>
														</div>
														{!template.isDefault && (
															<Button
																variant="ghost"
																size="sm"
																onClick={(e) => {
																	e.stopPropagation()
																	handleDeleteTemplate(template.id)
																}}
																className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
															>
																<X className="h-3 w-3" />
															</Button>
														)}
													</div>
													<CardDescription className="text-sm">
														{template.description}
													</CardDescription>
												</CardHeader>
												<CardContent className="pt-0">
													<div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono max-h-20 overflow-hidden">
														{template.content.substring(0, 100)}...
													</div>
													{template.isDefault && (
														<Badge variant="secondary" className="mt-2 text-xs">
															Predeterminada
														</Badge>
													)}
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}





