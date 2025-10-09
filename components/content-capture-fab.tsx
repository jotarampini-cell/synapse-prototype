"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, FileText, LinkIcon, Upload, Mic, Sparkles } from "lucide-react"
import { createTextContent, createUrlContent } from "@/app/actions/content"
import { toast } from "sonner"

export function ContentCaptureFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"text" | "url" | "file" | "voice">("text")
  const [isRecording, setIsRecording] = useState(false)

  const tabs = [
    { id: "text" as const, label: "Texto", icon: FileText },
    { id: "url" as const, label: "URL", icon: LinkIcon },
    { id: "file" as const, label: "Archivo", icon: Upload },
    { id: "voice" as const, label: "Voz", icon: Mic },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    
    try {
      if (activeTab === "text") {
        await createTextContent(formData)
        toast.success("Contenido creado exitosamente")
      } else if (activeTab === "url") {
        await createUrlContent(formData)
        toast.success("URL procesada exitosamente")
      }
      setIsOpen(false)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear contenido")
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Implement voice recording logic
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="Añadir contenido"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="relative w-full max-w-2xl border-border bg-card p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-card-foreground">Añadir Contenido</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0 hover:bg-muted">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-border">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit}>
              {/* Text Input */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-card-foreground">
                      Título
                    </label>
                    <Input id="title" placeholder="Ingresa un título para tu contenido..." className="bg-background" />
                  </div>
                  <div>
                    <label htmlFor="content" className="mb-2 block text-sm font-medium text-card-foreground">
                      Contenido
                    </label>
                    <Textarea
                      id="content"
                      placeholder="Escribe o pega tu contenido aquí..."
                      rows={8}
                      className="resize-none bg-background"
                    />
                  </div>
                  <div>
                    <label htmlFor="tags" className="mb-2 block text-sm font-medium text-card-foreground">
                      Etiquetas
                    </label>
                    <Input id="tags" placeholder="AI, Machine Learning, Research..." className="bg-background" />
                    <p className="mt-1 text-xs text-muted-foreground">Separa las etiquetas con comas</p>
                  </div>
                </div>
              )}

              {/* URL Input */}
              {activeTab === "url" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="url" className="mb-2 block text-sm font-medium text-card-foreground">
                      URL
                    </label>
                    <Input id="url" type="url" placeholder="https://ejemplo.com/articulo" className="bg-background" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Synapse extraerá automáticamente el contenido y creará conexiones
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-card-foreground">Procesamiento AI</span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      El contenido será analizado automáticamente para extraer conceptos clave, generar resúmenes y
                      sugerir conexiones con tu base de conocimiento existente.
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {activeTab === "file" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Subir Archivo</label>
                    <div className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50">
                      <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-2 text-sm font-medium text-card-foreground">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD (máx. 10MB)</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      PDF
                    </Badge>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      Word
                    </Badge>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      Texto
                    </Badge>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      Markdown
                    </Badge>
                  </div>
                </div>
              )}

              {/* Voice Input */}
              {activeTab === "voice" && (
                <div className="space-y-4">
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-8">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                        isRecording
                          ? "animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/50"
                          : "bg-primary text-primary-foreground hover:scale-105"
                      }`}
                    >
                      <Mic className="h-10 w-10" />
                    </button>
                    <p className="mb-2 text-sm font-medium text-card-foreground">
                      {isRecording ? "Grabando..." : "Haz clic para comenzar a grabar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRecording ? "Haz clic nuevamente para detener" : "Tu voz será transcrita automáticamente"}
                    </p>
                  </div>
                  {isRecording && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-card-foreground">Transcripción en vivo</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        La transcripción aparecerá aquí en tiempo real...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Procesar con AI
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
