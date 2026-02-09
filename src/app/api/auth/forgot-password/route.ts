import { NextRequest, NextResponse } from 'next/server'

const EDGE_FUNCTION_EMAIL_SECRET = process.env.EDGE_FUNCTION_EMAIL_SECRET
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
  try {
    if (!EDGE_FUNCTION_EMAIL_SECRET || !SUPABASE_FUNCTIONS_URL) {
      return NextResponse.json(
        { error: 'Recuperación de contraseña no configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json(
        { error: 'El campo email es obligatorio' },
        { status: 400 }
      )
    }

    const redirectTo = typeof body.redirect_to === 'string' ? body.redirect_to.trim() : undefined

    const url = `${SUPABASE_FUNCTIONS_URL}/functions/v1/request-password-recovery`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-secret': EDGE_FUNCTION_EMAIL_SECRET,
      },
      body: JSON.stringify({ email, redirect_to: redirectTo }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Error al solicitar recuperación' },
        { status: res.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message ?? 'Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.',
    })
  } catch (err) {
    console.error('Forgot password API error:', err)
    return NextResponse.json(
      { error: 'Error de servidor' },
      { status: 500 }
    )
  }
}
