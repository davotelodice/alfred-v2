import { NextRequest, NextResponse } from 'next/server'
import { getCategoriasAsientosServer } from '@/lib/database-server'
import type { ApiResponse } from '@/lib/types'

// GET /api/asientos/categorias - Obtener catálogo de categorías contables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoMovimiento = searchParams.get('tipo_movimiento') as 'ingreso' | 'gasto' | 'otro' | null

    const categorias = await getCategoriasAsientosServer(tipoMovimiento || undefined)

    const response: ApiResponse = {
      success: true,
      data: categorias,
      message: `${categorias.length} categorías encontradas`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/asientos/categorias:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}


