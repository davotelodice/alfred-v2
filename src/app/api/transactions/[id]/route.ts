import { NextRequest, NextResponse } from 'next/server'
import { updateTransaction, deleteTransaction } from '@/lib/database'
import { supabase } from '@/lib/supabaseClient'
import type { ApiResponse, UpdateTransactionRequest } from '@/lib/types'

// GET /api/transactions/[id] - Obtener transacción específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('contable_transactions')
      .select(`
        *,
        contable_categories(nombre, tipo, grupo),
        contable_accounts(nombre, tipo)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const response: ApiResponse = {
          success: false,
          error: 'Transacción no encontrada'
        }
        return NextResponse.json(response, { status: 404 })
      }
      throw error
    }

    const response: ApiResponse = {
      success: true,
      data: data,
      message: 'Transacción encontrada'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/transactions/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/transactions/[id] - Actualizar transacción
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateTransactionRequest = await request.json()

    // Validaciones básicas
    if (body.monto && body.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (body.tipo && !['ingreso', 'gasto', 'inversion', 'ahorro', 'transferencia'].includes(body.tipo)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo debe ser: ingreso, gasto, inversion, ahorro o transferencia'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const transaction = await updateTransaction(params.id, body)

    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transacción actualizada exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en PUT /api/transactions/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/transactions/[id] - Eliminar transacción
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la transacción existe
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('contable_transactions')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transacción no encontrada'
      }
      return NextResponse.json(response, { status: 404 })
    }

    await deleteTransaction(params.id)

    const response: ApiResponse = {
      success: true,
      message: 'Transacción eliminada exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en DELETE /api/transactions/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}