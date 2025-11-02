import { NextRequest, NextResponse } from 'next/server'
import { findUserByChatIdServer, supabaseServer } from '@/lib/database-server'
import type { ApiResponse, N8nQueryRequest } from '@/lib/types'

// POST /api/transactions/query - Consultar transacciones por chat_id
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

    // Parsear datos de la consulta
    const queryData: N8nQueryRequest = await request.json()

    // Validar chat_id (obligatorio)
    if (!queryData.chat_id) {
      const response: ApiResponse = {
        success: false,
        error: 'chat_id es requerido'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Buscar usuario por chat_id
    const user = await findUserByChatIdServer(queryData.chat_id)

    // Si NO existe el usuario, devolver error
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: `Usuario no registrado. El chat_id ${queryData.chat_id} no está vinculado a ninguna cuenta.`
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Construir consulta de transacciones
    let query = supabaseServer
      .from('contable_transactions')
      .select(`
        id,
        tipo,
        monto,
        descripcion,
        fecha,
        metodo_pago,
        origen,
        contable_categories(nombre, tipo, grupo),
        contable_accounts(nombre, tipo)
      `)
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })

    // Filtrar por fecha_desde
    if (queryData.fecha_desde) {
      query = query.gte('fecha', queryData.fecha_desde)
    }

    // Filtrar por fecha_hasta
    if (queryData.fecha_hasta) {
      query = query.lte('fecha', queryData.fecha_hasta)
    }

    // Filtrar por tipo
    if (queryData.tipo) {
      query = query.eq('tipo', queryData.tipo)
    }

    // Ejecutar consulta
    const { data: transactions, error } = await query

    if (error) {
      console.error('Error al consultar transacciones:', error)
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Error al consultar transacciones'
      }
      return NextResponse.json(response, { status: 500 })
    }

    // Calcular estadísticas
    const total = transactions?.reduce((sum, t) => sum + t.monto, 0) || 0
    const totalIngresos = transactions
      ?.filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + t.monto, 0) || 0
    const totalGastos = transactions
      ?.filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + t.monto, 0) || 0
    const totalAhorros = transactions
      ?.filter(t => t.tipo === 'ahorro')
      .reduce((sum, t) => sum + t.monto, 0) || 0
    const totalInversiones = transactions
      ?.filter(t => t.tipo === 'inversion')
      .reduce((sum, t) => sum + t.monto, 0) || 0

    const response: ApiResponse = {
      success: true,
      data: {
        user_id: user.id,
        total_transacciones: transactions?.length || 0,
        periodo: {
          desde: queryData.fecha_desde || 'todo',
          hasta: queryData.fecha_hasta || 'todo'
        },
        resumen: {
          total: total,
          ingresos: totalIngresos,
          gastos: totalGastos,
          ahorros: totalAhorros,
          inversiones: totalInversiones,
          balance: totalIngresos - totalGastos
        },
        transacciones: transactions || []
      },
      message: 'Consulta realizada exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en POST /api/transactions/query:', error)

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

