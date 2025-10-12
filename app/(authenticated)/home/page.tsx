"use client"

import { useState } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileModal, useMobileModal } from "@/components/mobile-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Search,
	Plus,
	Clock,
	FileText,
	CheckSquare,
	Link,
	Briefcase,
	TrendingUp,
	Bell
} from "lucide-react"

// Mock data
const recentNotes = [
	{ id: "1", title: "Ideas para el proyecto", updated: "2h", type: "idea" },
	{ id: "2", title: "Reunión con el equipo", updated: "4h", type: "meeting" },
	{ id: "3", title: "Lista de tareas pendientes", updated: "1d", type: "task" }
]

const quickActions = [
	{ icon: FileText, label: "Nueva Nota", color: "bg-blue-500" },
	{ icon: CheckSquare, label: "Nueva Tarea", color: "bg-green-500" },
	{ icon: Link, label: "Nueva Fuente", color: "bg-purple-500" },
	{ icon: Briefcase, label: "Nuevo Proyecto", color: "bg-orange-500" }
]

const stats = [
	{ label: "Notas", value: "24", icon: FileText, change: "+3" },
	{ label: "Tareas", value: "8", icon: CheckSquare, change: "+1" },
	{ label: "Proyectos", value: "3", icon: Briefcase, change: "0" },
	{ label: "Fuentes", value: "12", icon: Link, change: "+2" }
]

export default function HomePage() {
	const { isMobile } = useMobileDetection()
	const quickNoteModal = useMobileModal()
	const templatesModal = useMobileModal()
	const [searchQuery, setSearchQuery] = useState("")

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background/95 backdrop-blur-sm safe-area-top safe-area-left safe-area-right">
					<div className="flex-1">
						<h1 className="text-xl font-bold text-foreground">Synapse</h1>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						className="touch-target active:scale-95"
					>
						<Bell className="h-5 w-5" />
					</Button>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20 safe-area-left safe-area-right">
					<div className="p-4 space-y-6">
						{/* Búsqueda */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input 
								placeholder="Buscar en todo..." 
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 mobile-input"
							/>
						</div>

						{/* Stats Cards */}
						<div className="mobile-grid-2">
							{stats.map((stat) => {
								const Icon = stat.icon
								return (
									<Card key={stat.label} className="mobile-card active:scale-95 transition-transform">
										<div className="flex items-center justify-between mb-2">
											<Icon className="h-5 w-5 text-muted-foreground" />
											<Badge variant="secondary" className="text-xs">
												{stat.change}
											</Badge>
										</div>
										<div className="text-2xl font-bold text-foreground">{stat.value}</div>
										<div className="mobile-text-sm text-muted-foreground">{stat.label}</div>
									</Card>
								)
							})}
						</div>

						{/* Quick Actions */}
						<div>
							<h2 className="text-lg font-semibold mb-3 text-foreground">Acciones Rápidas</h2>
							<div className="mobile-grid-2">
								{quickActions.map((action) => {
									const Icon = action.icon
									return (
										<Button
											key={action.label}
											variant="outline"
											className="h-20 flex flex-col items-center justify-center gap-2 touch-target active:scale-95 transition-all"
											onClick={() => {
												if (action.label === "Nueva Nota") {
													quickNoteModal.openModal()
												}
											}}
										>
											<div className={`p-2 rounded-full ${action.color} transition-transform`}>
												<Icon className="h-5 w-5 text-white" />
											</div>
											<span className="mobile-text-sm text-foreground">{action.label}</span>
										</Button>
									)
								})}
							</div>
						</div>

						{/* Notas Recientes */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-lg font-semibold">Recientes</h2>
								<Button variant="ghost" size="sm">
									Ver todas
								</Button>
							</div>
							<div className="space-y-2">
								{recentNotes.map((note) => (
									<Card key={note.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors touch-target">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h3 className="font-medium text-sm mb-1">{note.title}</h3>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Clock className="h-3 w-3" />
													<span>{note.updated}</span>
												</div>
											</div>
											<Badge variant="outline" className="text-xs">
												{note.type}
											</Badge>
										</div>
									</Card>
								))}
							</div>
						</div>

						{/* Trending */}
						<div>
							<div className="flex items-center gap-2 mb-3">
								<TrendingUp className="h-5 w-5" />
								<h2 className="text-lg font-semibold">Tendencias</h2>
							</div>
							<div className="space-y-2">
								{["Inteligencia Artificial", "Productividad", "Notas", "Organización"].map((trend) => (
									<Badge key={trend} variant="secondary" className="mr-2 mb-2">
										{trend}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB */}
				<Button
					onClick={templatesModal.openModal}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 touch-target"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Modals */}
				<MobileModal
					isOpen={quickNoteModal.isOpen}
					onClose={quickNoteModal.closeModal}
					title="Nota Rápida"
					headerActions={
						<Button onClick={() => quickNoteModal.closeModal()}>
							Guardar
						</Button>
					}
				>
					<div className="p-4">
						<textarea
							placeholder="Escribe tu nota rápida aquí..."
							className="w-full h-64 p-4 border border-input rounded-lg resize-none text-base focus:outline-none focus:ring-2 focus:ring-primary"
							autoFocus
						/>
					</div>
				</MobileModal>

				<MobileModal
					isOpen={templatesModal.isOpen}
					onClose={templatesModal.closeModal}
					title="Crear Nuevo"
				>
					<div className="p-4">
						<div className="space-y-3">
							<Button 
								variant="outline" 
								className="w-full h-16 justify-start touch-target"
								onClick={() => {
									quickNoteModal.openModal()
									templatesModal.closeModal()
								}}
							>
								<FileText className="h-5 w-5 mr-3" />
								<div className="text-left">
									<div className="font-medium">Nueva Nota</div>
									<div className="text-sm text-muted-foreground">Crear una nota en blanco</div>
								</div>
							</Button>
							
							<Button 
								variant="outline" 
								className="w-full h-16 justify-start touch-target"
							>
								<CheckSquare className="h-5 w-5 mr-3" />
								<div className="text-left">
									<div className="font-medium">Nueva Tarea</div>
									<div className="text-sm text-muted-foreground">Crear una lista de tareas</div>
								</div>
							</Button>
							
							<Button 
								variant="outline" 
								className="w-full h-16 justify-start touch-target"
							>
								<Briefcase className="h-5 w-5 mr-3" />
								<div className="text-left">
									<div className="font-medium">Nuevo Proyecto</div>
									<div className="text-sm text-muted-foreground">Organizar trabajo en proyectos</div>
								</div>
							</Button>
						</div>
					</div>
				</MobileModal>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center border-b border-border">
				<h1 className="text-2xl font-bold">Home</h1>
				<div className="ml-auto flex gap-2">
					<Button variant="outline" size="sm">
						<Bell className="h-4 w-4 mr-2" />
						Notificaciones
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-6xl mx-auto">
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<FileText className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">24</p>
									<p className="text-sm text-muted-foreground">Notas</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">8</p>
									<p className="text-sm text-muted-foreground">Tareas</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-purple-100 rounded-lg">
									<Link className="h-6 w-6 text-purple-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">12</p>
									<p className="text-sm text-muted-foreground">Fuentes</p>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-orange-100 rounded-lg">
									<Briefcase className="h-6 w-6 text-orange-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">3</p>
									<p className="text-sm text-muted-foreground">Proyectos</p>
								</div>
							</div>
						</Card>
					</div>
					
					<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Elementos Recientes</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<FileText className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Nota de reunión</p>
										<p className="text-sm text-muted-foreground">Hace 2 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<CheckSquare className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Revisar propuesta</p>
										<p className="text-sm text-muted-foreground">Hace 4 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
									<Link className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium">Artículo sobre IA</p>
										<p className="text-sm text-muted-foreground">Ayer</p>
									</div>
								</div>
							</div>
						</Card>
						
						<Card className="p-6">
							<h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<p className="text-sm">Nueva nota creada</p>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<p className="text-sm">Tarea completada</p>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
									<p className="text-sm">Fuente agregada</p>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}