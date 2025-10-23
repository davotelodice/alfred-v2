import { NextRequest, NextResponse } from 'next/server'
import { getUserKPIs } from '@/lib/database'
import type { ApiResponse, KPIFilters } from '@/lib/types'

// GET /api/kpis - Obtener KPIs del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: KPIFilters = {
      periodo: searchParams.get('periodo') || undefined,
      fecha_desde: searchParams.get('fecha_desde') || undefined,
      fecha_hasta: searchParams.get('fecha_hasta') || undefined
    }

    const kpis = await getUserKPIs(filters.periodo)

    const response: ApiResponse = {
      success: true,
      data: kpis,
      message: `${kpis.length} KPIs encontrados`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/kpis:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}