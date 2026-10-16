import { chromium } from "playwright";
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const U="http://localhost:4173/#";
await p.goto(U+"/roadmap");await p.click("text=Generate roadmap");await p.goto(U+"/library");
await p.click("text=Ask the Advisor");await p.waitForTimeout(600);
await p.fill("input[placeholder='Ask the advisor…']","What should a bank do first in risk?");await p.keyboard.press("Enter");
await p.waitForFunction(()=>!document.querySelector("form button").disabled,null,{timeout:60000});await p.waitForTimeout(300);
await p.screenshot({path:"shots/09-advisor-mock.png"});await b.close();
