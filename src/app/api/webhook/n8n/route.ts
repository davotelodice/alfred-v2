import { NextRequest, NextResponse } from 'next/server'
import { 
  findUserByPhoneServer, 
  createUserIfNotExistsServer, 
  createTransactionServer, 
  logAuditActionServer 
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

    // Validar datos requeridos
    if (!webhookData.telefono) {
      const response: ApiResponse = {
        success: false,
        error: 'telefono es requerido'
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

    // Normalizar teléfono (remover espacios, guiones, etc.)
    const normalizedPhone = webhookData.telefono.replace(/[\s\-\(\)]/g, '')

    // Buscar usuario por teléfono
    let user = await findUserByPhoneServer(normalizedPhone)

    // Si no existe el usuario, crearlo
    if (!user) {
      user = await createUserIfNotExistsServer({
        nombre: `Usuario ${normalizedPhone}`,
        telefono: normalizedPhone
      })

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'No se pudo crear el usuario'
        }
        return NextResponse.json(response, { status: 500 })
      }

      // Registrar creación de usuario
      await logAuditActionServer(
        'user_created_via_webhook',
        { telefono: normalizedPhone, origen: 'n8n' },
        user.id
      )
    }

    // Preparar datos de la transacción
    const transactionData = {
      user_id: user.id,
      tipo: webhookData.tipo,
      monto: webhookData.monto,
      descripcion: webhookData.descripcion || `Transacción ${webhookData.tipo} desde Telegram`,
      fecha: webhookData.fecha || new Date().toISOString().split('T')[0],
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