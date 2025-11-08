'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  RefreshCw, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Filter
} from 'lucide-react'
import { 
  getUserAsientos,
  getCategoriasAsientos,
  createAsiento,
  updateAsiento,
  deleteAsiento
} from '@/lib/database'
import { useAuth } from '@/components/AuthProvider'
import type { ContableAsiento, ContableCategoriaAsiento } from '@/lib/types'

export default function AsientosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [asientos, setAsientos] = useState<ContableAsiento[]>([])
  const [categorias, setCategorias] = useState<ContableCategoriaAsiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAsiento, setEditingAsiento] = useState<ContableAsiento | null>(null)
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

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [asientosData, categoriasData] = await Promise.all([
        getUserAsientos({
          ...filters,
          tipo_movimiento: filters.tipo_movimiento || undefined,
          categoria_contable: filters.categoria_contable || undefined,
          fecha_desde: filters.fecha_desde || undefined,
          fecha_hasta: filters.fecha_hasta || undefined,
          limit: 100
        }),
        getCategoriasAsientos()
      ])
      setAsientos(asientosData || [])
      setCategorias(categoriasData || [])
    } catch (error) {
      console.error('Error al cargar asientos:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
                  onChange={(e) => setFilters({ ...filters, tipo_movimiento: e.target.value as any })}
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
                        setFormData({ ...formData, tipo_movimiento: e.target.value as any, categoria_contable: '' })
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
                              onClick={() => handleEdit(asiento)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(asiento.id_asiento)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
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

