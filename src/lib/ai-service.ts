// =====================================================
// SERVICIO DE IA PARA GENERAR CONSEJOS FINANCIEROS
// =====================================================

import OpenAI from 'openai'
import type { ContableTransaction, ContableKPISummary, ContableAdvice } from './types'

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// =====================================================
// PROMPTS DEL AGENTE
// =====================================================

const SYSTEM_PROMPT = `Eres un experto asesor financiero personal especializado en análisis de estados de cuenta y gestión de finanzas personales.

Tu objetivo es analizar los datos financieros del usuario y proporcionar recomendaciones inteligentes, prácticas y accionables.

REGLAS IMPORTANTES:
1. Analiza patrones de gasto, ingresos y ahorros
2. Identifica oportunidades de optimización
3. Detecta riesgos financieros potenciales
4. Proporciona consejos específicos y personalizados
5. Usa un tono profesional pero amigable
6. Sé conciso y claro en tus recomendaciones

FORMATO DE RESPUESTA:
Debes responder SOLO con un objeto JSON válido con esta estructura:
{
  "advices": [
    {
      "tipo_alerta": "tipo de alerta (ej: "gasto_excesivo", "oportunidad_ahorro", "riesgo_liquidez", etc)",
      "mensaje": "mensaje claro y conciso del consejo",
      "prioridad": "baja|normal|alta|critica"
    }
  ]
}

PRIORIDADES:
- "critica": Problemas financieros graves que requieren acción inmediata (ej: gastos superando ingresos, deuda excesiva)
- "alta": Situaciones importantes que deben atenderse pronto (ej: gastos innecesarios, oportunidades de ahorro)
- "normal": Recomendaciones generales de mejora
- "baja": Sugerencias opcionales o informativas`

const getAnalysisPrompt = (
  transactions: ContableTransaction[],
  kpis: ContableKPISummary[],
  periodo: string
) => {
  // Calcular estadísticas de transacciones
  const gastos = transactions.filter(t => t.tipo === 'gasto')
  const ingresos = transactions.filter(t => t.tipo === 'ingreso')
  const gastoTotal = gastos.reduce((sum, t) => sum + t.monto, 0)
  const ingresoTotal = ingresos.reduce((sum, t) => sum + t.monto, 0)

  // Agrupar gastos por categoría/descripción
  const gastosPorCategoria = gastos.reduce((acc, t) => {
    const key = t.descripcion || 'Sin descripción'
    acc[key] = (acc[key] || 0) + t.monto
    return acc
  }, {} as Record<string, number>)

  const topGastos = Object.entries(gastosPorCategoria)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([desc, monto]) => ({ descripcion: desc, monto }))

  const kpi = kpis.find(k => k.periodo === periodo)

  return `Analiza los siguientes datos financieros del usuario para el período ${periodo}:

KPIs FINANCIEROS:
- Ingresos totales: €${kpi?.ingreso_total.toFixed(2) || '0.00'}
- Gastos totales: €${kpi?.gasto_total.toFixed(2) || '0.00'}
- Balance: €${kpi?.balance.toFixed(2) || '0.00'}
- Porcentaje de ahorro: ${kpi?.porcentaje_ahorro?.toFixed(1) || '0'}%
- Liquidez: €${kpi?.liquidez?.toFixed(2) || '0.00'}
- Endeudamiento: ${kpi?.endeudamiento?.toFixed(2) || '0'}%

ESTADÍSTICAS DE TRANSACCIONES:
- Total de transacciones: ${transactions.length}
- Total ingresos: €${ingresoTotal.toFixed(2)}
- Total gastos: €${gastoTotal.toFixed(2)}

TOP 5 GASTOS MÁS ALTO:
${topGastos.map((g, i) => `${i + 1}. ${g.descripcion}: €${g.monto.toFixed(2)}`).join('\n')}

TRANSACCIONES RECIENTES (últimas 10):
${transactions.slice(0, 10).map(t => 
  `- [${t.tipo.toUpperCase()}] €${t.monto.toFixed(2)} - ${t.descripcion || 'Sin descripción'} (${t.fecha})`
).join('\n')}

Analiza estos datos y genera recomendaciones financieras inteligentes. Considera:
1. Si los gastos superan los ingresos
2. Patrones de gasto excesivo en ciertas categorías
3. Oportunidades de ahorro
4. Riesgos de liquidez
5. Proporción saludable de ahorro
6. Comportamientos financieros positivos para reforzar

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional.`
}

// =====================================================
// FUNCIÓN PRINCIPAL: GENERAR CONSEJOS CON IA
// =====================================================

export async function generateAdviceWithAI(
  userId: string,
  transactions: ContableTransaction[],
  kpis: ContableKPISummary[],
  periodo: string
): Promise<ContableAdvice[]> {
  try {
    console.log('[AI Service] Iniciando generación de consejos...')
    console.log('[AI Service] userId:', userId)
    console.log('[AI Service] periodo:', periodo)
    console.log('[AI Service] transacciones:', transactions.length)
    console.log('[AI Service] kpis:', kpis.length)

    // Verificar que hay API key configurada
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI Service] OPENAI_API_KEY no configurada. No se pueden generar consejos automáticos.')
      return []
    }

    // Si no hay suficientes datos, no generar consejos
    if (transactions.length === 0 && (!kpis.length || kpis[0].ingreso_total === 0)) {
      console.log('[AI Service] No hay suficientes datos para generar consejos')
      console.log('[AI Service] transactions.length:', transactions.length)
      console.log('[AI Service] kpis.length:', kpis.length)
      if (kpis.length > 0) {
        console.log('[AI Service] kpis[0].ingreso_total:', kpis[0].ingreso_total)
      }
      return []
    }

    // Preparar prompt
    const analysisPrompt = getAnalysisPrompt(transactions, kpis, periodo)
    console.log('[AI Service] Prompt generado, longitud:', analysisPrompt.length)

    // Llamar a OpenAI
    console.log('[AI Service] Llamando a OpenAI...')
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: analysisPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    })

    console.log('[AI Service] Respuesta de OpenAI recibida')
    console.log('[AI Service] Modelo usado:', completion.model)
    console.log('[AI Service] Tokens usados:', completion.usage)

    // Parsear respuesta
    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      console.error('[AI Service] No se recibió contenido en la respuesta de OpenAI')
      throw new Error('No se recibió respuesta de OpenAI')
    }

    console.log('[AI Service] Contenido de respuesta:', responseContent.substring(0, 200))

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('[AI Service] Error al parsear JSON:', parseError)
      console.error('[AI Service] Contenido completo:', responseContent)
      throw new Error(`Error al parsear respuesta de OpenAI: ${parseError}`)
    }

    const advices = parsedResponse.advices || []
    console.log('[AI Service] Consejos generados:', advices.length)

    // Convertir a formato ContableAdvice
    const adviceList: ContableAdvice[] = advices.map((advice: any) => ({
      id: '', // Se generará en la BD
      user_id: userId,
      tipo_alerta: advice.tipo_alerta || 'general',
      mensaje: advice.mensaje,
      prioridad: (advice.prioridad || 'normal') as 'baja' | 'normal' | 'alta' | 'critica',
      generado_por: 'IA',
      fecha: new Date().toISOString(),
      leido: false
    }))

    console.log('[AI Service] Lista de consejos formateada:', adviceList.length)
    console.log('[AI Service] Primer consejo:', adviceList[0]?.mensaje?.substring(0, 50))

    return adviceList
  } catch (error) {
    console.error('[AI Service] Error al generar consejos con IA:', error)
    if (error instanceof Error) {
      console.error('[AI Service] Mensaje de error:', error.message)
      console.error('[AI Service] Stack:', error.stack)
    }
    // No lanzar error, solo loguear - el sistema debe seguir funcionando sin IA
    return []
  }
}

// =====================================================
// FUNCIÓN: ANALIZAR ESTADO DE CUENTA
// =====================================================

export async function analyzeAccountStatement(
  userId: string,
  statementData: {
    transactions: ContableTransaction[]
    kpis: ContableKPISummary[]
    periodo: string
  }
): Promise<ContableAdvice[]> {
  return generateAdviceWithAI(
    userId,
    statementData.transactions,
    statementData.kpis,
    statementData.periodo
  )
}

