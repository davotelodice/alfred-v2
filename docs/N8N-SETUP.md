# 🔄 Configuración de n8n para Asistente Contable

Guía completa para configurar los flujos de n8n que integran Telegram con el sistema contable.

## 📋 Requisitos Previos

- Instancia de n8n funcionando
- Bot de Telegram configurado
- Credenciales de OpenAI (para el agente IA)
- URL de tu aplicación desplegada (o localhost para desarrollo)
- Token de webhook (`WEBHOOK_SECRET_TOKEN`)

## 🔑 Generar Token de API (WEBHOOK_SECRET_TOKEN)

El `WEBHOOK_SECRET_TOKEN` es un token secreto que autentica las peticiones HTTP desde n8n hacia tu aplicación. Debes generar uno único y seguro.

### Opción 1: Usando OpenSSL (Recomendado)

Ejecuta este comando en tu terminal:

```bash
openssl rand -hex 32
```

**Ejemplo de salida:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Opción 2: Usando Node.js

Si prefieres usar Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configurar el Token

Una vez generado el token, debes configurarlo en **dos lugares**:

#### 1. En tu archivo `.env.local` (Desarrollo Local)

```bash
WEBHOOK_SECRET_TOKEN=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### 2. En Vercel (Producción)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:
   - **Name**: `WEBHOOK_SECRET_TOKEN`
   - **Value**: El token que generaste
   - **Environment**: Production, Preview, Development (según necesites)
5. Haz clic en **Save**
6. **IMPORTANTE**: Redespliega tu aplicación para que los cambios surtan efecto

#### 3. En n8n (Headers HTTP)

Usa el mismo token en todos los nodos **HTTP Request** de n8n:

```
Authorization: Bearer a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**⚠️ IMPORTANTE**: 
- El token debe ser **exactamente el mismo** en `.env.local`, Vercel y n8n
- Nunca compartas este token públicamente
- Si comprometes el token, genera uno nuevo inmediatamente

## 🏗️ Arquitectura de Flujos

El sistema utiliza **1 flujo principal coordinador** y **3 subflujos**:

1. **Flujo Principal**: Recibe mensajes de Telegram y los enruta según el tipo (texto, audio, PDF)
2. **Subflujo CREAR TRANSACCIÓN**: Crea transacciones desde mensajes de texto
3. **Subflujo CONSULTAS**: Consulta transacciones existentes
4. **Subflujo CREAR ASIENTO CONTABLE**: Procesa extractos bancarios PDF y crea asientos contables

**📚 Documentación detallada de cada flujo:**
- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Configuración completa del flujo coordinador
- **[N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)**: Configuración del subflujo de crear transacción
- **[N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)**: Configuración del subflujo de consultas
- **[N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)**: Configuración del subflujo de crear asiento contable

## 🔧 Configuración Paso a Paso

### Paso 1: Configurar Credenciales en n8n

#### 1.1 Telegram Bot

1. Ve a **Credentials** en n8n
2. Crea nueva credencial de tipo **Telegram**
3. Ingresa tu **Bot Token** de Telegram
4. Guarda como: `Alfred Aux Bot`

#### 1.2 OpenAI

1. Crea nueva credencial de tipo **OpenAI**
2. Ingresa tu **API Key** de OpenAI
3. Guarda como: `OpenAi account`

#### 1.3 PostgreSQL (Opcional - solo si usas consultas directas)

1. Crea nueva credencial de tipo **PostgreSQL**
2. Configuración:
   - **Host**: `TU_PROYECTO.supabase.co`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Tu Service Role Key de Supabase
   - **Port**: `5432`
   - **SSL**: Habilitado

### Paso 2: Configurar Flujos

**📚 IMPORTANTE:** Para la configuración detallada de cada flujo, consulta los documentos específicos:

- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Configuración completa del flujo coordinador con todos sus nodos
- **[N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)**: Configuración del subflujo de crear transacción
- **[N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)**: Configuración del subflujo de consultas
- **[N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)**: Configuración del subflujo de crear asiento contable

A continuación se muestra un resumen rápido, pero **recomendamos seguir la documentación detallada de cada flujo**.

---

### Resumen Rápido: Flujo Principal

Este flujo recibe mensajes de Telegram y los enruta según el tipo (texto, audio, PDF).

#### 2.1 Nodo: Telegram Trigger

**Configuración:**
- **Credential**: `Alfred Aux Bot`
- **Updates**: `message`
- **Webhook ID**: Se genera automáticamente

#### 2.2 Nodo: Switch

Este nodo separa los mensajes según su tipo:

**Salida 1: Texto**
- Condición: `{{ $json.message.text }}` existe

**Salida 2: Audio**
- Condición: `{{ $json.message.voice.mime_type }}` existe

**Salida 3: PDF**
- Condición: `{{ $json.message.document.mime_type }}` existe

#### 2.3 Nodo: Edit Fields (Para texto)

**Asignaciones:**
- `text`: `={{ $json.message.text }}`

#### 2.4 Nodo: AI Agent (Para procesar mensajes de texto)

**Configuración:**
- **Model**: `gpt-5` (o `gpt-4o`)
- **System Message**: Copia el prompt completo de `docs/N8N-AGENT-PROMPT.md`
- **Tools disponibles**:
  - `CREAR TRANSACCIÓN` (subflujo)
  - `CONSULTAS` (subflujo)
  - `Date & Time`
  - `Calculator`

**Memory**: PostgreSQL Chat Memory
- **Table**: `asistente_contable`
- **Session Key**: `={{ $json.message.chat.id }}`

#### 2.5 Nodo: Telegram (Para audio)

**Configuración:**
- **Resource**: `file`
- **File ID**: `={{ $('Telegram Trigger').item.json.message.voice.file_id }}`

#### 2.6 Nodo: OpenAI (Transcripción de audio)

**Configuración:**
- **Resource**: `audio`
- **Operation**: `transcribe`
- **Credential**: `OpenAi account`

#### 2.7 Nodo: Extract from File (Para PDF)

**Configuración:**
- **Operation**: `pdf`
- **Input**: Archivo recibido de Telegram

#### 2.8 Nodo: Code (Limpieza de texto PDF)

**JavaScript:**
```javascript
const raw = $input.first().json.text_fragment || '';

const cleanText = raw
  .replace(/\r?\n+/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .replace(/[^\x20-\x7EÀ-ÿ€ñÑ.,:;()\-\/]/g, '')
  .trim();

return [{
  json: {
    text_clean: cleanText
  }
}];
```

#### 2.9 Nodo: AI Agent (Para procesar extractos PDF)

**Configuración:**
- **Model**: `gpt-4o` (recomendado para procesamiento de extractos)
- **System Message**: Copia el prompt de `docs/N8N-AGENT-PROMPT-ASIENTOS.md`
- **Tool disponible**:
  - `CREAR ASIENTO CONTABLE` (subflujo)

### Resumen Rápido: Subflujos

**⚠️ Para la configuración completa, consulta los documentos específicos de cada subflujo.**

---

### Resumen: Subflujo CREAR TRANSACCIÓN

Este subflujo crea una transacción desde un mensaje de texto.

**📚 Documentación completa:** [N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)

#### 3.1 Nodo: When Executed by Another Workflow

**Input Source**: `passthrough`

#### 3.2 Nodo: HTTP Request

**Configuración:**
- **Method**: `POST`
- **URL**: 
  - **Producción**: `https://TU-PROYECTO.vercel.app/api/webhook/n8n`
  - **Desarrollo Local**: `http://localhost:3000/api/webhook/n8n`
- **Authentication**: `Generic Credential Type`
- **Headers**:
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON)**:
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "telefono": "{{ $json.telefono }}",
  "tipo": "{{ $json.tipo }}",
  "monto": {{ $json.monto }},
  "descripcion": "{{ $json.descripcion }}",
  "fecha": "{{ $json.fecha }}",
  "metodo_pago": "{{ $json.metodo_pago }}"
}
```

**Nota**: Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste anteriormente. El mismo token debe estar configurado en tu archivo `.env.local` y en Vercel.

#### 3.3 Nodo: Edit Fields

**Asignaciones:**
- `output`: `={{ $json.data.message }}`

### Resumen: Subflujo CONSULTAS

Este subflujo consulta transacciones existentes.

**📚 Documentación completa:** [N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)

#### 4.1 Nodo: When Executed by Another Workflow

**Input Source**: `passthrough`

#### 4.2 Nodo: Code (Procesamiento de consulta)

**JavaScript:**
```javascript
const inputData = $input.all();

const results = inputData.map(item => {
  let data = {};
  
  if (typeof item.json.query === "string") {
    try {
      data = JSON.parse(item.json.query);
    } catch (err) {
      return { json: { error: true, message: "Error al parsear JSON" } };
    }
  } else if (typeof item.json.query === "object") {
    data = item.json.query;
  } else {
    data = item.json;
  }

  if (!data.chat_id) {
    return { json: { error: true, message: "chat_id es requerido" } };
  }

  const cleanData = Object.entries(data)
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .reduce((obj, [k, v]) => ({ ...obj, [k]: typeof v === "string" ? v.trim() : v }), {});

  const query = { chat_id: cleanData.chat_id };
  
  if (cleanData.fecha_desde) query.fecha_desde = cleanData.fecha_desde;
  if (cleanData.fecha_hasta) query.fecha_hasta = cleanData.fecha_hasta;

  const tipoConsulta = (cleanData.tipo_consulta || "todas").toLowerCase();
  
  switch (tipoConsulta) {
    case "ingresos": query.tipo = "ingreso"; break;
    case "gastos": query.tipo = "gasto"; break;
    case "ahorros": query.tipo = "ahorro"; break;
    case "inversiones": query.tipo = "inversion"; break;
  }

  return {
    json: {
      query,
      tipo_consulta: tipoConsulta,
      mensaje_original: cleanData.mensaje_usuario || ""
    }
  };
});

return results;
```

#### 4.3 Nodo: HTTP Request

**Configuración:**
- **Method**: `POST`
- **URL**: 
  - **Producción**: `https://TU-PROYECTO.vercel.app/api/transactions/query`
  - **Desarrollo Local**: `http://localhost:3000/api/transactions/query`
- **Authentication**: `Generic Credential Type`
- **Headers**:
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON)**:
```json
{
  "chat_id": "{{ $json.query.chat_id }}",
  "fecha_desde": "{{ $json.query.fecha_desde }}",
  "fecha_hasta": "{{ $json.query.fecha_hasta }}",
  "tipo": "{{ $json.query.tipo }}"
}
```

**Nota**: Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste anteriormente.

#### 4.4 Nodo: AI Agent (Formatear respuesta)

**Configuración:**
- **Model**: `gpt-4.1-mini`
- **System Message**: `Convierte en un formato de mensaje la respuesta por favor para el usuario con la información dada.`
- **Text**: `respuesta: {{ $json.respuesta }}`

### Resumen: Subflujo CREAR ASIENTO CONTABLE

Este subflujo crea asientos contables desde extractos bancarios.

**📚 Documentación completa:** [N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)

#### 5.1 Nodo: When Executed by Another Workflow

**Input Source**: `jsonExample`

**JSON Example:**
```json
{
  "chat_id": "123456789",
  "fecha": "2025-11-05",
  "descripcion": "CARGO POR AMORTIZACION",
  "tipo_movimiento": "gasto",
  "categoria_contable": "GAS008",
  "monto": 137.39,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "saldo_posterior": 430.39,
  "referencia": "0182-0787-48-0830126020"
}
```

#### 5.2 Nodo: HTTP Request

**Configuración:**
- **Method**: `POST`
- **URL**: 
  - **Producción**: `https://TU-PROYECTO.vercel.app/api/webhook/asientos`
  - **Desarrollo Local**: `http://localhost:3000/api/webhook/asientos`
- **Authentication**: `Generic Credential Type`
- **Headers**:
  - `Authorization`: `Bearer TU_WEBHOOK_SECRET_TOKEN` (reemplaza con tu token real)
  - `Content-Type`: `application/json`
- **Body (JSON)**:
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

**Nota**: Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste anteriormente.

#### 5.3 Nodo: Edit Fields

**Asignaciones:**
- `output`: `={{ $json.data.message }}`

## 📝 Prompts del Sistema

**⚠️ IMPORTANTE:** Los prompts son archivos separados que debes copiar y pegar directamente en n8n. Son necesarios para que los Agentes IA funcionen correctamente.

### Para Mensajes de Texto

1. Abre el archivo `docs/N8N-AGENT-PROMPT.md`
2. Copia TODO el contenido de la sección "📋 PROMPT DEL SISTEMA (COMPLETO)"
3. Pega el prompt completo en el campo **System Message** del nodo **AI Agent** del flujo principal

**Archivo:** `docs/N8N-AGENT-PROMPT.md`

### Para Extractos Bancarios

1. Abre el archivo `docs/N8N-AGENT-PROMPT-ASIENTOS.md`
2. Copia TODO el contenido del prompt (es muy largo, asegúrate de copiarlo completo)
3. Pega el prompt completo en el campo **System Message** del nodo **AI Agent1** que procesa PDFs

**Archivo:** `docs/N8N-AGENT-PROMPT-ASIENTOS.md`

**¿Por qué archivos separados?** Los prompts son muy largos (600+ y 800+ líneas) y contienen toda la lógica del Agente IA. Se mantienen en archivos separados para facilitar su copia y pegado en n8n. **NO están duplicados en los documentos de flujos** para evitar confusión.

## 🔗 Conectar Subflujos como Tools

### En el Flujo Principal

1. Agrega nodo **Tool Workflow** para cada subflujo
2. **CREAR TRANSACCIÓN**:
   - **Workflow**: Selecciona el subflujo "CREAR TRANSACCIÓN"
   - **Inputs**: Mapea `chat_id`, `tipo`, `monto`, `descripcion`, `fecha`, `telefono`, `metodo_pago`
3. **CONSULTAS**:
   - **Workflow**: Selecciona el subflujo "CONSULTAS"
   - **Inputs**: Mapea `chat_id`, `tipo_consulta`, `fecha_desde`, `fecha_hasta`
4. **CREAR ASIENTO CONTABLE**:
   - **Workflow**: Selecciona el subflujo "CREAR ASIENTO CONTABLE"
   - **Inputs**: Mapea todos los campos del asiento

## ✅ Verificación

### Probar Crear Transacción

Envía a Telegram:
```
Gasté 50 euros en supermercado
```

**Resultado esperado**: El bot responde confirmando que la transacción fue creada.

### Probar Consulta

Envía a Telegram:
```
Quiero saber mis gastos de este mes
```

**Resultado esperado**: El bot responde con un resumen de tus gastos.

### Probar Extracto Bancario

Envía un PDF de extracto bancario a Telegram.

**Resultado esperado**: El bot procesa el extracto y crea asientos contables automáticamente.

## 🔧 Troubleshooting

### Error: "Usuario no registrado"

**Causa**: El `chat_id` no está vinculado a ningún usuario.

**Solución**: 
1. El usuario debe registrarse en el dashboard web
2. Debe vincular su `telegram_chat_id` en el perfil

### Error: "Token de webhook inválido" o "401 Unauthorized"

**Causa**: El `WEBHOOK_SECRET_TOKEN` no coincide entre n8n, `.env.local` y Vercel.

**Solución**: 
1. Verifica que el token en n8n sea **exactamente el mismo** que en `.env.local`
2. Si estás en producción, verifica que el token esté configurado en Vercel:
   - Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
   - Verifica que `WEBHOOK_SECRET_TOKEN` existe y tiene el valor correcto
   - **Redespliega** la aplicación después de agregar/modificar variables de entorno
3. Verifica que no haya espacios extra en el token
4. Asegúrate de usar el formato correcto en el header: `Bearer TU_TOKEN_AQUI` (con espacio después de "Bearer")

### Error: "Token de webhook no configurado" o "500 Internal Server Error"

**Causa**: La variable `WEBHOOK_SECRET_TOKEN` no está configurada en el servidor.

**Solución**:
1. Si estás en desarrollo local, verifica que existe `.env.local` con `WEBHOOK_SECRET_TOKEN`
2. Si estás en producción, agrega la variable en Vercel y redespliega
3. Reinicia el servidor después de agregar la variable

### Error: "No se recibió respuesta de OpenAI"

**Causa**: Problema con la API de OpenAI o créditos insuficientes.

**Solución**: Verifica tu cuenta de OpenAI y los créditos disponibles.

## 📚 Resumen de URLs y Endpoints

### Endpoints Disponibles

| Endpoint | Método | Descripción | URL Producción | URL Desarrollo |
|----------|--------|-------------|----------------|----------------|
| Crear Transacción | POST | Crea una transacción desde n8n | `https://TU-PROYECTO.vercel.app/api/webhook/n8n` | `http://localhost:3000/api/webhook/n8n` |
| Consultar Transacciones | POST | Consulta transacciones por filtros | `https://TU-PROYECTO.vercel.app/api/transactions/query` | `http://localhost:3000/api/transactions/query` |
| Crear Asiento Contable | POST | Crea un asiento contable desde extractos | `https://TU-PROYECTO.vercel.app/api/webhook/asientos` | `http://localhost:3000/api/webhook/asientos` |

### Headers Requeridos

Todos los endpoints requieren estos headers:

```
Authorization: Bearer TU_WEBHOOK_SECRET_TOKEN
Content-Type: application/json
```

**⚠️ IMPORTANTE**: 
- Reemplaza `TU_PROYECTO` con el nombre de tu proyecto en Vercel
- Reemplaza `TU_WEBHOOK_SECRET_TOKEN` con el token que generaste usando `openssl rand -hex 32`
- El mismo token debe estar en `.env.local`, Vercel y n8n

## 📚 Documentación Adicional

### Flujos de n8n

- **[N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)**: Documentación completa del flujo coordinador
- **[N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)**: Documentación del subflujo de crear transacción
- **[N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)**: Documentación del subflujo de consultas
- **[N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)**: Documentación del subflujo de crear asiento contable

### Prompts del Sistema

- **[N8N-AGENT-PROMPT.md](N8N-AGENT-PROMPT.md)**: Prompt del sistema para mensajes de texto
- **[N8N-AGENT-PROMPT-ASIENTOS.md](N8N-AGENT-PROMPT-ASIENTOS.md)**: Prompt del sistema para extractos bancarios

### Base de Datos

- **[DATABASE-SCHEMA.md](DATABASE-SCHEMA.md)**: Esquema completo de la base de datos
- **[DATABASE-SETUP.md](DATABASE-SETUP.md)**: Guía de configuración de la base de datos

---

**¿Necesitas ayuda?** Revisa los logs de n8n y los logs de tu aplicación para diagnosticar problemas.

