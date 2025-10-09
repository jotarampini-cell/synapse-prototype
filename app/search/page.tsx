"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Search, Filter, SlidersHorizontal, FileText, LinkIcon, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import { ContentCaptureFAB } from "@/components/content-capture-fab"
import { UserMenu } from "@/components/user-menu"
import { searchContents } from "@/app/actions/search"
import { toast } from "sonner"

function SearchContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams])

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchContents(query)
      setSearchResults(results)
    } catch (error) {
      toast.error("Error al buscar contenido")
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery)
  }

  // searchResults ahora viene del estado

  const filters = [
    { id: "all", label: "All Results", count: 247 },
    { id: "documents", label: "Documents", count: 89 },
    { id: "notes", label: "Notes", count: 124 },
    { id: "articles", label: "Articles", count: 34 },
  ]

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
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link href="/search" className="text-sm font-medium text-foreground">
                  Búsqueda
                </Link>
                <Link href="/graph" className="text-sm text-muted-foreground hover:text-foreground">
                  Grafo
                </Link>
              </nav>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative mx-auto max-w-3xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Busca en tu base de conocimiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-4 text-base"
            />
          </form>
          {searchQuery && (
            <div className="mx-auto mt-4 flex max-w-3xl items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Buscando..."
                ) : (
                  <>
                    Encontrados <span className="font-semibold text-foreground">{searchResults.length} resultados</span> para "{searchQuery}"
                  </>
                )}
              </p>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Filters */}
          <aside className="space-y-6">
            <Card className="border-border bg-card p-4">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <Filter className="h-4 w-4" />
                Filter by Type
              </h3>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeFilter === filter.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="text-xs">{filter.count}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-card-foreground">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["AI", "Machine Learning", "Deep Learning", "Research", "Ethics", "Computer Vision"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </aside>

          {/* Main Content - Search Results */}
          <div className="space-y-4 lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Buscando...</p>
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron resultados para tu búsqueda.</p>
              </div>
            ) : (
              searchResults.map((result) => (
              <Card key={result.id} className="border-border bg-card p-6 transition-all hover:border-primary">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-card-foreground">{result.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {result.content_type}
                        </Badge>
                      </div>
                      <p className="leading-relaxed text-muted-foreground">
                        {result.content.length > 200 
                          ? `${result.content.substring(0, 200)}...` 
                          : result.content
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-sm font-semibold text-accent">
                      <Sparkles className="h-4 w-4" />
                      {result.relevance}%
                    </div>
                    <span className="text-xs text-muted-foreground">relevance</span>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {result.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {result.summaries?.[0]?.key_concepts && (
                  <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Conceptos Relacionados</p>
                    <div className="flex flex-wrap gap-2">
                      {result.summaries[0].key_concepts.map((concept) => (
                        <Badge
                          key={concept}
                          variant="outline"
                          className="cursor-pointer border-primary/30 text-xs text-primary hover:bg-primary/10"
                        >
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {result.similarity && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        {Math.round(result.similarity * 100)}% relevancia
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(result.created_at).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    Ver Detalles
                  </Button>
                </div>
              </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <ContentCaptureFAB />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
