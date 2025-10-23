import { NextRequest, NextResponse } from 'next/server'
import { getUserTransactions } from '@/lib/database'
import { createTransactionServer } from '@/lib/database-server'
import { supabaseServer } from '@/lib/database-server'
import type { ApiResponse, CreateTransactionRequest, TransactionFilters } from '@/lib/types'

// GET /api/transactions - Obtener transacciones del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: TransactionFilters = {
      periodo: searchParams.get('periodo') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      categoria: searchParams.get('categoria') || undefined,
      fecha_desde: searchParams.get('fecha_desde') || undefined,
      fecha_hasta: searchParams.get('fecha_hasta') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const transactions = await getUserTransactions(filters)

    const response: ApiResponse = {
      success: true,
      data: transactions,
      message: `${transactions.length} transacciones encontradas`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/transactions:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/transactions - Crear nueva transacción
export async function POST(request: NextRequest) {
  try {
    const body: Omit<CreateTransactionRequest, 'user_id'> = await request.json()

    // Obtener usuario autenticado desde el token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Token de autorización requerido'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      const response: ApiResponse = {
        success: false,
        error: 'Token inválido o usuario no autenticado'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const fullTransactionData: CreateTransactionRequest = {
      ...body,
      user_id: user.id
    }

    if (!body.tipo || !['ingreso', 'gasto', 'inversion', 'ahorro', 'transferencia'].includes(body.tipo)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo debe ser: ingreso, gasto, inversion, ahorro o transferencia'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.monto || body.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.fecha) {
      const response: ApiResponse = {
        success: false,
        error: 'fecha es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const transaction = await createTransactionServer(fullTransactionData)

    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transacción creada exitosamente'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/transactions:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}