// Edge Function: registrar usuario
// Genera el enlace de confirmación con GoTrue Admin y envía el email vía send-email
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-email-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secret = req.headers.get("x-email-secret");
  const expectedSecret = Deno.env.get("EDGE_FUNCTION_EMAIL_SECRET");
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { email: string; password?: string; nombre?: string; telefono?: string; redirect_to?: string; data?: any };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing email or password" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Not strictly needed for admin call but kept for consistency
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server config missing (SUPABASE_URL, keys)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authUrl = supabaseUrl.includes("http") ? supabaseUrl : `http://${supabaseUrl}`;
  const generateLinkUrl = `${authUrl}/auth/v1/admin/generate_link`;

  // Usar redirect del cliente o, si falta, obtener el origin de APP_URL
  const appUrl = Deno.env.get("APP_URL");
  let defaultRedirect = "https://alfred.seoescalaia.com";
  try {
    if (appUrl) {
      defaultRedirect = new URL(appUrl).origin;
    }
  } catch (e) {
    console.error("Invalid APP_URL:", appUrl, e);
  }
  const redirectTo = (body.redirect_to?.trim() || defaultRedirect).trim();

  let actionLink: string;
  try {
    const payload: any = {
      type: "signup",
      email,
      password, // Password es necesario para crear al usuario
    };
    if (redirectTo) payload.redirect_to = redirectTo;
    if (body.data) payload.data = body.data; // Metadata opcional

    const res = await fetch(generateLinkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey, // Needs service role for admin actions generally
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 1.5) Crear perfil en contable_users
    // Necesitamos el ID del usuario creado. data.user (o data directamente) debería tenerlo.
    // generate_link devuelve { user: { ... }, ... }
    const userId = data.user?.id || data.id;

    if (userId) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { error: profileError } = await supabaseAdmin
          .from('contable_users')
          .insert({
            id: userId,
            nombre: body.nombre || "",
            email: email,
            telefono: body.telefono || ""
          });

        if (profileError) {
          console.error("Error creating profile in contable_users:", profileError);
          // No fallamos la request completa, pero logueamos.
        }
      } catch (dbErr) {
        console.error("Error connecting to DB for profile:", dbErr);
      }
    } else {
      console.warn("Could not extract userId to create profile:", data);
    }

    if (!res.ok) {
      console.error("GoTrue signup error:", res.status, data);
      return new Response(
        JSON.stringify({ error: data.msg || data.error_description || "Error creating user" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si el usuario ya existe y está confirmado, GoTrue podría devolver un error o comportarse distinto
    // En signup, si ya existe, suele devolver error.

    actionLink = data?.action_link ?? data?.properties?.action_link ?? "";

    // Si la confirmación de email está DESACTIVADA, actionLink podría ser vacío y user ya estar confirmado.
    // Pero asumiendo que el usuario quiere EMAIL DE CONFIRMACIÓN:
    if (!actionLink && !data.user?.confirmed_at) {
      console.error("No action_link returned for unconfirmed user:", data);
      return new Response(
        JSON.stringify({ error: "No confirmation link generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Generate link error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2) Enviar email con el enlace (si hay actionLink)
  // Si no hay actionLink (e.g. auto-confirm enabled), no enviamos email de confirmación, quizás solo bienvenida.
  if (actionLink) {
    const hostname = Deno.env.get("SMTP_HOST");
    const port = parseInt(Deno.env.get("SMTP_PORT") ?? "465", 10);
    const username = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    const senderEmail = Deno.env.get("SENDER_EMAIL") ?? username;
    const senderName = Deno.env.get("SENDER_NAME") ?? "Asistente Contable";

    if (!hostname || !username || !pass) {
      console.error("SMTP not configured");
      // Devolvemos éxito al cliente para no bloquear, pero logueamos error
      return new Response(
        JSON.stringify({ success: true, message: "Usuario creado, pero error en SMTP server config." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Confirma tu cuenta</h2>
      <p>Gracias por registrarte en Asistente Contable. Para activar tu cuenta, por favor confirma tu correo electrónico haciendo clic en el enlace siguiente:</p>
      <p><a href="${actionLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Confirmar mi cuenta</a></p>
      <p>Si no te registraste, puedes ignorar este correo.</p>
      <p style="color: #666; font-size: 12px;">Asistente Contable</p>
    </body>
    </html>`;

    try {
      const client = new SMTPClient({
        connection: {
          hostname,
          port,
          tls: true,
          auth: { username, password: pass },
        },
      });
      const fromHeader = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;
      await client.send({
        from: fromHeader,
        to: email,
        subject: "Confirma tu cuenta - Asistente Contable",
        content: " ",
        html,
      });
      await client.close();
    } catch (err) {
      console.error("Send signup email error:", err);
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: "Usuario registrado. Revisa tu email." }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
