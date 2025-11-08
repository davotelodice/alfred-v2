import { NextRequest, NextResponse } from 'next/server'
import { 
  findUserByChatIdServer,
  createAsientoServer,
  findCategoriaByCodigoServer,
  logAuditActionServer,
  supabaseServer
} from '@/lib/database-server'
import type { ApiResponse, N8nAsientoWebhookData } from '@/lib/types'

// POST /api/webhook/asientos - Webhook para recibir asientos contables desde n8n
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticación
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN

    if (!expectedToken) {
      const response: ApiResponse = {
        success: false,
        error: 'Token de webhook no configurado'
      }
      return NextResponse.json(response, { status: 500 })
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      const response: ApiResponse = {
        success: false,
        error: 'Token de webhook inválido'
      }
      return NextResponse.json(response, { status: 401 })
    }

    // Parsear datos del webhook
    const webhookData: N8nAsientoWebhookData = await request.json()

    // Validar datos requeridos: chat_id ES OBLIGATORIO
    if (!webhookData.chat_id) {
      const response: ApiResponse = {
        success: false,
        error: 'chat_id es requerido'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar fecha (formato YYYY-MM-DD)
    if (!webhookData.fecha) {
      const response: ApiResponse = {
        success: false,
        error: 'fecha es requerida (formato: YYYY-MM-DD)'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(webhookData.fecha)) {
      const response: ApiResponse = {
        success: false,
        error: 'fecha debe tener formato YYYY-MM-DD'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar descripcion
    if (!webhookData.descripcion || webhookData.descripcion.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: 'descripcion es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar tipo_movimiento
    if (!webhookData.tipo_movimiento || !['ingreso', 'gasto', 'otro'].includes(webhookData.tipo_movimiento)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo_movimiento debe ser: ingreso, gasto u otro'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar categoria_contable
    if (!webhookData.categoria_contable) {
      const response: ApiResponse = {
        success: false,
        error: 'categoria_contable es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar monto
    if (!webhookData.monto || webhookData.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar cuenta_origen
    if (!webhookData.cuenta_origen || webhookData.cuenta_origen.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: 'cuenta_origen es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar formato de moneda (ISO 4217 - 3 letras mayúsculas)
    if (webhookData.moneda && !/^[A-Z]{3}$/.test(webhookData.moneda)) {
      const response: ApiResponse = {
        success: false,
        error: 'moneda debe ser un código ISO 4217 válido (3 letras mayúsculas, ej: EUR, USD)'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Buscar usuario POR CHAT_ID (obligatorio) - patrón establecido
    let user
    if (webhookData.user_id) {
      // Si se proporciona user_id, buscar directamente
      const { data, error } = await supabaseServer
        .from('contable_users')
        .select('*')
        .eq('id', webhookData.user_id)
        .single()

      if (error || !data) {
        const response: ApiResponse = {
          success: false,
          error: `Usuario con user_id ${webhookData.user_id} no encontrado`
        }
        return NextResponse.json(response, { status: 404 })
      }
      user = data
    } else {
      // Buscar por chat_id usando función establecida
      user = await findUserByChatIdServer(webhookData.chat_id)
    }

    // Si NO existe el usuario, devolver error - NO crear usuario automáticamente
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: `Usuario no registrado. El chat_id ${webhookData.chat_id} no está vinculado a ninguna cuenta. Por favor, registra tu cuenta en el dashboard y vincula tu Telegram Chat ID.`
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Si existe el usuario y se proporcionó teléfono, actualizar teléfono si es diferente
    if (webhookData.telefono && user.telefono !== webhookData.telefono) {
      const normalizedPhone = webhookData.telefono.replace(/[\s\-\(\)]/g, '')
      await supabaseServer
        .from('contable_users')
        .update({ telefono: normalizedPhone })
        .eq('id', user.id)
    }

    // Validar que la categoría existe en el catálogo y está activa
    const categoria = await findCategoriaByCodigoServer(webhookData.categoria_contable)
    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: `La categoría contable ${webhookData.categoria_contable} no existe o no está activa`
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validar que tipo_movimiento coincide con el tipo de la categoría
    if (categoria.tipo_movimiento !== webhookData.tipo_movimiento) {
      const response: ApiResponse = {
        success: false,
        error: `El tipo_movimiento (${webhookData.tipo_movimiento}) no coincide con el tipo de la categoría ${webhookData.categoria_contable} (${categoria.tipo_movimiento})`
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Preparar datos del asiento
    const asientoData = {
      id_asiento: webhookData.id_asiento, // Opcional - se genera automáticamente si no se proporciona
      user_id: user.id,
      fecha: webhookData.fecha,
      descripcion: webhookData.descripcion.trim(),
      tipo_movimiento: webhookData.tipo_movimiento,
      categoria_contable: webhookData.categoria_contable,
      monto: webhookData.monto,
      moneda: webhookData.moneda || 'EUR',
      cuenta_origen: webhookData.cuenta_origen.trim(),
      cuenta_destino: webhookData.cuenta_destino?.trim(),
      saldo_posterior: webhookData.saldo_posterior,
      referencia: webhookData.referencia?.trim(),
      fuente_datos: webhookData.fuente_datos || 'n8n'
    }

    // Crear asiento
    const asiento = await createAsientoServer(asientoData)

    // Registrar acción en audit log
    await logAuditActionServer(
      'asiento_created_via_webhook',
      { 
        id_asiento: asiento.id_asiento,
        categoria_contable: webhookData.categoria_contable,
        tipo_movimiento: webhookData.tipo_movimiento,
        monto: webhookData.monto,
        origen: 'n8n'
      },
      user.id
    )

    const response: ApiResponse = {
      success: true,
      data: {
        id_asiento: asiento.id_asiento,
        user_id: user.id,
        message: 'Asiento contable creado exitosamente'
      },
      message: 'Webhook procesado correctamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en POST /api/webhook/asientos:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}


