// Server-side proxy between the app and the Google Apps Script web app.
// Keeps the web-app URL private (env var) and avoids browser CORS issues.

const WEBAPP_URL = process.env.SHEETS_WEBAPP_URL;

export const dynamic = "force-dynamic";

// GET /api/students → just reports whether the sheet is wired up
// (the app uses this to decide whether to save on Build).
export async function GET() {
  return Response.json({ configured: !!WEBAPP_URL });
}

// POST /api/students → append one submission to the sheet.
export async function POST(request) {
  if (!WEBAPP_URL) {
    return Response.json({ ok: false, configured: false }, { status: 400 });
  }
  try {
    const body = await request.text();

    // Required-field guard (mirrors the client-side constraints).
    let parsed = {};
    try { parsed = JSON.parse(body); } catch {}
    const name = String(parsed.name || "").trim();
    const phone = String(parsed.phone || "").replace(/\D/g, "");
    const epsid = String(parsed.epsid || "").trim().toUpperCase();
    if (!name || phone.length !== 10 || !/^EPS\d{6}$/.test(epsid)) {
      return Response.json(
        { ok: false, configured: true, error: "A name, 10-digit phone number, and valid EPSID (EPS000000) are required." },
        { status: 422 }
      );
    }

    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      // text/plain keeps it a "simple" request; Apps Script parses the body itself.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
    });
    const data = await res.json();
    return Response.json({ ...data, configured: true });
  } catch (err) {
    return Response.json(
      { ok: false, configured: true, error: String(err) },
      { status: 502 }
    );
  }
}
