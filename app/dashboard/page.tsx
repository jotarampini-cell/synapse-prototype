"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Search,
  Network,
  Plus,
  FileText,
  Sparkles,
  Clock,
  TrendingUp,
  LinkIcon,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { ContentCaptureFAB } from "@/components/content-capture-fab"
import { UserMenu } from "@/components/user-menu"
import { getUserStats, getRecentSummaries, getSuggestedConnections, getProcessingItems } from "@/app/actions/dashboard"
import { toast } from "sonner"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    total_contents: 0,
    total_connections: 0,
    total_nodes: 0,
    recent_growth: 0
  })
  const [processingItems, setProcessingItems] = useState<any[]>([])
  const [aiSummaries, setAiSummaries] = useState<any[]>([])
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, processingData, summariesData, connectionsData] = await Promise.all([
          getUserStats(),
          getProcessingItems(),
          getRecentSummaries(),
          getSuggestedConnections()
        ])

        setStats(statsData)
        setProcessingItems(processingData)
        setAiSummaries(summariesData)
        setSuggestedConnections(connectionsData)
      } catch (error) {
        toast.error("Error al cargar datos del dashboard")
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold text-foreground">Synapse</span>
              </Link>
              <nav className="hidden items-center gap-6 md:flex">
                <Link href="/dashboard" className="text-sm font-medium text-foreground">
                  Dashboard
                </Link>
                <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  Search
                </Link>
                <Link href="/graph" className="text-sm text-muted-foreground hover:text-foreground">
                  Graph
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Añadir Contenido
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-4 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {isLoading ? "..." : stats.total_contents}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary/50" />
            </div>
          </Card>
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {isLoading ? "..." : stats.total_connections}
                </p>
              </div>
              <LinkIcon className="h-8 w-8 text-accent/50" />
            </div>
          </Card>
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {isLoading ? "..." : processingItems.filter(item => item.status === 'processing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-chart-4/50" />
            </div>
          </Card>
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {isLoading ? "..." : `+${stats.recent_growth}`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent/50" />
            </div>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Processing & Summaries */}
          <div className="space-y-8 lg:col-span-2">
            {/* Processing Status */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Estado de Procesamiento</h2>
                <Button variant="ghost" size="sm">
                  Ver Todo
                </Button>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : processingItems.length === 0 ? (
                  <Card className="border-border bg-card p-6 text-center">
                    <p className="text-muted-foreground">No hay elementos en procesamiento</p>
                  </Card>
                ) : (
                  processingItems.map((item) => (
                    <Card key={item.id} className="border-border bg-card p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{item.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.status === "complete" ? "Análisis completo" : "Analizando contenido..."}
                            </p>
                          </div>
                        </div>
                        {item.status === "complete" && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent">
                            Completo
                          </Badge>
                        )}
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </Card>
                  ))
                )}
              </div>
            </section>

            {/* AI Summaries */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Resúmenes IA</h2>
                </div>
                <Button variant="ghost" size="sm">
                  Ver Todo
                </Button>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : aiSummaries.length === 0 ? (
                  <Card className="border-border bg-card p-6 text-center">
                    <p className="text-muted-foreground">No hay resúmenes disponibles</p>
                  </Card>
                ) : (
                  aiSummaries.map((summary) => (
                    <Card key={summary.id} className="border-border bg-card p-6 transition-all hover:border-primary">
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-card-foreground">{summary.contents?.title || 'Sin título'}</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mb-4 leading-relaxed text-muted-foreground">{summary.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {summary.contents?.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" />
                            {summary.key_concepts?.length || 0}
                          </span>
                          <span>{new Date(summary.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Suggested Connections */}
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">Conexiones Sugeridas</h2>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : suggestedConnections.length === 0 ? (
                  <Card className="border-border bg-card p-6 text-center">
                    <p className="text-muted-foreground">No hay conexiones sugeridas</p>
                  </Card>
                ) : (
                  suggestedConnections.map((connection) => (
                    <Card key={connection.id} className="border-border bg-card p-4 transition-all hover:border-accent">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          {connection.source_concept}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="border-accent/50 text-accent">
                          {connection.target_concept}
                        </Badge>
                      </div>
                      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{connection.reason || 'Conexión sugerida por IA'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Confianza</span>
                        <span className="text-sm font-semibold text-accent">{Math.round(connection.strength * 100)}%</span>
                      </div>
                      <Progress value={connection.strength * 100} className="mt-2 h-1.5" />
                    </Card>
                  ))
                )}
              </div>
              <Link href="/graph">
                <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                  <Network className="h-4 w-4" />
                  Ver Grafo Completo
                </Button>
              </Link>
            </section>
          </div>
        </div>
      </main>

      <ContentCaptureFAB />
    </div>
  )
}
