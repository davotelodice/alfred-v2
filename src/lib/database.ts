import { supabase } from './supabaseClient'
import type { 
  ContableTransaction, 
  ContableKPISummary, 
  ContableAdvice, 
  ContableCategory,
  CreateTransactionRequest,
  CreateAdviceRequest,
  TransactionFilters,
  ContableAsiento,
  ContableCategoriaAsiento,
  CreateAsientoRequest,
  UpdateAsientoRequest,
  AsientoFilters
} from './types'

// =====================================================
// FUNCIONES FRONTEND (CON RLS)
// =====================================================

export async function getUserTransactions(filters: TransactionFilters = {}) {
  let query = supabase
    .from('contable_transactions')
    .select(`
      *,
      contable_categories(nombre, tipo, grupo),
      contable_accounts(nombre, tipo)
    `)
    .order('fecha', { ascending: false })

  if (filters.periodo) {
    const [year, month] = filters.periodo.split('-')
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    
    // Primer día del mes
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    
    // Último día del mes (calcular correctamente)
    const ultimoDia = new Date(yearNum, monthNum, 0).getDate()
    const endDate = `${year}-${month.padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`
    
    query = query.gte('fecha', startDate).lte('fecha', endDate)
  }

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  if (filters.categoria) {
    query = query.eq('category_id', filters.categoria)
  }

  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ContableTransaction[]
}

export async function getUserKPIs(periodo?: string) {
  let query = supabase
    .from('contable_kpi_summary')
    .select('*')
    .order('periodo', { ascending: false })

  if (periodo) {
    query = query.eq('periodo', periodo)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ContableKPISummary[]
}

export async function getUserAdvice() {
  const { data, error } = await supabase
    .from('contable_advice')
    .select('*')
    .order('fecha', { ascending: false })

  if (error) throw error
  return data as ContableAdvice[]
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('contable_categories')
    .select('*')
    .order('tipo', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) throw error
  return data as ContableCategory[]
}

export async function createTransaction(transactionData: CreateTransactionRequest) {
  const { data, error } = await supabase
    .from('contable_transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) throw error
  return data as ContableTransaction
}

export async function updateTransaction(id: string, updates: Partial<CreateTransactionRequest>) {
  const { data, error } = await supabase
    .from('contable_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ContableTransaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('contable_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function markAdviceAsRead(id: string) {
  const { data, error } = await supabase
    .from('contable_advice')
    .update({ leido: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ContableAdvice
}

export async function createAdvice(adviceData: CreateAdviceRequest) {
  const { data, error } = await supabase
    .from('contable_advice')
    .insert(adviceData)
    .select()
    .single()

  if (error) throw error
  return data as ContableAdvice
}

// =====================================================
// FUNCIONES SERVIDOR (SIN RLS - SERVICE ROLE)
// =====================================================
// NOTA: Estas funciones se movieron a database-server.ts
// para evitar problemas de hidratación en el cliente

// =====================================================
// FUNCIONES UTILITARIAS
// =====================================================

export function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function getAvailablePeriods(): Promise<string[]> {
  const { data, error } = await supabase
    .from('contable_transactions')
    .select('fecha')
    .order('fecha', { ascending: false })

  if (error) throw error

  const periods = new Set<string>()
  data?.forEach(transaction => {
    const date = new Date(transaction.fecha)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    periods.add(`${year}-${month}`)
  })

  // Agregar período actual si no existe
  periods.add(getCurrentPeriod())

  return Array.from(periods).sort().reverse()
}

// =====================================================
// FUNCIONES PARA ASIENTOS CONTABLES
// =====================================================

export async function getUserAsientos(filters: AsientoFilters = {}) {
  let query = supabase
    .from('contable_asientos')
    .select('*')
    .order('fecha', { ascending: false })

  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  if (filters.categoria_contable) {
    query = query.eq('categoria_contable', filters.categoria_contable)
  }

  if (filters.tipo_movimiento) {
    query = query.eq('tipo_movimiento', filters.tipo_movimiento)
  }

  if (filters.cuenta_origen) {
    query = query.eq('cuenta_origen', filters.cuenta_origen)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ContableAsiento[]
}

export async function getCategoriasAsientos(tipoMovimiento?: 'ingreso' | 'gasto' | 'otro') {
  let query = supabase
    .from('contable_categorias_asientos')
    .select('*')
    .eq('activo', true)
    .order('codigo', { ascending: true })

  if (tipoMovimiento) {
    query = query.eq('tipo_movimiento', tipoMovimiento)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ContableCategoriaAsiento[]
}

export async function createAsiento(asientoData: Omit<CreateAsientoRequest, 'user_id'>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Usuario no autenticado')

  const fullData: CreateAsientoRequest = {
    ...asientoData,
    user_id: session.user.id
  }

  const { data, error } = await supabase
    .from('contable_asientos')
    .insert(fullData)
    .select()
    .single()

  if (error) throw error
  return data as ContableAsiento
}

export async function updateAsiento(id: string, updates: UpdateAsientoRequest) {
  const { data, error } = await supabase
    .from('contable_asientos')
    .update(updates)
    .eq('id_asiento', id)
    .select()
    .single()

  if (error) throw error
  return data as ContableAsiento
}

export async function deleteAsiento(id: string) {
  const { error } = await supabase
    .from('contable_asientos')
    .delete()
    .eq('id_asiento', id)

  if (error) throw error
}

// =====================================================
// FUNCIONES PARA ANÁLISIS Y GRÁFICOS DE ASIENTOS
// =====================================================

export interface AsientoStats {
  total_ingresos: number
  total_gastos: number
  balance: number
  cantidad_transacciones: number
}

export interface AsientoPorCategoria {
  categoria_contable: string
  nombre_categoria: string
  tipo_movimiento: string
  total_monto: number
  cantidad: number
}

export interface AsientoPorMes {
  mes: string
  año: string
  periodo: string
  ingresos: number
  gastos: number
  balance: number
}

export async function getAsientosStats(filters: AsientoFilters = {}): Promise<AsientoStats> {
  let query = supabase
    .from('contable_asientos')
    .select('tipo_movimiento, monto')

  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  if (filters.tipo_movimiento) {
    query = query.eq('tipo_movimiento', filters.tipo_movimiento)
  }

  const { data, error } = await query

  if (error) throw error

  const stats: AsientoStats = {
    total_ingresos: 0,
    total_gastos: 0,
    balance: 0,
    cantidad_transacciones: data?.length || 0
  }

  data?.forEach(asiento => {
    if (asiento.tipo_movimiento === 'ingreso') {
      stats.total_ingresos += asiento.monto
    } else if (asiento.tipo_movimiento === 'gasto') {
      stats.total_gastos += asiento.monto
    }
  })

  stats.balance = stats.total_ingresos - stats.total_gastos

  return stats
}

export async function getAsientosPorCategoria(filters: AsientoFilters = {}): Promise<AsientoPorCategoria[]> {
  let query = supabase
    .from('contable_asientos')
    .select('categoria_contable, tipo_movimiento, monto')

  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  if (filters.tipo_movimiento) {
    query = query.eq('tipo_movimiento', filters.tipo_movimiento)
  }

  const { data, error } = await query

  if (error) throw error

  // Obtener nombres de categorías
  const { data: categorias } = await supabase
    .from('contable_categorias_asientos')
    .select('codigo, nombre')

  const categoriaMap = new Map<string, string>()
  categorias?.forEach(cat => {
    categoriaMap.set(cat.codigo, cat.nombre)
  })

  // Agrupar por categoría
  const grouped = new Map<string, AsientoPorCategoria>()

  data?.forEach(asiento => {
    const key = asiento.categoria_contable
    if (!grouped.has(key)) {
      grouped.set(key, {
        categoria_contable: key,
        nombre_categoria: categoriaMap.get(key) || key,
        tipo_movimiento: asiento.tipo_movimiento,
        total_monto: 0,
        cantidad: 0
      })
    }

    const item = grouped.get(key)!
    item.total_monto += asiento.monto
    item.cantidad += 1
  })

  return Array.from(grouped.values()).sort((a, b) => b.total_monto - a.total_monto)
}

export async function getAsientosPorMes(filters: AsientoFilters = {}): Promise<AsientoPorMes[]> {
  let query = supabase
    .from('contable_asientos')
    .select('fecha, tipo_movimiento, monto')
    .order('fecha', { ascending: true })

  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  const { data, error } = await query

  if (error) throw error

  // Agrupar por mes
  const grouped = new Map<string, AsientoPorMes>()

  data?.forEach(asiento => {
    const fecha = new Date(asiento.fecha)
    const año = fecha.getFullYear().toString()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const periodo = `${año}-${mes}`

    if (!grouped.has(periodo)) {
      grouped.set(periodo, {
        mes,
        año,
        periodo,
        ingresos: 0,
        gastos: 0,
        balance: 0
      })
    }

    const item = grouped.get(periodo)!
    if (asiento.tipo_movimiento === 'ingreso') {
      item.ingresos += asiento.monto
    } else if (asiento.tipo_movimiento === 'gasto') {
      item.gastos += asiento.monto
    }
    item.balance = item.ingresos - item.gastos
  })

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.año !== b.año) return a.año.localeCompare(b.año)
    return a.mes.localeCompare(b.mes)
  })
}