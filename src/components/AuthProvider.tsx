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

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Sesión inicial:', session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Cambio de autenticación:', event, session?.user?.id)
        setUser(session?.user ?? null)
        setLoading(false)

        // SOLO redirigir en SIGNED_OUT explícito
        // NO redirigir en SIGNED_IN, TOKEN_REFRESHED u otros eventos
        if (event === 'SIGNED_OUT') {
          const currentPath = window.location.pathname
          // Solo redirigir a auth si no estamos ya ahí
          if (currentPath !== '/auth' && currentPath !== '/') {
            router.push('/auth')
          }
        }
        // Eliminamos completamente la redirección automática en SIGNED_IN
        // El usuario debe navegar manualmente o usar los botones de la aplicación
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

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
