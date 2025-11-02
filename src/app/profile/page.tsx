'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { User, Mail, Phone, MessageSquare, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: authLoading, getSession } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [profileData, setProfileData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    telegram_chat_id: ''
  })

  useEffect(() => {
    // Esperar a que la autenticación termine de cargar completamente
    if (authLoading) {
      return
    }

    // Solo redirigir si realmente no hay usuario DESPUÉS de que termine la carga
    // No redirigir si el usuario es null temporalmente durante un refresh de token
    if (!user && !authLoading) {
      // Agregar un pequeño delay para asegurarnos de que no es un cambio temporal
      const timeoutId = setTimeout(() => {
        // Verificar de nuevo después del delay - usar getSession para verificar sesión real
        getSession().then((session) => {
          if (!session && !authLoading) {
            router.push('/auth')
          }
        })
      }, 1000) // 1 segundo de delay

      return () => clearTimeout(timeoutId)
    }
    
    // Cargar perfil solo si hay usuario y no está cargando
    if (user && !authLoading) {
      loadProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const session = await getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Usar API route que maneja RLS correctamente
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar el perfil')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setProfileData({
          nombre: result.data.nombre || '',
          email: result.data.email || user.email || '',
          telefono: result.data.telefono || '',
          telegram_chat_id: result.data.telegram_chat_id || ''
        })
      } else {
        // Si aún no hay perfil, usar datos del usuario autenticado
        setProfileData({
          nombre: user.email?.split('@')[0] || '',
          email: user.email || '',
          telefono: '',
          telegram_chat_id: ''
        })
      }
    } catch (err) {
      const error = err as Error
      setError(error.message || 'Error al cargar el perfil')
      console.error('Error al cargar perfil:', error)
      
      // Aún así, intentar cargar datos básicos del usuario autenticado
      if (user) {
        setProfileData({
          nombre: user.email?.split('@')[0] || '',
          email: user.email || '',
          telefono: '',
          telegram_chat_id: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const session = await getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Validar que telegram_chat_id no esté vacío si se intenta guardar
      if (profileData.telegram_chat_id.trim() === '') {
        throw new Error('El ID de Chat de Telegram es requerido para vincular tu cuenta')
      }

      // Usar API route que maneja RLS correctamente
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nombre: profileData.nombre,
          email: profileData.email,
          telefono: profileData.telefono,
          telegram_chat_id: profileData.telegram_chat_id.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el perfil')
      }

      const result = await response.json()
      
      if (result.success) {
        setSuccess('¡Perfil actualizado exitosamente!')
        
        // Recargar perfil
        await loadProfile()
      } else {
        throw new Error(result.error || 'Error al guardar el perfil')
      }
    } catch (err) {
      const error = err as Error
      setError(error.message || 'Error al guardar el perfil')
      console.error('Error al guardar perfil:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRevealId = () => {
    // Abrir el bot de Telegram directamente
    window.open('https://t.me/id_chat_alfred_bot', '_blank')
  }

  // Mostrar loading mientras se carga la autenticación o el perfil
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal y vincula tu Telegram</p>
      </div>

      {/* Alerta de error */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">{error}</div>
        </Alert>
      )}

      {/* Alerta de éxito */}
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <div className="ml-2">{success}</div>
        </Alert>
      )}

      {/* Formulario de perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="nombre"
                type="text"
                placeholder="Tu nombre completo"
                value={profileData.nombre}
                onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                value={profileData.telefono}
                onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Telegram Chat ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="telegram_chat_id">
                ID de Chat de Telegram <Badge variant="destructive" className="ml-2">Requerido</Badge>
              </Label>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="telegram_chat_id"
                  type="text"
                  placeholder="123456789"
                  value={profileData.telegram_chat_id}
                  onChange={(e) => setProfileData({ ...profileData, telegram_chat_id: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              {/* Botón Revelar ID */}
              <Button
                type="button"
                variant="outline"
                onClick={handleRevealId}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Revelar ID
              </Button>

              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">📱 Cómo obtener tu ID de Chat:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Haz clic en el botón &quot;Revelar ID&quot; de arriba</li>
                  <li>Se abrirá el bot de Telegram (@id_chat_alfred_bot)</li>
                  <li>Presiona el botón <strong>&quot;START&quot;</strong> en el chat</li>
                  <li>Copia el ID que te proporciona el bot</li>
                  <li>Pega el ID en el campo de arriba y guarda</li>
                </ol>
                <p className="mt-2 font-medium">⚠️ Importante: Este ID es necesario para vincular tu cuenta de Telegram con el sistema y recibir tus transacciones.</p>
              </div>

              {profileData.telegram_chat_id && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">ID configurado: {profileData.telegram_chat_id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !profileData.telegram_chat_id.trim()}
              className="flex-1"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Volver al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

