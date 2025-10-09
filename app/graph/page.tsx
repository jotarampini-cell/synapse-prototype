"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, ZoomIn, ZoomOut, Maximize2, Filter, Info } from "lucide-react"
import Link from "next/link"
import { InteractiveGraph } from "@/components/interactive-graph"
import { ContentCaptureFAB } from "@/components/content-capture-fab"

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const nodeDetails = {
    "Neural Networks": {
      type: "Concept",
      connections: 24,
      description: "Computing systems inspired by biological neural networks",
      tags: ["AI", "Deep Learning"],
      created: "2024-01-15",
    },
    "Machine Learning": {
      type: "Field",
      connections: 42,
      description: "Study of algorithms that improve through experience",
      tags: ["AI", "Data Science"],
      created: "2024-01-10",
    },
    "Computer Vision": {
      type: "Application",
      connections: 18,
      description: "Enabling machines to interpret visual information",
      tags: ["AI", "Image Processing"],
      created: "2024-01-18",
    },
    "Deep Learning": {
      type: "Technique",
      connections: 31,
      description: "Neural networks with multiple layers",
      tags: ["AI", "Neural Networks"],
      created: "2024-01-12",
    },
    NLP: {
      type: "Application",
      connections: 22,
      description: "Natural Language Processing for text understanding",
      tags: ["AI", "Language"],
      created: "2024-01-20",
    },
  }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
  const handleReset = () => setZoomLevel(1)

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
                <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  Search
                </Link>
                <Link href="/graph" className="text-sm font-medium text-foreground">
                  Graph
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-muted-foreground">Explore connections between your ideas and concepts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-9 w-9 p-0 bg-transparent">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="bg-transparent">
              {Math.round(zoomLevel * 100)}%
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-9 w-9 p-0 bg-transparent">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Graph */}
          <div className="lg:col-span-3">
            <Card className="border-border bg-card p-6">
              <InteractiveGraph zoomLevel={zoomLevel} onNodeSelect={setSelectedNode} />
            </Card>
          </div>

          {/* Sidebar - Node Details */}
          <div className="space-y-6">
            {selectedNode && nodeDetails[selectedNode as keyof typeof nodeDetails] ? (
              <Card className="border-border bg-card p-6">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">{selectedNode}</h3>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedNode(null)}>
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Type</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {nodeDetails[selectedNode as keyof typeof nodeDetails].type}
                    </Badge>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                    <p className="text-sm leading-relaxed text-card-foreground">
                      {nodeDetails[selectedNode as keyof typeof nodeDetails].description}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {nodeDetails[selectedNode as keyof typeof nodeDetails].tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <span className="text-sm text-muted-foreground">Connections</span>
                    <span className="text-lg font-semibold text-accent">
                      {nodeDetails[selectedNode as keyof typeof nodeDetails].connections}
                    </span>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm text-card-foreground">
                      {new Date(nodeDetails[selectedNode as keyof typeof nodeDetails].created).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  <Button className="w-full">View Details</Button>
                </div>
              </Card>
            ) : (
              <Card className="border-border bg-card p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Info className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 text-sm font-semibold text-card-foreground">Select a Node</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Click on any node in the graph to view its details and connections
                  </p>
                </div>
              </Card>
            )}

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-card-foreground">Graph Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Nodes</span>
                  <span className="font-semibold text-card-foreground">247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Connections</span>
                  <span className="font-semibold text-card-foreground">1,429</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clusters</span>
                  <span className="font-semibold text-card-foreground">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Connections</span>
                  <span className="font-semibold text-card-foreground">5.8</span>
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-card-foreground">Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-[#42a5f5]" />
                  <span className="text-sm text-muted-foreground">Concepts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-[#66bb6a]" />
                  <span className="text-sm text-muted-foreground">Applications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-[#ab47bc]" />
                  <span className="text-sm text-muted-foreground">Techniques</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-[#ffa726]" />
                  <span className="text-sm text-muted-foreground">Fields</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <ContentCaptureFAB />
    </div>
  )
}
