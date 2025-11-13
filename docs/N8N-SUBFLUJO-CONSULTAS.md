# 🔄 SUBFLUJO: CONSULTAS
## Asistente Contable Inteligente

**Propósito:** Este subflujo consulta transacciones existentes según filtros (tipo, rango de fechas, etc.) y formatea la respuesta para el usuario.

---

## 📋 Descripción General

Este subflujo se ejecuta cuando el usuario quiere **CONSULTAR transacciones existentes**. Recibe los parámetros de consulta del flujo principal, los procesa, realiza la petición HTTP al endpoint `/api/transactions/query`, y formatea la respuesta para que sea legible por el usuario.

---

## 🔧 Configuración de Nodos

### 1. When Executed by Another Workflow

**Tipo:** `n8n-nodes-base.executeWorkflowTrigger`

**Configuración:**
- **Input Source:** `passthrough`

**Función:** Recibe los datos de la consulta desde el flujo principal.

---

### 2. Code in JavaScript (Procesamiento de consulta)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
// ✅ Obtener todos los items de entrada
const inputData = $input.all();

// ✅ Procesar cada item
const results = inputData.map(item => {
  let data = {};

  // 🧩 Paso 1: detectar y parsear el campo query
  if (typeof item.json.query === "string") {
    try {
      data = JSON.parse(item.json.query);
    } catch (err) {
      return {
        json: {
          error: true,
          message: "Error al parsear el JSON del campo 'query': " + err.message,
        }
      };
    }
  } else if (typeof item.json.query === "object") {
    data = item.json.query;
  } else {
    data = item.json;
  }

  // 🧩 Paso 2: validar chat_id obligatorio
  if (!data.chat_id) {
    return {
      json: {
        error: true,
        message: "chat_id es requerido"
      }
    };
  }

  // 🧼 Paso 3: limpieza de datos (eliminar nulos, undefined y strings vacíos)
  const cleanData = Object.entries(data)
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .reduce((obj, [k, v]) => ({
      ...obj,
      [k]: typeof v === "string" ? v.trim() : v
    }), {});

  // 🎯 Paso 4: construir query base para HTTP Request
  const query = { chat_id: cleanData.chat_id };

  if (cleanData.fecha_desde) query.fecha_desde = cleanData.fecha_desde;
  if (cleanData.fecha_hasta) query.fecha_hasta = cleanData.fecha_hasta;

  // 🔄 Paso 5: normalizar tipo_consulta
  const tipoConsulta = (cleanData.tipo_consulta || "todas").toLowerCase();

  switch (tipoConsulta) {
    case "ingresos": query.tipo = "ingreso"; break;
    case "gastos": query.tipo = "gasto"; break;
    case "ahorros": query.tipo = "ahorro"; break;
    case "inversiones": query.tipo = "inversion"; break;
    case "resumen":
    case "todas":
      break;
  }

  // 🧠 Paso 6: determinar categoría de consulta
  let categoria = "sin_filtro";

  if (tipoConsulta === "resumen") {
    categoria = "resumen";
  } else if (cleanData.fecha_desde && cleanData.fecha_hasta && tipoConsulta !== "todas") {
    categoria = "rango_fechas_tipo";
  } else if (cleanData.fecha_desde && cleanData.fecha_hasta && tipoConsulta === "todas") {
    categoria = "rango_fechas_general";
  } else if (cleanData.fecha_desde && !cleanData.fecha_hasta && tipoConsulta !== "todas") {
    categoria = "mes_tipo";
  } else if (!cleanData.fecha_desde && !cleanData.fecha_hasta && tipoConsulta !== "todas") {
    categoria = "solo_tipo";
  } else if (!cleanData.fecha_desde && !cleanData.fecha_hasta && tipoConsulta === "todas") {
    categoria = "sin_filtro";
  }

  // ✅ Paso 7: retornar salida compatible con n8n 1.116.2
  return {
    json: {
      query, // ← cuerpo listo para HTTP Request
      tipo_consulta: tipoConsulta,
      categoria_consulta: categoria,
      fechas: {
        desde: cleanData.fecha_desde || null,
        hasta: cleanData.fecha_hasta || null
      },
      mensaje_original: cleanData.mensaje_usuario || ""
    }
  };
});

// ✅ Retornar salida final
return results;
```

**Función:** 
- Parsea y valida los datos de entrada
- Normaliza el tipo de consulta (ingresos → ingreso, gastos → gasto, etc.)
- Construye el objeto `query` para la petición HTTP
- Determina la categoría de consulta para el Switch

---

### 3. Switch

**Tipo:** `n8n-nodes-base.switch`

**Configuración:** Seis salidas según la categoría de consulta:

**Salida 1 - rango_fechas_tipo:**
- Condición: `{{ $json.categoria_consulta }}` = `"rango_fechas_tipo"`

**Salida 2 - rango_fechas_general:**
- Condición: `{{ $json.categoria_consulta }}` = `"rango_fechas_general"`

**Salida 3 - mes_tipo:**
- Condición: `{{ $json.categoria_consulta }}` = `"mes_tipo"`

**Salida 4 - solo_tipo:**
- Condición: `{{ $json.categoria_consulta }}` = `"solo_tipo"`

**Salida 5 - sin_filtro:**
- Condición: `{{ $json.categoria_consulta }}` = `"sin_filtro"`

**Salida 6 - resumen:**
- Condición: `{{ $json.categoria_consulta }}` = `"resumen"`

**Función:** Dirige el flujo según el tipo de consulta para usar el nodo HTTP Request correcto.

---

### 4. HTTP Request (Para rango_fechas_tipo)

**Tipo:** `n8n-nodes-base.httpRequest`

**Configuración:**
- **Method:** `POST`
- **URL:** 
  - **Producción:** `https://TU-PROYECTO.vercel.app/api/transactions/query`
  - **Desarrollo Local:** `http://localhost:3000/api/transactions/query`
- **Headers:**
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "chat_id": "{{ $json.query.chat_id }}",
  "fecha_desde": "{{ $json.query.fecha_desde }}",
  "fecha_hasta": "{{ $json.query.fecha_hasta }}",
  "tipo": "{{ $json.query.tipo }}"
}
```

**Función:** Consulta transacciones con rango de fechas y tipo específico.

---

### 5. HTTP Request1 (Para solo_tipo)

**Tipo:** `n8n-nodes-base.httpRequest`

**Configuración:**
- **Method:** `POST`
- **URL:** 
  - **Producción:** `https://TU-PROYECTO.vercel.app/api/transactions/query`
  - **Desarrollo Local:** `http://localhost:3000/api/transactions/query`
- **Headers:**
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "chat_id": "{{ $json.query.chat_id }}",
  "fecha_desde": "{{ $json.query.fecha_desde }}",
  "fecha_hasta": "{{ $json.query.fecha_hasta }}",
  "tipo_consulta": "{{ $json.tipo_consulta }}"
}
```

**Función:** Consulta transacciones solo por tipo (sin filtro de fechas).

---

### 6. Code in JavaScript1 (Formatear respuesta para rango_fechas_tipo)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
// Obtener todo el input
const inputData = $input.all();

// Transformar los datos en texto JSON legible para el agente
const results = inputData.map(item => {
  // Convertir el objeto a string con indentación
  const jsonString = JSON.stringify(item.json.data, null, 2);

  // Retornar salida legible
  return {
    json: {
      respuesta: jsonString
    }
  };
});

// Retornar salida
return results;
```

**Función:** Convierte la respuesta del API en un string JSON formateado para el Agente IA.

---

### 7. Code in JavaScript3 (Formatear respuesta para solo_tipo)

**Tipo:** `n8n-nodes-base.code`

**Código:** (Igual que Code in JavaScript1)

**Función:** Convierte la respuesta del API en un string JSON formateado para el Agente IA.

---

### 8. AI Agent (Formatear respuesta para rango_fechas_tipo)

**Tipo:** `@n8n/n8n-nodes-langchain.agent`

**Configuración:**
- **Model:** `gpt-4.1-mini`
- **System Message:** `convierte en un formato de mensaje la respuesta por favor para el usuario con la informacion dada.`
- **Text:** `respuesta: {{ $json.respuesta }}`

**Función:** Formatea la respuesta de transacciones en un mensaje legible para el usuario.

---

### 9. AI Agent1 (Formatear respuesta para solo_tipo)

**Tipo:** `@n8n/n8n-nodes-langchain.agent`

**Configuración:** (Igual que AI Agent)

**Función:** Formatea la respuesta de transacciones en un mensaje legible para el usuario.

---

### 10. Code in JavaScript2 (Limpiar respuesta para rango_fechas_tipo)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
const inputData = $input.all();

const results = inputData.map(item => {
  let textoRaw = item.json.output;
  let textoPlano = "";

  try {
    // Si el texto es un string JSON válido, lo parseamos
    const parsed = JSON.parse(textoRaw);

    // Construimos string plano SIN \n
    textoPlano = 
      `Descripción: ${parsed.descripcion} - ` +
      `Monto: ${parsed.monto} - ` +
      `Tipo: ${parsed.tipo} - ` +
      `Fecha: ${parsed.fecha}`;
  } catch (err) {
    // Si no es parseable, limpiamos caracteres escapados y eliminamos saltos
    textoPlano = textoRaw
      .replace(/\\n/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ') // remover múltiples espacios o saltos
      .trim();
  }

  return {
    json: {
      output: textoPlano
    }
  };
});

return results;
```

**Función:** Limpia y formatea el texto de salida del Agente IA.

---

### 11. Code in JavaScript4 (Limpiar respuesta para solo_tipo)

**Tipo:** `n8n-nodes-base.code`

**Código:** (Igual que Code in JavaScript2)

**Función:** Limpia y formatea el texto de salida del Agente IA.

---

### 12. Edit Fields (Salida para rango_fechas_tipo)

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignación:**
  - `output`: `={{ $json.output }}`

**Función:** Prepara la respuesta final para el flujo principal.

---

### 13. Edit Fields1 (Salida para solo_tipo)

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignación:**
  - `output`: `={{ $json.output }}`

**Función:** Prepara la respuesta final para el flujo principal.

---

## 🔗 Conexiones

```
When Executed by Another Workflow → Code in JavaScript → Switch
  ├─ (rango_fechas_tipo) → HTTP Request → Code in JavaScript1 → AI Agent → Code in JavaScript2 → Edit Fields
  └─ (solo_tipo) → HTTP Request1 → Code in JavaScript3 → AI Agent1 → Code in JavaScript4 → Edit Fields1
```

---

## 📊 Formato de Datos

### Input (Desde el Flujo Principal)

El subflujo recibe un JSON con los siguientes campos:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `chat_id` | string | ✅ Sí | ID del chat de Telegram del usuario |
| `tipo_consulta` | string | ❌ No | Tipo de consulta: `"ingresos"`, `"gastos"`, `"ahorros"`, `"inversiones"`, `"todas"` |
| `fecha_desde` | string | ❌ No | Fecha de inicio en formato `YYYY-MM-DD` |
| `fecha_hasta` | string | ❌ No | Fecha de fin en formato `YYYY-MM-DD` |
| `mensaje_usuario` | string | ❌ No | Mensaje original del usuario (para contexto) |

### Output (Respuesta del Sistema)

El sistema devuelve un JSON con la siguiente estructura:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipo": "gasto",
      "monto": 50,
      "descripcion": "Supermercado",
      "fecha": "2025-11-07"
    }
  ]
}
```

---

## ✅ Ejemplos de Uso

### Ejemplo 1: Consultar Gastos de un Rango de Fechas

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "tipo_consulta": "gastos",
  "fecha_desde": "2025-10-01",
  "fecha_hasta": "2025-10-30",
  "mensaje_usuario": "Muéstrame mis gastos del 1 al 30 de octubre"
}
```

**Resultado:** Lista de todas las transacciones de tipo "gasto" entre las fechas especificadas.

---

### Ejemplo 2: Consultar Todas las Transacciones

**Input desde el flujo principal:**
```json
{
  "chat_id": "5851213139",
  "tipo_consulta": "todas"
}
```

**Resultado:** Lista de todas las transacciones del usuario.

---

## 🔧 Troubleshooting

### Error: "Token de webhook inválido"

**Causa:** El `WEBHOOK_SECRET_TOKEN` no coincide.

**Solución:** Verifica que el token en el header `Authorization` sea exactamente el mismo que en `.env.local` y Vercel.

### Error: "Usuario no registrado"

**Causa:** El `chat_id` no está vinculado a ningún usuario en la base de datos.

**Solución:** El usuario debe registrarse en el dashboard web y vincular su `telegram_chat_id` en el perfil.

---

## 📚 Documentación Relacionada

- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Documentación del flujo principal coordinador
- **[N8N-SETUP.md](N8N-SETUP.md)**: Guía completa de configuración de n8n
- **[N8N-AGENT-PROMPT.md](N8N-AGENT-PROMPT.md)**: Prompt del sistema para el Agente IA

