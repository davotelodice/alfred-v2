import { NextRequest, NextResponse } from 'next/server'

const EDGE_FUNCTION_EMAIL_SECRET = process.env.EDGE_FUNCTION_EMAIL_SECRET
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
    try {
        if (!EDGE_FUNCTION_EMAIL_SECRET || !SUPABASE_FUNCTIONS_URL) {
            return NextResponse.json(
                { error: 'Configuración incompleta en servidor (Email Secret o URL)' },
                { status: 500 }
            )
        }

        const body = await request.json()

        // Llamar a la Edge Function
        const url = `${SUPABASE_FUNCTIONS_URL}/functions/v1/request-signup`
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-email-secret': EDGE_FUNCTION_EMAIL_SECRET,
            },
            body: JSON.stringify(body),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || 'Error al procesar la solicitud en Edge Function' },
                { status: res.status }
            )
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Request signup proxy error:', err)
        return NextResponse.json(
            { error: 'Error de servidor interno' },
            { status: 500 }
        )
    }
}
