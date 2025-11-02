# 🔍 CONSULTAS DE TRANSACCIONES VÍA WEBHOOK
## API de Consultas para n8n

**Última actualización:** 2024-11-02  
**Propósito:** Documentación para consultar transacciones financieras desde n8n usando HTTP

---

## 🎯 ENDPOINT DE CONSULTAS

**URL:** `https://TU-PROYECTO.vercel.app/api/transactions/query`  
**Método:** `POST`  
**Autenticación:** Bearer Token (mismo token del webhook)

---

## 📝 FORMATO DEL JSON

### JSON Mínimo (Todas las transacciones)

```json
{
  "chat_id": "123456789"
}
```

### JSON Completo (Con filtros)

```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "tipo": "gasto",
  "categoria": "supermercado"
}
```

---

## 📋 PARÁMETROS

### Requeridos

- **`chat_id`**: ID del chat de Telegram del usuario
  - Tipo: `string`
  - Ejemplo: `"123456789"`
  - **OBLIGATORIO**

### Opcionales (Filtros)

- **`fecha_desde`**: Fecha de inicio del rango (inclusive)
  - Tipo: `string` (formato: `YYYY-MM-DD`)
  - Ejemplo: `"2024-10-10"`
  - **Default**: Sin límite (desde el inicio)

- **`fecha_hasta`**: Fecha de fin del rango (inclusive)
  - Tipo: `string` (formato: `YYYY-MM-DD`)
  - Ejemplo: `"2024-11-01"`
  - **Default**: Sin límite (hasta hoy)

- **`tipo`**: Filtrar por tipo de transacción
  - Valores permitidos: `"ingreso"`, `"gasto"`, `"inversion"`, `"ahorro"`
  - Ejemplo: `"gasto"`
  - **Default**: Todos los tipos

- **`categoria`**: Filtrar por categoría (nombre exacto)
  - Tipo: `string`
  - Ejemplo: `"supermercado"`
  - **Default**: Todas las categorías

---

## 🔧 CONFIGURACIÓN EN N8N

### Nodo HTTP Request

**URL:** `https://TU-PROYECTO.vercel.app/api/transactions/query`

**Método:** `POST`

**Authentication:** `Header Auth`

**Headers:**
- `Authorization`: `Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da`
- `Content-Type`: `application/json`

**Body:**
- **Content Type:** `JSON`
- **Body:** (Usar expresiones de n8n para generar dinámicamente)

```json
{
  "chat_id": "{{ $json.chat.id }}",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "tipo": "gasto"
}
```

---

## 📊 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Consultar todos los gastos

**Pregunta del usuario:** "Quiero saber mis gastos"

**JSON:**
```json
{
  "chat_id": "123456789",
  "tipo": "gasto"
}
```

### Ejemplo 2: Consultar gastos en un rango de fechas

**Pregunta del usuario:** "Quiero saber mis gastos del 10 de octubre al 1 de noviembre"

**JSON:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "tipo": "gasto"
}
```

### Ejemplo 3: Consultar todas las transacciones en un período

**Pregunta del usuario:** "Muéstrame todas mis transacciones de octubre"

**JSON:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-10-01",
  "fecha_hasta": "2024-10-31"
}
```

### Ejemplo 4: Consultar solo ingresos

**Pregunta del usuario:** "Cuánto ingresé este mes"

**JSON:**
```json
{
  "chat_id": "123456789",
  "fecha_desde": "2024-11-01",
  "tipo": "ingreso"
}
```

---

## ✅ RESPUESTA DEL WEBHOOK

### Respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "user_id": "21baee99-3624-444b-abcc-0b10667751bd",
    "total_transacciones": 15,
    "periodo": {
      "desde": "2024-10-10",
      "hasta": "2024-11-01"
    },
    "resumen": {
      "total": 2500.00,
      "ingresos": 3000.00,
      "gastos": 1500.00,
      "ahorros": 500.00,
      "inversiones": 500.00,
      "balance": 1500.00
    },
    "transacciones": [
      {
        "id": "6491cc9c-d55d-457d-b5db-9fe33102dc95",
        "tipo": "gasto",
        "monto": 300.00,
        "descripcion": "libros",
        "fecha": "2024-10-15",
        "metodo_pago": "tarjeta",
        "origen": "n8n",
        "contable_categories": {
          "nombre": "Educación",
          "tipo": "gasto",
          "grupo": "Gastos Fijos"
        },
        "contable_accounts": {
          "nombre": "Cuenta Principal",
          "tipo": "corriente"
        }
      },
      // ... más transacciones
    ]
  },
  "message": "Consulta realizada exitosamente"
}
```

### Respuesta de error (Usuario no registrado):

```json
{
  "success": false,
  "error": "Usuario no registrado. El chat_id 123456789 no está vinculado a ninguna cuenta."
}
```

### Respuesta de error (Validación):

```json
{
  "success": false,
  "error": "chat_id es requerido"
}
```

---

## 🤖 USO EN EL AGENTE IA DE N8N

### ⚠️ IMPORTANTE: Flujo con Nodo Code

**NO debes llamar directamente a `HTTP_REQUEST2` para consultas.**

En su lugar, debes generar un JSON especial con `tipo_consulta` que el nodo Code procesará.

**Ver documentación completa del flujo en:** `docs/N8N-QUERY-FLOW.md`

### Prompt para el Agente

```
Cuando el usuario pregunte sobre sus transacciones financieras, debes:

1. **Detectar intenciones de consulta:**
   - "quiero saber mis gastos"
   - "muéstrame mis transacciones"
   - "cuánto gasté en octubre"
   - "mis ingresos del mes"

2. **Extraer información:**
   - **Rango de fechas:** Extrae fechas mencionadas (ej: "del 10 de octubre al 1 de noviembre")
   - **Tipo:** Identifica si busca "gastos", "ingresos", "ahorros", "inversiones"
   - **Período:** Identifica meses, semanas, años mencionados

3. **Construir JSON para la consulta:**
   - `chat_id`: Usar `{{ $json.chat.id }}` del mensaje de Telegram
   - `fecha_desde`: Convertir fechas mencionadas a formato YYYY-MM-DD
   - `fecha_hasta`: Convertir fechas mencionadas a formato YYYY-MM-DD
   - `tipo`: Mapear palabras a tipos (gastos→"gasto", ingresos→"ingreso", etc.)

4. **Llamar a HTTP_REQUEST2:**
   - URL: https://TU-PROYECTO.vercel.app/api/transactions/query
   - Método: POST
   - Headers: Authorization: Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da, Content-Type: application/json
   - Body: El JSON generado

5. **Procesar la respuesta:**
   - Formatear los resultados de manera amigable para el usuario
   - Mostrar resumen (total, balance, etc.)
   - Listar transacciones de forma clara
```

### Ejemplos de Análisis del Agente

#### Caso 1: "Quiero saber mis gastos del 10 de octubre al 1 de noviembre"

**Análisis del Agente:**
- tipo_consulta: "gastos"
- Fecha desde: "2024-10-10"
- Fecha hasta: "2024-11-01"

**JSON generado por el Agente (para el nodo Code):**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "gastos",
  "fecha_desde": "2024-10-10",
  "fecha_hasta": "2024-11-01",
  "mensaje_usuario": "quiero saber mis gastos del 10 de octubre al 1 de noviembre"
}
```

**Salida del Nodo Code (para el HTTP Request):**
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

#### Caso 2: "Cuánto ingresé este mes"

**Análisis del Agente:**
- tipo_consulta: "ingresos"
- Fecha desde: "2024-11-01" (primer día del mes actual)

**JSON generado por el Agente (para el nodo Code):**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "ingresos",
  "fecha_desde": "2024-11-01",
  "mensaje_usuario": "cuánto ingresé este mes"
}
```

**Salida del Nodo Code (para el HTTP Request):**
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-11-01",
    "tipo": "ingreso"
  }
}
```

#### Caso 3: "Muéstrame todas mis transacciones de octubre"

**Análisis del Agente:**
- tipo_consulta: "todas"
- Fecha desde: "2024-10-01"
- Fecha hasta: "2024-10-31"

**JSON generado por el Agente (para el nodo Code):**
```json
{
  "chat_id": "123456789",
  "tipo_consulta": "todas",
  "fecha_desde": "2024-10-01",
  "fecha_hasta": "2024-10-31",
  "mensaje_usuario": "muéstrame todas mis transacciones de octubre"
}
```

**Salida del Nodo Code (para el HTTP Request):**
```json
{
  "json": {
    "chat_id": "123456789",
    "fecha_desde": "2024-10-01",
    "fecha_hasta": "2024-10-31"
  }
}
```

---

## ⚠️ IMPORTANTE

1. **`chat_id` es OBLIGATORIO**
   - El usuario debe estar registrado en el dashboard
   - El `chat_id` debe estar vinculado al perfil del usuario
   - Si el usuario no está registrado, se devolverá un error 404

2. **Formato de fechas**
   - Siempre usar formato `YYYY-MM-DD`
   - Ejemplo: `"2024-10-10"` (no `"10/10/2024"`)

3. **Filtros combinables**
   - Puedes usar `fecha_desde` + `fecha_hasta` + `tipo` juntos
   - Los filtros son acumulativos (AND lógico)

---

## 🆚 COMPARACIÓN: HTTP vs PostgreSQL Directo

### ✅ RECOMENDADO: HTTP (Nuestro Endpoint)

**Ventajas:**
- ✅ Más seguro (usa RLS de Supabase)
- ✅ Valida datos automáticamente
- ✅ Evita exponer conexión directa a PostgreSQL
- ✅ Más fácil de mantener y versionar
- ✅ Incluye cálculos de resumen automáticos
- ✅ Manejo de errores consistente

**Desventajas:**
- ⚠️ Requiere una petición HTTP adicional

### ❌ NO RECOMENDADO: PostgreSQL Directo

**Desventajas:**
- ❌ Expone la conexión directa a la base de datos
- ❌ Requiere configurar conexión PostgreSQL en n8n
- ❌ No usa RLS (Row Level Security) de Supabase
- ❌ Debes hacer cálculos manualmente
- ❌ Más difícil de mantener

---

## 🔒 SEGURIDAD

- ✅ Todas las consultas requieren autenticación Bearer Token
- ✅ Las consultas solo devuelven transacciones del usuario identificado por `chat_id`
- ✅ No se pueden consultar transacciones de otros usuarios
- ✅ Todas las respuestas están validadas y sanitizadas

---

## 📚 EJEMPLOS DE USO EN N8N

### Flujo Completo: Pregunta → Consulta → Respuesta

1. **Trigger:** Mensaje de Telegram recibido
2. **Nodo IA:** Analizar mensaje y extraer intención de consulta
3. **Nodo Set:** Construir JSON con `chat_id`, `fecha_desde`, `fecha_hasta`, `tipo`
4. **Nodo HTTP Request:** Llamar a `/api/transactions/query`
5. **Nodo Code:** Formatear respuesta para el usuario
6. **Nodo Telegram:** Enviar respuesta formateada

### Ejemplo de Construcción de JSON en n8n

**Nodo Set (JSON Body):**
```json
{
  "chat_id": "{{ $json.chat.id }}",
  "fecha_desde": "{{ $json.fecha_desde }}",
  "fecha_hasta": "{{ $json.fecha_hasta }}",
  "tipo": "{{ $json.tipo }}"
}
```

