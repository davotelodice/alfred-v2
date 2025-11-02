# 🚀 DESPLEGAR EN VERCEL
## Asistente Contable Inteligente

**Última actualización:** 2024-11-02  
**Propósito:** Guía para desplegar el proyecto Next.js en Vercel para que sea accesible desde n8n (VPS)

---

## 🎯 POR QUÉ DESPLEGAR EN VERCEL

Tu n8n está en un **VPS remoto** y tu Next.js está en **localhost**. Para que n8n pueda conectarse al webhook, Next.js necesita estar accesible desde internet.

**Vercel es perfecto porque:**
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS gratuito
- ✅ URL pública permanente
- ✅ Variables de entorno seguras
- ✅ Gratis para proyectos personales

---

## 📋 PREPARACIÓN

### 1. Verificar que tienes Git configurado

```bash
cd /home/david/alfred/bandeja
git status
```

Si no tienes Git inicializado:
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (p. ej. `asistente-contable`)
3. **NO** inicialices con README, .gitignore ni licencia
4. Copia la URL del repositorio

### 3. Conectar tu proyecto con GitHub

```bash
cd /home/david/alfred/bandeja
git remote add origin https://github.com/TU-USUARIO/asistente-contable.git
git branch -M main
git push -u origin main
```

---

## 🚀 DESPLEGAR EN VERCEL

### Opción 1: Desde la Web (Recomendado)

1. **Ir a Vercel:**
   - Ve a https://vercel.com
   - Inicia sesión con GitHub

2. **Importar proyecto:**
   - Click en "Add New..." → "Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `asistente-contable`

3. **Configurar proyecto:**
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `./bandeja` (si está en subdirectorio) o `.` (si está en raíz)
   - **Build Command:** `npm run build` (auto-detectado)
   - **Output Directory:** `.next` (auto-detectado)

4. **Configurar Variables de Entorno:**
   Click en "Environment Variables" y agrega:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   SUPABASE_JWT_SECRET=tu-jwt-secret
   OPENAI_API_KEY=sk-tu-api-key-de-openai
   OPENAI_MODEL=gpt-4o-mini
   WEBHOOK_SECRET_TOKEN=2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da
   ```

5. **Desplegar:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - Obtendrás una URL como: `https://asistente-contable.vercel.app`

### Opción 2: Desde la CLI

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
cd /home/david/alfred/bandeja
vercel login
```

3. **Desplegar:**
```bash
vercel
```

4. **Configurar Variables de Entorno:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_JWT_SECRET
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
vercel env add WEBHOOK_SECRET_TOKEN
```

5. **Desplegar a producción:**
```bash
vercel --prod
```

---

## 🔧 CONFIGURAR n8n CON LA URL DE VERCEL

Una vez desplegado, obtendrás una URL como:
```
https://asistente-contable.vercel.app
```

### Actualizar el nodo HTTP Request en n8n:

**URL del webhook:**
```
https://asistente-contable.vercel.app/api/webhook/n8n
```

**Headers:**
```
Authorization: Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da
Content-Type: application/json
```

**Method:** `POST`

**Body:**
```json
{
  "telefono": "+34612345678",
  "tipo": "gasto",
  "monto": 300,
  "descripcion": "libros",
  "fecha": "2025-11-02"
}
```

---

## ✅ VERIFICACIÓN

### 1. Probar el endpoint desde terminal:

```bash
curl -X POST https://asistente-contable.vercel.app/api/webhook/n8n \
  -H "Authorization: Bearer 2b240ebc4588827cc1652007b4f42750283b91063cbc644741370081fb7ae6da" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+34612345678",
    "tipo": "gasto",
    "monto": 50,
    "descripcion": "Prueba",
    "fecha": "2025-11-02"
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
  }
}
```

### 2. Probar desde n8n:

1. Actualiza la URL en el nodo HTTP Request
2. Ejecuta el workflow
3. Debe funcionar correctamente

---

## 📝 ACTUALIZAR EL PROMPT DEL AGENTE

Una vez tengas la URL de Vercel, actualiza el prompt en `N8N-AGENT-PROMPT.md`:

**Cambiar:**
```
URL: http://localhost:3000/api/webhook/n8n
```

**Por:**
```
URL: https://TU-PROYECTO.vercel.app/api/webhook/n8n
```

---

## 🔄 ACTUALIZACIONES AUTOMÁTICAS

Una vez conectado con GitHub, cada push a `main` desplegará automáticamente en Vercel.

**Workflow:**
1. Haces cambios en local
2. `git add .`
3. `git commit -m "Descripción"`
4. `git push origin main`
5. Vercel despliega automáticamente (2-3 minutos)

---

## 🐛 TROUBLESHOOTING

### Error: Variables de entorno no configuradas

**Solución:** Asegúrate de agregar TODAS las variables de entorno en Vercel.

### Error: Build falla

**Verifica:**
- Todas las dependencias están en `package.json`
- No hay errores de TypeScript
- El build funciona localmente: `npm run build`

### Error: 404 en el endpoint

**Verifica:**
- La URL es correcta: `https://TU-PROYECTO.vercel.app/api/webhook/n8n`
- El archivo existe en: `src/app/api/webhook/n8n/route.ts`

### Error: 401 Unauthorized

**Verifica:**
- El token en Vercel es el mismo que en n8n
- El header `Authorization: Bearer TOKEN` está correcto

---

## 🔐 SEGURIDAD

### Recomendaciones:

1. **Variables de entorno en Vercel:**
   - NO commits `.env.local` a GitHub
   - Usa variables de entorno en Vercel

2. **Token del webhook:**
   - Mantén el token seguro
   - No lo compartas públicamente
   - Puedes regenerarlo si es necesario

3. **Supabase:**
   - Usa RLS (Row Level Security) - ya está configurado
   - El webhook usa Service Role Key (bypassa RLS solo para operaciones específicas)

---

## 📋 CHECKLIST DE DESPLIEGUE

- [ ] Proyecto en GitHub
- [ ] Vercel conectado con GitHub
- [ ] Variables de entorno configuradas en Vercel
- [ ] Despliegue exitoso
- [ ] URL de Vercel obtenida
- [ ] URL actualizada en n8n
- [ ] Probar desde terminal (curl)
- [ ] Probar desde n8n
- [ ] Prompt del agente actualizado con la nueva URL

---

## 🎯 RESULTADO FINAL

Una vez desplegado, tendrás:

1. **URL pública de Vercel:** `https://asistente-contable.vercel.app`
2. **Endpoint del webhook:** `https://asistente-contable.vercel.app/api/webhook/n8n`
3. **n8n puede conectarse** desde el VPS al webhook
4. **Despliegue automático** en cada push a GitHub

---

**Última actualización:** 2024-11-02

