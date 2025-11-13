# 🔄 SUBFLUJO: CREAR TRANSACCIÓN
## Asistente Contable Inteligente

**Propósito:** Este subflujo recibe datos de una transacción desde el flujo principal y la crea en el sistema mediante una petición HTTP al webhook.

---

## 📋 Descripción General

Este subflujo se ejecuta cuando el usuario quiere **CREAR una nueva transacción financiera** (gasto, ingreso, ahorro o inversión). Recibe los datos del flujo principal (a través del Agente IA) y realiza una petición HTTP POST al endpoint `/api/webhook/n8n`.

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
  "telefono": "+34612345678",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2025-11-02",
  "metodo_pago": "tarjeta"
}
```

**Función:** Recibe los datos de la transacción desde el flujo principal.

---

### 2. HTTP Request

**Tipo:** `n8n-nodes-base.httpRequest`

**Configuración:**
- **Method:** `POST`
- **URL:** 
  - **Producción:** `https://TU-PROYECTO.vercel.app/api/webhook/n8n`
  - **Desarrollo Local:** `http://localhost:3000/api/webhook/n8n`
- **Headers:**
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "telefono": "{{ $json.telefono }}",
  "tipo": "{{ $json.tipo }}",
  "monto": "{{ $json.monto }}",
  "descripcion": "{{ $json.descripcion }}",
  "fecha": "{{ $json.fecha }}"
}
```

**⚠️ IMPORTANTE:** 
- Reemplaza `TU_PROYECTO` con el nombre de tu proyecto en Vercel
- Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste usando `openssl rand -hex 32`
- El mismo token debe estar configurado en `.env.local` y en Vercel

**Función:** Envía la transacción al sistema para que sea creada en la base de datos.

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
| `telefono` | string | ❌ No | Teléfono del usuario (opcional) |
| `tipo` | string | ✅ Sí | Tipo de transacción: `"ingreso"`, `"gasto"`, `"inversion"`, `"ahorro"` |
| `monto` | number | ✅ Sí | Monto de la transacción (debe ser > 0) |
| `descripcion` | string | ✅ Sí | Descripción de la transacción |
| `fecha` | string | ✅ Sí | Fecha en formato `YYYY-MM-DD` |
| `metodo_pago` | string | ❌ No | Método de pago usado (opcional) |

### Output (Respuesta del Sistema)

El sistema devuelve un JSON con la siguiente estructura:

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-transaccion",
    "message": "Transacción creada exitosamente"
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

### Ejemplo 1: Crear Gasto

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "tipo": "gasto",
  "monto": 50,
  "descripcion": "Supermercado",
  "fecha": "2025-11-07",
  "metodo_pago": "tarjeta"
}
```

**Resultado:** Transacción de gasto creada exitosamente.

---

### Ejemplo 2: Crear Ingreso

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "tipo": "ingreso",
  "monto": 1500,
  "descripcion": "Salario",
  "fecha": "2025-11-01"
}
```

**Resultado:** Transacción de ingreso creada exitosamente.

---

## 🔧 Troubleshooting

### Error: "Token de webhook inválido"

**Causa:** El `WEBHOOK_SECRET_TOKEN` no coincide.

**Solución:** 
1. Verifica que el token en el header `Authorization` sea exactamente el mismo que en `.env.local` y Vercel
2. Asegúrate de usar el formato: `Bearer TU_TOKEN_AQUI` (con espacio después de "Bearer")

### Error: "chat_id es requerido"

**Causa:** El campo `chat_id` no está presente en el JSON de entrada.

**Solución:** Asegúrate de que el Agente IA del flujo principal esté pasando el `chat_id` correctamente.

### Error: "Usuario no registrado"

**Causa:** El `chat_id` no está vinculado a ningún usuario en la base de datos.

**Solución:** El usuario debe registrarse en el dashboard web y vincular su `telegram_chat_id` en el perfil.

---

## 📚 Documentación Relacionada

- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Documentación del flujo principal coordinador
- **[N8N-SETUP.md](N8N-SETUP.md)**: Guía completa de configuración de n8n
- **[N8N-AGENT-PROMPT.md](N8N-AGENT-PROMPT.md)**: Prompt del sistema para el Agente IA

