import { NextRequest, NextResponse } from 'next/server'

const EDGE_FUNCTION_EMAIL_SECRET = process.env.EDGE_FUNCTION_EMAIL_SECRET
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
  try {
    if (!EDGE_FUNCTION_EMAIL_SECRET || !SUPABASE_FUNCTIONS_URL) {
      return NextResponse.json(
        { error: 'Recuperación de contraseña no configurada. Añade EDGE_FUNCTION_EMAIL_SECRET y NEXT_PUBLIC_SUPABASE_URL en Vercel.' },
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

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-email-secret': EDGE_FUNCTION_EMAIL_SECRET,
        },
        body: JSON.stringify({ email, redirect_to: redirectTo }),
        signal: AbortSignal.timeout(15000),
      })
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'fetch failed'
      console.error('Forgot password: fetch to Edge Function failed', { url: url.replace(/\/[^/]+$/, '/***'), message: msg })
      return NextResponse.json(
        { error: 'No se pudo conectar con el servidor de recuperación. Comprueba que la URL de Supabase (NEXT_PUBLIC_SUPABASE_URL) sea la correcta y que las Edge Functions estén desplegadas.' },
        { status: 502 }
      )
    }

    const text = await res.text()
    const data = (() => { try { return JSON.parse(text) } catch { return {} } })()

    if (!res.ok) {
      console.error('Forgot password: Edge Function error', { status: res.status, body: data.error ?? text.slice(0, 200) })
      const userMsg =
        res.status === 401
          ? 'Configuración incorrecta. Comprueba que EDGE_FUNCTION_EMAIL_SECRET en Vercel coincida con el del servicio "functions" de Supabase.'
          : (data.error as string) ?? 'Error al solicitar recuperación.'
      return NextResponse.json(
        { error: userMsg },
        { status: res.status >= 500 ? 502 : res.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message ?? 'Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.',
    })
  } catch (err) {
    console.error('Forgot password API error:', err)
    return NextResponse.json(
      { error: 'Error de servidor. Revisa los logs en Vercel.' },
      { status: 500 }
    )
  }
}
