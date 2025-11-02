# 🔄 FLUJO DE CONSULTAS EN N8N
## Subflujo de Consultas con Nodo Code

**Última actualización:** 2024-11-02  
**Propósito:** Guía completa para implementar el flujo de consultas en n8n con nodo Code que filtra por tipo

---

## 🎯 ARQUITECTURA DEL FLUJO

```
Telegram Trigger
    ↓
Agente IA (Analiza mensaje)
    ↓
Identifica: ¿Crear transacción o Consultar?
    ↓
    ├─→ [Crear Transacción] → Subflujo CREAR TRANSACCIÓN
    │                           ↓
    │                       HTTP Request (Webhook n8n)
    │                           ↓
    │                       POST /api/webhook/n8n
    │
    └─→ [Consultar] → Subflujo CONSULTAR TRANSACCIONES
                        ↓
                    Nodo Code (Filtra por tipo_consulta)
                        ↓
                    HTTP Request
                        ↓
                    POST /api/transactions/query
                        ↓
                    Respuesta formateada
```

**Hay DOS subflujos:**
1. **Subflujo CREAR TRANSACCIÓN:** Recibe JSON con `chat_id`, `tipo`, `monto`, `descripcion`, `fecha` → Llama directamente a HTTP Request
2. **Subflujo CONSULTAR TRANSACCIONES:** Recibe JSON con `chat_id`, `tipo_consulta`, `fecha_desde`, `fecha_hasta` → Pasa por Nodo Code → Llama a HTTP Request

---

## 📋 ESTRUCTURA DEL JSON DE ENTRADA

El agente IA enviará un JSON con un campo especial `tipo_consulta` que indica qué tipo de consulta hacer:

```json
{
  "chat_id": "123456789",
  "tipo_consulta": "ingresos",        // Campo especial para el switch
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "fecha_desde_raw": "10 de octubre",  // Original del usuario (opcional)
  "fecha_hasta_raw": "1 de noviembre", // Original del usuario (opcional)
  "tipo_transaccion": "ingreso",       // Tipo real de transacción (si aplica)
  "mensaje_usuario": "quiero saber mis ingresos del 10 de octubre al 1 de noviembre"
}
```

---

## 🔀 TIPOS DE CONSULTA

El campo `tipo_consulta` puede tener los siguientes valores:

| Tipo Consulta | Descripción | Filtro aplicado |
|--------------|-------------|-----------------|
| `"ingresos"` | Solo consultar ingresos | `tipo: "ingreso"` |
| `"gastos"` | Solo consultar gastos | `tipo: "gasto"` |
| `"ahorros"` | Solo consultar ahorros | `tipo: "ahorro"` |
| `"inversiones"` | Solo consultar inversiones | `tipo: "inversion"` |
| `"todas"` | Consultar todas las transacciones | Sin filtro de tipo |
| `"resumen"` | Solo resumen (sin transacciones) | Sin filtro de tipo |

---

## 💻 CÓDIGO DEL NODO CODE

### Código JavaScript para el Nodo Code

```javascript
// Obtener datos de entrada
const inputData = $input.all();

// Procesar cada elemento (normalmente solo hay uno)
const results = inputData.map(item => {
  const data = item.json;
  
  // Validar chat_id (obligatorio)
  if (!data.chat_id) {
    return {
      error: true,
      message: "chat_id es requerido"
    };
  }
  
  // Base del JSON para la petición HTTP
  const queryJSON = {
    chat_id: data.chat_id
  };
  
  // Agregar fechas si existen
  if (data.fecha_desde) {
    queryJSON.fecha_desde = data.fecha_desde;
  }
  
  if (data.fecha_hasta) {
    queryJSON.fecha_hasta = data.fecha_hasta;
  }
  
  // SWITCH: Filtrar según tipo_consulta
  const tipoConsulta = (data.tipo_consulta || "todas").toLowerCase();
  
  switch (tipoConsulta) {
    case "ingresos":
      queryJSON.tipo = "ingreso";
      break;
      
    case "gastos":
      queryJSON.tipo = "gasto";
      break;
      
    case "ahorros":
      queryJSON.tipo = "ahorro";
      break;
      
    case "inversiones":
      queryJSON.tipo = "inversion";
      break;
      
    case "todas":
      // No agregar filtro de tipo
      break;
      
    case "resumen":
      // No agregar filtro de tipo (se usará para resumen)
      break;
      
    default:
      // Si no se especifica o es desconocido, consultar todas
      break;
  }
  
  // Retornar JSON filtrado y listo para HTTP Request
  return {
    json: queryJSON,
    tipo_consulta: tipoConsulta,
    fecha_desde: data.fecha_desde,
    fecha_hasta: data.fecha_hasta,
    mensaje_original: data.mensaje_usuario || ""
  };
});

// Retornar resultados
return results;
```

---

## 📊 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Consultar solo gastos

**Entrada del Agente IA:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "mensaje_usuario": "quiero saber mis gastos del 10 de octubre al 1 de noviembre"
}
```

**Salida del Nodo Code:**
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-10-10",
    "fecha_hasta": "2024-11-01",
    "tipo": "gasto"
  },
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "tipo": "gasto"
}
```

---

### Ejemplo 2: Consultar todas las transacciones

**Entrada del Agente IA:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "todas",
  "fecha_desde": "2024-10-01",
  "fecha_hasta": "2024-10-31",
  "mensaje_usuario": "muéstrame todas mis transacciones de octubre"
}
```

**Salida del Nodo Code:**
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-10-01",
    "fecha_hasta": "2024-10-31"
  },
  "tipo_consulta": "todas"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-01",
  "fecha_hasta": "2024-10-31"
}
```

---

### Ejemplo 3: Consultar solo ingresos (sin fechas)

**Entrada del Agente IA:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "ingresos",
  "mensaje_usuario": "cuánto ingresé este mes"
}
```

**Salida del Nodo Code:**
```json
{
  "json": {
    "chat_id": "123456789",
    "tipo": "ingreso"
  },
  "tipo_consulta": "ingresos"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "123456789",
  "tipo": "ingreso"
}
```

---

### Ejemplo 4: Consultar ahorros en rango específico

**Entrada del Agente IA:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "ahorros",
  "fecha_desde": "2024-11-01",
  "mensaje_usuario": "cuánto ahorré este mes"
}
```

**Salida del Nodo Code:**
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-11-01",
    "tipo": "ahorro"
  },
  "tipo_consulta": "ahorros"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-11-01",
  "tipo": "ahorro"
}
```

---

## 🔧 CONFIGURACIÓN DE LOS NODOS HTTP REQUEST

### 🔹 SUBFLUJO CREAR TRANSACCIÓN

**Nodo:** `HTTP Request`

**URL:** `https://TU-PROYECTO.vercel.app/api/webhook/n8n`

**Método:** `POST`

**Authentication:** `Header Auth`

**Headers:**
- `Authorization`: `Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da`
- `Content-Type`: `application/json`

**Body:**
- **Content Type:** `JSON`
- **Body:** `{{ $json }}` (El JSON completo del agente IA)

**Ejemplo del Body:**
```json
{
  "chat_id": "123456789",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2024-11-02"
}
```

---

### 🔹 SUBFLUJO CONSULTAR TRANSACCIONES

**Después del Nodo Code:**

**Nodo:** `HTTP Request`

**URL:** `https://TU-PROYECTO.vercel.app/api/transactions/query`

**Método:** `POST`

**Authentication:** `Header Auth`

**Headers:**
- `Authorization`: `Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da`
- `Content-Type`: `application/json`

**Body:**
- **Content Type:** `JSON`
- **Body:** `{{ $json.json }}`

**⚠️ IMPORTANTE:** Usa `{{ $json.json }}` porque el nodo Code retorna un objeto con la propiedad `json` que contiene el JSON filtrado.

**Ejemplo del Body (después del Code):**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "tipo": "gasto"
}
```

---

## 🤖 PROMPT PARA EL AGENTE IA

Actualiza el prompt del agente para que identifique entre CREAR transacciones y CONSULTAR transacciones:

```
Eres un asistente contable inteligente. Tu tarea es analizar mensajes de Telegram y determinar si el usuario quiere CREAR una transacción o CONSULTAR transacciones.

## IDENTIFICAR INTENCIÓN

**Hay DOS tipos de acciones:**

### 1. CREAR TRANSACCIÓN (Registrar un nuevo gasto/ingreso/ahorro/inversión)
- Palabras clave: "gasté", "gasto", "compré", "pagé", "ingresé", "ingreso", "ahorré", "ahorro", "invertí", "inversión"
- Si el mensaje menciona un MONTO y una DESCRIPCIÓN, es CREAR TRANSACCIÓN
- Ejemplos:
  - "Gasté 50 euros en supermercado"
  - "Agregame 300 en libros"
  - "Ingresé 1500 de salario"
  - "Ahorré 200 euros hoy"

### 2. CONSULTAR TRANSACCIONES (Ver transacciones existentes)
- Palabras clave: "quiero saber", "muéstrame", "cuánto", "mis gastos", "mis ingresos", "transacciones"
- Si el mensaje NO menciona un monto específico para REGISTRAR, es CONSULTAR
- Ejemplos:
  - "Quiero saber mis gastos"
  - "Muéstrame mis ingresos de octubre"
  - "Cuánto gasté del 10 de octubre al 1 de noviembre"
  - "Todas mis transacciones"

---

## CASO 1: CREAR TRANSACCIÓN

**Cuando detectes que el usuario quiere CREAR una transacción:**

1. **Extraer información:**
   - `chat_id`: Usar `{{ $json.chat.id }}` del mensaje de Telegram
   - `tipo`: "ingreso", "gasto", "inversion", "ahorro" (según el mensaje)
   - `monto`: Número extraído del mensaje (debe ser > 0)
   - `descripcion`: Descripción de la transacción (OBLIGATORIO)
   - `fecha`: Fecha en formato YYYY-MM-DD (OBLIGATORIO, usar hoy si no se menciona)
   - `telefono`: Opcional (solo si está disponible)

2. **Generar JSON para el subflujo de CREAR TRANSACCIÓN:**
```json
{
  "chat_id": "123456789",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2024-11-02",
  "telefono": "+34612345678"
}
```

3. **Enviar al subflujo de CREAR TRANSACCIÓN**
   - El subflujo llamará directamente a HTTP_REQUEST2 con este JSON
   - URL: https://TU-PROYECTO.vercel.app/api/webhook/n8n
   - Método: POST
   - Headers: Authorization: Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da, Content-Type: application/json

---

## CASO 2: CONSULTAR TRANSACCIONES

**Cuando detectes que el usuario quiere CONSULTAR transacciones:**

1. **Detectar tipo de consulta:**
   - "quiero saber mis gastos" → `tipo_consulta: "gastos"`
   - "muéstrame mis ingresos" → `tipo_consulta: "ingresos"`
   - "cuánto ahorré" → `tipo_consulta: "ahorros"`
   - "mis inversiones" → `tipo_consulta: "inversiones"`
   - "todas mis transacciones" → `tipo_consulta: "todas"`

2. **Extraer información:**
   - `chat_id`: Usar `{{ $json.chat.id }}` del mensaje de Telegram
   - `fecha_desde`: Fecha de inicio (formato YYYY-MM-DD) - OPCIONAL
   - `fecha_hasta`: Fecha de fin (formato YYYY-MM-DD) - OPCIONAL
   - Rango de fechas mencionadas: ej: "del 10 de octubre al 1 de noviembre" → fecha_desde: "2024-10-10", fecha_hasta: "2024-11-01"

3. **Generar JSON para el subflujo de CONSULTAR:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "mensaje_usuario": "quiero saber mis gastos del 10 de octubre al 1 de noviembre"
}
```

4. **Enviar al subflujo de CONSULTAS**
   - El subflujo pasará por el nodo Code que hará el switch según `tipo_consulta`
   - El nodo Code generará el JSON filtrado para el HTTP Request
   - NO llames directamente a HTTP_REQUEST2 para consultas

---

## EJEMPLOS COMPLETOS

### Ejemplo 1: Crear Transacción
**Usuario dice:** "Agregame 300 en libros hoy"

**Análisis:**
- Intención: CREAR TRANSACCIÓN (menciona monto: 300, descripción: "libros")
- Tipo: "gasto" (agregar = gasto)
- Monto: 300
- Descripción: "libros"
- Fecha: hoy (2024-11-02)

**JSON generado para subflujo CREAR:**
```json
{
  "chat_id": "123456789",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2024-11-02"
}
```

---

### Ejemplo 2: Consultar Gastos
**Usuario dice:** "Quiero saber mis gastos del 10 de octubre al 1 de noviembre"

**Análisis:**
- Intención: CONSULTAR TRANSACCIONES (no menciona monto para registrar)
- Tipo consulta: "gastos"
- Fecha desde: "2024-10-10"
- Fecha hasta: "2024-11-01"

**JSON generado para subflujo CONSULTAR:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "mensaje_usuario": "quiero saber mis gastos del 10 de octubre al 1 de noviembre"
}
```

---

### Ejemplo 3: Crear Ingreso
**Usuario dice:** "Ingresé 1500 de salario"

**Análisis:**
- Intención: CREAR TRANSACCIÓN (menciona monto: 1500, descripción: "salario")
- Tipo: "ingreso"
- Monto: 1500
- Descripción: "salario"
- Fecha: hoy (si no se menciona)

**JSON generado para subflujo CREAR:**
```json
{
  "chat_id": "123456789",
  "tipo": "ingreso",
  "monto": 1500,
  "descripcion": "salario",
  "fecha": "2024-11-02"
}
```

---

### Ejemplo 4: Consultar Ingresos
**Usuario dice:** "Cuánto ingresé este mes"

**Análisis:**
- Intención: CONSULTAR TRANSACCIONES (no menciona monto para registrar)
- Tipo consulta: "ingresos"
- Fecha desde: Primer día del mes actual (2024-11-01)

**JSON generado para subflujo CONSULTAR:**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "ingresos",
  "fecha_desde": "2024-11-01",
  "mensaje_usuario": "cuánto ingresé este mes"
}
```

---

## ⚠️ REGLAS IMPORTANTES

1. **Siempre identificar primero la intención:** ¿CREAR o CONSULTAR?
2. **Para CREAR:** El JSON debe tener `chat_id`, `tipo`, `monto`, `descripcion`, `fecha` (todos obligatorios)
3. **Para CONSULTAR:** El JSON debe tener `chat_id`, `tipo_consulta` (obligatorios), y opcionalmente `fecha_desde`, `fecha_hasta`
4. **NO mezclar formatos:** Si es CREAR, usa el formato de CREAR. Si es CONSULTAR, usa el formato de CONSULTAR
5. **Enviar al subflujo correspondiente:** CREAR → subflujo de crear, CONSULTAR → subflujo de consultar
```

---

## 📝 MAPEO DE PALABRAS CLAVE

### Palabras clave para detectar tipo de consulta:

**Gastos:**
- "gastos", "gasté", "gasto", "compré", "comprar", "pagué", "desembolso"

**Ingresos:**
- "ingresos", "ingresé", "ingreso", "gané", "recibí", "cobré", "sueldo", "salario"

**Ahorros:**
- "ahorros", "ahorré", "ahorro", "guardé", "deposité"

**Inversiones:**
- "inversiones", "invertí", "inversión"

**Todas:**
- "todas las transacciones", "todas mis transacciones", "mis transacciones", "transacciones"

---

## 🔄 FLUJO COMPLETO PASO A PASO

### Paso 1: Telegram Trigger
- Usuario envía: "quiero saber mis gastos del 10 de octubre al 1 de noviembre"

### Paso 2: Agente IA
- Analiza el mensaje
- Detecta: tipo_consulta = "gastos"
- Extrae: fecha_desde = "2024-10-10", fecha_hasta = "2024-11-01"
- Genera JSON:
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "mensaje_usuario": "quiero saber mis gastos del 10 de octubre al 1 de noviembre"
}
```

### Paso 3: Nodo Code
- Recibe el JSON del agente
- Hace switch según `tipo_consulta`
- Filtra y genera JSON final:
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-10-10",
    "fecha_hasta": "2024-11-01",
    "tipo": "gasto"
  }
}
```

### Paso 4: HTTP Request
- URL: `/api/transactions/query`
- Body: `{{ $json.json }}`
- Envía petición

### Paso 5: Respuesta
- Recibe datos del servidor
- Formatea para el usuario
- Envía respuesta a Telegram

---

## ⚠️ IMPORTANTE

1. **El nodo Code debe procesar `tipo_consulta` y convertirlo a `tipo`** para el HTTP Request
2. **Usa `{{ $json.json }}` en el HTTP Request** porque el Code retorna un objeto con propiedad `json`
3. **Siempre validar `chat_id`** antes de continuar
4. **Las fechas son opcionales** pero si el usuario las menciona, deben estar en formato YYYY-MM-DD

---

## 🚀 VENTAJAS DE ESTE ENFOQUE

✅ **Separación de responsabilidades:**
- Agente IA: Analiza y genera JSON con `tipo_consulta`
- Nodo Code: Filtra y transforma según tipo
- HTTP Request: Solo envía el JSON final limpio

✅ **Fácil de mantener:**
- Si cambias los tipos de consulta, solo modificas el switch en el Code

✅ **Escalable:**
- Puedes agregar nuevos tipos de consulta fácilmente

✅ **Reutilizable:**
- El mismo subflujo puede usarse para diferentes tipos de consulta

