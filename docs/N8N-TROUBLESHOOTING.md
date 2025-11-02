# 🔧 SOLUCIÓN DE PROBLEMAS: Conexión n8n → Webhook
## Asistente Contable Inteligente

**Última actualización:** 2024-11-02  
**Error:** "The service refused the connection - perhaps it is offline"

---

## ✅ DIAGNÓSTICO RÁPIDO

### El servidor está corriendo:
- ✅ Next.js está corriendo en el puerto **3000**
- ✅ El endpoint `/api/webhook/n8n` existe y responde
- ✅ El problema es la conexión desde n8n

---

## 🔍 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: n8n no puede acceder a `localhost:3000`

**Causa:** Si n8n está en un contenedor Docker o en otra máquina, `localhost` apunta a la máquina de n8n, no a tu máquina local.

**Solución:**

#### Opción A: Si n8n está en la MISMA máquina que Next.js

**Configuración:**
```
URL: http://localhost:3000/api/webhook/n8n
```

#### Opción B: Si n8n está en Docker o en otra máquina

**Para Docker en Linux/Mac:**
```
URL: http://host.docker.internal:3000/api/webhook/n8n
```

**Para Docker en Windows:**
```
URL: http://host.docker.internal:3000/api/webhook/n8n
```

**Para n8n en otra máquina en la misma red:**
```
URL: http://IP-DE-TU-MÁQUINA:3000/api/webhook/n8n
```

**Para obtener tu IP:**
```bash
# En Linux/Mac
hostname -I | awk '{print $1}'

# O
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1
```

#### Opción C: Si n8n está en la misma red WSL2

**Si Next.js está en WSL2 y n8n también:**
```
URL: http://localhost:3000/api/webhook/n8n
```

**Si Next.js está en WSL2 y n8n en Windows:**
```
URL: http://IP-DEL-HOST-WSL2:3000/api/webhook/n8n
```

**Para obtener IP de WSL2:**
```bash
# Desde WSL2
hostname -I | awk '{print $1}'
```

---

### Problema 2: El puerto está bloqueado o incorrecto

**Verificar:**
```bash
# Verificar que el servidor está escuchando
curl http://localhost:3000/api/webhook/n8n
# Debe dar un 405 (Method Not Allowed) o error de autenticación
```

**Solución:**
- Verificar que Next.js está corriendo: `npm run dev`
- Verificar el puerto correcto (por defecto es 3000, pero puede ser otro)
- Verificar que no hay firewall bloqueando el puerto

---

### Problema 3: URL mal configurada en n8n

**URLs incorrectas:**
```
❌ https://localhost:3000/api/webhook/n8n  (no uses https si no hay SSL)
❌ http://localhost/api/webhook/n8n        (falta el puerto :3000)
❌ http://localhost:3000/webhook/n8n      (falta /api)
```

**URL correcta:**
```
✅ http://localhost:3000/api/webhook/n8n
```

---

### Problema 4: Configuración del nodo HTTP Request en n8n

**Configuración correcta:**

#### Node: HTTP Request

**Settings:**
- **Name:** `Create Transaction Webhook`
- **Authentication:** `None` (manejamos auth en headers)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/webhook/n8n` (o la IP correcta)
- **Send Headers:** `Yes`

**Headers:**
```json
{
  "Authorization": "Bearer TU_WEBHOOK_SECRET_TOKEN_AQUI",
  "Content-Type": "application/json"
}
```

**Send Body:** `Yes`

**Specify Body:** `JSON`

**Body:**
```json
{
  "telefono": "{{ $json.telefono }}",
  "tipo": "{{ $json.tipo }}",
  "monto": {{ $json.monto }},
  "descripcion": "{{ $json.descripcion }}",
  "fecha": "{{ $json.fecha }}"
}
```

---

## 🧪 PROBAR LA CONEXIÓN

### Paso 1: Probar desde la terminal

```bash
# Probar que el servidor responde
curl -X POST http://localhost:3000/api/webhook/n8n \
  -H "Authorization: Bearer TU_WEBHOOK_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+34612345678",
    "tipo": "gasto",
    "monto": 50.00,
    "descripcion": "Prueba",
    "fecha": "2024-11-02"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "transaction_id": "...",
    "user_id": "...",
    "message": "Transacción procesada exitosamente"
  },
  "message": "Webhook procesado correctamente"
}
```

### Paso 2: Si funciona desde terminal pero no desde n8n

**Problema:** n8n no puede alcanzar el servidor (problema de red).

**Solución:**
1. Identificar dónde está corriendo n8n (Docker, máquina remota, etc.)
2. Usar la URL correcta según el caso (ver Problema 1)

---

## 🌐 CONFIGURACIÓN POR ESCENARIO

### Escenario 1: Todo en la misma máquina local

**Configuración:**
```
URL: http://localhost:3000/api/webhook/n8n
```

### Escenario 2: Next.js en WSL2, n8n en Windows

**Paso 1:** Obtener IP de WSL2
```bash
# Desde WSL2
hostname -I | awk '{print $1}'
```

**Paso 2:** Configurar en n8n
```
URL: http://IP-OBTENIDA:3000/api/webhook/n8n
```

**Paso 3:** Exponer el puerto de WSL2 a Windows
```bash
# Desde PowerShell en Windows (como administrador)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=IP-DE-WSL2
```

### Escenario 3: n8n en Docker, Next.js en local

**Configuración:**
```
URL: http://host.docker.internal:3000/api/webhook/n8n
```

**Si no funciona host.docker.internal:**
```bash
# Obtener IP del host desde Docker
# En Linux
ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'

# Usar esa IP directamente
URL: http://IP-OBTENIDA:3000/api/webhook/n8n
```

### Escenario 4: Todo en Docker

**Si ambos están en Docker y en la misma red:**
```
URL: http://NOMBRE-DEL-CONTENEDOR-NEXTJS:3000/api/webhook/n8n
```

**Si están en redes diferentes:**
```
URL: http://IP-DEL-CONTENEDOR-NEXTJS:3000/api/webhook/n8n
```

---

## 🔐 VERIFICAR EL TOKEN

### Verificar que el token está configurado:

```bash
# En tu proyecto
cd /home/david/alfred/bandeja
grep WEBHOOK_SECRET_TOKEN .env.local
```

### El token en n8n debe ser EXACTAMENTE el mismo:

**En .env.local:**
```
WEBHOOK_SECRET_TOKEN=tu_token_aqui
```

**En n8n (en el header):**
```
Authorization: Bearer tu_token_aqui
```

**⚠️ IMPORTANTE:** El token debe ser exactamente el mismo en ambos lados.

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Next.js está corriendo (`npm run dev`)
- [ ] El servidor responde en el puerto 3000 (`curl http://localhost:3000`)
- [ ] El endpoint existe (`curl http://localhost:3000/api/webhook/n8n`)
- [ ] El método es POST (no GET)
- [ ] La URL en n8n es correcta (según tu escenario)
- [ ] El token está configurado en `.env.local`
- [ ] El token en n8n es el mismo que en `.env.local`
- [ ] Los headers están configurados correctamente
- [ ] El body está en formato JSON

---

## 🐛 DEBUGGING

### Activar logs en Next.js:

```bash
# Ver logs en tiempo real
cd /home/david/alfred/bandeja
npm run dev
```

### Verificar logs en n8n:

- Ir a **Executions** en n8n
- Ver la ejecución fallida
- Revisar los logs del nodo HTTP Request
- Verificar el error específico

### Probar con un curl desde la máquina de n8n:

**Si n8n está en Docker:**
```bash
# Desde dentro del contenedor de n8n
docker exec -it CONTENEDOR-N8N curl -X POST http://host.docker.internal:3000/api/webhook/n8n \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"telefono":"+123","tipo":"gasto","monto":50}'
```

---

## ✅ SOLUCIÓN RÁPIDA

### Si todo está en la misma máquina:

1. **Verificar que Next.js está corriendo:**
```bash
cd /home/david/alfred/bandeja
npm run dev
```

2. **Probar el endpoint:**
```bash
curl -X POST http://localhost:3000/api/webhook/n8n \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"telefono":"+123","tipo":"gasto","monto":50}'
```

3. **Configurar en n8n:**
- URL: `http://localhost:3000/api/webhook/n8n`
- Method: `POST`
- Headers: `Authorization: Bearer TU_TOKEN`, `Content-Type: application/json`
- Body: JSON con los datos

---

## 📞 INFORMACIÓN PARA DIAGNÓSTICO

Si el problema persiste, proporciona:

1. **Dónde está corriendo n8n:**
   - [ ] Misma máquina
   - [ ] Docker
   - [ ] Máquina remota
   - [ ] WSL2

2. **Dónde está corriendo Next.js:**
   - [ ] Misma máquina
   - [ ] Docker
   - [ ] WSL2

3. **Error exacto de n8n:**
   - Copiar el error completo

4. **Resultado del test con curl:**
   - Probar desde terminal y pegar resultado

---

**Última actualización:** 2024-11-02

