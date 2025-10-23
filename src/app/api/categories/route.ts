import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/database'
import type { ApiResponse } from '@/lib/types'

// GET /api/categories - Obtener categorías disponibles
export async function GET() {
  try {
    const categories = await getCategories()

    const response: ApiResponse = {
      success: true,
      data: categories,
      message: `${categories.length} categorías encontradas`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/categories:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}