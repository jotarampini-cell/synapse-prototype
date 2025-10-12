"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, X, FileText, Upload, Mic, Sparkles, Save, Brain, Calendar, Lightbulb, CheckCircle, BookOpen } from "lucide-react"
import { 
	createBasicTextContent, 
	createBasicFileContent, 
	createBasicVoiceContent,
	analyzeContentWithAI
} from "@/app/actions/content"
import { getFolderTree } from "@/app/actions/folders"
// Web Speech API se usa directamente en el componente
import { toast } from "sonner"

interface ContentCaptureFABProps {
	onContentSaved?: () => void
}

export function ContentCaptureFAB({ onContentSaved }: ContentCaptureFABProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"text" | "file" | "voice">("text")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [savedContentId, setSavedContentId] = useState<string | null>(null)
  const [transcription, setTranscription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string>("none")
  const [folders, setFolders] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [quickTemplate, setQuickTemplate] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const quickTemplates = [
    {
      id: 'meeting',
      name: 'Reunión',
      icon: <Calendar className="h-4 w-4" />,
      content: `# Reunión: 
Fecha: ${new Date().toLocaleDateString('es-ES')}
Participantes: 

## Agenda
- 

## Notas principales


## Acciones
- [ ] `
    },
    {
      id: 'idea',
      name: 'Idea',
      icon: <Lightbulb className="h-4 w-4" />,
      content: `# Idea: 

## Contexto


## Descripción


## Beneficios


## Próximos pasos
- [ ] `
    },
    {
      id: 'task',
      name: 'Tarea',
      icon: <CheckCircle className="h-4 w-4" />,
      content: `# Tarea: 

## Descripción


## Criterios de aceptación
- [ ] 
- [ ] 
- [ ] 

## Notas adicionales


## Fecha límite: `
    },
    {
      id: 'learning',
      name: 'Aprendizaje',
      icon: <BookOpen className="h-4 w-4" />,
      content: `# Aprendizaje: 

## Conceptos clave


## Ejemplos


## Aplicaciones prácticas


## Recursos adicionales
- 
- 

## Resumen personal

`
    }
  ]

  const tabs = [
    { id: "text" as const, label: "Texto", icon: FileText },
    { id: "file" as const, label: "Archivo", icon: Upload },
    { id: "voice" as const, label: "Voz", icon: Mic },
  ]

  // Cargar carpetas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadFolders()
    }
  }, [isOpen])

  const loadFolders = async () => {
    try {
      const folderTree = await getFolderTree()
      // Flatten the tree for the dropdown
      const flattenFolders = (folders: Folder[]): Folder[] => {
        const result: Folder[] = []
        folders.forEach(folder => {
          result.push({
            id: folder.id,
            name: folder.name,
            color: folder.color
          })
          if (folder.children) {
            result.push(...flattenFolders(folder.children))
          }
        })
        return result
      }
      setFolders(flattenFolders(folderTree))
    } catch (error) {
      console.error("Error loading folders:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validar que se haya seleccionado un archivo para el tab de archivo
      if (activeTab === "file" && !selectedFile) {
        toast.error("Por favor selecciona un archivo")
        setIsLoading(false)
        return
      }

      const formData = new FormData(e.currentTarget as HTMLFormElement)
      
      // Agregar folder_id al FormData
      if (selectedFolder && selectedFolder !== 'none') {
        formData.set('folder_id', selectedFolder)
      }
      
      let result

      console.log('Enviando formulario para:', activeTab)

      if (activeTab === "text") {
        result = await createBasicTextContent(formData)
        console.log('Resultado texto:', result)
      } else if (activeTab === "file") {
        result = await createBasicFileContent(formData)
        console.log('Resultado archivo:', result)
      } else if (activeTab === "voice") {
        formData.set('content', transcription)
        result = await createBasicVoiceContent(formData)
        console.log('Resultado voz:', result)
      }

      if (result?.contentId) {
        setSavedContentId(result.contentId)
        toast.success("¡Contenido guardado! Ahora puedes analizarlo con IA")
        // Llamar al callback para actualizar la lista de notas en el dashboard
        if (onContentSaved) {
          onContentSaved()
        }
        // Disparar evento para actualizar contadores y listas
        window.dispatchEvent(new CustomEvent('notesUpdated'))
      } else {
        console.error('No se recibió contentId del resultado:', result)
        toast.error("Error al guardar contenido. Verifica que el archivo no sea demasiado grande.")
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      const errorMessage = error instanceof Error ? error.message : "Error al guardar contenido"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeWithAI = async (analysisType: 'summary' | 'concepts' | 'connections' | 'all') => {
    if (!savedContentId) return

    setIsLoading(true)
    try {
      await analyzeContentWithAI(savedContentId, analysisType)
      toast.success(`Análisis de ${analysisType} completado`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al analizar contenido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error(`El archivo es demasiado grande. Máximo permitido: 5MB`)
        return
      }
      
      setSelectedFile(file)
      toast.success(`Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // Usar Web Speech API directamente para transcripción en tiempo real
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'es-ES'

          recognition.onstart = () => {
            setIsRecording(true)
            toast.success("Grabación iniciada")
          }

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcript
              } else {
                interimTranscript += transcript
              }
            }

            setTranscription(finalTranscript + interimTranscript)
          }

          recognition.onend = () => {
            setIsRecording(false)
            toast.success("Grabación detenida")
          }

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setIsRecording(false)
            console.error('Error en reconocimiento:', event.error)
            
            // Manejar diferentes tipos de errores
            let errorMessage = 'Error en reconocimiento'
            switch (event.error) {
              case 'aborted':
                errorMessage = 'Reconocimiento cancelado'
                break
              case 'audio-capture':
                errorMessage = 'Error al acceder al micrófono'
                break
              case 'network':
                errorMessage = 'Error de conexión'
                break
              case 'not-allowed':
                errorMessage = 'Permisos de micrófono denegados'
                break
              case 'no-speech':
                errorMessage = 'No se detectó habla'
                break
              case 'service-not-allowed':
                errorMessage = 'Servicio no permitido'
                break
              default:
                errorMessage = `Error: ${event.error}`
            }
            
            // Solo mostrar error si no es una cancelación intencional
            if (event.error !== 'aborted') {
              toast.error(errorMessage)
            }
          }

          recognition.start()
          mediaRecorderRef.current = recognition // Guardar referencia para poder detenerlo
        } else {
          // Web Speech API no está disponible, mostrar mensaje
          toast.error("Web Speech API no está disponible en este navegador. Usa Chrome o Edge para mejor compatibilidad.")
          return
        }
      } catch (error) {
        console.error('Error al acceder al micrófono:', error)
        toast.error("Error al acceder al micrófono. Verifica los permisos.")
      }
    } else {
      // Detener grabación
      if (mediaRecorderRef.current) {
        try {
          if (typeof mediaRecorderRef.current.stop === 'function') {
            mediaRecorderRef.current.stop()
          } else if (typeof mediaRecorderRef.current.abort === 'function') {
            mediaRecorderRef.current.abort()
          }
          setIsRecording(false)
          toast.success("Grabación detenida")
        } catch (error) {
          console.log('Grabación detenida correctamente')
          setIsRecording(false)
        }
      }
    }
  }


  const resetForm = () => {
    setSavedContentId(null)
    setTranscription("")
    setSelectedFile(null)
    setSelectedFolder("none")
    setQuickTemplate(null)
    setIsRecording(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const closeModal = () => {
    setIsOpen(false)
    resetForm()
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-border bg-card p-6 shadow-2xl">
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
              {/* Quick Templates */}
              {activeTab === "text" && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-card-foreground">
                    Plantillas rápidas (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickTemplates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant={quickTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setQuickTemplate(quickTemplate === template.id ? null : template.id)
                        }}
                        className="justify-start gap-2 h-auto p-3"
                      >
                        {template.icon}
                        <span className="text-xs">{template.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Input */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-card-foreground">
                      Título *
                    </label>
                    <Input 
                      id="title" 
                      name="title"
                      placeholder="Ingresa un título para tu contenido..." 
                      className="bg-background" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="content" className="mb-2 block text-sm font-medium text-card-foreground">
                      Contenido *
                    </label>
                    <Textarea
                      id="content"
                      name="content"
                      placeholder="Escribe o pega tu contenido aquí..."
                      rows={8}
                      className="resize-none bg-background"
                      required
                      value={quickTemplate ? quickTemplates.find(t => t.id === quickTemplate)?.content || '' : ''}
                      onChange={(e) => {
                        // Allow manual editing even when template is selected
                        if (quickTemplate) {
                          setQuickTemplate(null) // Clear template selection when user edits
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="tags" className="mb-2 block text-sm font-medium text-card-foreground">
                      Etiquetas
                    </label>
                    <Input 
                      id="tags" 
                      name="tags"
                      placeholder="AI, Machine Learning, Research..." 
                      className="bg-background" 
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Separa las etiquetas con comas</p>
                  </div>
                  <div>
                    <Label htmlFor="folder" className="text-sm font-medium text-card-foreground">
                      Carpeta (opcional)
                    </Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Inbox (por defecto)</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: folder.color }}
                              />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Si no seleccionas una carpeta, se guardará en Inbox</p>
                  </div>
                </div>
              )}


              {/* File Upload */}
              {activeTab === "file" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-card-foreground">
                      Título (opcional)
                    </label>
                    <Input 
                      id="title" 
                      name="title"
                      placeholder="Título para el archivo..." 
                      className="bg-background" 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-card-foreground">Subir Archivo *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.docx,.txt,.md,.doc"
                    />
                    {selectedFile ? (
                      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-solid border-primary bg-primary/5 p-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                          <FileText className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <p className="mb-2 text-sm font-medium text-foreground">
                          Archivo seleccionado
                        </p>
                        <p className="mb-4 text-xs text-muted-foreground">{selectedFile.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          className="hover:bg-accent hover:text-accent-foreground"
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
                      >
                        <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-sm font-medium text-card-foreground">
                          Arrastra archivos aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD (máx. 5MB)</p>
                      </div>
                    )}
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
                  <div>
                    <Label htmlFor="folder" className="text-sm font-medium text-card-foreground">
                      Carpeta (opcional)
                    </Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Inbox (por defecto)</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: folder.color }}
                              />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Si no seleccionas una carpeta, se guardará en Inbox</p>
                  </div>
                </div>
              )}

              {/* Voice Input */}
              {activeTab === "voice" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-card-foreground">
                      Título *
                    </label>
                    <Input 
                      id="title" 
                      name="title"
                      placeholder="Título para tu nota de voz..." 
                      className="bg-background" 
                      required 
                    />
                  </div>
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
                  {(transcription || isRecording) && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                        <span className="text-sm font-medium text-card-foreground">
                          {isRecording ? 'Transcribiendo...' : 'Transcripción'}
                        </span>
                        {isLoading && (
                          <div className="ml-auto">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                      
                      {isRecording && !transcription && (
                        <p className="text-sm text-muted-foreground italic">
                          Habla ahora... La transcripción aparecerá aquí en tiempo real.
                        </p>
                      )}
                      
                      {transcription && (
                        <>
                          <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                            {transcription}
                          </p>
                          {!isRecording && (
                            <div className="mt-2">
                              <Textarea
                                value={transcription}
                                onChange={(e) => setTranscription(e.target.value)}
                                placeholder="Edita la transcripción si es necesario..."
                                rows={3}
                                className="resize-none bg-background text-sm"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="folder" className="text-sm font-medium text-card-foreground">
                      Carpeta (opcional)
                    </Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Inbox (por defecto)</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: folder.color }}
                              />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Si no seleccionas una carpeta, se guardará en Inbox</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-4">
                {!savedContentId ? (
                  <div className="flex items-center justify-between gap-4">
                    <Button type="button" variant="outline" onClick={closeModal} className="bg-transparent">
                  Cancelar
                </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                      <Save className="h-4 w-4" />
                      {isLoading ? "Guardando..." : "Guardar Contenido"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">¡Contenido guardado exitosamente!</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ahora puedes analizarlo con IA o crear más contenido
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-card-foreground">Análisis con IA</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAnalyzeWithAI('summary')}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Brain className="h-4 w-4" />
                          Resumen
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAnalyzeWithAI('concepts')}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Brain className="h-4 w-4" />
                          Conceptos
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAnalyzeWithAI('connections')}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Brain className="h-4 w-4" />
                          Conexiones
                        </Button>
                        <Button 
                          type="button" 
                          variant="default" 
                          size="sm"
                          onClick={() => handleAnalyzeWithAI('all')}
                          disabled={isLoading}
                          className="gap-2"
                        >
                  <Sparkles className="h-4 w-4" />
                          Análisis Completo
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <Button type="button" variant="outline" onClick={closeModal} className="bg-transparent">
                        Cerrar
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo Contenido
                </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}

