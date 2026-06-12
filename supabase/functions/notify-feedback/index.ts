// Supabase Edge Function: emails new contact-form feedback to the site owner.
//
// Triggered by a Database Webhook on INSERT into feedback_messages.
// Sends via Resend (https://resend.com — free tier is plenty here).
//
// Required secrets (Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY          — your Resend API key (starts with "re_")
//   FEEDBACK_WEBHOOK_SECRET — any random string; must match the webhook's
//                             "x-webhook-secret" header so only your database
//                             can trigger emails
// Optional secrets:
//   FEEDBACK_TO_EMAIL       — recipient (default: zhchong0623@gmail.com)
//   FEEDBACK_FROM_EMAIL     — sender (default: onboarding@resend.dev, which
//                             works without verifying a domain as long as the
//                             recipient is your own Resend account email)

type FeedbackRecord = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  message?: string;
  created_at?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Only accept calls that carry the shared secret set on the webhook.
  const expectedSecret = Deno.env.get("FEEDBACK_WEBHOOK_SECRET");
  if (!expectedSecret || req.headers.get("x-webhook-secret") !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response("RESEND_API_KEY is not configured", { status: 500 });
  }

  let record: FeedbackRecord;
  try {
    const payload = await req.json();
    // Supabase Database Webhook payload shape: { type, table, record, ... }
    record = payload.record ?? {};
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const name = (record.name ?? "Unknown").slice(0, 200);
  const email = record.email ?? "";
  const phone = record.phone ?? "";
  const message = (record.message ?? "").slice(0, 5000);
  const toEmail = Deno.env.get("FEEDBACK_TO_EMAIL") ?? "zhchong0623@gmail.com";
  const fromEmail = Deno.env.get("FEEDBACK_FROM_EMAIL") ?? "onboarding@resend.dev";

  const contactLine = [
    email ? `Email: ${email}` : null,
    phone ? `Phone: ${phone}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `Plan My FIRE Feedback <${fromEmail}>`,
      to: [toEmail],
      reply_to: email || undefined,
      subject: `New feedback from ${name}`,
      html: `
        <h2 style="margin:0 0 8px">New feedback on Plan My FIRE</h2>
        <p style="margin:0 0 4px"><strong>From:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 12px"><strong>Contact:</strong> ${escapeHtml(contactLine || "none provided")}</p>
        <p style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px;margin:0">${escapeHtml(message)}</p>
        <p style="color:#888;font-size:12px;margin-top:16px">Received ${escapeHtml(record.created_at ?? new Date().toISOString())} · id ${escapeHtml(record.id ?? "n/a")}</p>
      `
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend error:", response.status, detail);
    return new Response(`Email send failed: ${response.status}`, { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
