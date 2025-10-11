"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        console.log('Auth check:', { supabaseUrl, supabaseAnonKey })

        // Si Supabase no está configurado, usar modo demo inmediatamente
        if (!supabaseUrl || !supabaseAnonKey || 
            supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined' ||
            supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
          
          console.log('Using demo mode')
          setUser({
            id: 'demo-user',
            email: 'demo@synapse.ai',
            user_metadata: {
              full_name: 'Usuario Demo'
            }
          } as User)
          setLoading(false)
          return
        }

        console.log('Using Supabase auth')
        const supabase = createClient()

        // Obtener usuario inicial
        const getUser = async () => {
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) {
              console.warn('Error obteniendo usuario:', error.message)
            }
            setUser(user)
          } catch (error) {
            console.warn('Error en autenticación:', error)
          } finally {
            setLoading(false)
          }
        }

        // Timeout de seguridad
        const timeout = setTimeout(() => {
          console.warn('Timeout en autenticación. Continuando sin usuario.')
          setLoading(false)
        }, 5000)

        getUser()

        // Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
            clearTimeout(timeout)
          }
        )

        return () => {
          subscription.unsubscribe()
          clearTimeout(timeout)
        }
      } catch (error) {
        console.error('Error in auth check:', error)
        // En caso de error, usar modo demo
        setUser({
          id: 'demo-user',
          email: 'demo@synapse.ai',
          user_metadata: {
            full_name: 'Usuario Demo'
          }
        } as User)
        setLoading(false)
      }
    }

    // Pequeño delay para asegurar que las variables estén disponibles
    const timeout = setTimeout(checkAuth, 100)
    
    return () => clearTimeout(timeout)
  }, [])

  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  return { user, loading, isDemoMode }
}




