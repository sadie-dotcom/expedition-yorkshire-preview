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
const MAX = { name: 200, email: 320, dates: 300, group: 60, tour: 200, message: 5000, hp: 100, token: 4000 };
const RECAPTCHA_MIN_SCORE = 0.5;
const RECAPTCHA_ACTION = "enquiry";

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

  // 4. Verify the reCAPTCHA v3 token with Google before doing anything else.
  //    Fail closed: a missing secret, a missing token, a failed check, or an
  //    unreachable Google all reject the submission and never reach GHL.
  const secret = env && env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY is not set");
    return json({ ok: false, error: "Sorry, the enquiry form is temporarily unavailable." }, 500);
  }
  const token = clean(data && data.recaptcha_token, MAX.token);
  if (!token) {
    return json({ ok: false, error: "Could not confirm you're human. Please reload the page and try again." }, 400);
  }
  let verdict;
  try {
    const params = new URLSearchParams({ secret: secret, response: token });
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) params.append("remoteip", ip);
    const vres = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    verdict = await vres.json();
  } catch (err) {
    console.error("reCAPTCHA siteverify request failed", err);
    return json({ ok: false, error: "We couldn't verify your submission just now. Please try again in a moment." }, 502);
  }
  const passed =
    verdict &&
    verdict.success === true &&
    (verdict.action === undefined || verdict.action === RECAPTCHA_ACTION) &&
    (typeof verdict.score !== "number" || verdict.score >= RECAPTCHA_MIN_SCORE);
  if (!passed) {
    console.error("reCAPTCHA verification rejected", {
      success: verdict && verdict.success,
      score: verdict && verdict.score,
      action: verdict && verdict.action,
      errors: verdict && verdict["error-codes"]
    });
    return json({ ok: false, error: "Your submission couldn't be verified. Please try again." }, 403);
  }

  // 5. Ensure the destination is configured
  const webhook = env && env.GHL_WEBHOOK_URL;
  if (!webhook) {
    console.error("GHL_WEBHOOK_URL is not set");
    return json({ ok: false, error: "Sorry, the enquiry form is temporarily unavailable." }, 500);
  }

  // 6. Build the GHL payload (split the name; keep the full name too)
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

  // 7. Forward to Go High Level
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
