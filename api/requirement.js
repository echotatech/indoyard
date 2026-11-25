// Vercel serverless function: receives the "Submit your requirement" popup and emails it.
// Needs one environment variable in Vercel: RESEND_API_KEY  (free account at resend.com)

const TO = process.env.REQUIREMENT_TO || "info@echotatech.com";
const FROM = process.env.REQUIREMENT_FROM || "Indoyards <onboarding@resend.dev>";

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);

// strips control characters; keepNewlines is for the multi-line requirement text
const clean = (v, max, keepNewlines) =>
  String(v ?? "")
    .replace(keepNewlines ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // Hidden "website" field is for bots only. Pretend success and send nothing.
  if (b.website) return res.status(200).json({ ok: true });

  const name = clean(b.name, 80);
  const phone = String(b.phone ?? "").replace(/\D/g, "");
  const email = clean(b.email, 120);
  const requirement = clean(b.requirement, 1000, true);
  const page = /^https?:\/\//i.test(String(b.page || "")) ? clean(b.page, 300) : "";

  if (name.length < 2) return res.status(400).json({ ok: false, error: "Enter your name" });
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ ok: false, error: "Enter a valid mobile number" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, error: "Enter a valid email" });
  if (requirement.length < 10) return res.status(400).json({ ok: false, error: "Describe your requirement" });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set in Vercel environment variables");
    return res.status(500).json({ ok: false, error: "Email is not configured" });
  }

  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const row = (k, v) =>
    `<tr><td style="padding:8px 12px;color:#52605A;font-size:13px;width:130px;vertical-align:top">${k}</td>` +
    `<td style="padding:8px 12px;font-size:15px;color:#15201C;vertical-align:top">${v}</td></tr>`;

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #D8DDD5;border-radius:12px;overflow:hidden">
  <div style="background:#0B6E66;color:#fff;padding:18px 20px">
    <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.85">Indoyards website</div>
    <div style="font-size:20px;font-weight:700;margin-top:2px">New requirement received</div>
  </div>
  <table style="width:100%;border-collapse:collapse;background:#fff">
    ${row("Name", esc(name))}
    ${row("Mobile", `<a href="tel:+91${phone}" style="color:#0B6E66;font-weight:700;text-decoration:none">+91 ${phone.slice(0, 5)} ${phone.slice(5)}</a>`)}
    ${row("Email", `<a href="mailto:${esc(email)}" style="color:#0B6E66;text-decoration:none">${esc(email)}</a>`)}
    ${row("Requirement", `<div style="white-space:pre-wrap">${esc(requirement)}</div>`)}
    ${page ? row("Sent from", `<a href="${esc(page)}" style="color:#52605A">${esc(page)}</a>`) : ""}
    ${row("Received", esc(when) + " IST")}
  </table>
  <div style="padding:12px 20px;background:#F3F5F1;color:#52605A;font-size:12px">Reply to this email to answer the visitor directly.</div>
</div>`;

  const text = `New requirement received\n\nName: ${name}\nMobile: +91 ${phone}\nEmail: ${email}\n\nRequirement:\n${requirement}\n\n` +
    (page ? `Sent from: ${page}\n` : "") + `Received: ${when} IST`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `New requirement: ${name.replace(/[<>]/g, "")} (+91 ${phone})`,
        html,
        text
      })
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "Could not send email" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Requirement email error:", e);
    return res.status(500).json({ ok: false, error: "Could not send email" });
  }
};
