"use client"

import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
	Search,
	Plus,
	Bell,
	FileText,
	CheckSquare,
	Link,
	Briefcase,
	TrendingUp,
	Users,
	Calendar
} from "lucide-react"

export default function DashboardPage() {
	const { isMobile } = useMobileDetection()

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<div className="flex-1">
						<h1 className="text-lg font-bold">Dashboard</h1>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						className="touch-target"
					>
						<Bell className="h-5 w-5" />
					</Button>
				</header>

				{/* Content */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-4">
						{/* Búsqueda Global */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input 
								placeholder="Buscar en todo..." 
								className="pl-10"
								size="mobile"
							/>
						</div>

						{/* Stats Cards */}
						<div className="grid grid-cols-2 gap-3">
							<Card className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-100 rounded-lg">
										<FileText className="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">24</p>
										<p className="text-xs text-muted-foreground">Notas</p>
									</div>
								</div>
							</Card>
							
							<Card className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-green-100 rounded-lg">
										<CheckSquare className="h-5 w-5 text-green-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">8</p>
										<p className="text-xs text-muted-foreground">Tareas</p>
									</div>
								</div>
							</Card>
							
							<Card className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-purple-100 rounded-lg">
										<Link className="h-5 w-5 text-purple-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">12</p>
										<p className="text-xs text-muted-foreground">Fuentes</p>
									</div>
								</div>
							</Card>
							
							<Card className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-orange-100 rounded-lg">
										<Briefcase className="h-5 w-5 text-orange-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">3</p>
										<p className="text-xs text-muted-foreground">Proyectos</p>
									</div>
								</div>
							</Card>
						</div>

						{/* Elementos Recientes */}
						<Card className="p-4">
							<h3 className="font-semibold mb-3">Elementos Recientes</h3>
							<div className="space-y-3">
								<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Nota de reunión</p>
										<p className="text-xs text-muted-foreground">Hace 2 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
									<CheckSquare className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Revisar propuesta</p>
										<p className="text-xs text-muted-foreground">Hace 4 horas</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
									<Link className="h-4 w-4 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-medium">Artículo sobre IA</p>
										<p className="text-xs text-muted-foreground">Ayer</p>
									</div>
								</div>
							</div>
						</Card>
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center border-b border-border">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<div className="ml-auto flex gap-2">
					<Button variant="outline" size="sm">
						<Bell className="h-4 w-4 mr-2" />
						Notificaciones
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-6xl mx-auto">
					<p className="text-muted-foreground mb-6">
						Vista desktop del dashboard. Cambia el tamaño de la ventana a menos de 768px para ver la vista móvil.
					</p>
					
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