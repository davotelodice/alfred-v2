# 🔄 FLUJO DE N8N EXPLICADO PASO A PASO
## Para Asistente Contable Inteligente

**Última actualización:** 2024-10-23  
**Propósito:** Explicar de manera clara y simple cómo configurar el flujo en n8n

---

## 🎯 RESUMEN EJECUTIVO

**Opción Recomendada: Webhook HTTP + PostgreSQL para Consultas**

- **Para CREAR/MODIFICAR/ELIMINAR transacciones:** Usa Webhook HTTP (más fácil y seguro)
- **Para CONSULTAR datos:** Usa PostgreSQL directo (más flexible)

---

## 🔄 FLUJO COMPLETO EXPLICADO

### Escenario: Usuario envía mensaje desde Telegram

```
[Telegram] 
  → Usuario escribe: "Gasté 50 euros en supermercado"
    ↓
[Trigger: Telegram Bot]
  → n8n recibe el mensaje
    ↓
[Node: Extraer Datos]
  → Extrae: teléfono, mensaje
    ↓
[Node: Agente IA]
  → El agente entiende: "Gasté 50 euros en supermercado"
  → El agente decide: "Necesito crear una transacción"
    ↓
[Node: HTTP Request - Webhook]
  → POST https://tu-dominio.com/api/webhook/n8n
  → Body: { telefono, tipo: "gasto", monto: 50, descripcion: "supermercado" }
    ↓
[Tu API recibe el webhook]
  → Busca o crea usuario por teléfono
  → Crea la transacción
  → Recalcula KPIs automáticamente
    ↓
[Respuesta del Webhook]
  → Devuelve: { success: true, transaction_id: "..." }
    ↓
[Node: Telegram - Enviar Mensaje]
  → Confirma al usuario: "✅ Gasto de 50 euros agregado"
```

---

## 🤔 PREGUNTAS FRECUENTES

### ¿Qué es un Webhook HTTP?

**Respuesta simple:**
Un webhook es como enviar una carta por correo. Tú envías datos a una URL específica y esa URL hace el trabajo por ti.

**En este caso:**
- n8n envía los datos de la transacción al webhook
- Tu API (Next.js) recibe los datos
- Tu API crea la transacción en la base de datos
- Tu API responde si fue exitoso o no

**Ventaja:** No necesitas conectarte directamente a la base de datos desde n8n para crear transacciones.

---

### ¿Cuál Método Usar?

#### Opción 1: Solo Webhook HTTP (RECOMENDADO para crear/modificar/eliminar)

**Cuándo usar:**
- Para crear transacciones desde Telegram
- Para modificar transacciones
- Para eliminar transacciones

**Ventajas:**
- ✅ No necesitas conectar PostgreSQL en n8n
- ✅ Más seguro (usa autenticación por token)
- ✅ Respetan RLS automáticamente
- ✅ Validación de datos integrada
- ✅ Logs de auditoría automáticos

**Desventajas:**
- ❌ No puedes hacer queries complejas directamente

**Cómo funciona:**
```
[Agente IA] → [HTTP Request] → [Tu API] → [Base de Datos]
```

**Ejemplo en n8n:**
```
1. Trigger: Telegram
2. Node: Extraer teléfono y mensaje
3. Node: Agente IA (analiza el mensaje)
4. Node: HTTP Request (POST /api/webhook/n8n)
5. Node: Telegram (envía confirmación)
```

---

#### Opción 2: PostgreSQL Directo (Para consultas)

**Cuándo usar:**
- Para consultar gastos totales
- Para consultar ingresos totales
- Para consultar balance
- Para consultar transacciones por período

**Ventajas:**
- ✅ Puedes hacer queries SQL directamente
- ✅ Más flexible para consultas complejas
- ✅ Más rápido para solo lectura

**Desventajas:**
- ❌ Necesitas conexión directa a PostgreSQL
- ❌ Debes manejar RLS manualmente
- ❌ Menos seguro si no lo configuras bien

**Cómo funciona:**
```
[Agente IA] → [PostgreSQL Node] → [Base de Datos]
```

---

#### Opción 3: Combinado (RECOMENDADO - Lo mejor de ambos mundos)

**Cuándo usar:**
- Para todo tipo de operaciones

**Flujo:**
- **Crear/Modificar/Eliminar:** Webhook HTTP
- **Consultar datos:** PostgreSQL directo

**Ventajas:**
- ✅ Máxima flexibilidad
- ✅ Seguro para escritura (webhook)
- ✅ Flexible para lectura (PostgreSQL)

---

## 📋 FLUJO RECOMENDADO PASO A PASO

### Paso 1: Configurar Webhook HTTP (Para crear transacciones)

**Node en n8n:**
```
Type: HTTP Request
Method: POST
URL: https://tu-dominio.com/api/webhook/n8n
Headers:
  - Authorization: Bearer WEBHOOK_SECRET_TOKEN
  - Content-Type: application/json
Body:
{
  "telefono": "{{ $json.phone }}",
  "tipo": "gasto",
  "monto": 50.00,
  "descripcion": "supermercado",
  "fecha": "2024-10-23"
}
```

**¿Qué hace este nodo?**
- Envía los datos de la transacción a tu API
- Tu API crea la transacción automáticamente
- Tu API responde si fue exitoso

**¿Necesitas conectar PostgreSQL aquí?** ❌ NO

**¿Por qué no necesitas PostgreSQL aquí?**
Porque el webhook ya se conecta a tu API, y tu API se conecta a la base de datos. Tú solo necesitas enviar los datos por HTTP.

---

### Paso 2: Configurar PostgreSQL Directo (Para consultas)

**Node en n8n:**
```
Type: PostgreSQL
Operation: Execute Query
Query:
SELECT 
  SUM(monto) as total_gastos
FROM contable_transactions
WHERE user_id = $1
  AND tipo = 'gasto'
  AND fecha >= $2
  AND fecha <= $3;
Parameters:
  - {{ $json.user_id }}
  - {{ $json.fecha_desde }}
  - {{ $json.fecha_hasta }}
```

**¿Qué hace este nodo?**
- Se conecta directamente a PostgreSQL
- Ejecuta la query SQL
- Devuelve los resultados

**¿Necesitas conectar PostgreSQL aquí?** ✅ SÍ

**Conexión:**
```
Host: db.knaplqhumkuiazqdnznd.supabase.co
Database: postgres
User: postgres
Password: [SUPABASE_DB_PASSWORD o SERVICE_ROLE_KEY]
Port: 5432
SSL: Required
```

---

## 🎭 EL PAPEL DEL AGENTE

### ¿Qué es el Agente?

El agente es como un asistente inteligente que:
1. **Entiende** lo que el usuario quiere hacer
2. **Decide** qué acción necesita realizar
3. **Ejecuta** la acción usando los nodos correctos

### Ejemplo Real:

**Usuario dice:** "¿Cuánto gasté este mes?"

**El agente:**
1. **Entiende:** "Necesito consultar gastos del mes actual"
2. **Decide:** "Necesito usar PostgreSQL para hacer una query"
3. **Ejecuta:** Llama al nodo PostgreSQL con la query correcta
4. **Responde:** "Gastaste 250 euros este mes en 5 transacciones"

### ¿Cómo Sabe el Agente Qué Hacer?

**El agente tiene prompts que le explican:**
- Qué tablas existen
- Qué queries puede usar
- Qué nodos tiene disponibles
- Cómo interpretar las respuestas

---

## 🔄 FLUJO COMPLETO EJEMPLO

### Ejemplo 1: Usuario quiere AGREGAR una transacción

**Usuario en Telegram:** "Gasté 50 euros en supermercado"

**Flujo en n8n:**

```
1. [Trigger: Telegram]
   → Recibe: { message: "Gasté 50 euros en supermercado", phone: "+34612345678" }
   
2. [Node: Extract Data]
   → Extrae: phone = "+34612345678", message = "Gasté 50 euros en supermercado"
   
3. [Node: AI Agent]
   → El agente analiza el mensaje
   → El agente entiende: "Necesito crear una transacción tipo 'gasto'"
   → El agente decide: "Voy a usar el webhook HTTP"
   → El agente prepara: { telefono: "+34612345678", tipo: "gasto", monto: 50, descripcion: "supermercado" }
   
4. [Node: HTTP Request - Webhook]
   → POST https://tu-dominio.com/api/webhook/n8n
   → Headers: Authorization: Bearer WEBHOOK_SECRET_TOKEN
   → Body: { telefono: "+34612345678", tipo: "gasto", monto: 50, descripcion: "supermercado" }
   → Respuesta: { success: true, transaction_id: "abc-123" }
   
5. [Node: Telegram - Send Message]
   → Envía: "✅ Gasto de 50 euros agregado exitosamente"
```

**¿Necesitas PostgreSQL aquí?** ❌ NO, solo necesitas el HTTP Request.

---

### Ejemplo 2: Usuario quiere CONSULTAR sus gastos

**Usuario en Telegram:** "¿Cuánto gasté este mes?"

**Flujo en n8n:**

```
1. [Trigger: Telegram]
   → Recibe: { message: "¿Cuánto gasté este mes?", phone: "+34612345678" }
   
2. [Node: Extract Data]
   → Extrae: phone = "+34612345678", message = "¿Cuánto gasté este mes?"
   
3. [Node: AI Agent]
   → El agente analiza el mensaje
   → El agente entiende: "Necesito consultar gastos del mes actual"
   → El agente decide: "Voy a usar PostgreSQL para hacer una query"
   → El agente prepara: user_id, fecha_desde, fecha_hasta
   
4. [Node: PostgreSQL - Buscar Usuario]
   → Query: SELECT * FROM contable_users WHERE telefono = $1
   → Parámetro: "+34612345678"
   → Resultado: { id: "user-uuid-here", nombre: "David", ... }
   
5. [Node: PostgreSQL - Consultar Gastos]
   → Query: SELECT SUM(monto) as total FROM contable_transactions WHERE user_id = $1 AND tipo = 'gasto' AND fecha >= $2 AND fecha <= $3
   → Parámetros: user_id, fecha_desde, fecha_hasta
   → Resultado: { total: 250.00 }
   
6. [Node: AI Agent - Formatear Respuesta]
   → El agente formatea: "Gastaste 250 euros este mes"
   
7. [Node: Telegram - Send Message]
   → Envía: "💰 Gastaste 250 euros este mes"
```

**¿Necesitas PostgreSQL aquí?** ✅ SÍ, necesitas conectar PostgreSQL para hacer la consulta.

---

## 🎯 RECOMENDACIÓN FINAL

### Usa ESTE Flujo:

```
┌─────────────────────────────────────────────────────┐
│                    TELEGRAM                          │
│          Usuario envía mensaje                       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              TRIGGER: Telegram                      │
│          Recibe mensaje                             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│            NODE: Extract Data                        │
│          Extrae teléfono y mensaje                   │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              NODE: AI Agent                          │
│    Entiende qué quiere hacer el usuario              │
│    Decide qué acción necesita                        │
└─────────────────────────────────────────────────────┘
                      ↓
        ┌──────────────┴──────────────┐
        ↓                              ↓
┌───────────────────┐        ┌───────────────────┐
│  ACCIÓN: Crear/   │        │  ACCIÓN: Consultar │
│  Modificar/       │        │  datos             │
│  Eliminar         │        │                    │
└───────────────────┘        └───────────────────┘
        ↓                              ↓
┌───────────────────┐        ┌───────────────────┐
│  HTTP Request     │        │  PostgreSQL        │
│  (Webhook)        │        │  (Query SQL)       │
│                   │        │                    │
│  POST /api/      │        │  SELECT ...        │
│  webhook/n8n     │        │  WHERE ...         │
└───────────────────┘        └───────────────────┘
        ↓                              ↓
        └──────────────┬──────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│          NODE: AI Agent - Formatear                  │
│          Formatea la respuesta                       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│            NODE: Telegram                            │
│          Envía respuesta al usuario                   │
└─────────────────────────────────────────────────────┘
```

---

## 📝 CONFIGURACIÓN PASO A PASO

### Paso 1: Configurar Webhook HTTP (Para crear/modificar/eliminar)

**1. Crear nodo "HTTP Request"**

**Configuración:**
- **Name:** `Create Transaction Webhook`
- **Type:** `HTTP Request`
- **Method:** `POST`
- **URL:** `https://tu-dominio.com/api/webhook/n8n` (o `http://localhost:3000/api/webhook/n8n` para desarrollo)
- **Authentication:** `None` (manejamos auth en headers)
- **Headers:**
  ```
  Authorization: Bearer WEBHOOK_SECRET_TOKEN
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "telefono": "{{ $json.phone }}",
    "tipo": "{{ $json.tipo }}",
    "monto": {{ $json.monto }},
    "descripcion": "{{ $json.descripcion }}",
    "fecha": "{{ $json.fecha || $now.format('YYYY-MM-DD') }}"
  }
  ```

**2. ¿Necesitas conectar PostgreSQL aquí?**
❌ **NO** - El webhook ya se conecta a tu API, y tu API se conecta a la base de datos.

**3. ¿Qué hace este nodo?**
- Envía los datos al webhook
- Tu API recibe los datos
- Tu API crea/modifica/elimina la transacción
- Tu API responde si fue exitoso

---

### Paso 2: Configurar PostgreSQL (Para consultas)

**1. Crear nodo "PostgreSQL"**

**Configuración:**
- **Name:** `Query User Transactions`
- **Type:** `PostgreSQL`
- **Operation:** `Execute Query`
- **Connection:**
  - **Host:** `db.knaplqhumkuiazqdnznd.supabase.co`
  - **Database:** `postgres`
  - **User:** `postgres`
  - **Password:** `[SUPABASE_DB_PASSWORD o SERVICE_ROLE_KEY]`
  - **Port:** `5432`
  - **SSL:** `Required`

**2. Query Example:**
```sql
SELECT 
  SUM(monto) as total_gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = $1
  AND tipo = 'gasto'
  AND fecha >= $2
  AND fecha <= $3;
```

**3. Parameters:**
```
{{ $json.user_id }}
{{ $json.fecha_desde }}
{{ $json.fecha_hasta }}
```

---

## 🎯 EL AGENTE Y SUS MENSAJES

### ¿Qué mensaje envía el agente?

El agente NO envía mensajes directamente. El agente:

1. **Analiza** el mensaje del usuario
2. **Decide** qué acción necesita hacer
3. **Prepara** los datos necesarios
4. **Llama** al nodo correcto (HTTP Request o PostgreSQL)
5. **Recibe** la respuesta del nodo
6. **Formatea** la respuesta para el usuario
7. **Envía** la respuesta final a Telegram

### Ejemplo de Flujo del Agente:

**Usuario:** "Gasté 50 euros en supermercado"

**Agente analiza:**
```
Input: "Gasté 50 euros en supermercado"
Acción detectada: CREAR_TRANSACCION
Datos extraídos:
  - tipo: "gasto"
  - monto: 50
  - descripcion: "supermercado"
  - fecha: [hoy]
Decisión: Usar HTTP Request (Webhook)
```

**Agente ejecuta:**
```
Llama a: HTTP Request Node
Envia: { telefono: "+34612345678", tipo: "gasto", monto: 50, descripcion: "supermercado" }
```

**Agente recibe:**
```
Respuesta: { success: true, transaction_id: "abc-123" }
```

**Agente formatea:**
```
Respuesta para usuario: "✅ Gasto de 50 euros agregado exitosamente"
```

---

## 🎯 DECISIÓN FINAL

### ¿Qué método usar?

**Para CREAR/MODIFICAR/ELIMINAR transacciones:**
✅ **Webhook HTTP** (más fácil, más seguro, no necesitas PostgreSQL)

**Para CONSULTAR datos (gastos, ingresos, balance):**
✅ **PostgreSQL directo** (más flexible, queries SQL)

### Configuración Recomendada:

```
1. Webhook HTTP (para escribir)
   → NO necesitas conectar PostgreSQL
   → Solo necesitas el nodo HTTP Request
   → URL: /api/webhook/n8n

2. PostgreSQL (para leer)
   → SÍ necesitas conectar PostgreSQL
   → Usa el nodo PostgreSQL
   → Conexión a Supabase DB
```

---

## 📋 RESUMEN SIMPLE

### Para Crear/Modificar/Eliminar:
- **Usa:** HTTP Request → Webhook
- **URL:** `/api/webhook/n8n`
- **Headers:** `Authorization: Bearer WEBHOOK_SECRET_TOKEN`
- **¿Necesitas PostgreSQL?** ❌ NO

### Para Consultar:
- **Usa:** PostgreSQL Node
- **Conexión:** Supabase DB
- **Query:** SQL directamente
- **¿Necesitas PostgreSQL?** ✅ SÍ

### El Agente:
- **Entiende** lo que quiere el usuario
- **Decide** qué nodo usar (HTTP Request o PostgreSQL)
- **Ejecuta** la acción
- **Formatea** la respuesta

---

**¿Todavía confundido?** 

**Respuesta simple:**
- Para **escribir** (crear/modificar/eliminar): Usa **HTTP Request**
- Para **leer** (consultar): Usa **PostgreSQL**

**Eso es todo.** 🎯

