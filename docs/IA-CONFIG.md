# 🤖 Configuración de IA - Generación de Consejos Financieros

## 📋 Resumen

El sistema de Asistente Contable Inteligente incluye integración con OpenAI GPT para generar consejos financieros automáticamente basados en el análisis de transacciones y KPIs del usuario.

## 🔧 Configuración

### 1. Obtener API Key de OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia la clave (formato: `sk-...`)

### 2. Agregar Variables de Entorno

Edita el archivo `.env.local` en la raíz del proyecto:

```bash
# OpenAI - Generación de Consejos con IA
OPENAI_API_KEY=sk-tu-api-key-de-openai
OPENAI_MODEL=gpt-4o-mini  # Opcional, por defecto gpt-4o-mini
```

### 3. Modelos Disponibles

- `gpt-4o-mini` (Recomendado, más económico)
- `gpt-4o` (Más potente, más costoso)
- `gpt-3.5-turbo` (Alternativa económica)

## 📍 Ubicación de Archivos

### Servicio de IA
- **Archivo:** `src/lib/ai-service.ts`
- **Función principal:** `generateAdviceWithAI()`

### Prompts del Agente
- **Archivo:** `src/lib/prompts.ts`
- **Contiene:** Prompts del sistema y plantillas de análisis

### API Route
- **Archivo:** `src/app/api/advice/generate/route.ts`
- **Endpoint:** `POST /api/advice/generate`

## 🚀 Uso

### Generar Consejos Automáticamente

**Desde el Frontend (JavaScript):**

```typescript
const generateAdvice = async () => {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const response = await fetch('/api/advice/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      periodo: '2024-10' // Opcional, por defecto período actual
    })
  })

  const data = await response.json()
  console.log('Consejos generados:', data)
}
```

**Desde cURL:**

```bash
curl -X POST http://localhost:3000/api/advice/generate \
  -H "Authorization: Bearer TU_TOKEN_DE_SESION" \
  -H "Content-Type: application/json" \
  -d '{"periodo": "2024-10"}'
```

## 📊 Cómo Funciona

1. **Análisis de Datos:**
   - El sistema obtiene todas las transacciones del usuario para el período especificado
   - Obtiene los KPIs calculados para ese período
   - Calcula estadísticas adicionales (gastos por categoría, patrones, etc.)

2. **Generación de Consejos:**
   - Envía los datos a OpenAI GPT con un prompt especializado
   - GPT analiza los datos y genera recomendaciones financieras
   - Las recomendaciones se categorizan por prioridad (baja, normal, alta, critica)

3. **Almacenamiento:**
   - Los consejos se guardan en la tabla `contable_advice`
   - Cada consejo incluye:
     - `tipo_alerta`: Tipo de alerta detectada
     - `mensaje`: Mensaje del consejo
     - `prioridad`: Nivel de prioridad
     - `generado_por`: "IA"

## 🎯 Tipos de Alertas

El sistema puede generar los siguientes tipos de alertas:

- `gasto_excesivo`: Gastos que superan lo recomendado
- `oportunidad_ahorro`: Oportunidades identificadas para ahorrar
- `riesgo_liquidez`: Riesgo de problemas de liquidez
- `desbalance_financiero`: Desbalance entre ingresos y gastos
- `categoria_dominante`: Una categoría de gasto está dominando
- `patron_anomalo`: Patrón de gasto anómalo detectado
- `meta_ahorro`: Recomendaciones para alcanzar metas de ahorro
- `optimizacion`: Sugerencias de optimización financiera

## 🔐 Seguridad

- La API key de OpenAI debe estar solo en el servidor (`.env.local`)
- El endpoint requiere autenticación (Bearer token)
- Los consejos se generan solo para el usuario autenticado
- Los datos se envían a OpenAI de forma segura (HTTPS)

## 📝 Notas Importantes

- **Sin API Key:** Si no se configura `OPENAI_API_KEY`, el sistema seguirá funcionando pero no generará consejos automáticos
- **Costo:** Cada llamada a GPT tiene un costo. El modelo `gpt-4o-mini` es el más económico
- **Límites:** Revisa los límites de tu cuenta de OpenAI
- **Privacidad:** Los datos financieros se envían a OpenAI para análisis. Asegúrate de que esto cumpla con tus políticas de privacidad

## 🧪 Testing

Para probar el sistema:

1. Asegúrate de tener transacciones y KPIs en la base de datos
2. Configura `OPENAI_API_KEY` en `.env.local`
3. Reinicia el servidor de desarrollo (`npm run dev`)
4. Llama al endpoint `/api/advice/generate`
5. Verifica que los consejos se crearon en `contable_advice`

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY no configurada"
**Solución:** Agrega `OPENAI_API_KEY` a tu `.env.local`

### Error: "Invalid API key"
**Solución:** Verifica que tu API key sea correcta y esté activa en OpenAI

### Error: "Rate limit exceeded"
**Solución:** Has excedido el límite de tu cuenta. Espera o actualiza tu plan de OpenAI

### No se generan consejos
**Solución:** 
- Verifica que haya transacciones y KPIs en el período especificado
- Revisa los logs del servidor para errores
- Verifica que `OPENAI_API_KEY` esté configurada correctamente

