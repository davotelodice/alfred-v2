import { NextRequest, NextResponse } from 'next/server'

const EDGE_FUNCTION_EMAIL_SECRET = process.env.EDGE_FUNCTION_EMAIL_SECRET
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
  try {
    if (!EDGE_FUNCTION_EMAIL_SECRET || !SUPABASE_FUNCTIONS_URL) {
      return NextResponse.json(
        { error: 'Envío de email no configurado' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : body.nombre ?? ''

    if (!to) {
      return NextResponse.json(
        { error: 'Campo "to" (email) obligatorio' },
        { status: 400 }
      )
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Bienvenido${nombre ? `, ${nombre}` : ''}</h2>
  <p>Tu cuenta en Asistente Contable se ha creado correctamente.</p>
  <p>Ya puedes iniciar sesión y empezar a usar la aplicación.</p>
  <p style="color: #666; font-size: 12px;">Asistente Contable</p>
</body>
</html>`

    const url = `${SUPABASE_FUNCTIONS_URL}/functions/v1/send-email`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-secret': EDGE_FUNCTION_EMAIL_SECRET,
      },
      body: JSON.stringify({
        to,
        subject: 'Cuenta creada - Asistente Contable',
        html,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Error al enviar el email' },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send welcome email error:', err)
    return NextResponse.json(
      { error: 'Error de servidor' },
      { status: 500 }
    )
  }
}
