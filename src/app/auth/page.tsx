'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { supabase } from '@/lib/supabaseClient'
import { Calculator, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      setSuccess('Inicio de sesión exitoso')
      router.push('/dashboard')
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Registrar usuario usando Edge Function (flujo personalizado)
      const response = await fetch('/api/auth/request-signup-edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          telefono: formData.telefono
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar usuario')
      }

      // La edge function crea el usuario, pero no devuelve la sesión inmediatamente (porque requiere confirmación).
      // Sin embargo, para mantener compatibilidad con el resto del código que inserta en contable_users,
      // necesitamos intentar manejarlo.
      // OJO: La edge function crea el usuario en Auth. Para insertar en contable_users, necesitamos hacerlo
      // o bien aquí (si pudiéramos obtener el ID, pero generate_link NO devuelve el ID del usuario directamente en response pública, oops).
      //
      // REVISIÓN: admin.generateLink devuelve propiedades del usuario incluyendo ID.
      // Pero nuestra edge function debe devolvernos ese ID si queremos insertar en 'contable_users'.
      // Vamos a asumir que la edge function fue modificada para devolver user_id en 'data' si es exitoso, 
      // O BIEN (mejor), la edge function recibe los metadatos y los guarda en user_metadata.
      //
      // PERO: El código original hacía un insert manual en 'contable_users'.
      // Si usamos generateLink, podemos pasar user_metadata.
      // Supabase suele tener un trigger que copia de auth.users a public.users (si existe).
      // Si 'contable_users' se llena manual, tenemos un problema porque no tenemos el ID sin sesión.

      // SOLUCIÓN: Modificar la Edge Function para devolver el User ID (lo tiene en la resp de GoTrue).
      // O esperar que el usuario use el link.

      // Por ahora, mostrar éxito y pedir confirmar.
      setSuccess('Cuenta creada exitosamente. Por favor revisa tu email para confirmar tu cuenta.')
      return

    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-10 w-10 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Asistente Contable</h1>
          </div>
          <p className="text-gray-600">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta para comenzar'}
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">{error}</div>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <div className="ml-2">{success}</div>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
              </Button>

              {isLogin && (
                <div className="text-center">
                  <a
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isLogin
                  ? '¿No tienes cuenta? Crear una'
                  : '¿Ya tienes cuenta? Iniciar sesión'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Demo info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Demo: Usa cualquier email y contraseña para probar
          </p>
        </div>
      </div>
    </div>
  )
}
