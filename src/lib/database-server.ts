import { supabaseServer } from './serverSupabase'
import type { 
  ContableTransaction, 
  ContableUser,
  CreateTransactionRequest,
  ContableAsiento,
  ContableCategoriaAsiento,
  CreateAsientoRequest,
  UpdateAsientoRequest,
  AsientoFilters
} from './types'

// Exportar supabaseServer para uso en API routes
export { supabaseServer }

// =====================================================
// FUNCIONES SERVIDOR (SIN RLS - SERVICE ROLE)
// =====================================================

export async function findUserByPhoneServer(telefono: string) {
  const { data, error } = await supabaseServer
    .from('contable_users')
    .select('*')
    .eq('telefono', telefono)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ContableUser | null
}

export async function findUserByChatIdServer(chatId: string) {
  const { data, error } = await supabaseServer
    .from('contable_users')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ContableUser | null
}

export async function createUserIfNotExistsServer(userData: { nombre: string; telefono?: string; email?: string; telegram_chat_id?: string }) {
  const { data, error } = await supabaseServer
    .from('contable_users')
    .insert(userData)
    .select()
    .single()

  if (error) throw error
  return data as ContableUser
}

export async function createTransactionServer(transactionData: CreateTransactionRequest) {
  const { data, error } = await supabaseServer
    .from('contable_transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) throw error
  return data as ContableTransaction
}

export async function logAuditActionServer(accion: string, detalles: Record<string, unknown>, userId?: string) {
  const { data, error } = await supabaseServer
    .from('contable_audit_logs')
    .insert({
      user_id: userId,
      accion,
      detalles
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// FUNCIONES PARA ASIENTOS CONTABLES
// =====================================================

export async function createAsientoServer(asientoData: CreateAsientoRequest) {
  const { data, error } = await supabaseServer
    .from('contable_asientos')
    .insert({
      ...asientoData,
      id_asiento: asientoData.id_asiento || undefined, // Si no se proporciona, se genera automáticamente
      moneda: asientoData.moneda || 'EUR',
      fuente_datos: asientoData.fuente_datos || 'n8n'
    })
    .select()
    .single()

  if (error) throw error
  return data as ContableAsiento
}

export async function getAsientosByUserServer(userId: string, filters?: AsientoFilters) {
  let query = supabaseServer
    .from('contable_asientos')
    .select('*')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })

  if (filters?.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde)
  }

  if (filters?.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta)
  }

  if (filters?.categoria_contable) {
    query = query.eq('categoria_contable', filters.categoria_contable)
  }

  if (filters?.tipo_movimiento) {
    query = query.eq('tipo_movimiento', filters.tipo_movimiento)
  }

  if (filters?.cuenta_origen) {
    query = query.eq('cuenta_origen', filters.cuenta_origen)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ContableAsiento[]
}

export async function getAsientoByIdServer(asientoId: string) {
  const { data, error } = await supabaseServer
    .from('contable_asientos')
    .select('*')
    .eq('id_asiento', asientoId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ContableAsiento | null
}

export async function updateAsientoServer(asientoId: string, updateData: UpdateAsientoRequest) {
  const { data, error } = await supabaseServer
    .from('contable_asientos')
    .update(updateData)
    .eq('id_asiento', asientoId)
    .select()
    .single()

  if (error) throw error
  return data as ContableAsiento
}

export async function deleteAsientoServer(asientoId: string) {
  const { error } = await supabaseServer
    .from('contable_asientos')
    .delete()
    .eq('id_asiento', asientoId)

  if (error) throw error
  return { success: true }
}

export async function getCategoriasAsientosServer(tipoMovimiento?: 'ingreso' | 'gasto' | 'otro') {
  let query = supabaseServer
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

export async function findCategoriaByCodigoServer(codigo: string) {
  const { data, error } = await supabaseServer
    .from('contable_categorias_asientos')
    .select('*')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ContableCategoriaAsiento | null
}
