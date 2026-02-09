# 🔄 SUBFLUJO: CREAR ASIENTO CONTABLE
## Asistente Contable Inteligente

**Propósito:** Este subflujo recibe datos de un asiento contable desde el flujo principal (procesamiento de extractos bancarios) y lo crea en el sistema mediante una petición HTTP al webhook.

---

## 📋 Descripción General

Este subflujo se ejecuta cuando el usuario envía un **extracto bancario en PDF** y el Agente IA del flujo principal procesa las transacciones. Para cada transacción encontrada en el extracto, el Agente IA llama a este subflujo para crear el asiento contable correspondiente.

---

## 🔧 Configuración de Nodos

### 1. When Executed by Another Workflow

**Tipo:** `n8n-nodes-base.executeWorkflowTrigger`

**Configuración:**
- **Input Source:** `jsonExample`
- **JSON Example:**
```json
{
  "chat_id": "123456789",
  "fecha": "2025-11-05",
  "descripcion": "CARGO POR AMORTIZACION DE PRESTAMO/CREDITO",
  "tipo_movimiento": "gasto",
  "categoria_contable": "GAS008",
  "monto": 137.39,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "saldo_posterior": 430.39,
  "referencia": "0182-0787-48-0830126020"
}
```

**Función:** Recibe los datos del asiento contable desde el flujo principal (Agente IA que procesa extractos).

---

### 2. HTTP Request

**Tipo:** `n8n-nodes-base.httpRequest`

**Configuración:**
- **Method:** `POST`
- **URL:** 
  - **Producción:** `https://TU-PROYECTO.vercel.app/api/webhook/asientos`
  - **Desarrollo Local:** `http://localhost:3000/api/webhook/asientos`
- **Headers:**
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "telefono": "{{ $json.telefono }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "moneda": "{{ $json.moneda }}",
  "monto": {{ $json.monto }},
  "cuenta_origen": "{{ $json.cuenta_origen }}",
  "cuenta_destino": "{{ $json.cuenta_destino }}",
  "saldo_posterior": {{ $json.saldo_posterior }},
  "referencia": "{{ $json.referencia }}"
}
```

**⚠️ IMPORTANTE:** 
- Reemplaza `TU_PROYECTO` con el nombre de tu proyecto en Vercel
- Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste usando `openssl rand -hex 32`
- El mismo token debe estar configurado en `.env.local` y en Vercel

**Función:** Envía el asiento contable al sistema para que sea creado en la base de datos.

---

### 3. Edit Fields

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignación:**
  - `output`: `={{ $json.data.message }}`

**Función:** Extrae el mensaje de respuesta del sistema para devolverlo al flujo principal.

---

## 📊 Formato de Datos

### Input (Desde el Flujo Principal)

El subflujo recibe un JSON con los siguientes campos:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `chat_id` | string | ✅ Sí | ID del chat de Telegram del usuario |
| `fecha` | string | ✅ Sí | Fecha en formato `YYYY-MM-DD` |
| `descripcion` | string | ✅ Sí | Descripción del movimiento |
| `tipo_movimiento` | string | ✅ Sí | Tipo: `"ingreso"`, `"gasto"` u `"otro"` |
| `categoria_contable` | string | ✅ Sí | Código de categoría (ej: `"GAS008"`, `"ING001"`) |
| `monto` | number | ✅ Sí | Monto (siempre positivo, debe ser > 0) |
| `moneda` | string | ❌ No | Código ISO 4217 (default: `"EUR"`) |
| `cuenta_origen` | string | ✅ Sí | IBAN o nombre de la cuenta origen |
| `cuenta_destino` | string | ❌ No | IBAN o nombre de la cuenta destino |
| `saldo_posterior` | number | ❌ No | Saldo después de la operación |
| `referencia` | string | ❌ No | Referencia o código de transacción |
| `fuente_datos` | string | ❌ No | Origen de la información (default: `"n8n"`) |
| `telefono` | string | ❌ No | Teléfono del usuario (opcional) |

### Output (Respuesta del Sistema)

El sistema devuelve un JSON con la siguiente estructura:

```json
{
  "success": true,
  "data": {
    "id_asiento": "uuid-del-asiento",
    "message": "Asiento contable creado exitosamente"
  }
}
```

O en caso de error:

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

---

## 🔗 Conexiones

```
When Executed by Another Workflow → HTTP Request → Edit Fields
```

---

## ✅ Ejemplos de Uso

### Ejemplo 1: Crear Asiento de Gasto (Comisión Bancaria)

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "fecha": "2025-09-01",
  "descripcion": "CARGO POR AMORTIZACION DE PRESTAMO/CREDITO",
  "tipo_movimiento": "gasto",
  "categoria_contable": "GAS008",
  "monto": 137.39,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "saldo_posterior": 430.39,
  "referencia": "0182-0787-48-0830126020",
  "fuente_datos": "Extracto Bancario BBVA"
}
```

**Resultado:** Asiento contable de gasto creado exitosamente.

---

### Ejemplo 2: Crear Asiento de Ingreso (Nómina)

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "fecha": "2025-09-02",
  "descripcion": "ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U",
  "tipo_movimiento": "ingreso",
  "categoria_contable": "ING001",
  "monto": 835.51,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "cuenta_destino": "GERIOLVEIRA S.L.U",
  "saldo_posterior": 1163.50,
  "fuente_datos": "Extracto Bancario BBVA"
}
```

**Resultado:** Asiento contable de ingreso creado exitosamente.

---

## 🔧 Troubleshooting

### Error: "Token de webhook inválido"

**Causa:** El `WEBHOOK_SECRET_TOKEN` no coincide.

**Solución:** 
1. Verifica que el token en el header `Authorization` sea exactamente el mismo que en `.env.local` y Vercel
2. Asegúrate de usar el formato: `Bearer TU_TOKEN_AQUI` (con espacio después de "Bearer")

### Error: "La categoría contable no existe o no está activa"

**Causa:** El código de categoría no existe en el catálogo o no está activa.

**Solución:** 
1. Verifica que el código de categoría sea correcto (ej: `ING001`, `GAS001`)
2. Consulta el catálogo completo usando `GET /api/asientos/categorias`
3. Asegúrate de que la categoría esté activa

### Error: "El tipo_movimiento no coincide con el tipo de la categoría"

**Causa:** El `tipo_movimiento` no coincide con el tipo de la categoría seleccionada.

**Ejemplo de error:**
- Categoría `ING001` tiene `tipo_movimiento: "ingreso"`
- Pero se envía `tipo_movimiento: "gasto"`
- Resultado: Error de validación

**Solución:** Verifica la correspondencia entre categoría y tipo de movimiento. Usa la tabla de categorías de `docs/N8N-AGENT-PROMPT-ASIENTOS.md` como referencia.

### Error: "Usuario no registrado"

**Causa:** El `chat_id` no está vinculado a ningún usuario en la base de datos.

**Solución:** El usuario debe registrarse en el dashboard web y vincular su `telegram_chat_id` en el perfil.

---

## 📚 Documentación Relacionada

- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Documentación del flujo principal coordinador
- **[N8N-SETUP.md](N8N-SETUP.md)**: Guía completa de configuración de n8n
- **[N8N-AGENT-PROMPT-ASIENTOS.md](N8N-AGENT-PROMPT-ASIENTOS.md)**: Prompt del sistema para procesar extractos bancarios


