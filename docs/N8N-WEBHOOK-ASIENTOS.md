# 📋 WEBHOOK N8N - ASIENTOS CONTABLES UNIVERSALES
## Formato del Body HTTP y Configuración Completa

**Última actualización:** 2025-01-27  
**Propósito:** Documentación completa del formato JSON y configuración del webhook para recibir asientos contables desde n8n  
**Endpoint:** `POST /api/webhook/asientos`

---

## 🎯 FORMATO DEL JSON

### JSON Mínimo (Campos Obligatorios)

```json
{
  "chat_id": "123456789",
  "fecha": "2025-09-02",
  "descripcion": "ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U",
  "tipo_movimiento": "ingreso",
  "categoria_contable": "ING001",
  "monto": 835.51,
  "cuenta_origen": "ES7701824259060202343378"
}
```

### JSON Completo (Con Todos los Campos)

```json
{
  "chat_id": "123456789",
  "user_id": "uuid-del-usuario",
  "id_asiento": "A-2025-000123",
  "fecha": "2025-09-02",
  "descripcion": "ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U",
  "tipo_movimiento": "ingreso",
  "categoria_contable": "ING001",
  "monto": 835.51,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "cuenta_destino": "GERIOLVEIRA S.L.U",
  "saldo_posterior": 1163.50,
  "referencia": "N2025244004037086",
  "fuente_datos": "Extracto Bancario BBVA",
  "telefono": "+34612345678"
}
```

---

## 📝 PARÁMETROS DETALLADOS

### ⚠️ Campos OBLIGATORIOS

#### `chat_id` (string) - **OBLIGATORIO**
- **Descripción:** ID del chat de Telegram del usuario
- **Tipo:** `string`
- **Ejemplo:** `"123456789"`
- **⚠️ IMPORTANTE:** El usuario DEBE estar registrado previamente en el dashboard con este `chat_id` vinculado
- **Cómo obtenerlo en n8n:** `{{ $json.chat.id }}` o `{{ $json.message.chat.id }}`

#### `fecha` (string) - **OBLIGATORIO**
- **Descripción:** Fecha de la operación
- **Tipo:** `string` (formato: `YYYY-MM-DD`)
- **Ejemplo:** `"2025-09-02"`
- **Validación:** Debe seguir el formato ISO 8601 (YYYY-MM-DD)

#### `descripcion` (string) - **OBLIGATORIO**
- **Descripción:** Concepto extraído del extracto bancario
- **Tipo:** `string`
- **Ejemplo:** `"ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U"`
- **Validación:** No puede estar vacío

#### `tipo_movimiento` (string) - **OBLIGATORIO**
- **Descripción:** Tipo de movimiento contable
- **Tipo:** `string`
- **Valores permitidos:** `"ingreso"`, `"gasto"`, `"otro"`
- **Ejemplo:** `"ingreso"`
- **⚠️ IMPORTANTE:** Debe coincidir con el tipo de la categoría seleccionada

#### `categoria_contable` (string) - **OBLIGATORIO**
- **Descripción:** Código de categoría contable universal
- **Tipo:** `string`
- **Ejemplo:** `"ING001"`
- **Valores válidos:** Ver sección "Catálogo de Categorías" más abajo
- **⚠️ IMPORTANTE:** Debe existir en el catálogo y estar activa

#### `monto` (number) - **OBLIGATORIO**
- **Descripción:** Valor numérico del movimiento
- **Tipo:** `number` (decimal)
- **Ejemplo:** `835.51`
- **Validación:** Debe ser mayor a 0

#### `cuenta_origen` (string) - **OBLIGATORIO**
- **Descripción:** IBAN o nombre de la cuenta de origen
- **Tipo:** `string`
- **Ejemplo:** `"ES7701824259060202343378"` o `"Cuenta Principal BBVA"`
- **Validación:** No puede estar vacío

### 📌 Campos OPCIONALES

#### `user_id` (string) - **OPCIONAL**
- **Descripción:** UUID del usuario en la base de datos
- **Tipo:** `string` (UUID)
- **Ejemplo:** `"21baee99-3624-444b-abcc-0b10667751bd"`
- **Nota:** Si se proporciona, se usa directamente. Si no, se busca por `chat_id`

#### `id_asiento` (string) - **OPCIONAL**
- **Descripción:** Identificador único del asiento
- **Tipo:** `string`
- **Ejemplo:** `"A-2025-000123"` o UUID
- **Nota:** Si no se proporciona, se genera automáticamente

#### `moneda` (string) - **OPCIONAL**
- **Descripción:** Código ISO 4217 de la moneda
- **Tipo:** `string` (3 letras mayúsculas)
- **Ejemplo:** `"EUR"`, `"USD"`, `"GBP"`
- **Default:** `"EUR"`
- **Validación:** Debe ser código ISO 4217 válido (3 letras mayúsculas)

#### `cuenta_destino` (string) - **OPCIONAL**
- **Descripción:** IBAN o descripción de la cuenta destino
- **Tipo:** `string`
- **Ejemplo:** `"GERIOLVEIRA S.L.U"` o `"ES1234567890123456789012"`

#### `saldo_posterior` (number) - **OPCIONAL**
- **Descripción:** Saldo final tras la operación
- **Tipo:** `number` (decimal)
- **Ejemplo:** `1163.50`

#### `referencia` (string) - **OPCIONAL**
- **Descripción:** Referencia o código de transacción
- **Tipo:** `string`
- **Ejemplo:** `"N2025244004037086"`

#### `fuente_datos` (string) - **OPCIONAL**
- **Descripción:** Origen de la información
- **Tipo:** `string`
- **Ejemplo:** `"Extracto Bancario BBVA"`, `"n8n"`, `"Manual"`
- **Default:** `"n8n"`

#### `telefono` (string) - **OPCIONAL**
- **Descripción:** Teléfono del usuario
- **Tipo:** `string`
- **Ejemplo:** `"+34612345678"`
- **Nota:** Si se proporciona y es diferente al del usuario, se actualiza automáticamente

---

## 📊 CATÁLOGO DE CATEGORÍAS CONTABLES

### Ingresos (`tipo_movimiento: "ingreso"`)

| Código | Nombre | Ejemplos de Uso |
|--------|--------|-----------------|
| `ING001` | Ingreso - Nómina o transferencia recibida | "ABONO DE NOMINA", "TRANSFERENCIA RECIBIDA", "BIZUM RECIBIDO" |
| `ING002` | Ingreso - Bonificación o reembolso | "ABONO BONIFICACIÓN", "DEVOLUCIÓN", "CASHBACK" |

### Gastos (`tipo_movimiento: "gasto"`)

| Código | Nombre | Ejemplos de Uso |
|--------|--------|-----------------|
| `GAS001` | Gasto - Compras y supermercados | "FROIZ", "GADIS", "AUTOSERVICIOS FAMILIA" |
| `GAS002` | Gasto - Servicios (energía, agua, internet) | "Naturgy", "R Cable", "Telecable" |
| `GAS003` | Gasto - Restauración y ocio | "PASTELERIA", "CAFETERIA", "RESTAURANTE" |
| `GAS004` | Gasto - Transporte | "MONFOBUS", "GASOLINERA", "BUTANO" |
| `GAS005` | Gasto - Hogar y decoración | "MERCA ASIA", "FLORISTERIA" |
| `GAS006` | Gasto - Salud y farmacia | "FARMACIA", "SANIDAD" |
| `GAS007` | Gasto - Suscripciones o servicios digitales | "Microsoft", "Google One", "Amazon" |
| `GAS008` | Gasto - Comisiones bancarias o cargos automáticos | "CARGO POR AMORTIZACION", "COMISION" |
| `GAS009` | Gasto - Retiro de efectivo o débito | "RET. EFECTIVO", "CAJERO" |

### Transferencias

| Código | Nombre | Tipo | Ejemplos |
|--------|--------|------|----------|
| `TRF001` | Transferencia - Enviada | `gasto` | "TRANSFERENCIAS DAVID", "HECTOR" |
| `TRF002` | Transferencia - Recibida | `ingreso` | "BIZUM", "RECIBIDO" |

### Otros

| Código | Nombre | Ejemplos |
|--------|--------|----------|
| `OTR001` | Otros movimientos o sin clasificar | "LIQUIDACION INTERESES", "VARIOS" |

---

## 🔧 CONFIGURACIÓN PASO A PASO EN N8N

### Paso 1: Crear el Nodo HTTP Request

1. **Agregar nodo:** Arrastra un nodo `HTTP Request` a tu workflow
2. **Nombre del nodo:** `Crear Asiento Contable` (opcional, pero recomendado)

### Paso 2: Configurar el Nodo HTTP Request

#### **Configuración Básica:**

- **Name:** `Crear Asiento Contable`
- **Authentication:** `None` (manejamos auth en headers)
- **Method:** `POST`
- **URL:** 
  - **Producción:** `https://TU-PROYECTO.vercel.app/api/webhook/asientos`
  - **Desarrollo local:** `http://localhost:3000/api/webhook/asientos`
  - **Ejemplo:** `https://alfred-contable.vercel.app/api/webhook/asientos`

#### **Headers:**

Agregar los siguientes headers:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer TU_WEBHOOK_SECRET_TOKEN_AQUI` |
| `Content-Type` | `application/json` |

**Ejemplo de configuración en n8n:**
```
Authorization: Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da
Content-Type: application/json
```

#### **Send Body:** `Yes`

#### **Specify Body:** `JSON`

#### **Body (JSON):**

Usa expresiones de n8n para generar dinámicamente el JSON. Aquí tienes ejemplos:

**Ejemplo Completo con Expresiones de n8n:**

```json
{
  "chat_id": "{{ $json.chat.id }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "monto": {{ $json.monto }},
  "moneda": "{{ $json.moneda || 'EUR' }}",
  "cuenta_origen": "{{ $json.cuenta_origen }}",
  "cuenta_destino": "{{ $json.cuenta_destino }}",
  "saldo_posterior": {{ $json.saldo_posterior }},
  "referencia": "{{ $json.referencia }}",
  "fuente_datos": "{{ $json.fuente_datos || 'n8n' }}",
  "telefono": "{{ $json.telefono }}"
}
```

**Ejemplo Mínimo (Solo Campos Obligatorios):**

```json
{
  "chat_id": "{{ $json.chat.id }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "monto": {{ $json.monto }},
  "cuenta_origen": "{{ $json.cuenta_origen }}"
}
```

---

## 📊 EJEMPLOS PRÁCTICOS COMPLETOS

### Ejemplo 1: Ingreso de Nómina (Mínimo)

**Datos de entrada en n8n:**
```json
{
  "chat_id": "123456789",
  "fecha": "2025-09-02",
  "descripcion": "ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U",
  "tipo_movimiento": "ingreso",
  "categoria_contable": "ING001",
  "monto": 835.51,
  "cuenta_origen": "ES7701824259060202343378"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "monto": {{ $json.monto }},
  "cuenta_origen": "{{ $json.cuenta_origen }}"
}
```

### Ejemplo 2: Gasto en Supermercado (Completo)

**Datos de entrada en n8n:**
```json
{
  "chat_id": "123456789",
  "fecha": "2025-09-15",
  "descripcion": "COMPRA EN FROIZ",
  "tipo_movimiento": "gasto",
  "categoria_contable": "GAS001",
  "monto": 125.75,
  "moneda": "EUR",
  "cuenta_origen": "ES7701824259060202343378",
  "saldo_posterior": 1037.76,
  "referencia": "TARJETA-1234",
  "fuente_datos": "Extracto Bancario BBVA"
}
```

**Body del HTTP Request:**
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "monto": {{ $json.monto }},
  "moneda": "{{ $json.moneda || 'EUR' }}",
  "cuenta_origen": "{{ $json.cuenta_origen }}",
  "saldo_posterior": {{ $json.saldo_posterior }},
  "referencia": "{{ $json.referencia }}",
  "fuente_datos": "{{ $json.fuente_datos || 'n8n' }}"
}
```

### Ejemplo 3: Transferencia Enviada

**Datos de entrada en n8n:**
```json
{
  "chat_id": "123456789",
  "fecha": "2025-09-20",
  "descripcion": "TRANSFERENCIA A DAVID",
  "tipo_movimiento": "gasto",
  "categoria_contable": "TRF001",
  "monto": 200.00,
  "cuenta_origen": "ES7701824259060202343378",
  "cuenta_destino": "ES1234567890123456789012"
}
```

### Ejemplo 4: Procesamiento de Extracto Bancario Automático

**Escenario:** Procesar múltiples líneas de un extracto bancario

**Workflow sugerido en n8n:**

1. **Nodo: Extracto Bancario** (Trigger o entrada de datos)
2. **Nodo: Split In Batches** (dividir en líneas individuales)
3. **Nodo: Clasificar con IA** (determinar tipo_movimiento y categoria_contable)
4. **Nodo: HTTP Request - Crear Asiento** (este nodo)

**Body del HTTP Request con datos procesados:**
```json
{
  "chat_id": "{{ $json.chat_id }}",
  "fecha": "{{ $json.fecha }}",
  "descripcion": "{{ $json.descripcion }}",
  "tipo_movimiento": "{{ $json.tipo_movimiento }}",
  "categoria_contable": "{{ $json.categoria_contable }}",
  "monto": {{ $json.monto }},
  "moneda": "{{ $json.moneda || 'EUR' }}",
  "cuenta_origen": "{{ $json.cuenta_origen }}",
  "cuenta_destino": "{{ $json.cuenta_destino }}",
  "saldo_posterior": {{ $json.saldo_posterior }},
  "referencia": "{{ $json.referencia }}",
  "fuente_datos": "{{ $json.fuente_datos || 'Extracto Bancario BBVA' }}"
}
```

---

## 🚀 RESPUESTAS DEL WEBHOOK

### ✅ Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "data": {
    "id_asiento": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "21baee99-3624-444b-abcc-0b10667751bd",
    "message": "Asiento contable creado exitosamente"
  },
  "message": "Webhook procesado correctamente"
}
```

**Campos de la respuesta:**
- `success`: `true` indica que la operación fue exitosa
- `data.id_asiento`: ID único del asiento creado (UUID o formato personalizado)
- `data.user_id`: UUID del usuario al que pertenece el asiento
- `data.message`: Mensaje de confirmación
- `message`: Mensaje general del webhook

### ❌ Respuestas de Error

#### Error 400 - Validación Fallida

```json
{
  "success": false,
  "error": "fecha debe tener formato YYYY-MM-DD"
}
```

**Errores comunes de validación:**
- `"chat_id es requerido"`
- `"fecha es requerida (formato: YYYY-MM-DD)"`
- `"fecha debe tener formato YYYY-MM-DD"`
- `"descripcion es requerida"`
- `"tipo_movimiento debe ser: ingreso, gasto u otro"`
- `"categoria_contable es requerida"`
- `"monto debe ser mayor a 0"`
- `"cuenta_origen es requerida"`
- `"moneda debe ser un código ISO 4217 válido (3 letras mayúsculas, ej: EUR, USD)"`
- `"La categoría contable ING999 no existe o no está activa"`
- `"El tipo_movimiento (gasto) no coincide con el tipo de la categoría ING001 (ingreso)"`

**⚠️ EXCEPCIÓN:** La categoría `OTR001` (Otros movimientos o sin clasificar) acepta cualquier tipo de movimiento (`ingreso`, `gasto` u `otro`). Esto permite clasificar movimientos ambiguos o que no encajan claramente en otras categorías.

#### Error 401 - Token Inválido

```json
{
  "success": false,
  "error": "Token de webhook inválido"
}
```

**Solución:** Verificar que el token en el header `Authorization` sea correcto.

#### Error 404 - Usuario No Encontrado

```json
{
  "success": false,
  "error": "Usuario no registrado. El chat_id 123456789 no está vinculado a ninguna cuenta. Por favor, registra tu cuenta en el dashboard y vincula tu Telegram Chat ID."
}
```

**⚠️ IMPORTANTE:** El usuario DEBE estar registrado previamente en el dashboard y tener su `chat_id` vinculado en el perfil.

**Solución:**
1. El usuario debe registrarse en el dashboard
2. Ir a "Mi Perfil"
3. Vincular su `chat_id` de Telegram
4. Luego podrá recibir asientos desde n8n

#### Error 500 - Error del Servidor

```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```

**Solución:** Revisar los logs del servidor para más detalles.

---

## 🔗 OBTENER CHAT_ID EN N8N

### Desde Trigger de Telegram

Si estás usando el trigger de Telegram en n8n, el `chat_id` está disponible en:

```
{{ $json.message.chat.id }}
```

O también puede estar en:

```
{{ $json.chat.id }}
```

### Desde Webhook de Telegram

Si recibes datos desde un webhook de Telegram:

```
{{ $json.message.chat.id }}
```

### Ejemplo Completo de Configuración

**Nodo Trigger: Telegram**
- Output: `{ "message": { "chat": { "id": "123456789" } } }`

**Nodo HTTP Request:**
- Body JSON:
```json
{
  "chat_id": "{{ $json.message.chat.id }}",
  "fecha": "{{ $now.format('YYYY-MM-DD') }}",
  "descripcion": "{{ $json.message.text }}",
  "tipo_movimiento": "gasto",
  "categoria_contable": "GAS001",
  "monto": 50.00,
  "cuenta_origen": "ES7701824259060202343378"
}
```

---

## ✅ VALIDACIONES AUTOMÁTICAS

El webhook valida automáticamente:

### Validaciones de Campos Obligatorios
- ✅ `chat_id` está presente
- ✅ `fecha` está presente y tiene formato YYYY-MM-DD
- ✅ `descripcion` está presente y no está vacío
- ✅ `tipo_movimiento` es uno de: `ingreso`, `gasto`, `otro`
- ✅ `categoria_contable` está presente
- ✅ `monto` es un número mayor a 0
- ✅ `cuenta_origen` está presente y no está vacío

### Validaciones de Formato
- ✅ Formato de fecha: `YYYY-MM-DD` (ej: `2025-09-02`)
- ✅ Formato de moneda: Código ISO 4217 válido (3 letras mayúsculas)
- ✅ Formato de `id_asiento`: UUID o formato personalizado

### Validaciones de Negocio
- ✅ Usuario existe en la base de datos (buscado por `chat_id`)
- ✅ Categoría existe en el catálogo y está activa
- ✅ `tipo_movimiento` coincide con el tipo de la categoría seleccionada
- ⚠️ **EXCEPCIÓN:** La categoría `OTR001` acepta cualquier tipo de movimiento (`ingreso`, `gasto` u `otro`)

---

## 🔄 FLUJO COMPLETO EN N8N

### Flujo Recomendado para Procesar Extractos Bancarios

```
[Trigger: Extracto Bancario]
  ↓
[Nodo: Parsear Extracto]
  → Extrae: fecha, descripcion, monto, cuenta_origen, referencia, saldo_posterior
  ↓
[Nodo: Clasificar con IA]
  → Determina: tipo_movimiento, categoria_contable basado en descripcion
  → Usa catálogo de categorías para sugerir la mejor categoría
  ↓
[Nodo: Enriquecer Datos]
  → Agrega: chat_id del usuario, moneda (EUR), fuente_datos
  ↓
[Nodo: HTTP Request - Crear Asiento]
  → POST /api/webhook/asientos
  → Body: { chat_id, fecha, descripcion, tipo_movimiento, categoria_contable, monto, ... }
  ↓
[Nodo: Verificar Respuesta]
  → Si success: Continuar
  → Si error: Notificar y registrar en logs
```

### Ejemplo de Nodo "Clasificar con IA"

**Prompt sugerido para el nodo de IA:**

```
Analiza la siguiente descripción de movimiento bancario y determina:
1. tipo_movimiento: "ingreso", "gasto" u "otro"
2. categoria_contable: código de categoría más apropiado

Descripción: {{ $json.descripcion }}
Monto: {{ $json.monto }}

Catálogo de categorías disponibles:
- ING001: Ingreso - Nómina o transferencia recibida
- ING002: Ingreso - Bonificación o reembolso
- GAS001: Gasto - Compras y supermercados
- GAS002: Gasto - Servicios (energía, agua, internet)
- GAS003: Gasto - Restauración y ocio
- GAS004: Gasto - Transporte
- GAS005: Gasto - Hogar y decoración
- GAS006: Gasto - Salud y farmacia
- GAS007: Gasto - Suscripciones o servicios digitales
- GAS008: Gasto - Comisiones bancarias o cargos automáticos
- GAS009: Gasto - Retiro de efectivo o débito
- TRF001: Transferencia - Enviada
- TRF002: Transferencia - Recibida
- OTR001: Otros movimientos o sin clasificar

Responde SOLO con un JSON en este formato:
{
  "tipo_movimiento": "ingreso|gasto|otro",
  "categoria_contable": "CODIGO_DE_CATEGORIA"
}
```

---

## 🧪 PRUEBAS DESDE TERMINAL

### Probar el Webhook con cURL

```bash
curl -X POST http://localhost:3000/api/webhook/asientos \
  -H "Authorization: Bearer TU_WEBHOOK_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789",
    "fecha": "2025-09-02",
    "descripcion": "ABONO DE NOMINA POR TRANSFERENCIA GERIOLVEIRA S.L.U",
    "tipo_movimiento": "ingreso",
    "categoria_contable": "ING001",
    "monto": 835.51,
    "moneda": "EUR",
    "cuenta_origen": "ES7701824259060202343378",
    "cuenta_destino": "GERIOLVEIRA S.L.U",
    "saldo_posterior": 1163.50,
    "referencia": "N2025244004037086",
    "fuente_datos": "Extracto Bancario BBVA"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id_asiento": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "21baee99-3624-444b-abcc-0b10667751bd",
    "message": "Asiento contable creado exitosamente"
  },
  "message": "Webhook procesado correctamente"
}
```

---

## ⚠️ IMPORTANTE - REQUISITOS PREVIOS

### 1. Usuario Debe Estar Registrado

**⚠️ CRÍTICO:** El usuario DEBE estar registrado previamente en el dashboard y tener su `chat_id` vinculado.

**Proceso para el usuario:**
1. Registrarse en el dashboard (`/auth`)
2. Iniciar sesión
3. Ir a "Mi Perfil" (`/profile`)
4. Vincular su `chat_id` de Telegram
5. Guardar cambios

**Sin esto, el webhook devolverá error 404.**

### 2. Token de Webhook Configurado

El token debe estar configurado en las variables de entorno del servidor:
- Variable: `WEBHOOK_SECRET_TOKEN`
- Debe coincidir exactamente con el token usado en el header `Authorization`

### 3. Categorías Válidas

Solo se pueden usar categorías que existan en el catálogo `contable_categorias_asientos` y que estén activas (`activo = true`).

---

## 🔍 TROUBLESHOOTING

### Problema: Error 404 - Usuario no encontrado

**Causa:** El `chat_id` no está vinculado a ningún usuario en la base de datos.

**Solución:**
1. Verificar que el usuario existe en `contable_users`
2. Verificar que el campo `telegram_chat_id` tiene el valor correcto
3. El usuario debe vincular su `chat_id` desde el perfil en el dashboard

### Problema: Error 400 - Categoría no existe

**Causa:** El código de categoría no existe o no está activa.

**Solución:**
1. Verificar que el código de categoría es correcto (ej: `ING001`, `GAS001`)
2. Consultar el catálogo completo usando `GET /api/asientos/categorias`
3. Asegurarse de que la categoría está activa

### Problema: Error 400 - Tipo de movimiento no coincide

**Causa:** El `tipo_movimiento` no coincide con el tipo de la categoría seleccionada.

**Ejemplo de error:**
- Categoría `ING001` tiene `tipo_movimiento: "ingreso"`
- Pero se envía `tipo_movimiento: "gasto"`
- Resultado: Error de validación

**Solución:**
- Verificar la correspondencia entre categoría y tipo de movimiento
- Usar la tabla de categorías de esta documentación como referencia

### Problema: Error 401 - Token inválido

**Causa:** El token en el header `Authorization` no es correcto.

**Solución:**
1. Verificar que el token es exactamente el mismo que está en `WEBHOOK_SECRET_TOKEN`
2. Verificar que el formato es: `Bearer TOKEN` (con espacio después de "Bearer")
3. Verificar que no hay espacios extra o caracteres especiales

### Problema: Error 500 - Error interno del servidor

**Causa:** Error en el servidor al procesar la petición.

**Solución:**
1. Revisar los logs del servidor
2. Verificar que la base de datos está accesible
3. Verificar que todas las migraciones están aplicadas
4. Contactar al administrador del sistema

---

## 📋 CHECKLIST DE CONFIGURACIÓN

Antes de usar el webhook, verifica:

- [ ] El usuario está registrado en el dashboard
- [ ] El `chat_id` está vinculado en el perfil del usuario
- [ ] El token `WEBHOOK_SECRET_TOKEN` está configurado
- [ ] El token en el header `Authorization` coincide con el del servidor
- [ ] La URL del webhook es correcta (producción o desarrollo)
- [ ] Los campos obligatorios están presentes en el JSON
- [ ] El formato de fecha es `YYYY-MM-DD`
- [ ] El código de categoría existe y está activo
- [ ] El `tipo_movimiento` coincide con el tipo de la categoría
- [ ] El `monto` es un número mayor a 0

---

## 🔗 ENDPOINTS RELACIONADOS

### Obtener Catálogo de Categorías

**GET** `/api/asientos/categorias`

**Query Parameters:**
- `tipo_movimiento` (opcional): Filtrar por tipo (`ingreso`, `gasto`, `otro`)

**Ejemplo:**
```
GET /api/asientos/categorias?tipo_movimiento=ingreso
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "codigo": "ING001",
      "nombre": "Ingreso - Nómina o transferencia recibida",
      "tipo_movimiento": "ingreso",
      "descripcion": "Entradas de dinero provenientes de salarios...",
      "activo": true
    }
  ],
  "message": "2 categorías encontradas"
}
```

---

## 📚 REFERENCIAS

- **Especificación de Asientos:** Ver `asientos.md` en la raíz del proyecto
- **Roadmap del Proyecto:** Ver `ROADMAP.md`
- **Tareas de Implementación:** Ver `tareas.md`
- **Esquema de Base de Datos:** Ver `docs/DATABASE-SCHEMA.md`

---

**Última actualización:** 2025-01-27  
**Versión del API:** 1.0.0  
**Estado:** ✅ Producción

