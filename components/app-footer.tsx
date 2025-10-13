"use client"

import { APP_VERSION, APP_NAME } from "@/lib/version"

export function AppFooter() {
	return (
		<footer className="py-2 px-4 text-center text-xs text-muted-foreground border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<p>{APP_NAME} {APP_VERSION}</p>
		</footer>
	)
}
