# 📋 JSON PARA WEBHOOK N8N
## Formato del Body HTTP

**Última actualización:** 2024-11-02  
**Propósito:** Documentación del formato JSON para la petición HTTP al webhook de n8n

---

## 🎯 FORMATO DEL JSON

### JSON Mínimo (Solo con teléfono)

```json
{
  "telefono": "+34612345678",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2025-11-02"
}
```

### JSON Recomendado (Con chat_id)

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

---

## 📝 PARÁMETROS

### Requeridos

- **`tipo`**: Tipo de transacción
  - Valores permitidos: `"ingreso"`, `"gasto"`, `"inversion"`, `"ahorro"`
  - Ejemplo: `"gasto"`

- **`monto`**: Monto de la transacción
  - Tipo: `number` (debe ser mayor a 0)
  - Ejemplo: `300` o `300.50`

### Requeridos (Uno de los dos)

- **`chat_id`**: ID del chat de Telegram del usuario
  - Tipo: `string`
  - Ejemplo: `"123456789"`
  - **Recomendado**: Usar `chat_id` es la mejor opción para identificar usuarios
  
- **`telefono`**: Teléfono del usuario
  - Tipo: `string`
  - Ejemplo: `"+34612345678"`
  - **Nota**: Se normaliza automáticamente (se eliminan espacios, guiones, paréntesis)

### Opcionales

- **`descripcion`**: Descripción de la transacción
  - Tipo: `string`
  - Ejemplo: `"libros"`
  - **Default**: Si no se proporciona, se usa `"Transacción {tipo} desde Telegram"`

- **`fecha`**: Fecha de la transacción
  - Tipo: `string` (formato: `YYYY-MM-DD`)
  - Ejemplo: `"2025-11-02"`
  - **Default**: Si no se proporciona, se usa la fecha actual

- **`metodo_pago`**: Método de pago usado
  - Tipo: `string`
  - Ejemplo: `"tarjeta"`, `"efectivo"`, `"transferencia"`
  - **Default**: `"telegram"`

---

## 🔧 CONFIGURACIÓN EN N8N

### Nodo HTTP Request

**URL:** `https://TU-PROYECTO.vercel.app/api/webhook/n8n`

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
  "telefono": "+34612345678",
  "tipo": "{{ $json.tipo }}",
  "monto": {{ $json.monto }},
  "descripcion": "{{ $json.descripcion }}",
  "fecha": "{{ $json.fecha }}",
  "metodo_pago": "{{ $json.metodo_pago }}"
}
```

---

## 📊 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Gasto con chat_id

```json
{
  "chat_id": "123456789",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2025-11-02"
}
```

### Ejemplo 2: Ingreso con todos los campos

```json
{
  "chat_id": "123456789",
  "telefono": "+34612345678",
  "tipo": "ingreso",
  "monto": 1500,
  "descripcion": "Salario mensual",
  "fecha": "2025-11-01",
  "metodo_pago": "transferencia"
}
```

### Ejemplo 3: Solo con teléfono (funciona, pero menos recomendado)

```json
{
  "telefono": "+34612345678",
  "tipo": "gasto",
  "monto": 50,
  "descripcion": "supermercado"
}
```

---

## ⚠️ IMPORTANTE - CAMBIOS RECIENTES

1. **`chat_id` es OBLIGATORIO**
   - El usuario DEBE estar registrado previamente en el dashboard
   - Si el `chat_id` no existe en la base de datos, se devolverá error
   - El usuario debe vincular su `chat_id` desde el perfil en el dashboard

2. **`telefono` es OPCIONAL**
   - Si se proporciona, se actualizará el teléfono del usuario si es diferente
   - NO es necesario si el usuario ya está registrado con `chat_id`

3. **Parámetros obligatorios:**
   - ✅ `chat_id` - OBLIGATORIO
   - ✅ `tipo` - OBLIGATORIO
   - ✅ `monto` - OBLIGATORIO
   - ✅ `descripcion` - OBLIGATORIO
   - ✅ `fecha` - OBLIGATORIO (formato: YYYY-MM-DD)

4. **Si el usuario no está registrado:**
   - Se devolverá error 404: "Usuario no registrado"
   - El usuario debe registrarse primero en el dashboard y vincular su `chat_id`

---

## 🔗 OBTENER CHAT_ID EN N8N

En n8n, cuando recibes un mensaje de Telegram, el `chat_id` está disponible en:

```
{{ $json.chat.id }}
```

O si estás usando el trigger de Telegram:

```
{{ $json.message.chat.id }}
```

**Ejemplo de configuración en n8n:**
- Nodo: `HTTP Request`
- Body JSON: Usa expresiones como `{{ $json.chat.id }}` para obtener el `chat_id` del mensaje de Telegram

---

## ✅ VALIDACIÓN

El webhook valida automáticamente:

- ✅ Que exista `chat_id` **O** `telefono` (al menos uno)
- ✅ Que `tipo` sea uno de: `ingreso`, `gasto`, `inversion`, `ahorro`
- ✅ Que `monto` sea un número mayor a 0
- ✅ Formato de fecha `YYYY-MM-DD` (si se proporciona)

---

## 🚀 RESPUESTA DEL WEBHOOK

### Respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "transaction_id": "6491cc9c-d55d-457d-b5db-9fe33102dc95",
    "user_id": "21baee99-3624-444b-abcc-0b10667751bd",
    "message": "Transacción procesada exitosamente"
  },
  "message": "Webhook procesado correctamente"
}
```

### Respuesta de error:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

