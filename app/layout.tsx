import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AppStateProvider } from "@/contexts/app-state-context"
import "./globals.css"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Synapse - Your Second Brain",
  description: "AI-powered knowledge management for professionals and students",
  generator: "v0.app",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`font-sans ${inter.variable} antialiased`}>
				<AppStateProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem={false}
						disableTransitionOnChange
					>
						<Suspense fallback={null}>
							{children}
							<Analytics />
							<Toaster />
						</Suspense>
					</ThemeProvider>
				</AppStateProvider>
			</body>
		</html>
	)
}