// ARCHIVED live (OpenAI-backed) advisor panel. Not imported by the app.
// To re-enable: run src/advisor-live/server.mjs (needs OPENAI_API_KEY), add a Vite /api proxy to :8787, and swap this into App.jsx.
import { useState } from "react";
import { md } from "../App.jsx";
export function Advisor({open,onClose}){const[m,setM]=useState([{role:"assistant",content:"Hi, I'm the AI Build Advisor. Ask me where to start, e.g. _What should a bank do first in risk?_ I ground answers in our example use-case library and your Roadmap Builder profile."}]);const[v,setV]=useState("");const[busy,setBusy]=useState(false);
const send=async t=>{if(!t||busy)return;const hist=[...m.slice(1),{role:"user",content:t}];setM(x=>[...x,{role:"user",content:t},{role:"assistant",content:""}]);setV("");setBusy(true);
const upd=f=>setM(x=>{const y=[...x];y[y.length-1]={...y[y.length-1],...f(y[y.length-1])};return y});
try{let profile=null;try{profile=JSON.parse(localStorage.getItem("aib_profile"))}catch{}
const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist,profile})});
if(!r.ok){let e="Something went wrong.";try{e=(await r.json()).error}catch{}throw new Error(e)}
const rd=r.body.getReader(),dec=new TextDecoder();for(;;){const{done,value}=await rd.read();if(done)break;const c=dec.decode(value,{stream:true});upd(l=>({content:l.content+c}))}}
catch(e){upd(()=>({content:"⚠️ The advisor couldn't answer right now ("+e.message+"). Please try again.",error:true}))}finally{setBusy(false)}};
let prof=null;try{prof=JSON.parse(localStorage.getItem("aib_profile"))}catch{}
return <div className={`fixed top-0 right-0 h-full w-[440px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col transition-transform ${open?"":"translate-x-full invisible"}`}><div className="p-4 border-b flex justify-between items-center"><div><div className="font-semibold text-ink">✦ AI Advisor</div><div className="text-xs text-slate-500">{prof?`Context: ${prof.name} · ${prof.industry}`:"Grounded in the example library"}</div></div><button onClick={onClose} className="text-slate-400 text-xl">×</button></div>
<div className="flex-1 overflow-auto p-4 space-y-3">{m.map((x,i)=><div key={i} className={`text-sm p-3 rounded-xl max-w-[92%] leading-relaxed ${x.role==="user"?"ml-auto bg-brand-600 text-white":x.error?"bg-rose-50 text-rose-700":"bg-slate-100"}`}>{x.role==="user"?x.content:x.content?<span dangerouslySetInnerHTML={{__html:md(x.content)}}/>:<span className="animate-pulse text-slate-400">Thinking…</span>}</div>)}</div>
<div className="px-4 flex flex-wrap gap-2">{["What should a bank do first in risk?","Quick wins for our company?","How do we govern agentic AI?"].map(s=><button key={s} disabled={busy} onClick={()=>send(s)} className="chip hover:bg-brand-50">{s}</button>)}</div>
<form onSubmit={e=>{e.preventDefault();send(v)}} className="p-4 flex gap-2"><input className="input" value={v} onChange={e=>setV(e.target.value)} placeholder="Ask the advisor…"/><button disabled={busy} className="btn-primary disabled:opacity-50">Send</button></form></div>}

