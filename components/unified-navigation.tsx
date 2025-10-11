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
	BookOpen, 
	Folder,
	Menu,
	X,
	ChevronDown,
	Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { useCommandPalette } from "@/hooks/use-command-palette"

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
		title: "Acciones",
		href: "/acciones",
		icon: <CheckSquare className="h-4 w-4" />,
		description: "Tareas y acciones"
	},
	{
		title: "Fuentes",
		href: "/fuentes",
		icon: <BookOpen className="h-4 w-4" />,
		description: "Fuentes de información"
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
}

export function UnifiedNavigation({ showUserMenu = true, className }: UnifiedNavigationProps) {
	const pathname = usePathname()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	
	// Command Palette
	const { isOpen: isCommandPaletteOpen, closeCommandPalette, openCommandPalette } = useCommandPalette()

	const isActive = (href: string) => {
		if (href === "/home") {
			return pathname === "/home" || pathname === "/"
		}
		return pathname.startsWith(href)
	}

	return (
		<header className={cn("sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm", className)}>
			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<Link href="/home" className="flex items-center gap-2">
						<Brain className="h-8 w-8 text-primary" />
						<span className="text-xl font-semibold text-foreground">Synapse</span>
					</Link>

					{/* Desktop Navigation */}
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							{navigationItems.map((item) => (
								<NavigationMenuItem key={item.href}>
									<NavigationMenuLink asChild>
										<Link 
											href={item.href}
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
					<div className="flex items-center gap-4">
						{/* Search button - solo en desktop */}
						<Button
							variant="ghost"
							size="sm"
							onClick={openCommandPalette}
							className="hidden md:flex items-center gap-2 h-9 px-3"
						>
							<Search className="h-4 w-4" />
							<span className="text-sm text-muted-foreground">Buscar...</span>
							<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
								<span className="text-xs">⌘</span>K
							</kbd>
						</Button>
						
						<ThemeToggle />
						{showUserMenu && <UserMenu />}
						
						{/* Mobile menu button */}
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden h-9 w-9 p-0"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							{isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
						<nav className="space-y-2">
							{navigationItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
										isActive(item.href) && "bg-muted text-foreground"
									)}
									onClick={() => setIsMobileMenuOpen(false)}
								>
									{item.icon}
									<div>
										<div>{item.title}</div>
										{item.description && (
											<div className="text-xs text-muted-foreground">
												{item.description}
											</div>
										)}
									</div>
								</Link>
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	)
}
