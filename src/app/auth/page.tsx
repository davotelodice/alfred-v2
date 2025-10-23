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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      setSuccess('Inicio de sesión exitoso')
      router.push('/dashboard')
    } catch (error: any) {
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
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      if (authData.user) {
        // Crear perfil en nuestra tabla contable_users
        const { error: profileError } = await supabase
          .from('contable_users')
          .insert({
            id: authData.user.id,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono
          })

        if (profileError) {
          console.error('Error creando perfil:', profileError)
          // No lanzamos error aquí porque el usuario ya se creó en auth
        }

        setSuccess('Cuenta creada exitosamente. Revisa tu email para confirmar.')
      }
    } catch (error: any) {
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
