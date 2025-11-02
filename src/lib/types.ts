// =====================================================
// TIPOS PARA ASISTENTE CONTABLE INTELIGENTE
// =====================================================

export interface ContableUser {
  id: string
  nombre: string
  email?: string
  telefono?: string
  telegram_chat_id?: string
  tipo_usuario: string
  moneda_preferida: string
  fecha_creacion: string
}

export interface ContableAccount {
  id: string
  user_id: string
  nombre: string
  tipo?: string
  saldo_actual: number
  entidad?: string
  numero_cuenta?: string
  fecha_creacion: string
}

export interface ContableCategory {
  id: string
  nombre: string
  tipo: 'ingreso' | 'gasto' | 'inversion' | 'ahorro'
  grupo?: string
  descripcion?: string
}

export interface ContableTransaction {
  id: string
  user_id: string
  account_id?: string
  category_id?: string
  tipo: 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia'
  monto: number
  descripcion?: string
  fecha: string
  metodo_pago?: string
  origen: string
  creado_por?: string
  created_at: string
}

export interface ContableKPISummary {
  id: string
  user_id: string
  periodo: string
  ingreso_total: number
  gasto_total: number
  ahorro_total: number
  inversion_total: number
  balance: number
  porcentaje_ahorro?: number
  liquidez?: number
  endeudamiento?: number
  margen_neto?: number
  fecha_calculo: string
}

export interface ContableAdvice {
  id: string
  user_id: string
  tipo_alerta?: string
  mensaje: string
  prioridad: 'baja' | 'normal' | 'alta' | 'critica'
  generado_por: string
  fecha: string
  leido: boolean
}

export interface ContableAuditLog {
  id: string
  user_id?: string
  accion?: string
  detalles?: Record<string, unknown>
  fecha: string
}

// =====================================================
// TIPOS PARA API RESPONSES
// =====================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// =====================================================
// TIPOS PARA REQUESTS
// =====================================================

export interface CreateTransactionRequest {
  user_id: string
  account_id?: string
  category_id?: string
  tipo: 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia'
  monto: number
  descripcion?: string
  fecha: string
  metodo_pago?: string
  origen?: string
}

export interface UpdateTransactionRequest {
  account_id?: string
  category_id?: string
  tipo?: 'ingreso' | 'gasto' | 'inversion' | 'ahorro' | 'transferencia'
  monto?: number
  descripcion?: string
  fecha?: string
  metodo_pago?: string
}

export interface CreateAdviceRequest {
  user_id: string
  tipo_alerta?: string
  mensaje: string
  prioridad?: 'baja' | 'normal' | 'alta' | 'critica'
  generado_por?: string
}

// =====================================================
// TIPOS PARA WEBHOOK N8N
// =====================================================

export interface N8nWebhookData {
  chat_id?: string
  telefono?: string
  tipo: 'ingreso' | 'gasto' | 'inversion' | 'ahorro'
  monto: number
  descripcion?: string
  categoria?: string
  fecha?: string
  metodo_pago?: string
}

// =====================================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// =====================================================

export interface TransactionFilters {
  periodo?: string
  tipo?: string
  categoria?: string
  fecha_desde?: string
  fecha_hasta?: string
  limit?: number
  offset?: number
}

export interface KPIFilters {
  periodo?: string
  fecha_desde?: string
  fecha_hasta?: string
}