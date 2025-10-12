"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Database, 
  Key, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Download
} from "lucide-react"
import { useAppConfig } from "@/hooks/use-app-config"
import { toast } from "sonner"

export default function SetupPage() {
  const { config } = useAppConfig()
  const [envContent, setEnvContent] = useState("")

  const generateEnvContent = () => {
    const content = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Gemini API Configuration (YA CONFIGURADO)
GEMINI_API_KEY=AIzaSyAbJ2-IRbdX7OarBEb-N2UOcR64PVLaHE0

# URL del sitio
NEXT_PUBLIC_SITE_URL=https://synapse-ai.vercel.app`
    
    setEnvContent(content)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envContent)
    toast.success("Contenido copiado al portapapeles")
  }

  const downloadEnvFile = () => {
    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env.local'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Archivo .env.local descargado")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Configuración de Synapse
          </h1>
          <p className="text-lg text-muted-foreground">
            Configura tu aplicación para usar todas las funcionalidades
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase
                {config.isSupabaseConfigured ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    No configurado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Base de datos y autenticación
              </p>
              {!config.isSupabaseConfigured && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com', '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Crear proyecto
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gemini AI
                {config.isGeminiConfigured ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    No configurado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Procesamiento de IA y análisis
              </p>
              {config.isGeminiConfigured && (
                <p className="text-xs text-green-600">
                  ✅ API Key configurada correctamente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuración Paso a Paso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Supabase */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Crear proyecto en Supabase
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <ol className="text-sm space-y-2">
                  <li>1. Ve a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
                  <li>2. Crea una cuenta o inicia sesión</li>
                  <li>3. Haz clic en &quot;New Project&quot;</li>
                  <li>4. Nombre del proyecto: <code className="bg-muted px-2 py-1 rounded">SynapseAI</code></li>
                  <li>5. Elige una región cercana</li>
                  <li>6. Crea el proyecto</li>
                </ol>
              </div>
            </div>

            {/* Step 2: Get Credentials */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                Obtener credenciales
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <ol className="text-sm space-y-2">
                  <li>1. En tu proyecto, ve a <strong>Settings → API</strong></li>
                  <li>2. Copia estos valores:</li>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Project URL</strong> (NEXT_PUBLIC_SUPABASE_URL)</li>
                    <li>• <strong>anon public</strong> key (NEXT_PUBLIC_SUPABASE_ANON_KEY)</li>
                    <li>• <strong>service_role</strong> key (SUPABASE_SERVICE_ROLE_KEY)</li>
                  </ul>
                </ol>
              </div>
            </div>

            {/* Step 3: Database Setup */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Configurar base de datos
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <ol className="text-sm space-y-2">
                  <li>1. Ve al <strong>SQL Editor</strong> en Supabase</li>
                  <li>2. Haz clic en &quot;New query&quot;</li>
                  <li>3. Copia y pega el contenido de <code className="bg-muted px-2 py-1 rounded">database/install_complete_schema.sql</code></li>
                  <li>4. Haz clic en &quot;Run&quot; para ejecutar el esquema</li>
                  <li>5. Habilita la extensión <strong>vector</strong> en Settings → Database → Extensions</li>
                </ol>
              </div>
            </div>

            {/* Step 4: Environment File */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                Crear archivo .env.local
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={generateEnvContent} variant="outline" size="sm">
                    Generar contenido
                  </Button>
                  {envContent && (
                    <>
                      <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                      <Button onClick={downloadEnvFile} variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                    </>
                  )}
                </div>
                
                {envContent && (
                  <Textarea
                    value={envContent}
                    onChange={(e) => setEnvContent(e.target.value)}
                    className="font-mono text-sm"
                    rows={10}
                    placeholder="Contenido del archivo .env.local..."
                  />
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instrucciones:</strong>
                  </p>
                  <ol className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>1. Reemplaza los valores de placeholder con tus credenciales reales</li>
                    <li>2. Guarda el archivo como <code>.env.local</code> en la raíz del proyecto</li>
                    <li>3. Reinicia la aplicación con <code>npm run dev</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Modo de la aplicación:</span>
                <Badge variant={config.mode === 'production' ? 'default' : config.mode === 'demo' ? 'secondary' : 'outline'}>
                  {config.mode === 'production' ? 'Producción' : config.mode === 'demo' ? 'Demo' : 'Configuración'}
                </Badge>
              </div>
              
              {config.mode === 'demo' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Modo Demo:</strong> La aplicación funciona con datos simulados. 
                    Para usar todas las funcionalidades, completa la configuración de Supabase.
                  </p>
                </div>
              )}
              
              {config.mode === 'production' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Modo Producción:</strong> Todas las funcionalidades están disponibles.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
