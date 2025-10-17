"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
	Home, 
	FileText, 
	CheckSquare, 
	Calendar, 
	Briefcase 
} from "lucide-react"

const navItems = [
	{ 
		icon: Home, 
		label: "Home", 
		href: "/home",
		ariaLabel: "Ir a Home"
	},
	{ 
		icon: FileText, 
		label: "Notas", 
		href: "/notes",
		ariaLabel: "Ir a Notas"
	},
	{ 
		icon: CheckSquare, 
		label: "Tareas", 
		href: "/tareas",
		ariaLabel: "Ir a Tareas"
	},
	{ 
		icon: Calendar, 
		label: "Calendario", 
		href: "/fuentes",
		ariaLabel: "Ir a Calendario"
	},
	{ 
		icon: Briefcase, 
		label: "Proyectos", 
		href: "/proyectos",
		ariaLabel: "Ir a Proyectos"
	}
]

export function MobileBottomNav() {
	const pathname = usePathname()

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
			<div className="flex items-center justify-around h-16 px-1 safe-area-left safe-area-right">
				{navItems.map((item) => {
					const isActive = pathname === item.href
					const Icon = item.icon
					
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center justify-center",
								"min-h-[44px] min-w-[44px] p-1 rounded-lg",
								"transition-all duration-200",
								"touch-target",
								"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
								"active:scale-95",
								isActive 
									? "text-primary bg-primary/10 scale-105" 
									: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
							)}
							aria-label={item.ariaLabel}
						>
							<Icon 
								className={cn(
									"h-5 w-5 mb-0.5 transition-transform duration-200",
									isActive && "scale-110"
								)} 
							/>
							<span 
								className={cn(
									"text-[10px] font-medium leading-none transition-all duration-200",
									isActive && "font-semibold text-primary"
								)}
							>
								{item.label}
							</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}

// Componente para agregar padding bottom a las páginas que usan bottom nav
export function MobileBottomNavSpacer() {
	return <div className="h-16 safe-area-bottom" />
}
