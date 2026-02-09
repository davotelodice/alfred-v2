# Edge Functions (Supabase self-hosted)

Estas funciones se ejecutan en tu instancia de Supabase (servicio `functions` en Docker).

## Desplegar en tu servidor

1. En el servidor donde está el stack de Supabase, las funciones viven en:
   ```
   /root/supabase/docker/volumes/functions/
   ```
2. La estructura que espera el runtime suele ser una carpeta por función con un `index.ts` dentro. Copia desde este repo:
   - `supabase/functions/send-email/` → en el servidor: `.../functions/send-email/index.ts` (o la estructura que use tu runtime)
   - `supabase/functions/request-password-recovery/` → `.../functions/request-password-recovery/index.ts`

3. Si tu despliegue usa otro esquema (por ejemplo todo bajo `main`), adapta la estructura según la documentación de tu versión de Supabase Edge Runtime.

4. Asegúrate de que el servicio `functions` tiene las variables de entorno (ver [VARIABLES-ENTORNO-EDGE-FUNCTIONS.md](../../docs/VARIABLES-ENTORNO-EDGE-FUNCTIONS.md)):
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SENDER_EMAIL, SENDER_NAME
   - EDGE_FUNCTION_EMAIL_SECRET
   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (ya las tienes en el stack)

5. Reinicia o redespliega el stack para que cargue el código nuevo.

## URLs públicas (tras Kong/Traefik)

- `https://seosupa.seoescalaia.com/functions/v1/send-email`
- `https://seosupa.seoescalaia.com/functions/v1/request-password-recovery`

Todas las peticiones deben incluir el header: `x-email-secret: <EDGE_FUNCTION_EMAIL_SECRET>`.
