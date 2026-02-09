# Plan de ejecución: Autenticación, recuperación de contraseña y envío de emails (Supabase self-hosted)

**Estado:** Ejecutado  
**Última actualización:** 2025-02-09

---

## 1. Resumen general

Tu Supabase está en Docker Swarm (Portainer). El servicio **Auth (GoTrue)** tiene la sección SMTP comentada, por lo que **no envía correos**. No usaremos Resend; usaremos **SMTP de tu dominio en Hostinger** para enviar todos los correos desde una **Edge Function** que tú controlas.

Se implementará:

1. **Edge Function de envío de emails** por SMTP (Hostinger), reutilizable para todos los tipos de correo.
2. **Flujo de recuperación de contraseña**: el usuario pide recuperar → Edge Function obtiene el enlace de GoTrue (admin) y envía el email con ese enlace.
3. **Flujo de confirmación de registro y notificaciones de éxito**: correos de confirmación de cuenta y de “todo ha salido bien” enviados por la misma Edge Function (y en el futuro otros tipos).
4. **Cambios en la app Next.js**: página “¿Olvidaste tu contraseña?” y uso de la nueva función para recuperación; opcionalmente ajuste del flujo de registro para usar tus correos (confirmación / bienvenida).

Al final podrás hacer la **prueba de recuperación con el usuario `info@seoescala.com`** usando el flujo normal (sin tocar SQL).

---

## 2. Contexto técnico relevante (tu setup)

- **Auth (GoTrue)**  
  - Variables SMTP comentadas → ningún correo lo envía GoTrue.  
  - Tienes `GOTRUE_MAILER_URLPATHS_*` (confirmación, recovery, etc.); los enlaces que generemos deben encajar con estos paths (por ejemplo `/auth/v1/verify`).
- **Edge Functions**  
  - Servicio: `functions`, imagen `supabase/edge-runtime`.  
  - Código en el host: `/root/supabase/docker/volumes/functions` (mapeado a `/home/deno/functions`).  
  - En tu stack ya existe `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` en el servicio `functions`, por lo que una Edge Function puede llamar a la API de Auth con rol admin (para generar enlaces de recuperación/confirmación).
- **App (bandeja)**  
  - Una sola página de auth: login + registro (`src/app/auth/page.tsx`).  
  - Mensaje actual “Revisa tu email para confirmar” nunca se cumple porque no hay envío de correo.  
  - No existe aún página ni enlace de “¿Olvidaste tu contraseña?”.

Con este plan no se modifica la base de datos de negocio (solo se usan Auth y Edge Functions).

---

## 3. Roadmap por tareas (PR-style)

Cada bloque es una tarea que puedes aprobar o rechazar. No se ejecutará nada hasta que apruebes.

---

### Fase 0 – Requisitos previos (tú)

| # | Tarea | Responsable | Descripción |
|---|--------|-------------|-------------|
| 0.1 | Datos SMTP Hostinger | Tú | ✅ **Confirmado:** smtp.hostinger.com:465, info@seoescala.com. Ver [VARIABLES-ENTORNO-EDGE-FUNCTIONS.md](VARIABLES-ENTORNO-EDGE-FUNCTIONS.md) sección 1. |
| 0.2 | Variables de entorno en el stack | Tú | Añadir en el servicio **`functions`** las variables SMTP y secret. **Guía paso a paso:** [VARIABLES-ENTORNO-EDGE-FUNCTIONS.md](VARIABLES-ENTORNO-EDGE-FUNCTIONS.md) (qué es el servicio "functions", Opción A Portainer, Opción B archivo compose). |
| 0.3 | Seguridad del archivo de config | Tú | El archivo `env-supa.md` que compartiste contiene secretos (contraseñas, JWT, etc.). Debe estar en `.gitignore` y no subirse a ningún repo público. |

---

### Fase 1 – Edge Function: envío de email por SMTP

| # | Tarea | Descripción |
|---|--------|-------------|
| 1.1 | Crear Edge Function `send-email` | Una función en Deno que reciba `to`, `subject`, `html` (y opcionalmente `from`/`replyTo`). Usará SMTP Hostinger con las variables de entorno (puerto **465**, SSL/TLS). En Deno se usará una dependencia SMTP compatible con 465. |
| 1.2 | Proteger la función | La función no debe ser llamable por cualquiera. Opciones: (a) Verificar JWT (service_role o un secret en header); (b) Un header tipo `x-email-secret` con un token que solo conozcan tu backend y otras Edge Functions. Se recomienda (b) o JWT para no exponer la función al público. |
| 1.3 | Probar envío | Llamada de prueba desde Postman/curl con body `{ "to": "info@seoescala.com", "subject": "Test", "html": "<p>Test</p>" }` y el header de autorización. Confirmar que el correo llega a Hostinger y a la bandeja. |

**Entregable:** Edge Function desplegada en tu volumen de functions, documentada (nombre, URL, headers y body esperados).

---

### Fase 2 – Recuperación de contraseña (flujo completo)

| # | Tarea | Descripción |
|---|--------|-------------|
| 2.1 | Edge Function `request-password-recovery` | Recibe `{ "email": "..." }`. Con `SUPABASE_SERVICE_ROLE_KEY` llama a la API de GoTrue (admin) para generar el enlace de recuperación. GoTrue expone algo tipo `POST /auth/v1/admin/generate_link` con `{"type":"recovery","email":"..."}` (o el endpoint que use tu versión). La función obtiene la URL del enlace, monta un HTML breve (“Restablece tu contraseña”) con ese link y llama a la Edge Function `send-email` (o al mismo código SMTP) para enviar el correo a ese email. Redirección tras el link debe ser la que ya tienes en `GOTRUE_MAILER_URLPATHS_RECOVERY` (ej. `/auth/v1/verify`). |
| 2.2 | Documentar URL pública de la función | La app Next.js llamará a `https://seosupa.seoescalaia.com/functions/v1/request-password-recovery` (o la ruta que expongas vía Kong/Traefik). Documentar método (POST), body y header de autorización. |
| 2.3 | Página “¿Olvidaste tu contraseña?” en Next.js | Nueva ruta, p. ej. `src/app/auth/forgot-password/page.tsx`: formulario con email y botón “Enviar enlace de recuperación”. Al enviar, la app llama a la Edge Function `request-password-recovery` con ese email (desde el cliente o desde una API Route de Next.js que reenvíe la petición con el secret). Mostrar mensaje tipo “Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.” |
| 2.4 | Enlace en la página de login | En `src/app/auth/page.tsx`, añadir un enlace “¿Olvidaste tu contraseña?” que lleve a `/auth/forgot-password`. |
| 2.5 | Página de “nueva contraseña” (tras clic en el link) | El enlace que envía GoTrue suele llevar a una URL de tu app con token (hash/fragment). Necesitas una página, p. ej. `src/app/auth/reset-password/page.tsx`, que lea el token de la URL, muestre formulario (nueva contraseña + repetir) y llame a `supabase.auth.updateUser({ password })` (o el método que use tu SDK). Documentar en el plan la URL de redirección que debes configurar en GoTrue/Auth para que, tras verificar el token, el usuario acabe en esta página. |

**Entregable:** Usuario `info@seoescala.com` puede solicitar recuperación desde la app, recibir el email en su bandeja y completar el cambio de contraseña en la app.

---

### Fase 3 – Confirmación de registro y notificaciones de éxito

| # | Tarea | Descripción |
|---|--------|-------------|
| 3.1 | Decidir comportamiento de registro | Opción A: **Autoconfirm** – En Auth activas `GOTRUE_MAILER_AUTOCONFIRM=true` (en el servicio `auth` del compose). Los usuarios quedan confirmados sin email. Luego, desde tu app o una Edge Function llamada tras el signup, envías un correo de “Bienvenida / cuenta creada” usando `send-email`. Opción B: **Confirmación por email** – Sin autoconfirm. Una Edge Function (o la app con service role) genera el enlace de confirmación vía admin (`generate_link` type `signup`) y envía ese enlace por `send-email`. El plan recomienda empezar por **Opción A** (más simple) y luego, si quieres, añadir confirmación explícita (Opción B). |
| 3.2 | Email de bienvenida tras registro | Tras `signUp` exitoso en la app, llamar a una Edge Function tipo `send-auth-email` con `{ "type": "welcome", "to": "email del usuario", "nombre": "..." }`. Esa función (o `send-email`) envía un HTML de “Cuenta creada correctamente” usando tu SMTP. |
| 3.3 | Plantillas reutilizables | Definir en código (o en un objeto en la Edge Function) plantillas HTML mínimas para: recuperación de contraseña, bienvenida, y “operación completada con éxito”. Así en el futuro solo añades tipos (p. ej. `type: "success"`) sin duplicar lógica. |

**Entregable:** Nuevos usuarios reciben un correo de bienvenida; opcionalmente confirmación de correo; y puedes reutilizar el mismo sistema para “todo ha salido bien” u otras notificaciones.

---

### Fase 4 – Integración Auth (GoTrue) con nuestros correos

| # | Tarea | Descripción |
|---|--------|-------------|
| 4.1 | Redirección tras recovery/confirm | Asegurar que `GOTRUE_SITE_URL` (y si aplica `GOTRUE_REDIRECT_URL`) apunten a la URL de tu app (p. ej. `https://tuapp.com` o la ruta de reset-password), para que tras hacer clic en “restablecer contraseña” o “confirmar email” el usuario caiga en tu frontend y no en una página en blanco de Supabase. |
| 4.2 | (Opcional) Desactivar envío de correo desde GoTrue | Si en el futuro activaras SMTP en GoTrue, evitar duplicar envíos. Por ahora, al estar SMTP comentado, no hay conflicto. Solo documentar que “todos los correos salen por nuestra Edge Function”. |

---

### Fase 5 – Documentación y cierre

| # | Tarea | Descripción |
|---|--------|-------------|
| 5.1 | Documentar variables de entorno | En el repo (por ejemplo en `docs/` o en un `env.example` para Edge Functions), listar solo los **nombres** de variables necesarias para las Edge Functions (SMTP_*, SENDER_*, URL de la app, secret para llamar a `send-email`), sin valores reales. En el mismo doc, indicar que los valores se configuran en el stack (Portainer/compose). |
| 5.2 | Actualizar README o docs de auth | Breve sección “Recuperación de contraseña” y “Correos (SMTP Hostinger)” que enlace a este plan y a la doc de variables. |
| 5.3 | Checklist final | (1) Recuperación con `info@seoescala.com` probada de punta a punta. (2) Registro de un usuario nuevo y recepción de correo de bienvenida. (3) Confirmar que `env-supa.md` (o cualquier archivo con secretos) está en `.gitignore` y no se sube a GitHub. |

---

## 4. Orden de ejecución sugerido

1. **Fase 0** – Tú completas datos SMTP y variables en el stack; verificas que `env-supa.md` no se sube al repo.  
2. **Fase 1** – Implementación y prueba de `send-email` (SMTP Hostinger).  
3. **Fase 2** – Recuperación de contraseña (Edge Function + páginas y enlace en login).  
4. **Fase 3** – Bienvenida (y opcionalmente confirmación).  
5. **Fase 4** – Revisar redirecciones Auth.  
6. **Fase 5** – Documentación y checklist.

---

## 5. Riesgos y consideraciones

- **SMTP Hostinger**: límites de envío y posible cola en correo no deseado. Conviene usar un “from” de tu dominio y, si es posible, SPF/DKIM correctos.  
- **Secrets**: El token/secret que use la app o las Edge Functions para llamar a `send-email` no debe estar en el frontend; idealmente la llamada a `request-password-recovery` pase por una API Route de Next.js que añada el secret.  
- **GoTrue admin**: La ruta exacta de `generate_link` puede variar según la versión de GoTrue (v2.176.1). Si no existiera, se documentaría la alternativa (p. ej. usar solo el flujo de “recover” de GoTrue y que la Edge Function solo envíe el email con una URL que tú construyas si tu versión lo permite).

---

## 6. Qué necesito de ti para ejecutar (después de tu aprobación)

1. Confirmación de que apruebas este plan (o qué fases quieres cambiar).  
2. Datos SMTP Hostinger (host, puerto, user, password, from address/name) por un canal seguro; no los pondré en el repo.  
3. Confirmación de la URL pública de tu app (donde quieres que redirija tras “restablecer contraseña” y “confirmar email”), p. ej. `https://tuapp.seoescala.com` o la que uses para bandeja.  
4. Si quieres que la llamada a `request-password-recovery` sea desde el navegador directamente a la Edge Function, hará falta un mecanismo seguro (p. ej. API Route en Next.js que reciba el email y llame a la función con el secret).

---

## 7. Resumen de lo implementado

- **Edge Functions** (en `supabase/functions/`): `send-email` (SMTP 465), `request-password-recovery` (GoTrue admin + envío de correo). Ver [supabase/functions/README.md](../supabase/functions/README.md) para desplegar en tu servidor.
- **Next.js**: `/auth/forgot-password`, `/auth/reset-password`, enlace "¿Olvidaste tu contraseña?" en login; API routes `POST /api/auth/forgot-password` y `POST /api/auth/send-welcome-email`; email de bienvenida tras registro.
- **Variables en la app**: `EDGE_FUNCTION_EMAIL_SECRET` (mismo valor que en el servicio `functions`). Ver `env.example`.
- **Checklist**: (1) Copiar las Edge Functions al servidor y redesplegar. (2) Añadir `EDGE_FUNCTION_EMAIL_SECRET` en `.env.local` de la app. (3) Probar recuperación con `info@seoescala.com`. (4) Probar registro y correo de bienvenida.
