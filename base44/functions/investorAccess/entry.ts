// investorAccess — server-side gate for the investor area.
//
// The access code and the signing secret live only here (Base44 Secrets),
// never in the browser bundle. On a correct code this mints a short-lived
// signed token (HMAC-SHA256). The browser stores only that token; it can't be
// forged without the server secret, so setting a sessionStorage flag by hand
// no longer opens the gate.
//
//   POST { code }                    -> { ok, token?, exp? }
//   POST { action: "verify", token } -> { ok }
//
// Secrets (set these in Base44; sensible fallbacks keep it working meanwhile):
//   INVESTOR_ACCESS_CODE   — the shared code funders type
//   INVESTOR_TOKEN_SECRET  — HMAC signing key (change this before sharing)

const DEFAULT_CODE = "OOH-INVEST-2026";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlStr = (s: string) => b64url(enc.encode(s));
const fromB64urlStr = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

const norm = (s: unknown) => String(s ?? "").trim().toUpperCase();
function safeEqual(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

async function hmac(msg: string): Promise<string> {
  const secret = Deno.env.get("INVESTOR_TOKEN_SECRET") || `${Deno.env.get("INVESTOR_ACCESS_CODE") || DEFAULT_CODE}::ooh-token-v1`;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

async function mint(): Promise<{ token: string; exp: number }> {
  const exp = Date.now() + TTL_MS;
  const payload = b64urlStr(JSON.stringify({ exp }));
  const sig = await hmac(payload);
  return { token: `${payload}.${sig}`, exp };
}

async function verify(token: string): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, await hmac(payload))) return false;
  try { const { exp } = JSON.parse(fromB64urlStr(payload)); return typeof exp === "number" && Date.now() < exp; }
  catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ ok: false, reason: "POST required" }, { status: 405 });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body */ }

  if (body?.action === "verify") {
    return Response.json({ ok: await verify(String(body?.token || "")) }, { status: 200 });
  }

  const expected = norm(Deno.env.get("INVESTOR_ACCESS_CODE") || DEFAULT_CODE);
  const ok = expected.length > 0 && safeEqual(norm(body?.code), expected);
  if (!ok) return Response.json({ ok: false, ts: Date.now() }, { status: 200 });
  const { token, exp } = await mint();
  return Response.json({ ok: true, token, exp, ts: Date.now() }, { status: 200 });
});
