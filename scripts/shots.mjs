import { chromium } from "playwright";
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const U="http://localhost:4173/#";
const go=async(h,f,full=true)=>{await p.goto(U+h);await p.waitForTimeout(400);await p.screenshot({path:`shots/${f}.png`,fullPage:full})};
await go("/","01-landing");await go("/library","02-library");
await p.selectOption("select >> nth=0","Banking");await p.waitForTimeout(200);await p.screenshot({path:"shots/03-library-filtered.png"});
await go("/use-case/claims-triage-copilot","04-detail");
await p.goto(U+"/roadmap");await p.click("text=Generate roadmap");await p.waitForTimeout(300);await p.screenshot({path:"shots/05-roadmap.png",fullPage:true});
await p.click("text=Export board deck");await p.waitForTimeout(200);await p.screenshot({path:"shots/06-export.png"});
await b.close();
