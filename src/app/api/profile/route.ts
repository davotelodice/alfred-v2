import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/serverSupabase'
import type { ApiResponse } from '@/lib/types'

// Forzar ruta dinámica
export const dynamic = 'force-dynamic'

// GET /api/profile - Obtener perfil del usuario
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

    // Obtener perfil del usuario desde contable_users (usando service role para bypassear RLS si es necesario)
    const { data: profile, error: profileError } = await supabaseServer
      .from('contable_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Si no existe el perfil, crearlo
    if (!profile) {
      const { data: newProfile, error: createError } = await supabaseServer
        .from('contable_users')
        .insert({
          id: user.id,
          nombre: user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          tipo_usuario: 'personal',
          moneda_preferida: 'EUR'
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      const response: ApiResponse = {
        success: true,
        data: newProfile,
        message: 'Perfil creado exitosamente'
      }
      return NextResponse.json(response)
    }

    if (profileError) {
      throw profileError
    }

    const response: ApiResponse = {
      success: true,
      data: profile,
      message: 'Perfil obtenido exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en GET /api/profile:', error)

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/profile - Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
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

    const body = await request.json()

    // Validar que telegram_chat_id no esté vacío si se intenta guardar
    if (body.telegram_chat_id !== undefined && body.telegram_chat_id.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: 'El ID de Chat de Telegram es requerido para vincular tu cuenta'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Actualizar perfil usando service role (bypassea RLS)
    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from('contable_users')
      .update({
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        telegram_chat_id: body.telegram_chat_id?.trim() || null
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    const response: ApiResponse = {
      success: true,
      data: updatedProfile,
      message: 'Perfil actualizado exitosamente'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en PUT /api/profile:', error)

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

