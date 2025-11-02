import { supabaseServer } from './serverSupabase'
import type { 
  ContableTransaction, 
  ContableUser,
  CreateTransactionRequest
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

export async function createUserIfNotExistsServer(userData: { nombre: string; telefono: string; email?: string }) {
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



