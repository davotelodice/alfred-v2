import { NextRequest, NextResponse } from 'next/server'
import { 
  getAsientosByUserServer,
  createAsientoServer,
  supabaseServer
} from '@/lib/database-server'
import type { ApiResponse, CreateAsientoRequest, AsientoFilters } from '@/lib/types'

// GET /api/asientos - Obtener asientos del usuario autenticado
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    const filters: AsientoFilters = {
      fecha_desde: searchParams.get('fecha_desde') || undefined,
      fecha_hasta: searchParams.get('fecha_hasta') || undefined,
      categoria_contable: searchParams.get('categoria_contable') || undefined,
      tipo_movimiento: searchParams.get('tipo_movimiento') as 'ingreso' | 'gasto' | 'otro' | undefined,
      cuenta_origen: searchParams.get('cuenta_origen') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const asientos = await getAsientosByUserServer(user.id, filters)

    const response: ApiResponse = {
      success: true,
      data: asientos,
      message: `${asientos.length} asientos encontrados`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/asientos:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/asientos - Crear nuevo asiento
export async function POST(request: NextRequest) {
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

    const body: Omit<CreateAsientoRequest, 'user_id'> = await request.json()

    // Validaciones
    if (!body.fecha) {
      const response: ApiResponse = {
        success: false,
        error: 'fecha es requerida (formato: YYYY-MM-DD)'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.descripcion || body.descripcion.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: 'descripcion es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.tipo_movimiento || !['ingreso', 'gasto', 'otro'].includes(body.tipo_movimiento)) {
      const response: ApiResponse = {
        success: false,
        error: 'tipo_movimiento debe ser: ingreso, gasto u otro'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (!body.categoria_contable) {
      const response: ApiResponse = {
        success: false,
        error: 'categoria_contable es requerida'
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

    if (!body.cuenta_origen || body.cuenta_origen.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: 'cuenta_origen es requerida'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const fullAsientoData: CreateAsientoRequest = {
      ...body,
      user_id: user.id
    }

    const asiento = await createAsientoServer(fullAsientoData)

    const response: ApiResponse = {
      success: true,
      data: asiento,
      message: 'Asiento contable creado exitosamente'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/asientos:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}




