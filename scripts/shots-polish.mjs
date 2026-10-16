import { chromium } from "playwright";
const b=await chromium.launch();const U="http://localhost:4173/#";
for(const [tag,vp] of [["desktop",{width:1440,height:900}],["mobile",{width:390,height:844}]]){
 const ctx=await b.newContext({viewport:vp,deviceScaleFactor:tag==="mobile"?2:1});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const shot=async(n,full=true)=>{await p.waitForTimeout(700);await p.screenshot({path:`shots/polish/${tag}-${n}.png`,fullPage:full})};
 await p.goto(U+"/");await shot("01-landing");
 await p.goto(U+"/library");await shot("02-library");
 await p.goto(U+"/use-case/aml-alert-investigator-agent");await p.click("button:has-text('Add to my roadmap')");await shot("03-detail");
 await p.goto(U+"/use-case/demand-sensing");await p.click("button:has-text('Add to my roadmap')");
 await p.goto(U+"/roadmap");await p.click("button:has-text('Generate roadmap')");await shot("04-roadmap");
 await p.click("button:has-text('Export board deck')");await shot("05-export",false);
 await p.goto(U+"/library");await p.click(tag==="mobile"?"button[aria-label=Advisor]":"button:has-text('Advisor')");await p.waitForTimeout(500);
 const ask=async q=>{await p.fill("input[placeholder='Ask the advisor…']",q);await p.keyboard.press("Enter");await p.waitForTimeout(700)};
 await ask("What should a bank do first in risk?");await shot("06-advisor",false);
 if(tag==="desktop"){await ask("Quick wins for a retailer?");await ask("How do we govern agentic AI?");
  console.log((await p.locator(".animate-up a[href^='#/use-case']").allTextContents()).join(" | "));}
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);console.log(tag,"scrollWidth",w,"errors",errs.length?errs:"none");
 await ctx.close();}
await b.close();
