"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { 
	Brain, 
	Home, 
	FileText, 
	BarChart3, 
	CheckSquare, 
	Calendar, 
	Folder,
	ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/user-menu"

interface NavigationItem {
	title: string
	href: string
	icon: React.ReactNode
	description?: string
}

const navigationItems: NavigationItem[] = [
	{
		title: "Home",
		href: "/home",
		icon: <Home className="h-4 w-4" />,
		description: "Página principal"
	},
	{
		title: "Mis Notas",
		href: "/notes",
		icon: <FileText className="h-4 w-4" />,
		description: "Gestiona tus notas"
	},
	{
		title: "Tareas",
		href: "/tareas",
		icon: <CheckSquare className="h-4 w-4" />,
		description: "Gestiona tus tareas"
	},
	{
		title: "Calendario",
		href: "/fuentes",
		icon: <Calendar className="h-4 w-4" />,
		description: "Calendario y eventos"
	},
	{
		title: "Proyectos",
		href: "/proyectos",
		icon: <Folder className="h-4 w-4" />,
		description: "Organiza tus proyectos"
	}
]

interface UnifiedNavigationProps {
	showUserMenu?: boolean
	className?: string
	showBackButton?: boolean
	backButtonText?: string
	onBackClick?: () => void
}

export function UnifiedNavigation({ 
	showUserMenu = true, 
	className,
	showBackButton = false,
	backButtonText,
	onBackClick
}: UnifiedNavigationProps) {
	const pathname = usePathname()

	const isActive = (href: string) => {
		if (href === "/home") {
			return pathname === "/home" || pathname === "/"
		}
		return pathname.startsWith(href)
	}

	return (
		<header className={cn("sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm overflow-x-hidden", className)}>
			<div className="container mx-auto px-6 py-2">
				<div className="flex items-center justify-between relative">
					{/* Espacio izquierdo - botón back o vacío */}
					<div className="flex items-center gap-2">
						{showBackButton && (
							<div className="flex items-center gap-2">
								<Button 
									variant="ghost" 
									size="sm" 
									onClick={onBackClick}
									className="h-8 w-8 p-0"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								{backButtonText && (
									<span className="text-sm font-medium text-foreground">{backButtonText}</span>
								)}
							</div>
						)}
					</div>

					{/* Logo centrado */}
					<div className="absolute left-1/2 transform -translate-x-1/2">
						<Link href="/home" prefetch={true} className="flex items-center">
							<Brain className="h-8 w-8 text-primary" />
						</Link>
					</div>

					{/* Desktop Navigation */}
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							{navigationItems.map((item) => (
								<NavigationMenuItem key={item.href}>
									<NavigationMenuLink asChild>
										<Link 
											href={item.href}
											prefetch={true}
											className={cn(
												"group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
												isActive(item.href) && "bg-muted text-foreground"
											)}
										>
											<div className="flex items-center gap-2">
												{item.icon}
												<span>{item.title}</span>
											</div>
										</Link>
									</NavigationMenuLink>
								</NavigationMenuItem>
							))}
						</NavigationMenuList>
					</NavigationMenu>

					{/* Right side controls */}
					<div className="flex items-center gap-2 ml-auto">
						{/* Menú de configuración - visible en desktop y mobile */}
						{showUserMenu && <UserMenu />}
					</div>
				</div>

			</div>
		</header>
	)
}
