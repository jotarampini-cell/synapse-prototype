import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Search, Network, Sparkles } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function HomePage() {
  // Verificar si el usuario está autenticado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Si está autenticado, redirigir al home
  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">Synapse</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Knowledge Management</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-foreground md:text-6xl">
            Your Second Brain,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Powered by AI</span>
          </h1>

          <p className="mb-10 text-xl leading-relaxed text-muted-foreground">
            Capture, process, and discover knowledge effortlessly. Synapse uses AI to connect your ideas and surface
            insights you never knew existed.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                <Brain className="h-5 w-5" />
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          <Link href="/auth/signup" className="group">
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Registro Inteligente</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Comienza en minutos con nuestro flujo de registro inteligente
              </p>
            </div>
          </Link>

          <Link href="/search" className="group">
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Semantic Search</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Find connections between ideas using AI-powered search
              </p>
            </div>
          </Link>

          <Link href="/graph" className="group">
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <Network className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Knowledge Graph</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Visualize how your knowledge connects and grows over time
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
