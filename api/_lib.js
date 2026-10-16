// Shared helpers for serverless functions. Zero dependencies (node:crypto + fetch).
import crypto from "node:crypto"; import fs from "node:fs"; import path from "node:path";
const SECRET = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
export const DEMO = { email: "demo@aibuild.dev", name: "Demo Executive" };

export async function body(req) {
  if (req.body !== undefined) return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { return {}; }
}
export function send(res, status, data, headers = {}) {
  res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}
export const method = (req, res, m) => { if (req.method !== m) { send(res, 405, { error: "Method not allowed" }); return false; } return true; };

// --- session token: base64url(payload).hmac ---
const b64 = s => Buffer.from(s).toString("base64url");
const sig = s => crypto.createHmac("sha256", SECRET).update(s).digest("base64url");
export function sign(user) { const p = b64(JSON.stringify({ ...user, exp: Date.now() + 7 * 864e5 })); return `${p}.${sig(p)}`; }
export function verify(t) {
  if (!t || !t.includes(".")) return null; const [p, s] = t.split(".");
  const ok = s && s.length === sig(p).length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(sig(p)));
  if (!ok) return null; const u = JSON.parse(Buffer.from(p, "base64url").toString()); return u.exp > Date.now() ? u : null;
}
const secure = () => (process.env.VERCEL ? "; Secure" : "");
export const sessionCookie = u => `aib_session=${sign(u)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}${secure()}`;
export const clearCookie = () => `aib_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure()}`;
export function currentUser(req) { const m = (req.headers.cookie || "").match(/(?:^|;\s*)aib_session=([^;]+)/); return m ? verify(m[1]) : null; }
export const publicUser = u => ({ email: u.email, name: u.name, plan: u.plan || "free", demo: !!u.demo });

// --- password hashing ---
export function hashPw(pw) { const salt = crypto.randomBytes(16).toString("hex"); return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`; }
export function checkPw(pw, stored) { const [salt, h] = (stored || "").split(":"); if (!h) return false; const a = crypto.scryptSync(pw, salt, 64); const b = Buffer.from(h, "hex"); return a.length === b.length && crypto.timingSafeEqual(a, b); }

// --- user store: Upstash Redis REST if configured, else local JSON file (or memory on serverless) ---
const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const FILE = path.resolve(process.env.VERCEL ? "/tmp" : ".data", "users.json"); const mem = new Map();
const readFile = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; } };
export const storeKind = RURL ? "upstash-redis" : process.env.VERCEL ? "ephemeral (/tmp)" : "local-file";
export async function getUser(email) {
  email = email.toLowerCase();
  if (RURL) { const r = await fetch(`${RURL}/get/user:${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${RTOK}` } }); const j = await r.json(); return j.result ? JSON.parse(j.result) : null; }
  return readFile()[email] || mem.get(email) || null;
}
export async function saveUser(u) {
  u.email = u.email.toLowerCase();
  if (RURL) { await fetch(`${RURL}/set/user:${encodeURIComponent(u.email)}`, { method: "POST", headers: { Authorization: `Bearer ${RTOK}` }, body: JSON.stringify(u) }); return u; }
  mem.set(u.email, u);
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const all = readFile(); all[u.email] = u; fs.writeFileSync(FILE, JSON.stringify(all, null, 2)); } catch {}
  return u;
}
export const validEmail = e => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;
export const origin = req => process.env.APP_URL || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers["x-forwarded-host"] || req.headers.host}`;
