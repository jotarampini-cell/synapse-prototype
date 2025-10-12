"use client"

import { useState } from "react"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileDrawer, useMobileDrawer } from "@/components/mobile-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Search,
	Plus,
	Filter,
	Link,
	FileText,
	Video,
	Image,
	Globe,
	BookOpen,
	ExternalLink,
	MoreHorizontal,
	Tag,
	Star,
	CheckSquare
} from "lucide-react"

// Mock data
const sources = [
	{
		id: "1",
		title: "Guía completa de React 18",
		url: "https://react.dev",
		type: "article",
		description: "Documentación oficial de React con ejemplos y mejores prácticas",
		tags: ["react", "javascript", "frontend"],
		addedDate: "2024-01-10",
		status: "read"
	},
	{
		id: "2",
		title: "Tutorial de Next.js 14",
		url: "https://nextjs.org/docs",
		type: "tutorial",
		description: "Aprende a construir aplicaciones web modernas con Next.js",
		tags: ["nextjs", "react", "tutorial"],
		addedDate: "2024-01-08",
		status: "reading"
	},
	{
		id: "3",
		title: "Diseño de sistemas escalables",
		url: "https://youtube.com/watch?v=example",
		type: "video",
		description: "Conferencia sobre arquitectura de software y patrones de diseño",
		tags: ["architecture", "design", "scalability"],
		addedDate: "2024-01-05",
		status: "saved"
	},
	{
		id: "4",
		title: "API Reference - Supabase",
		url: "https://supabase.com/docs",
		type: "documentation",
		description: "Referencia completa de la API de Supabase",
		tags: ["supabase", "database", "api"],
		addedDate: "2024-01-03",
		status: "saved"
	}
]

const typeIcons = {
	article: FileText,
	tutorial: BookOpen,
	video: Video,
	documentation: FileText,
	image: Image,
	website: Globe
}

const statusColors = {
	read: "bg-green-500",
	reading: "bg-blue-500",
	saved: "bg-gray-500"
}

export default function FuentesPage() {
	const { isMobile } = useMobileDetection()
	const filtersDrawer = useMobileDrawer()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedType, setSelectedType] = useState("all")

	const filteredSources = sources.filter(source => {
		const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			source.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
		
		const matchesType = selectedType === "all" || source.type === selectedType
		
		return matchesSearch && matchesType
	})

	// Layout móvil
	if (isMobile) {
		return (
			<div className="h-screen flex flex-col bg-background">
				{/* Header */}
				<header className="h-14 px-4 flex items-center border-b border-border bg-background safe-area-top">
					<Button 
						variant="ghost" 
						size="icon-mobile" 
						onClick={filtersDrawer.openDrawer}
						className="touch-target"
					>
						<Filter className="h-5 w-5" />
					</Button>
					<div className="flex-1 mx-2">
						<Input 
							placeholder="Buscar fuentes..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							size="mobile"
						/>
					</div>
					<Button 
						variant="ghost" 
						size="icon-mobile"
						className="touch-target"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-y-auto pb-20">
					<div className="p-4 space-y-3">
						{/* Stats rápidas */}
						<div className="grid grid-cols-4 gap-2 mb-4">
							<Card className="p-2 text-center">
								<div className="text-sm font-bold">{sources.length}</div>
								<div className="text-xs text-muted-foreground">Total</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-green-500">
									{sources.filter(s => s.status === "read").length}
								</div>
								<div className="text-xs text-muted-foreground">Leídas</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-blue-500">
									{sources.filter(s => s.status === "reading").length}
								</div>
								<div className="text-xs text-muted-foreground">Leyendo</div>
							</Card>
							<Card className="p-2 text-center">
								<div className="text-sm font-bold text-gray-500">
									{sources.filter(s => s.status === "saved").length}
								</div>
								<div className="text-xs text-muted-foreground">Guardadas</div>
							</Card>
						</div>

						{/* Lista de fuentes */}
						{filteredSources.map((source) => {
							const Icon = typeIcons[source.type as keyof typeof typeIcons] || Link
							return (
								<Card key={source.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors touch-target">
									<div className="flex items-start justify-between mb-2">
										<div className="flex items-start gap-3 flex-1">
											<div className="p-2 bg-muted rounded-lg">
												<Icon className="h-5 w-5" />
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold text-base mb-1 line-clamp-2">
													{source.title}
												</h3>
												<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
													{source.description}
												</p>
												<div className="flex items-center gap-2 mb-2">
													<Badge 
														variant="secondary" 
														className={`text-xs ${statusColors[source.status as keyof typeof statusColors]} text-white`}
													>
														{source.status === "read" ? "Leída" : 
														 source.status === "reading" ? "Leyendo" : "Guardada"}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{source.type}
													</Badge>
												</div>
											</div>
										</div>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</div>
									
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1 flex-wrap">
											{source.tags.slice(0, 3).map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													<Tag className="h-3 w-3 mr-1" />
													{tag}
												</Badge>
											))}
											{source.tags.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{source.tags.length - 3}
												</Badge>
											)}
										</div>
										<Button 
											variant="ghost" 
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												window.open(source.url, '_blank')
											}}
											className="h-8 px-2"
										>
											<ExternalLink className="h-3 w-3" />
										</Button>
									</div>
								</Card>
							)
						})}

						{/* Empty state */}
						{filteredSources.length === 0 && (
							<div className="text-center py-8">
								<Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-lg font-semibold mb-2">No hay fuentes</h3>
								<p className="text-muted-foreground mb-4">
									{searchQuery ? "No se encontraron fuentes con ese criterio" : "Guarda tu primera fuente"}
								</p>
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Agregar Fuente
								</Button>
							</div>
						)}
					</div>
				</main>

				{/* Bottom Navigation */}
				<MobileBottomNav />

				{/* FAB */}
				<Button
					onClick={() => alert("Agregar nueva fuente")}
					className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 touch-target"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>

				{/* Filters Drawer */}
				<MobileDrawer
					isOpen={filtersDrawer.isOpen}
					onClose={filtersDrawer.closeDrawer}
					title="Filtros"
					height="md"
				>
					<div className="p-4 space-y-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Tipo</label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="type" 
										value="all"
										checked={selectedType === "all"}
										onChange={(e) => setSelectedType(e.target.value)}
									/>
									<span>Todos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="type" 
										value="article"
										checked={selectedType === "article"}
										onChange={(e) => setSelectedType(e.target.value)}
									/>
									<span>Artículos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="type" 
										value="video"
										checked={selectedType === "video"}
										onChange={(e) => setSelectedType(e.target.value)}
									/>
									<span>Videos</span>
								</label>
								<label className="flex items-center space-x-2">
									<input 
										type="radio" 
										name="type" 
										value="documentation"
										checked={selectedType === "documentation"}
										onChange={(e) => setSelectedType(e.target.value)}
									/>
									<span>Documentación</span>
								</label>
							</div>
						</div>
						
						<div>
							<label className="text-sm font-medium mb-2 block">Estado</label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Leídas</span>
								</label>
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Leyendo</span>
								</label>
								<label className="flex items-center space-x-2">
									<input type="checkbox" className="rounded" />
									<span>Guardadas</span>
								</label>
							</div>
						</div>
					</div>
				</MobileDrawer>
			</div>
		)
	}

	// Layout desktop
	return (
		<div className="h-screen flex flex-col bg-background">
			<header className="h-16 px-6 flex items-center justify-between border-b border-border">
				<h1 className="text-2xl font-bold">Fuentes</h1>
				<div className="flex items-center gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input 
							placeholder="Buscar fuentes..." 
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 w-64"
						/>
					</div>
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Agregar Fuente
					</Button>
				</div>
			</header>
			<main className="flex-1 p-6">
				<div className="max-w-7xl mx-auto">
					{/* Stats Cards */}
					<div className="grid grid-cols-4 gap-6 mb-8">
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Link className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{sources.length}</p>
									<p className="text-sm text-muted-foreground">Total</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckSquare className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{sources.filter(s => s.status === "read").length}</p>
									<p className="text-sm text-muted-foreground">Leídas</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<BookOpen className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{sources.filter(s => s.status === "reading").length}</p>
									<p className="text-sm text-muted-foreground">Leyendo</p>
								</div>
							</div>
						</Card>
						<Card className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-gray-100 rounded-lg">
									<Star className="h-6 w-6 text-gray-600" />
								</div>
								<div>
									<p className="text-3xl font-bold">{sources.filter(s => s.status === "saved").length}</p>
									<p className="text-sm text-muted-foreground">Guardadas</p>
								</div>
							</div>
						</Card>
					</div>

					{/* Sources Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{filteredSources.map((source) => {
							const Icon = typeIcons[source.type as keyof typeof typeIcons] || Link
							return (
								<Card key={source.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
									<div className="flex items-start gap-4">
										<div className="p-3 bg-muted rounded-lg flex-shrink-0">
											<Icon className="h-6 w-6" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between mb-2">
												<h3 className="text-lg font-semibold line-clamp-2 mb-2">
													{source.title}
												</h3>
												<Button 
													variant="ghost" 
													size="sm"
													onClick={(e) => {
														e.stopPropagation()
														window.open(source.url, '_blank')
													}}
												>
													<ExternalLink className="h-4 w-4" />
												</Button>
											</div>
											<p className="text-muted-foreground mb-3 line-clamp-2">
												{source.description}
											</p>
											<div className="flex items-center gap-2 mb-3">
												<Badge 
													variant="secondary" 
													className={`text-xs ${statusColors[source.status as keyof typeof statusColors]} text-white`}
												>
													{source.status === "read" ? "Leída" : 
													 source.status === "reading" ? "Leyendo" : "Guardada"}
												</Badge>
												<Badge variant="outline" className="text-xs">
													{source.type}
												</Badge>
											</div>
											<div className="flex items-center gap-2 flex-wrap">
												{source.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant="outline" className="text-xs">
														<Tag className="h-3 w-3 mr-1" />
														{tag}
													</Badge>
												))}
												{source.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{source.tags.length - 3}
													</Badge>
												)}
											</div>
										</div>
									</div>
								</Card>
							)
						})}
					</div>

					{/* Empty state */}
					{filteredSources.length === 0 && (
						<Card className="p-12 text-center">
							<Link className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
							<h3 className="text-xl font-semibold mb-2">No hay fuentes</h3>
							<p className="text-muted-foreground mb-6">
								{searchQuery ? "No se encontraron fuentes con ese criterio" : "Guarda tu primera fuente para comenzar"}
							</p>
							<Button size="lg">
								<Plus className="h-4 w-4 mr-2" />
								Agregar Fuente
							</Button>
						</Card>
					)}
				</div>
			</main>
		</div>
	)
}