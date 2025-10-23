'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, TrendingUp, Smartphone, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a auth después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/auth')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Calculator className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Asistente Contable Inteligente</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Gestiona tus finanzas personales de manera inteligente con automatización via Telegram
          </p>
                  <Button 
                    onClick={() => router.push('/auth')}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Comenzar
                  </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">KPIs Automáticos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Métricas financieras calculadas automáticamente con cada transacción
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Telegram Bot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Registra transacciones directamente desde Telegram via n8n
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Recomendaciones IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Consejos inteligentes basados en tus patrones de gasto
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calculator className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Dashboard Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Visualiza tus finanzas con gráficos y análisis detallados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sistema funcionando correctamente
          </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Redirigiendo a la página de inicio en unos segundos...
                  </p>
        </div>
      </div>
    </div>
  )
}
