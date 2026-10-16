import { chromium } from "playwright";
const b=await chromium.launch();const EM=`ada+${Date.now()}@example.com`;const U="http://localhost:4173/#";const hash=(pg,re)=>pg.waitForFunction(src=>new RegExp(src).test(location.hash),re.source);const log=(...a)=>console.log("✓",...a);
const ctx=await b.newContext({viewport:{width:1280,height:860}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
const shot=async n=>{await p.waitForTimeout(600);await p.screenshot({path:`shots/auth/${n}.png`})};
// gated pin -> login redirect
await p.goto(U+"/use-case/fraud-ring-detection");await p.click("button:has-text('Add to my roadmap')");await hash(p,/login\?next/);log("pin redirects to login when signed out");
await shot("01-login");
// sign up
await p.click("button:has-text('Create account')");await p.fill("input[autocomplete=name]","Ada Lovelace");await p.fill("input[type=email]",EM);await p.fill("input[type=password]","supersecret1");
await p.click("form button:has-text('Create account')");await hash(p,/use-case\/fraud-ring-detection/);log("sign-up returns to page");
await p.click("button:has-text('Add to my roadmap')");await p.waitForSelector("text=Added to my roadmap");await shot("02-signed-in-detail");log("pin works when signed in");
// sign out + bad login + sign in
await p.click("button:has-text('Sign out')");await p.waitForSelector("header a:has-text('Sign in')");await p.goto(U+"/login");await p.fill("input[type=email]",EM);await p.fill("input[type=password]","wrongpass");await p.click("form button:has-text('Sign in')");await p.waitForSelector("[role=alert]");await shot("03-login-error");log("wrong password error shown");
await p.fill("input[type=password]","supersecret1");await p.click("form button:has-text('Sign in')");await hash(p,/roadmap/);await p.click("button:has-text('Generate roadmap')");await p.waitForSelector("text=Pinned use cases (1)");await shot("04-roadmap-signed-in");log("sign-in persists pins");
// checkout
await p.goto(U+"/pricing");await p.waitForTimeout(800);await shot("05-pricing-test-banner");
await p.click("button:has-text('Upgrade to Team')");await hash(p,/checkout\/simulated/);await shot("06-simulated-checkout");
await p.click("button:has-text('Complete simulated payment')");await hash(p,/checkout\/success/);await p.waitForSelector("text=Pro");await shot("07-checkout-success");log("simulated checkout -> Pro");
await p.reload();await p.waitForSelector("header >> text=Pro");log("Pro survives reload");
// demo account in fresh context
const c2=await b.newContext({viewport:{width:1280,height:860}});const q=await c2.newPage();await q.goto(U+"/roadmap");await q.waitForTimeout(500);await q.screenshot({path:"shots/auth/08-roadmap-signed-out.png"});
await q.click("text=Generate roadmap");await q.click("button:has-text('Export board deck')");await hash(q,/login/);log("export gated");
await q.click("button:has-text('Try demo account')");await hash(q,/roadmap/);await q.waitForSelector("header >> text=Demo Executive");await q.screenshot({path:"shots/auth/09-demo-signed-in.png"});log("demo account works");
// mobile login
const c3=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const m=await c3.newPage();await m.goto(U+"/login");await m.waitForTimeout(600);await m.screenshot({path:"shots/auth/10-mobile-login.png"});
console.log("page errors:",errs.length?errs:"none");await b.close();
