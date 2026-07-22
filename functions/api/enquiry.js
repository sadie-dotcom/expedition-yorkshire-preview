/**
 * Cloudflare Pages Function — enquiry form handler.
 * Route: POST /api/enquiry  (Content-Type: application/json)
 *
 * Validates the submission, drops honeypot spam, then forwards the enquiry
 * to the Go High Level inbound webhook. The webhook URL is read from the
 * GHL_WEBHOOK_URL environment variable (never hardcoded).
 *
 * Responses: { ok: true } on success, { ok: false, error } on failure,
 * with an appropriate HTTP status so the front-end can show success or error.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 200, email: 320, dates: 300, group: 60, tour: 200, message: 5000, hp: 100 };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function clean(value, max) {
  return (typeof value === "string" ? value : "").trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  // 1. Parse JSON body
  let data;
  try {
    data = await request.json();
  } catch (_err) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  // 2. Honeypot — a real user never fills this. Pretend success, forward nothing.
  if (clean(data && data._hp, MAX.hp)) {
    return json({ ok: true }, 200);
  }

  // 3. Validate the essentials
  const name = clean(data && data.name, MAX.name);
  const email = clean(data && data.email, MAX.email);
  if (!name) return json({ ok: false, error: "Please enter your name." }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "Please enter a valid email address." }, 400);

  // 4. Ensure the destination is configured
  const webhook = env && env.GHL_WEBHOOK_URL;
  if (!webhook) {
    console.error("GHL_WEBHOOK_URL is not set");
    return json({ ok: false, error: "Sorry, the enquiry form is temporarily unavailable." }, 500);
  }

  // 5. Build the GHL payload (split the name; keep the full name too)
  const parts = name.split(/\s+/).filter(Boolean);
  const payload = {
    first_name: parts[0] || name,
    last_name: parts.slice(1).join(" "),
    name: name,
    email: email,
    dates: clean(data.dates, MAX.dates),
    group: clean(data.group, MAX.group),
    tour: clean(data.tour, MAX.tour),
    message: clean(data.message, MAX.message)
  };

  // 6. Forward to Go High Level
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error("GHL webhook responded with status", res.status);
      return json({ ok: false, error: "We couldn't send your enquiry. Please try again in a moment." }, 502);
    }
  } catch (err) {
    console.error("GHL webhook request failed", err);
    return json({ ok: false, error: "We couldn't send your enquiry. Please try again in a moment." }, 502);
  }

  return json({ ok: true }, 200);
}
