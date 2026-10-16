// Serves /api/* from the ./api folder (Vercel-style functions) during `vite dev` and `vite preview`.
import path from "node:path"; import fs from "node:fs"; import { pathToFileURL } from "node:url";
function mw() {
  return async (req, res, next) => {
    const url = new URL(req.url, "http://x"); if (!url.pathname.startsWith("/api/")) return next();
    const rel = url.pathname.slice(5).replace(/\/$/, ""); const file = path.resolve("api", rel + ".js");
    if (rel.split("/").some(s => s.startsWith("_")) || !file.startsWith(path.resolve("api")) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('{"error":"Not found"}'); }
    try { const mod = await import(pathToFileURL(file).href + "?t=" + fs.statSync(file).mtimeMs); await mod.default(req, res); }
    catch (e) { console.error(e); res.statusCode = 500; res.end('{"error":"Server error"}'); }
  };
}
export default function apiPlugin() { return { name: "local-api", configureServer: s => { s.middlewares.use(mw()); }, configurePreviewServer: s => { s.middlewares.use(mw()); } }; }
