import { NextRequest, NextResponse } from 'next/server'
import { 
  findUserByPhoneServer,
  findUserByChatIdServer,
  createUserIfNotExistsServer, 
  createTransactionServer, 
  logAuditActionServer,
  supabaseServer
} from '@/lib/database-server'
import type { ApiResponse, N8nWebhookData, ContableUser } from '@/lib/types'

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

    // Validar datos requeridos (chat_id O telefono)
    if (!webhookData.chat_id && !webhookData.telefono) {
      const response: ApiResponse = {
        success: false,
        error: 'chat_id o telefono es requerido'
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

    // Buscar usuario: PRIMERO por chat_id (preferido), luego por teléfono
    let user: ContableUser | null = null

    if (webhookData.chat_id) {
      // Prioridad 1: Buscar por telegram_chat_id
      user = await findUserByChatIdServer(webhookData.chat_id)
      
      if (!user && webhookData.telefono) {
        // Si no existe pero hay teléfono, buscar por teléfono
        const normalizedPhone = webhookData.telefono.replace(/[\s\-\(\)]/g, '')
        user = await findUserByPhoneServer(normalizedPhone)
        
        // Si encontramos por teléfono, actualizar con chat_id
        if (user) {
          const { error: updateError } = await supabaseServer
            .from('contable_users')
            .update({ telegram_chat_id: webhookData.chat_id })
            .eq('id', user.id)
          
          if (!updateError) {
            user.telegram_chat_id = webhookData.chat_id
          }
        }
      }
    } else if (webhookData.telefono) {
      // Si no hay chat_id, buscar solo por teléfono
      const normalizedPhone = webhookData.telefono.replace(/[\s\-\(\)]/g, '')
      user = await findUserByPhoneServer(normalizedPhone)
    }

    // Si no existe el usuario, crearlo
    if (!user) {
      const userData: { nombre: string; telefono?: string; telegram_chat_id?: string } = {
        nombre: webhookData.chat_id 
          ? `Usuario Telegram ${webhookData.chat_id}` 
          : (webhookData.telefono ? `Usuario ${webhookData.telefono.replace(/[\s\-\(\)]/g, '')}` : 'Usuario Telegram'),
      }
      
      if (webhookData.telefono) {
        userData.telefono = webhookData.telefono.replace(/[\s\-\(\)]/g, '')
      }
      
      if (webhookData.chat_id) {
        userData.telegram_chat_id = webhookData.chat_id
      }

      user = await createUserIfNotExistsServer(userData)

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
        { 
          chat_id: webhookData.chat_id,
          telefono: webhookData.telefono,
          origen: 'n8n' 
        },
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