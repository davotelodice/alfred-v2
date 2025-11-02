'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  getSession: () => Promise<{ access_token: string; refresh_token: string } | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  getSession: async () => null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Sesión inicial:', session)
      setUser(session?.user ?? null)
      setLoading(false)
      setIsInitialized(true)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Cambio de autenticación:', event, session?.user?.id)
        setUser(session?.user ?? null)
        setLoading(false)

        // Solo redirigir si es un evento real de inicio/cierre de sesión
        // No redirigir en refrescos de token o cambios de sesión cuando ya estamos inicializados
        if (!isInitialized) {
          // Solo redirigir en la inicialización si el usuario está autenticado
          if (event === 'SIGNED_IN' && session?.user) {
            const currentPath = window.location.pathname
            // Solo redirigir si estamos en la página de auth
            if (currentPath === '/auth' || currentPath === '/') {
              router.push('/dashboard')
            }
          }
        } else {
          // Después de la inicialización, solo redirigir en eventos explícitos
          if (event === 'SIGNED_OUT') {
            router.push('/auth')
          }
          // No redirigir en SIGNED_IN después de la inicialización para evitar interrupciones
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, isInitialized])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, getSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
