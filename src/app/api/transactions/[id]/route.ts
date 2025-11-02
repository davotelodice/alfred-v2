// =====================================================
// API ROUTE: Actualizar y Eliminar Transacciones
// =====================================================
// PUT /api/transactions/[id] - Actualizar transacción
// DELETE /api/transactions/[id] - Eliminar transacción

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/serverSupabase'
import type { ApiResponse, UpdateTransactionRequest } from '@/lib/types'

// PUT /api/transactions/[id] - Actualizar transacción
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    const body: UpdateTransactionRequest = await request.json()

    // Verificar que la transacción existe y pertenece al usuario
    const { data: existingTransaction, error: fetchError } = await supabaseServer
      .from('contable_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transacción no encontrada o no tienes permisos para modificarla'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Validaciones
    if (body.tipo && !['ingreso', 'gasto', 'inversion', 'ahorro', 'transferencia'].includes(body.tipo)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo debe ser: ingreso, gasto, inversion, ahorro o transferencia'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (body.monto !== undefined && body.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Actualizar transacción
    const { data: updatedTransaction, error: updateError } = await supabaseServer
      .from('contable_transactions')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    const response: ApiResponse = {
      success: true,
      data: updatedTransaction,
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    // Verificar que la transacción existe y pertenece al usuario
    const { data: existingTransaction, error: fetchError } = await supabaseServer
      .from('contable_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transacción no encontrada o no tienes permisos para eliminarla'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Eliminar transacción
    const { error: deleteError } = await supabaseServer
      .from('contable_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

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
