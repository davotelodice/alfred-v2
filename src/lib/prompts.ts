// =====================================================
// PROMPTS DEL AGENTE FINANCIERO
// =====================================================
// Este archivo contiene los prompts del sistema para
// el agente de IA que genera consejos financieros

import type { ContableKPISummary, ContableTransaction } from './types'

export const FINANCIAL_ADVISOR_PROMPTS = {
  // Prompt del sistema principal
  system: `Eres un experto asesor financiero personal especializado en análisis de estados de cuenta y gestión de finanzas personales.

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
      "tipo_alerta": "tipo de alerta",
      "mensaje": "mensaje claro y conciso del consejo",
      "prioridad": "baja|normal|alta|critica"
    }
  ]
}

PRIORIDADES:
- "critica": Problemas financieros graves que requieren acción inmediata
- "alta": Situaciones importantes que deben atenderse pronto
- "normal": Recomendaciones generales de mejora
- "baja": Sugerencias opcionales o informativas`,

  // Tipos de alertas que puede generar
  alertTypes: {
    gasto_excesivo: 'Gastos que superan lo recomendado',
    oportunidad_ahorro: 'Oportunidades identificadas para ahorrar',
    riesgo_liquidez: 'Riesgo de problemas de liquidez',
    desbalance_financiero: 'Desbalance entre ingresos y gastos',
    categoria_dominante: 'Una categoría de gasto está dominando',
    patron_anomalo: 'Patrón de gasto anómalo detectado',
    meta_ahorro: 'Recomendaciones para alcanzar metas de ahorro',
    optimizacion: 'Sugerencias de optimización financiera'
  },

  // Plantilla para análisis de período
  analysisTemplate: (periodo: string, kpi: ContableKPISummary | null, transactions: ContableTransaction[]) => {
    return `Analiza los siguientes datos financieros del usuario para el período ${periodo}:

KPIs FINANCIEROS:
- Ingresos totales: €${kpi?.ingreso_total?.toFixed(2) || '0.00'}
- Gastos totales: €${kpi?.gasto_total?.toFixed(2) || '0.00'}
- Balance: €${kpi?.balance?.toFixed(2) || '0.00'}
- Porcentaje de ahorro: ${kpi?.porcentaje_ahorro?.toFixed(1) || '0'}%
- Liquidez: €${kpi?.liquidez?.toFixed(2) || '0.00'}
- Endeudamiento: ${kpi?.endeudamiento?.toFixed(2) || '0'}%

TRANSACCIONES:
- Total de transacciones: ${transactions.length}

Analiza estos datos y genera recomendaciones financieras inteligentes.`
  }
}

