"use client"

import { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  label: string
  color: string
}

interface Edge {
  source: string
  target: string
}

export function AnimatedGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])

  useEffect(() => {
    // Initialize nodes with random positions
    const initialNodes: Node[] = [
      { id: "1", x: 200, y: 150, vx: 0.5, vy: 0.3, label: "AI", color: "#42a5f5" },
      { id: "2", x: 350, y: 100, vx: -0.3, vy: 0.5, label: "Design", color: "#66bb6a" },
      { id: "3", x: 300, y: 250, vx: 0.4, vy: -0.4, label: "Code", color: "#ab47bc" },
      { id: "4", x: 150, y: 300, vx: -0.5, vy: 0.2, label: "Research", color: "#ffa726" },
      { id: "5", x: 400, y: 280, vx: 0.2, vy: -0.5, label: "Writing", color: "#ec407a" },
      { id: "6", x: 250, y: 180, vx: -0.4, vy: 0.4, label: "Ideas", color: "#42a5f5" },
    ]

    const initialEdges: Edge[] = [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "2", target: "6" },
      { source: "3", target: "6" },
      { source: "4", target: "6" },
      { source: "5", target: "3" },
      { source: "4", target: "1" },
    ]

    setNodes(initialNodes)
    setEdges(initialEdges)
    nodesRef.current = initialNodes
    edgesRef.current = initialEdges
  }, [])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const updatedNodes = nodesRef.current.map((node) => {
        let newX = node.x + node.vx
        let newY = node.y + node.vy
        let newVx = node.vx
        let newVy = node.vy

        // Bounce off walls
        if (newX <= 30 || newX >= canvas.width - 30) {
          newVx = -newVx
          newX = Math.max(30, Math.min(canvas.width - 30, newX))
        }
        if (newY <= 30 || newY >= canvas.height - 30) {
          newVy = -newVy
          newY = Math.max(30, Math.min(canvas.height - 30, newY))
        }

        return { ...node, x: newX, y: newY, vx: newVx, vy: newVy }
      })

      nodesRef.current = updatedNodes
      setNodes(updatedNodes)

      // Draw edges using current ref values
      edgesRef.current.forEach((edge) => {
        const sourceNode = nodesRef.current.find((n) => n.id === edge.source)
        const targetNode = nodesRef.current.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.strokeStyle = "rgba(66, 165, 245, 0.2)"
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      // Draw nodes using current ref values
      nodesRef.current.forEach((node) => {
        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35)
        gradient.addColorStop(0, `${node.color}40`)
        gradient.addColorStop(1, `${node.color}00`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, 35, 0, Math.PI * 2)
        ctx.fill()

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, 25, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()
        ctx.strokeStyle = `${node.color}80`
        ctx.lineWidth = 2
        ctx.stroke()

        // Label
        ctx.fillStyle = "#0a0a0a"
        ctx.font = "600 12px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.label, node.x, node.y)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    if (nodesRef.current.length > 0) {
      animate()
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, []) // Empty dependency array - only run once on mount

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-chart-3/5 blur-3xl" />
      <div className="relative rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm">
        <canvas ref={canvasRef} width={500} height={400} className="rounded-lg" />
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Your knowledge graph is forming...</p>
        </div>
      </div>
    </div>
  )
}
