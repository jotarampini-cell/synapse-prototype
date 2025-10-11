"use client"

import { useState, useEffect } from 'react'

export interface AppConfig {
  isSupabaseConfigured: boolean
  isGeminiConfigured: boolean
  hasValidCredentials: boolean
  mode: 'production' | 'demo' | 'setup'
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>({
    isSupabaseConfigured: false,
    isGeminiConfigured: false,
    hasValidCredentials: false,
    mode: 'setup'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkConfiguration = () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const geminiApiKey = process.env.GEMINI_API_KEY

        console.log('Config check:', { supabaseUrl, supabaseAnonKey, geminiApiKey })

        const isSupabaseConfigured = !!(
          supabaseUrl && 
          supabaseAnonKey && 
          supabaseUrl !== 'undefined' &&
          supabaseAnonKey !== 'undefined' &&
          !supabaseUrl.includes('placeholder') &&
          !supabaseAnonKey.includes('placeholder')
        )

        const isGeminiConfigured = !!(
          geminiApiKey && 
          geminiApiKey !== 'undefined' &&
          !geminiApiKey.includes('placeholder')
        )

        const hasValidCredentials = isSupabaseConfigured && isGeminiConfigured

        let mode: 'production' | 'demo' | 'setup' = 'setup'
        if (hasValidCredentials) {
          mode = 'production'
        } else if (isGeminiConfigured) {
          mode = 'demo'
        }

        console.log('Config result:', { isSupabaseConfigured, isGeminiConfigured, hasValidCredentials, mode })

        setConfig({
          isSupabaseConfigured,
          isGeminiConfigured,
          hasValidCredentials,
          mode
        })
      } catch (error) {
        console.error('Error checking configuration:', error)
        // En caso de error, usar modo demo por defecto
        setConfig({
          isSupabaseConfigured: false,
          isGeminiConfigured: true, // Gemini está configurado por defecto
          hasValidCredentials: false,
          mode: 'demo'
        })
      } finally {
        setLoading(false)
      }
    }

    // Pequeño delay para asegurar que las variables de entorno estén disponibles
    const timeout = setTimeout(checkConfiguration, 100)
    
    return () => clearTimeout(timeout)
  }, [])

  return { config, loading }
}
