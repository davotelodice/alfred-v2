# Edge Functions (Supabase self-hosted)

Estas funciones se ejecutan en tu instancia de Supabase (servicio `functions` en Docker).

## Desplegar en tu servidor

Los logs del runtime muestran: **`serving the request with /home/deno/functions/request-password-recovery`**.  
Es decir, busca cada función **directamente** bajo `/home/deno/functions/` (en el host: bajo el volumen), **sin** carpeta `main`.

1. En el servidor, el volumen está en:
   ```
   /root/supabase/docker/volumes/functions/
   ```

2. **Estructura obligatoria** (carpetas de funciones directamente bajo el volumen):
   ```
   /root/supabase/docker/volumes/functions/
   ├── send-email/
   │   └── index.ts
   └── request-password-recovery/
       └── index.ts
   ```
   No uses una carpeta intermedia `main/`: el runtime resuelve `/home/deno/functions/<nombre-función>`.

3. Copia desde este repo al servidor:
   - `supabase/functions/send-email/index.ts` → servidor: `.../functions/send-email/index.ts`
   - `supabase/functions/request-password-recovery/index.ts` → servidor: `.../functions/request-password-recovery/index.ts`

   Ejemplo en el servidor:
   ```bash
   FUNC_DIR="/root/supabase/docker/volumes/functions"
   mkdir -p "$FUNC_DIR/send-email" "$FUNC_DIR/request-password-recovery"
   # Pega o copia el contenido de cada index.ts del repo en su carpeta
   ```

4. Asegúrate de que el servicio `functions` tiene las variables de entorno (ver [VARIABLES-ENTORNO-EDGE-FUNCTIONS.md](../../docs/VARIABLES-ENTORNO-EDGE-FUNCTIONS.md)):
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SENDER_EMAIL, SENDER_NAME
   - EDGE_FUNCTION_EMAIL_SECRET
   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (ya las tienes en el stack)

5. Reinicia o redespliega el stack para que cargue el código nuevo.

## URLs públicas (tras Kong/Traefik)

- `https://seosupa.seoescalaia.com/functions/v1/send-email`
- `https://seosupa.seoescalaia.com/functions/v1/request-password-recovery`

Todas las peticiones deben incluir el header: `x-email-secret: <EDGE_FUNCTION_EMAIL_SECRET>`.
