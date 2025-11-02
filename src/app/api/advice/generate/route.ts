// =====================================================
// API ROUTE: Generar Consejos con IA
// =====================================================
// POST /api/advice/generate
// Genera consejos financieros automáticamente usando GPT

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/serverSupabase'
import { generateAdviceWithAI } from '@/lib/ai-service'
import type { ApiResponse, CreateAdviceRequest } from '@/lib/types'

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

    // Obtener período del body (opcional, por defecto período actual)
    const body = await request.json().catch(() => ({}))
    const periodo = body.periodo || new Date().toISOString().slice(0, 7) // YYYY-MM

    console.log('[API] Generando consejos para período:', periodo)
    console.log('[API] Usuario:', user.id)

    // Convertir período YYYY-MM a rango de fechas
    const [year, month] = periodo.split('-')
    const fechaInicio = `${year}-${month.padStart(2, '0')}-01`
    
    // Calcular último día del mes
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    const ultimoDia = new Date(yearNum, monthNum, 0).getDate()
    const fechaFin = `${year}-${month.padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`

    console.log('[API] Rango de fechas:', fechaInicio, 'a', fechaFin)

    // Obtener transacciones del usuario para el período
    const { data: transactions, error: transactionsError } = await supabaseServer
      .from('contable_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: false })

    if (transactionsError) {
      console.error('[API] Error al obtener transacciones:', transactionsError)
      throw transactionsError
    }

    console.log('[API] Transacciones encontradas:', transactions?.length || 0)

    // Obtener KPIs del usuario para el período
    const { data: kpis, error: kpisError } = await supabaseServer
      .from('contable_kpi_summary')
      .select('*')
      .eq('user_id', user.id)
      .eq('periodo', periodo)

    if (kpisError) {
      console.error('[API] Error al obtener KPIs:', kpisError)
      throw kpisError
    }

    console.log('[API] KPIs encontrados:', kpis?.length || 0)
    if (kpis && kpis.length > 0) {
      console.log('[API] Primer KPI:', {
        periodo: kpis[0].periodo,
        ingreso_total: kpis[0].ingreso_total,
        gasto_total: kpis[0].gasto_total,
        balance: kpis[0].balance
      })
    }

    // Generar consejos con IA
    const adviceList = await generateAdviceWithAI(
      user.id,
      transactions || [],
      kpis || [],
      periodo
    )

    // Guardar consejos en la base de datos usando supabaseServer
    const savedAdvices = []
    for (const advice of adviceList) {
      try {
        const adviceData: CreateAdviceRequest = {
          user_id: advice.user_id,
          tipo_alerta: advice.tipo_alerta,
          mensaje: advice.mensaje,
          prioridad: advice.prioridad,
          generado_por: advice.generado_por || 'IA'
        }

        const { data: savedAdvice, error: saveError } = await supabaseServer
          .from('contable_advice')
          .insert(adviceData)
          .select()
          .single()

        if (saveError) {
          throw saveError
        }

        savedAdvices.push(savedAdvice)
      } catch (error) {
        console.error('Error al guardar consejo:', error)
        // Continuar con los siguientes consejos
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        generated: adviceList.length,
        saved: savedAdvices.length,
        advices: savedAdvices
      },
      message: `${savedAdvices.length} consejos generados y guardados exitosamente`
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/advice/generate:', error)

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

