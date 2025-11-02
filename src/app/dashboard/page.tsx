'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  BarChart3,
  Lightbulb,
  LogOut,
  User,
  Edit
} from 'lucide-react'
import { 
  getUserTransactions, 
  getUserKPIs, 
  getUserAdvice, 
  createTransaction,
  markAdviceAsRead,
  getCurrentPeriod,
  getAvailablePeriods
} from '@/lib/database'
import { useAuth } from '@/components/AuthProvider'
import type { ContableTransaction, ContableKPISummary, ContableAdvice } from '@/lib/types'

export default function DashboardPage() {
  const { user, signOut, getSession } = useAuth()
  const [transactions, setTransactions] = useState<ContableTransaction[]>([])
  const [kpis, setKpis] = useState<ContableKPISummary[]>([])
  const [advice, setAdvice] = useState<ContableAdvice[]>([])
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod())
  const [isLoading, setIsLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ContableTransaction | null>(null)
  const [transactionForm, setTransactionForm] = useState({
    tipo: 'gasto' as 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  })
  const [editForm, setEditForm] = useState({
    tipo: 'gasto' as 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia',
    monto: '',
    descripcion: '',
    fecha: ''
  })

  // Debug: Log del estado del formulario
  useEffect(() => {
    console.log('Estado del formulario:', transactionForm)
  }, [transactionForm])

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadTransactions(),
        loadKPIs(),
        loadAdvice(),
        loadAvailablePeriods()
      ])
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await getUserTransactions({ 
        periodo: selectedPeriod, // Corregido: period -> periodo
        limit: 50 
      })
      setTransactions(data || [])
      console.log(`[Dashboard] Cargadas ${data?.length || 0} transacciones para período ${selectedPeriod}`)
    } catch (error) {
      console.error('Error al cargar transacciones:', error)
    }
  }

  const loadKPIs = async () => {
    try {
      const data = await getUserKPIs(selectedPeriod)
      setKpis(data || [])
    } catch (error) {
      console.error('Error al cargar KPIs:', error)
    }
  }

  const loadAdvice = async () => {
    try {
      const data = await getUserAdvice()
      setAdvice(data || [])
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error)
    }
  }

  const loadAvailablePeriods = async () => {
    try {
      const data = await getAvailablePeriods()
      setAvailablePeriods(data || [])
    } catch (error) {
      console.error('Error al cargar períodos:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
  }

  const handleSaveTransaction = async () => {
    try {
      console.log('Usuario actual:', user)
      console.log('Datos del formulario:', transactionForm)
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }
      
      if (!transactionForm.monto || !transactionForm.descripcion) {
        alert('Por favor completa todos los campos obligatorios')
        return
      }
      
      const transactionData = {
        tipo: transactionForm.tipo,
        monto: parseFloat(transactionForm.monto),
        descripcion: transactionForm.descripcion,
        fecha: transactionForm.fecha
      }
      
      console.log('Datos a enviar:', transactionData)
      
      // Usar función directa del frontend (con RLS)
      await createTransaction({
        user_id: user.id,
        ...transactionData
      })
      await loadTransactions() // Recargar transacciones
      await loadKPIs() // Recargar KPIs (se actualizarán automáticamente por triggers)
      
      // Resetear formulario
      setTransactionForm({
        tipo: 'gasto',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
      })
      setShowTransactionForm(false)
      
      alert('¡Transacción guardada exitosamente!')
    } catch (err) {
      const error = err as Error
      console.error('Error al guardar transacción:', error)
      alert(`Error al guardar la transacción: ${error.message || 'Error desconocido'}`)
    }
  }

  const handleMarkAdviceAsRead = async (adviceId: string) => {
    try {
      await markAdviceAsRead(adviceId)
      await loadAdvice() // Recargar recomendaciones
    } catch (error) {
      console.error('Error al marcar recomendación como leída:', error)
    }
  }

  const handleEditTransaction = (transaction: ContableTransaction) => {
    setEditingTransaction(transaction)
    setEditForm({
      tipo: transaction.tipo,
      monto: transaction.monto.toString(),
      descripcion: transaction.descripcion || '',
      fecha: transaction.fecha
    })
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setEditForm({
      tipo: 'gasto',
      monto: '',
      descripcion: '',
      fecha: ''
    })
  }

  const handleUpdateTransaction = async () => {
    try {
      if (!editingTransaction) return
      if (!user) {
        alert('Usuario no autenticado')
        return
      }

      if (!editForm.monto || !editForm.descripcion) {
        alert('Por favor completa todos los campos obligatorios')
        return
      }

      // Obtener token de sesión
      const session = await getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Llamar al API para actualizar
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: editForm.tipo,
          monto: parseFloat(editForm.monto),
          descripcion: editForm.descripcion,
          fecha: editForm.fecha
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar transacción')
      }

      await loadTransactions()
      await loadKPIs()
      setEditingTransaction(null)
      setEditForm({
        tipo: 'gasto',
        monto: '',
        descripcion: '',
        fecha: ''
      })

      alert('¡Transacción actualizada exitosamente!')
    } catch (err) {
      const error = err as Error
      console.error('Error al actualizar transacción:', error)
      alert(`Error al actualizar la transacción: ${error.message || 'Error desconocido'}`)
    }
  }

  const handleGenerateAdvice = async () => {
    try {
      setIsGeneratingAdvice(true)

      if (!user) {
        alert('Usuario no autenticado')
        return
      }

      // Obtener token de sesión
      const session = await getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Llamar al endpoint para generar consejos
      console.log('[Dashboard] Generando consejos para período:', selectedPeriod)
      console.log('[Dashboard] Usuario:', user.id)
      
      const response = await fetch('/api/advice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          periodo: selectedPeriod
        })
      })
      
      console.log('[Dashboard] Respuesta recibida:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar consejos')
      }

      const data = await response.json()
      console.log('Consejos generados:', data)

      // Recargar consejos
      await loadAdvice()

      alert(`¡Se generaron ${data.data?.saved || 0} consejos financieros!`)
    } catch (err) {
      const error = err as Error
      console.error('Error al generar consejos:', error)
      alert(`Error al generar consejos: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsGeneratingAdvice(false)
    }
  }

  const currentKPI = kpis.find(kpi => kpi.periodo === selectedPeriod)
  const unreadAdviceCount = advice.filter(item => !item.leido).length
  const criticalAdviceCount = advice.filter(item => item.prioridad === 'critica' && !item.leido).length

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Contable</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus finanzas personales de manera inteligente
          </p>
          {user && (
            <div className="flex items-center gap-2 mt-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector de período */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availablePeriods.map(period => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button 
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </Button>

          <Button 
            onClick={signOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Alertas importantes */}
      {criticalAdviceCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  Tienes {criticalAdviceCount} recomendación{criticalAdviceCount > 1 ? 'es' : ''} crítica{criticalAdviceCount > 1 ? 's' : ''} sin leer
                </p>
                <p className="text-sm text-red-600">
                  Revisa las recomendaciones para optimizar tus finanzas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs del período actual */}
      {currentKPI && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Métricas del Período {selectedPeriod}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  €{currentKPI.ingreso_total.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  €{currentKPI.gasto_total.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${currentKPI.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{currentKPI.balance.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">% Ahorro</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {currentKPI.porcentaje_ahorro?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Transacciones y Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de Transacciones */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Transacciones Recientes</h2>
            <Badge variant="secondary">{transactions.length}</Badge>
          </div>
          <Card>
            <CardContent className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay transacciones para este período</p>
                  <Button onClick={() => setShowTransactionForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Transacción
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingTransaction?.id === transaction.id ? (
                        // Formulario de edición
                        <div className="w-full space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Tipo</label>
                            <select
                              className="w-full p-1 border rounded text-sm"
                              value={editForm.tipo}
                              onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia' })}
                            >
                              <option value="ingreso">Ingreso</option>
                              <option value="gasto">Gasto</option>
                              <option value="ahorro">Ahorro</option>
                              <option value="inversion">Inversión</option>
                              <option value="transferencia">Transferencia</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Monto *</label>
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-sm"
                              placeholder="0.00"
                              value={editForm.monto}
                              onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Descripción *</label>
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-sm"
                              placeholder="Descripción"
                              value={editForm.descripcion}
                              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Fecha</label>
                            <input
                              type="date"
                              className="w-full p-1 border rounded text-sm"
                              value={editForm.fecha}
                              onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={handleUpdateTransaction}
                              size="sm"
                              className="flex-1"
                            >
                              Guardar
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Vista normal
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{transaction.descripcion || 'Sin descripción'}</p>
                            <p className="text-sm text-gray-500">{transaction.fecha}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`font-bold ${transaction.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.tipo === 'ingreso' ? '+' : '-'}€{transaction.monto.toFixed(2)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.tipo}
                              </Badge>
                            </div>
                            <Button
                              onClick={() => handleEditTransaction(transaction)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Panel de Recomendaciones */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Recomendaciones</h2>
              {unreadAdviceCount > 0 && (
                <Badge variant="destructive">{unreadAdviceCount}</Badge>
              )}
            </div>
            <Button
              onClick={handleGenerateAdvice}
              disabled={isGeneratingAdvice}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isGeneratingAdvice ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  Solicitar Consejos IA
                </>
              )}
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              {advice.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay recomendaciones disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {advice.slice(0, 5).map((item) => (
                    <div key={item.id} className={`p-3 border rounded-lg ${!item.leido ? 'bg-blue-50 border-blue-200' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.mensaje}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.fecha}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={item.prioridad === 'critica' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {item.prioridad}
                          </Badge>
                          {!item.leido && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAdviceAsRead(item.id)}
                            >
                              Marcar leído
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Formulario de Transacción */}
      {showTransactionForm && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <CardTitle>Nueva Transacción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={transactionForm.tipo}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, tipo: e.target.value as 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia' }))}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                  <option value="ahorro">Ahorro</option>
                  <option value="inversion">Inversión</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto *</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="0.00" 
                  value={transactionForm.monto}
                  onChange={(e) => {
                    console.log('Cambiando monto:', e.target.value)
                    setTransactionForm(prev => ({ ...prev, monto: e.target.value }))
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="Descripción de la transacción" 
                  value={transactionForm.descripcion}
                  onChange={(e) => {
                    console.log('Cambiando descripción:', e.target.value)
                    setTransactionForm(prev => ({ ...prev, descripcion: e.target.value }))
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-md" 
                  value={transactionForm.fecha}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowTransactionForm(false)
                    setTransactionForm({
                      tipo: 'gasto',
                      monto: '',
                      descripcion: '',
                      fecha: new Date().toISOString().split('T')[0]
                    })
                  }} 
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveTransaction}>
                  Guardar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}