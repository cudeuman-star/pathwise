import express from "express"; import OpenAI from "openai"; import path from "node:path";
import { useCases } from "../data.js";
const app = express(); app.use(express.json({ limit: "100kb" }));
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const STOP = new Set("the a an and or of to for in on what how should we our do is are with first can my i".split(" "));
const toks = s => s.toLowerCase().match(/[a-z]+/g)?.filter(w => w.length > 2 && !STOP.has(w)) || [];
function retrieve(q, profile, k = 6) {
  const qt = toks(q + " " + (profile?.industry || "") + " " + (profile?.priorities || []).join(" "));
  return useCases.map(u => {
    const meta = toks(`${u.industry} ${u.function} ${u.aiType}`), body = toks(`${u.title} ${u.problem} ${u.solution} ${u.roi} ${u.risks}`);
    let s = 0; for (const t of qt) { if (meta.some(m => m.startsWith(t.slice(0, 5)))) s += 3; if (body.some(m => m.startsWith(t.slice(0, 5)))) s += 1; }
    if (profile?.industry && u.industry === profile.industry) s += 2;
    return { u, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k).map(x => x.u);
}
const SYSTEM = `You are the AI Build Advisor, a senior enterprise AI strategist advising C-suite executives and corporate strategy teams.
Style: crisp, executive-ready, structured (short headers or bullets), decisive recommendations with clear sequencing, trade-offs, and governance considerations. Under ~250 words unless asked for more.
Grounding rules:
- Base recommendations on the LIBRARY CASES provided. When you reference a case, cite it by exact name as a markdown link: [Case Name](#/use-case/<id>).
- Never invent library cases. If nothing fits, say so and give general strategic guidance, labeled as such.
- All difficulty, time-to-value, and impact figures in the library are illustrative EXAMPLE data, not benchmarks. Whenever you mention any figure, note that it's example data; end every answer with a one-line note: "_Figures are example data from the AI Build prototype library._"
- Use the company profile (if given) to tailor priorities, maturity-appropriate sequencing and risk appetite.
- Always flag key risks and governance controls (ownership, human oversight, privacy, bias, regulatory).`;
app.post("/api/chat", async (req, res) => {
  const { messages = [], profile } = req.body || {};
  if (!client) return res.status(503).json({ error: "Advisor is not configured (missing API key on server)." });
  const last = [...messages].reverse().find(m => m.role === "user")?.content || "";
  if (!last.trim()) return res.status(400).json({ error: "Empty question." });
  const cases = retrieve(messages.filter(m => m.role === "user").slice(-3).map(m => m.content).join(" "), profile);
  const ctx = "LIBRARY CASES (example data):\n" + (cases.length ? cases.map(u => `- id=${u.id} | ${u.title} | ${u.industry} | ${u.function} | ${u.aiType} | difficulty ${u.difficulty} | ~${u.ttvMonths} mo to value | impact ${u.impact}/100\n  Problem: ${u.problem}\n  Solution: ${u.solution}\n  Data: ${u.data}\n  ROI: ${u.roi.join("; ")}\n  Risks: ${u.risks.join("; ")}`).join("\n") : "(no close matches)")
    + "\n\nCOMPANY PROFILE: " + (profile ? JSON.stringify(profile) : "(none provided)");
  res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Cited-Cases", cases.map(u => u.id).join(","));
  try {
    const stream = await client.chat.completions.create({ model: MODEL, stream: true, temperature: 0.4, max_tokens: 700,
      messages: [{ role: "system", content: SYSTEM }, { role: "system", content: ctx }, ...messages.slice(-10).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 4000) }))] });
    req.on("close", () => stream.controller?.abort());
    for await (const ch of stream) { const t = ch.choices[0]?.delta?.content; if (t) res.write(t); }
    res.end();
  } catch (e) {
    console.error("chat error:", e.status, e.message);
    const msg = e.status === 401 ? "authentication with the AI provider failed" : e.status === 429 && /credit|quota/i.test(e.message) ? "the AI account has no API credits remaining (billing needs topping up)" : e.status === 429 ? "the AI service is rate-limited, please retry shortly" : "the AI service is unavailable";
    if (!res.headersSent) res.status(502).json({ error: msg }); else res.end(`\n\n⚠️ Sorry, ${msg}.`);
  }
});
app.get("/api/health", (_, r) => r.json({ ok: true, configured: !!client, model: MODEL }));
app.use(express.static(path.resolve("dist")));
const PORT = process.env.PORT || 8787; app.listen(PORT, () => console.log("AI Build server on :" + PORT));
