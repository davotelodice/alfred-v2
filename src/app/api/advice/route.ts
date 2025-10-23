import { NextRequest, NextResponse } from 'next/server'
import { getUserAdvice, createAdvice } from '@/lib/database'
import type { ApiResponse, CreateAdviceRequest } from '@/lib/types'

// GET /api/advice - Obtener recomendaciones del usuario
export async function GET() {
  try {
    const advice = await getUserAdvice()

    const response: ApiResponse = {
      success: true,
      data: advice,
      message: `${advice.length} recomendaciones encontradas`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/advice:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/advice - Crear nueva recomendación
export async function POST(request: NextRequest) {
  try {
    const body: CreateAdviceRequest = await request.json()

    // Validaciones básicas
    if (!body.user_id) {
      const response: ApiResponse = {
        success: false,
        error: 'user_id es requerido'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.mensaje) {
      const response: ApiResponse = {
        success: false,
        error: 'mensaje es requerido'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (body.prioridad && !['baja', 'normal', 'alta', 'critica'].includes(body.prioridad)) {
      const response: ApiResponse = {
        success: false,
        error: 'prioridad debe ser: baja, normal, alta o critica'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const advice = await createAdvice(body)

    const response: ApiResponse = {
      success: true,
      data: advice,
      message: 'Recomendación creada exitosamente'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/advice:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}