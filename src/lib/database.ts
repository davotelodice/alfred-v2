import { supabase } from './supabaseClient'
import type { 
  ContableTransaction, 
  ContableKPISummary, 
  ContableAdvice, 
  ContableCategory,
  CreateTransactionRequest,
  CreateAdviceRequest,
  TransactionFilters
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