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
// TIPOS PARA ASIENTOS CONTABLES UNIVERSALES
// =====================================================

export interface ContableCategoriaAsiento {
  codigo: string
  nombre: string
  tipo_movimiento: 'ingreso' | 'gasto' | 'otro'
  descripcion?: string
  ejemplos?: string[]
  activo: boolean
  created_at: string
}

export interface ContableAsiento {
  id_asiento: string
  fecha: string
  descripcion: string
  tipo_movimiento: 'ingreso' | 'gasto' | 'otro'
  categoria_contable: string
  monto: number
  moneda: string
  cuenta_origen: string
  cuenta_destino?: string
  saldo_posterior?: number
  referencia?: string
  fuente_datos: string
  user_id: string
  account_id?: string
  created_at: string
  updated_at: string
}

export interface CreateAsientoRequest {
  id_asiento?: string // Opcional - se genera automáticamente si no se proporciona
  fecha: string
  descripcion: string
  tipo_movimiento: 'ingreso' | 'gasto' | 'otro'
  categoria_contable: string
  monto: number
  moneda?: string
  cuenta_origen: string
  cuenta_destino?: string
  saldo_posterior?: number
  referencia?: string
  fuente_datos?: string
  user_id: string
  account_id?: string
}

export interface UpdateAsientoRequest {
  fecha?: string
  descripcion?: string
  tipo_movimiento?: 'ingreso' | 'gasto' | 'otro'
  categoria_contable?: string
  monto?: number
  moneda?: string
  cuenta_origen?: string
  cuenta_destino?: string
  saldo_posterior?: number
  referencia?: string
  fuente_datos?: string
  account_id?: string
}

export interface AsientoFilters {
  fecha_desde?: string
  fecha_hasta?: string
  categoria_contable?: string
  tipo_movimiento?: 'ingreso' | 'gasto' | 'otro'
  cuenta_origen?: string
  limit?: number
  offset?: number
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
  chat_id: string // REQUERIDO - No opcional
  telefono?: string // Opcional - Solo si se necesita
  tipo: 'ingreso' | 'gasto' | 'inversion' | 'ahorro'
  monto: number
  descripcion: string // REQUERIDO
  categoria?: string
  fecha: string // REQUERIDO
  metodo_pago?: string
}

export interface N8nAsientoWebhookData {
  chat_id: string // OBLIGATORIO - ID del chat de Telegram
  user_id?: string // OPCIONAL - si se proporciona, se usa directamente
  id_asiento?: string // OPCIONAL - se genera automáticamente si no se proporciona
  fecha: string // OBLIGATORIO - formato YYYY-MM-DD
  descripcion: string // OBLIGATORIO
  tipo_movimiento: 'ingreso' | 'gasto' | 'otro' // OBLIGATORIO
  categoria_contable: string // OBLIGATORIO - debe existir en catálogo
  monto: number // OBLIGATORIO - debe ser > 0
  moneda?: string // OPCIONAL - default: "EUR"
  cuenta_origen: string // OBLIGATORIO - IBAN o nombre
  cuenta_destino?: string // OPCIONAL
  saldo_posterior?: number // OPCIONAL
  referencia?: string // OPCIONAL
  fuente_datos?: string // OPCIONAL - default: "n8n"
  telefono?: string // OPCIONAL - se actualiza si es diferente al del usuario
}

export interface N8nQueryRequest {
  chat_id: string // REQUERIDO para identificar al usuario
  fecha_desde?: string // OPCIONAL: YYYY-MM-DD
  fecha_hasta?: string // OPCIONAL: YYYY-MM-DD
  tipo?: 'ingreso' | 'gasto' | 'inversion' | 'ahorro' // OPCIONAL: filtrar por tipo
  categoria?: string // OPCIONAL: filtrar por categoría
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
