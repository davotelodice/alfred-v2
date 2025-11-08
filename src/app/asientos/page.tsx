'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  RefreshCw,
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react'
import {
  getUserAsientos,
  getCategoriasAsientos,
  createAsiento,
  updateAsiento,
  deleteAsiento,
  getAsientosStats,
  getAsientosPorCategoria,
  getAsientosPorMes,
  type AsientoStats,
  type AsientoPorCategoria,
  type AsientoPorMes
} from '@/lib/database'
import { useAuth } from '@/components/AuthProvider'
import type { ContableAsiento, ContableCategoriaAsiento } from '@/lib/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export default function AsientosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [asientos, setAsientos] = useState<ContableAsiento[]>([])
  const [categorias, setCategorias] = useState<ContableCategoriaAsiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewingAsiento, setViewingAsiento] = useState<ContableAsiento | null>(null)
  const [editingAsiento, setEditingAsiento] = useState<ContableAsiento | null>(null)
  const [stats, setStats] = useState<AsientoStats | null>(null)
  const [porCategoria, setPorCategoria] = useState<AsientoPorCategoria[]>([])
  const [porMes, setPorMes] = useState<AsientoPorMes[]>([])
  const [filters, setFilters] = useState({
    tipo_movimiento: '' as '' | 'ingreso' | 'gasto' | 'otro',
    categoria_contable: '',
    fecha_desde: '',
    fecha_hasta: ''
  })
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    tipo_movimiento: 'gasto' as 'ingreso' | 'gasto' | 'otro',
    categoria_contable: '',
    monto: '',
    moneda: 'EUR',
    cuenta_origen: '',
    cuenta_destino: '',
    saldo_posterior: '',
    referencia: '',
    fuente_datos: 'manual'
  })

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [asientosData, categoriasData, statsData, categoriaData, mesData] = await Promise.all([
        getUserAsientos({
          ...filters,
          tipo_movimiento: filters.tipo_movimiento || undefined,
          categoria_contable: filters.categoria_contable || undefined,
          fecha_desde: filters.fecha_desde || undefined,
          fecha_hasta: filters.fecha_hasta || undefined,
          limit: 100
        }),
        getCategoriasAsientos(),
        getAsientosStats(filters),
        getAsientosPorCategoria(filters),
        getAsientosPorMes(filters)
      ])
      setAsientos(asientosData || [])
      setCategorias(categoriasData || [])
      setStats(statsData)
      setPorCategoria(categoriaData)
      setPorMes(mesData)
    } catch (error) {
      console.error('Error al cargar asientos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters, loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAsiento) {
        await updateAsiento(editingAsiento.id_asiento, {
          fecha: formData.fecha,
          descripcion: formData.descripcion,
          tipo_movimiento: formData.tipo_movimiento,
          categoria_contable: formData.categoria_contable,
          monto: parseFloat(formData.monto),
          moneda: formData.moneda,
          cuenta_origen: formData.cuenta_origen,
          cuenta_destino: formData.cuenta_destino || undefined,
          saldo_posterior: formData.saldo_posterior ? parseFloat(formData.saldo_posterior) : undefined,
          referencia: formData.referencia || undefined,
          fuente_datos: formData.fuente_datos
        })
      } else {
        await createAsiento({
          fecha: formData.fecha,
          descripcion: formData.descripcion,
          tipo_movimiento: formData.tipo_movimiento,
          categoria_contable: formData.categoria_contable,
          monto: parseFloat(formData.monto),
          moneda: formData.moneda,
          cuenta_origen: formData.cuenta_origen,
          cuenta_destino: formData.cuenta_destino || undefined,
          saldo_posterior: formData.saldo_posterior ? parseFloat(formData.saldo_posterior) : undefined,
          referencia: formData.referencia || undefined,
          fuente_datos: formData.fuente_datos
        })
      }
      setShowForm(false)
      setEditingAsiento(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error al guardar asiento:', error)
      alert('Error al guardar el asiento. Por favor, verifica los datos.')
    }
  }

  const handleEdit = (asiento: ContableAsiento) => {
    setEditingAsiento(asiento)
    setFormData({
      fecha: asiento.fecha,
      descripcion: asiento.descripcion,
      tipo_movimiento: asiento.tipo_movimiento,
      categoria_contable: asiento.categoria_contable,
      monto: asiento.monto.toString(),
      moneda: asiento.moneda,
      cuenta_origen: asiento.cuenta_origen,
      cuenta_destino: asiento.cuenta_destino || '',
      saldo_posterior: asiento.saldo_posterior?.toString() || '',
      referencia: asiento.referencia || '',
      fuente_datos: asiento.fuente_datos
    })
    setShowForm(true)
  }

  const handleView = (asiento: ContableAsiento) => {
    setViewingAsiento(asiento)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asiento?')) return
    try {
      await deleteAsiento(id)
      loadData()
    } catch (error) {
      console.error('Error al eliminar asiento:', error)
      alert('Error al eliminar el asiento')
    }
  }

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      tipo_movimiento: 'gasto',
      categoria_contable: '',
      monto: '',
      moneda: 'EUR',
      cuenta_origen: '',
      cuenta_destino: '',
      saldo_posterior: '',
      referencia: '',
      fuente_datos: 'manual'
    })
  }

  const getCategoriaNombre = (codigo: string) => {
    return categorias.find(c => c.codigo === codigo)?.nombre || codigo
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ingreso': return 'bg-green-100 text-green-800'
      case 'gasto': return 'bg-red-100 text-red-800'
      case 'otro': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const categoriasFiltradas = categorias.filter(c =>
    !filters.tipo_movimiento || c.tipo_movimiento === filters.tipo_movimiento
  )

  // Preparar datos para gráficos
  const topGastos = porCategoria
    .filter(c => c.tipo_movimiento === 'gasto')
    .slice(0, 5)

  const topIngresos = porCategoria
    .filter(c => c.tipo_movimiento === 'ingreso')
    .slice(0, 5)

  const distribucionGastos = porCategoria
    .filter(c => c.tipo_movimiento === 'gasto')
    .slice(0, 8)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Asientos Contables Universales
              </h1>
              <p className="text-gray-600 mt-1">Gestiona tus asientos contables categorizados</p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setEditingAsiento(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Asiento
          </Button>
        </div>

        {/* Estadísticas Resumidas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.total_ingresos.toFixed(2)} EUR
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Gastos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.total_gastos.toFixed(2)} EUR
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.balance.toFixed(2)} EUR
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transacciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.cantidad_transacciones}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico: Ingresos vs Gastos por Mes */}
          {porMes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Ingresos vs Gastos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={porMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodo"
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-')
                        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                        return `${monthNames[parseInt(month) - 1]} ${year}`
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(2)} EUR`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Ingresos" />
                    <Area type="monotone" dataKey="gastos" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Gastos" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico: Balance Mensual */}
          {porMes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Balance Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={porMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodo"
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-')
                        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                        return `${monthNames[parseInt(month) - 1]} ${year}`
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(2)} EUR`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Balance" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico: Top 5 Categorías de Gastos */}
          {topGastos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 5 Categorías de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topGastos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre_categoria" type="category" width={150} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} EUR`} />
                    <Bar dataKey="total_monto" fill="#ef4444" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico: Distribución de Gastos por Categoría */}
          {distribucionGastos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={distribucionGastos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre_categoria, percent }) => `${nombre_categoria}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_monto"
                      nameKey="nombre_categoria"
                    >
                      {distribucionGastos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} EUR`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
                <select
                  value={filters.tipo_movimiento}
                  onChange={(e) => setFilters({ ...filters, tipo_movimiento: e.target.value as '' | 'ingreso' | 'gasto' | 'otro' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filters.categoria_contable}
                  onChange={(e) => setFilters({ ...filters, categoria_contable: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat.codigo} value={cat.codigo}>
                      {cat.codigo} - {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button
                onClick={() => setFilters({ tipo_movimiento: '', categoria_contable: '', fecha_desde: '', fecha_hasta: '' })}
                variant="outline"
                size="sm"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulario Modal */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingAsiento ? 'Editar Asiento' : 'Nuevo Asiento'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento *</label>
                    <select
                      value={formData.tipo_movimiento}
                      onChange={(e) => {
                        setFormData({ ...formData, tipo_movimiento: e.target.value as 'ingreso' | 'gasto' | 'otro', categoria_contable: '' })
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Contable *</label>
                    <select
                      value={formData.categoria_contable}
                      onChange={(e) => setFormData({ ...formData, categoria_contable: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categoriasFiltradas.map(cat => (
                        <option key={cat.codigo} value={cat.codigo}>
                          {cat.codigo} - {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <input
                      type="text"
                      value={formData.moneda}
                      onChange={(e) => setFormData({ ...formData, moneda: e.target.value.toUpperCase() })}
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Origen *</label>
                    <input
                      type="text"
                      value={formData.cuenta_origen}
                      onChange={(e) => setFormData({ ...formData, cuenta_origen: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="IBAN o nombre de cuenta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                    <input
                      type="text"
                      value={formData.cuenta_destino}
                      onChange={(e) => setFormData({ ...formData, cuenta_destino: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Posterior</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.saldo_posterior}
                      onChange={(e) => setFormData({ ...formData, saldo_posterior: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                    <input
                      type="text"
                      value={formData.referencia}
                      onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuente de Datos</label>
                    <input
                      type="text"
                      value={formData.fuente_datos}
                      onChange={(e) => setFormData({ ...formData, fuente_datos: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Descripción del movimiento"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingAsiento ? 'Actualizar' : 'Crear'} Asiento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingAsiento(null)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Modal de Visualización */}
        <Dialog open={!!viewingAsiento} onOpenChange={() => setViewingAsiento(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Asiento Contable</DialogTitle>
              <DialogDescription>
                Información completa de la transacción
              </DialogDescription>
            </DialogHeader>
            {viewingAsiento && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Asiento</p>
                    <p className="text-base font-mono">{viewingAsiento.id_asiento}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha</p>
                    <p className="text-base">{new Date(viewingAsiento.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Movimiento</p>
                    <Badge className={getTipoColor(viewingAsiento.tipo_movimiento)}>
                      {viewingAsiento.tipo_movimiento}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoría</p>
                    <p className="text-base">{getCategoriaNombre(viewingAsiento.categoria_contable)}</p>
                    <p className="text-xs text-gray-500">({viewingAsiento.categoria_contable})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monto</p>
                    <p className="text-2xl font-bold">
                      {viewingAsiento.monto.toFixed(2)} {viewingAsiento.moneda}
                    </p>
                  </div>
                  {viewingAsiento.saldo_posterior && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Saldo Posterior</p>
                      <p className="text-base font-semibold">
                        {viewingAsiento.saldo_posterior.toFixed(2)} {viewingAsiento.moneda}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Descripción</p>
                  <p className="text-base bg-gray-50 p-3 rounded-md">{viewingAsiento.descripcion}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cuenta Origen</p>
                    <p className="text-base font-mono text-sm break-all">{viewingAsiento.cuenta_origen}</p>
                  </div>
                  {viewingAsiento.cuenta_destino && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cuenta Destino</p>
                      <p className="text-base break-all">{viewingAsiento.cuenta_destino}</p>
                    </div>
                  )}
                </div>
                {(viewingAsiento.referencia || viewingAsiento.fuente_datos) && (
                  <div className="grid grid-cols-2 gap-4">
                    {viewingAsiento.referencia && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Referencia</p>
                        <p className="text-base font-mono text-sm">{viewingAsiento.referencia}</p>
                      </div>
                    )}
                    {viewingAsiento.fuente_datos && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fuente de Datos</p>
                        <p className="text-base">{viewingAsiento.fuente_datos}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        handleEdit(viewingAsiento)
                        setViewingAsiento(null)
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => {
                        setViewingAsiento(null)
                        handleDelete(viewingAsiento.id_asiento)
                      }}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lista de Asientos */}
        <Card>
          <CardHeader>
            <CardTitle>Asientos Contables ({asientos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600">Cargando asientos...</p>
              </div>
            ) : asientos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay asientos contables registrados</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="mt-4"
                >
                  Crear Primer Asiento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Descripción</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Categoría</th>
                      <th className="text-right p-2">Monto</th>
                      <th className="text-left p-2">Cuenta Origen</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asientos.map(asiento => (
                      <tr key={asiento.id_asiento} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm font-mono">{asiento.id_asiento.substring(0, 8)}...</td>
                        <td className="p-2 text-sm">{new Date(asiento.fecha).toLocaleDateString('es-ES')}</td>
                        <td className="p-2 text-sm max-w-xs truncate" title={asiento.descripcion}>
                          {asiento.descripcion}
                        </td>
                        <td className="p-2">
                          <Badge className={getTipoColor(asiento.tipo_movimiento)}>
                            {asiento.tipo_movimiento}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{getCategoriaNombre(asiento.categoria_contable)}</td>
                        <td className="p-2 text-right text-sm font-semibold">
                          {asiento.monto.toFixed(2)} {asiento.moneda}
                        </td>
                        <td className="p-2 text-sm max-w-xs truncate" title={asiento.cuenta_origen}>
                          {asiento.cuenta_origen}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleView(asiento)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleEdit(asiento)}
                              variant="outline"
                              size="sm"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(asiento.id_asiento)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
