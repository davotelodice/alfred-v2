import { NextRequest, NextResponse } from 'next/server'
import { 
  findUserByChatIdServer,
  createTransactionServer, 
  logAuditActionServer,
  supabaseServer
} from '@/lib/database-server'
import type { ApiResponse, N8nWebhookData } from '@/lib/types'

// POST /api/webhook/n8n - Webhook para n8n
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
    const webhookData: N8nWebhookData = await request.json()

    // Validar datos requeridos: chat_id ES OBLIGATORIO
    if (!webhookData.chat_id) {
      const response: ApiResponse = {
        success: false,
        error: 'chat_id es requerido'
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

    // Validar fecha
    if (!webhookData.fecha) {
      const response: ApiResponse = {
        success: false,
        error: 'fecha es requerida (formato: YYYY-MM-DD)'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!webhookData.tipo || !['ingreso', 'gasto', 'inversion', 'ahorro'].includes(webhookData.tipo)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo debe ser: ingreso, gasto, inversion o ahorro'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!webhookData.monto || webhookData.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Buscar usuario POR CHAT_ID (obligatorio)
    const user = await findUserByChatIdServer(webhookData.chat_id)

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

    // Preparar datos de la transacción (ahora fecha y descripcion son obligatorios)
    const transactionData = {
      user_id: user.id,
      tipo: webhookData.tipo,
      monto: webhookData.monto,
      descripcion: webhookData.descripcion, // Ya validado arriba
      fecha: webhookData.fecha, // Ya validado arriba
      metodo_pago: webhookData.metodo_pago || 'telegram',
      origen: 'n8n'
    }

    // Crear transacción
    const transaction = await createTransactionServer(transactionData)

    // Registrar acción en audit log
    await logAuditActionServer(
      'transaction_created_via_webhook',
      { 
        transaction_id: transaction.id,
        tipo: webhookData.tipo,
        monto: webhookData.monto,
        origen: 'n8n'
      },
      user.id
    )

    const response: ApiResponse = {
      success: true,
      data: {
        transaction_id: transaction.id,
        user_id: user.id,
        message: 'Transacción procesada exitosamente'
      },
      message: 'Webhook procesado correctamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en POST /api/webhook/n8n:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}