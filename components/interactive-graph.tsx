"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  label: string
  color: string
  size: number
  type: string
}

interface Edge {
  source: string
  target: string
  strength: number
}

interface InteractiveGraphProps {
  zoomLevel: number
  onNodeSelect: (nodeId: string | null) => void
}

export function InteractiveGraph({ zoomLevel, onNodeSelect }: InteractiveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)

  useEffect(() => {
    // Initialize a more complex graph
    const initialNodes: Node[] = [
      {
        id: "1",
        x: 400,
        y: 300,
        vx: 0.3,
        vy: 0.2,
        label: "Neural Networks",
        color: "#42a5f5",
        size: 35,
        type: "concept",
      },
      {
        id: "2",
        x: 600,
        y: 250,
        vx: -0.2,
        vy: 0.3,
        label: "Deep Learning",
        color: "#ab47bc",
        size: 40,
        type: "technique",
      },
      {
        id: "3",
        x: 500,
        y: 450,
        vx: 0.25,
        vy: -0.25,
        label: "Computer Vision",
        color: "#66bb6a",
        size: 30,
        type: "application",
      },
      {
        id: "4",
        x: 300,
        y: 400,
        vx: -0.3,
        vy: 0.15,
        label: "Machine Learning",
        color: "#ffa726",
        size: 45,
        type: "field",
      },
      { id: "5", x: 700, y: 400, vx: 0.15, vy: -0.3, label: "NLP", color: "#66bb6a", size: 32, type: "application" },
      {
        id: "6",
        x: 450,
        y: 200,
        vx: -0.25,
        vy: 0.25,
        label: "Transformers",
        color: "#ab47bc",
        size: 28,
        type: "technique",
      },
      { id: "7", x: 250, y: 250, vx: 0.2, vy: -0.2, label: "Data Science", color: "#ffa726", size: 38, type: "field" },
      { id: "8", x: 650, y: 150, vx: -0.15, vy: 0.35, label: "CNN", color: "#ab47bc", size: 25, type: "technique" },
      {
        id: "9",
        x: 350,
        y: 550,
        vx: 0.35,
        vy: -0.15,
        label: "Reinforcement Learning",
        color: "#42a5f5",
        size: 30,
        type: "concept",
      },
      { id: "10", x: 550, y: 350, vx: -0.2, vy: 0.2, label: "AI Ethics", color: "#ec407a", size: 28, type: "concept" },
    ]

    const initialEdges: Edge[] = [
      { source: "1", target: "2", strength: 0.9 },
      { source: "1", target: "3", strength: 0.8 },
      { source: "2", target: "3", strength: 0.7 },
      { source: "2", target: "5", strength: 0.75 },
      { source: "2", target: "6", strength: 0.85 },
      { source: "4", target: "1", strength: 0.95 },
      { source: "4", target: "2", strength: 0.9 },
      { source: "4", target: "7", strength: 0.8 },
      { source: "3", target: "8", strength: 0.85 },
      { source: "6", target: "5", strength: 0.9 },
      { source: "8", target: "2", strength: 0.8 },
      { source: "9", target: "4", strength: 0.75 },
      { source: "10", target: "2", strength: 0.6 },
      { source: "10", target: "4", strength: 0.65 },
    ]

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply zoom transform
      ctx.save()
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      ctx.translate(centerX, centerY)
      ctx.scale(zoomLevel, zoomLevel)
      ctx.translate(-centerX, -centerY)

      // Update node positions (only if not being dragged)
      if (!isDragging) {
        setNodes((prevNodes) => {
          return prevNodes.map((node) => {
            if (node.id === draggedNode) return node

            let newX = node.x + node.vx
            let newY = node.y + node.vy
            let newVx = node.vx
            let newVy = node.vy

            // Bounce off walls
            if (newX <= 50 || newX >= canvas.width - 50) {
              newVx = -newVx
              newX = Math.max(50, Math.min(canvas.width - 50, newX))
            }
            if (newY <= 50 || newY >= canvas.height - 50) {
              newVy = -newVy
              newY = Math.max(50, Math.min(canvas.height - 50, newY))
            }

            // Apply slight attraction to center
            const centerForceX = (centerX - newX) * 0.0001
            const centerForceY = (centerY - newY) * 0.0001
            newVx += centerForceX
            newVy += centerForceY

            // Apply damping
            newVx *= 0.99
            newVy *= 0.99

            return { ...node, x: newX, y: newY, vx: newVx, vy: newVy }
          })
        })
      }

      // Draw edges
      edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)

          const isConnectedToHovered = hoveredNode === sourceNode.id || hoveredNode === targetNode.id
          const isConnectedToSelected = selectedNode === sourceNode.id || selectedNode === targetNode.id

          if (isConnectedToHovered || isConnectedToSelected) {
            ctx.strokeStyle = `rgba(66, 165, 245, ${edge.strength * 0.6})`
            ctx.lineWidth = 3
          } else {
            ctx.strokeStyle = `rgba(66, 165, 245, ${edge.strength * 0.2})`
            ctx.lineWidth = 2
          }
          ctx.stroke()
        }
      })

      // Draw nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNode === node.id
        const isSelected = selectedNode === node.id

        // Outer glow
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size + 20)
          gradient.addColorStop(0, `${node.color}60`)
          gradient.addColorStop(1, `${node.color}00`)
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.size + 20, 0, Math.PI * 2)
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        // Border
        ctx.strokeStyle = isSelected ? "#ffffff" : `${node.color}80`
        ctx.lineWidth = isSelected ? 4 : 2
        ctx.stroke()

        // Label
        ctx.fillStyle = "#0a0a0a"
        ctx.font = `600 ${Math.max(10, node.size / 3)}px Inter, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.label, node.x, node.y)

        // Label background for better readability on hover
        if (isHovered || isSelected) {
          ctx.fillStyle = "rgba(10, 10, 10, 0.8)"
          ctx.font = "500 12px Inter, sans-serif"
          const textWidth = ctx.measureText(node.label).width
          ctx.fillRect(node.x - textWidth / 2 - 6, node.y + node.size + 8, textWidth + 12, 20)
          ctx.fillStyle = "#f8f9fa"
          ctx.fillText(node.label, node.x, node.y + node.size + 18)
        }
      })

      ctx.restore()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [nodes, edges, zoomLevel, hoveredNode, selectedNode, isDragging, draggedNode])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvas.width / 2) / zoomLevel + canvas.width / 2
    const y = (e.clientY - rect.top - canvas.height / 2) / zoomLevel + canvas.height / 2

    if (isDragging && draggedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) => (node.id === draggedNode ? { ...node, x, y, vx: 0, vy: 0 } : node)),
      )
      return
    }

    let foundNode: string | null = null
    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (distance < node.size) {
        foundNode = node.id
        break
      }
    }

    setHoveredNode(foundNode)
    canvas.style.cursor = foundNode ? "pointer" : "default"
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setIsDragging(true)
      setDraggedNode(hoveredNode)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedNode(null)
  }

  const handleClick = () => {
    if (hoveredNode && !isDragging) {
      setSelectedNode(hoveredNode)
      onNodeSelect(hoveredNode)
      const node = nodes.find((n) => n.id === hoveredNode)
      if (node) {
        console.log("[v0] Selected node:", node.label)
      }
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="rounded-lg bg-gradient-to-br from-background via-muted/5 to-background"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  )
}
