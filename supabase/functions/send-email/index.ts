// Edge Function: envío de email por SMTP (Hostinger, puerto 465)
// Requiere header x-email-secret con EDGE_FUNCTION_EMAIL_SECRET
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

  let body: { to: string; subject: string; html: string; from?: string; replyTo?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { to, subject, html, from, replyTo } = body;
  if (!to || !subject || typeof html !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const hostname = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "465", 10);
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASS");
  const senderEmail = Deno.env.get("SENDER_EMAIL") ?? username;
  const senderName = Deno.env.get("SENDER_NAME") ?? "Asistente Contable";

  if (!hostname || !username || !password) {
    return new Response(
      JSON.stringify({ error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname,
        port,
        tls: true,
        auth: { username, password },
      },
    });

    const fromHeader = from ?? (senderName ? `"${senderName}" <${senderEmail}>` : senderEmail);
    await client.send({
      from: fromHeader,
      to,
      replyTo: replyTo ?? undefined,
      subject,
      content: " ",
      html,
    });
    await client.close();

    return new Response(
      JSON.stringify({ success: true, to }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send email error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
