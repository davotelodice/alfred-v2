// Edge Function: solicitar recuperación de contraseña
// Genera el enlace con GoTrue Admin y envía el email vía send-email
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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

  let body: { email: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return new Response(
      JSON.stringify({ error: "Missing email" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return new Response(
      JSON.stringify({ error: "Server config missing (SUPABASE_URL, keys)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1) Generar enlace de recuperación con GoTrue Admin
  const authUrl = supabaseUrl.includes("http") ? supabaseUrl : `http://${supabaseUrl}`;
  const generateLinkUrl = `${authUrl}/auth/v1/admin/generate_link`;
  // Usar redirect del cliente o, si falta, APP_URL del servidor (p. ej. https://alfred.seoescalaia.com/auth/reset-password)
  const redirectTo = (body.redirect_to?.trim() || Deno.env.get("APP_URL") || "").trim();

  let actionLink: string;
  try {
    const payload: { type: string; email: string; redirect_to?: string } = {
      type: "recovery",
      email,
    };
    if (redirectTo) payload.redirect_to = redirectTo;

    const res = await fetch(generateLinkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GoTrue generate_link error:", res.status, text);
      // No revelar si el email existe o no (evitar enumeración)
      return new Response(
        JSON.stringify({ success: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    actionLink = data?.action_link ?? data?.properties?.action_link ?? "";
    if (!actionLink) {
      console.error("No action_link in response:", data);
      return new Response(
        JSON.stringify({ success: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Generate link error:", err);
    return new Response(
      JSON.stringify({ success: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2) Enviar email con el enlace (SMTP directo, mismo código que send-email)
  const hostname = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "465", 10);
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASS");
  const senderEmail = Deno.env.get("SENDER_EMAIL") ?? username;
  const senderName = Deno.env.get("SENDER_NAME") ?? "Asistente Contable";

  if (!hostname || !username || !password) {
    console.error("SMTP not configured");
    return new Response(
      JSON.stringify({ success: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Restablecer contraseña</h2>
  <p>Has solicitado restablecer la contraseña de tu cuenta. Haz clic en el enlace siguiente para elegir una nueva contraseña:</p>
  <p><a href="${actionLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Restablecer contraseña</a></p>
  <p>Si no solicitaste este correo, puedes ignorarlo.</p>
  <p style="color: #666; font-size: 12px;">Asistente Contable</p>
</body>
</html>`;

  try {
    const client = new SMTPClient({
      connection: {
        hostname,
        port,
        tls: true,
        auth: { username, password },
      },
    });
    const fromHeader = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;
    await client.send({
      from: fromHeader,
      to: email,
      subject: "Restablecer contraseña - Asistente Contable",
      content: " ",
      html,
    });
    await client.close();
  } catch (err) {
    console.error("Send recovery email error:", err);
  }

  return new Response(
    JSON.stringify({ success: true, message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña." }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
