import { NextRequest, NextResponse } from 'next/server'
import { 
  getAsientoByIdServer,
  updateAsientoServer,
  deleteAsientoServer,
  supabaseServer
} from '@/lib/database-server'
import type { ApiResponse, UpdateAsientoRequest } from '@/lib/types'

// GET /api/asientos/[id] - Obtener asiento por ID
export async function GET(
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
    const asiento = await getAsientoByIdServer(id)

    if (!asiento) {
      const response: ApiResponse = {
        success: false,
        error: 'Asiento no encontrado'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Verificar que el asiento pertenece al usuario autenticado (RLS también lo protege)
    if (asiento.user_id !== user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'No tienes permiso para acceder a este asiento'
      }
      return NextResponse.json(response, { status: 403 })
    }

    const response: ApiResponse = {
      success: true,
      data: asiento
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/asientos/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/asientos/[id] - Actualizar asiento
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

    // Verificar que el asiento existe y pertenece al usuario
    const existingAsiento = await getAsientoByIdServer(id)
    if (!existingAsiento) {
      const response: ApiResponse = {
        success: false,
        error: 'Asiento no encontrado'
      }
      return NextResponse.json(response, { status: 404 })
    }

    if (existingAsiento.user_id !== user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'No tienes permiso para modificar este asiento'
      }
      return NextResponse.json(response, { status: 403 })
    }

    const updateData: UpdateAsientoRequest = await request.json()

    // Validaciones opcionales
    if (updateData.tipo_movimiento && !['ingreso', 'gasto', 'otro'].includes(updateData.tipo_movimiento)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo_movimiento debe ser: ingreso, gasto u otro'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (updateData.monto !== undefined && updateData.monto <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'monto debe ser mayor a 0'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const updatedAsiento = await updateAsientoServer(id, updateData)

    const response: ApiResponse = {
      success: true,
      data: updatedAsiento,
      message: 'Asiento actualizado exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en PUT /api/asientos/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/asientos/[id] - Eliminar asiento
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

    // Verificar que el asiento existe y pertenece al usuario
    const existingAsiento = await getAsientoByIdServer(id)
    if (!existingAsiento) {
      const response: ApiResponse = {
        success: false,
        error: 'Asiento no encontrado'
      }
      return NextResponse.json(response, { status: 404 })
    }

    if (existingAsiento.user_id !== user.id) {
      const response: ApiResponse = {
        success: false,
        error: 'No tienes permiso para eliminar este asiento'
      }
      return NextResponse.json(response, { status: 403 })
    }

    await deleteAsientoServer(id)

    const response: ApiResponse = {
      success: true,
      message: 'Asiento eliminado exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en DELETE /api/asientos/[id]:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

