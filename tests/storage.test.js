/* Trip Board — the front page's storage panel: that it says where the trips are,
   offers the fix, and takes a dropped file. Tiles are stubbed; no network.
   Needs Playwright (npm i -D playwright):  node tests/storage.test.js  */
const { chromium } = require('playwright');
const path = require('path');
const BOARD = 'file://' + path.join(__dirname, '..', 'Trip Board.html');
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let pass=0,fail=0;
const ok=(n,c,x)=>c?pass++:(fail++,console.log("  FAIL "+n+(x?"  <"+x+">":"")));
const eq=(n,a,b)=>ok(n,a===b,JSON.stringify(a)+" !== "+JSON.stringify(b));
(async()=>{
  const b = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p=await b.newPage({viewport:{width:1100,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**://tile.openstreetmap.org/**', r=>r.fulfill({status:200,contentType:'image/png',body:TILE}));
  await p.goto(BOARD);
  await p.waitForSelector('.trip-grid');

  eq("the front page says where trips live", await p.locator('.homestore').count(), 1);
  ok("and flags the risky default", await p.locator('.homestore.warn').count()===1);
  const txt = await p.locator('.homestore').innerText();
  ok("in plain words", /this browser on this computer/i.test(txt), txt.slice(0,120));
  eq("with the three steps spelled out", await p.locator('.hssteps li').count(), 3);
  ok("import is a labelled button now", await p.locator('.homestore [data-act="import"]').count()===1);
  ok("so is linking a file", await p.locator('.homestore [data-act="st-link"]').count()===1);
  ok("and backing up", await p.locator('.homestore [data-act="export"]').count()===1);
  ok("it says you can drop a file too", /drop a trip file/i.test(txt));
  ok("never backed up, and it says so", /Never backed up/i.test(txt));

  // with a trip on the board
  await p.click('[data-act="demo"]'); await p.waitForTimeout(900);
  await p.click('[data-act="home"]'); await p.waitForTimeout(400);
  ok("it counts what you have", /1 trip\b/.test(await p.locator('.hsmeta').innerText()));

  // dropping a trip file imports it
  const other = await p.evaluate(()=>{
    const t = JSON.parse(JSON.stringify(trip() || DB.trips[0]));
    t.id = "dropped-1"; t.name = "Dropped in from a file"; delete t.demo;
    return JSON.stringify({trips:[t]}, null, 2);
  });
  await p.evaluate(text=>{
    const dt = new DataTransfer();
    dt.items.add(new File([text], "my-trips.json", {type:"application/json"}));
    const app = document.getElementById("app");
    app.dispatchEvent(new DragEvent("dragover", {bubbles:true, cancelable:true, dataTransfer:dt}));
    app.dispatchEvent(new DragEvent("drop", {bubbles:true, cancelable:true, dataTransfer:dt}));
  }, other);
  await p.waitForTimeout(600);
  eq("dropping a trip file imports it", await p.locator('.trip-card').count(), 2);
  ok("and says what it did", /added/i.test(await p.locator('#toasts .toast').first().innerText()));

  // dropping a city report goes to the guides instead
  const rep = JSON.stringify({schema:"cityreport.v1", city:"Lisbon", country:"Portugal",
    lat:38.72, lon:-9.14, glance:{why:"A test report"}, coords:{}});
  await p.evaluate(text=>{
    const dt = new DataTransfer();
    dt.items.add(new File([text], "lisbon.json", {type:"application/json"}));
    const app = document.getElementById("app");
    app.dispatchEvent(new DragEvent("drop", {bubbles:true, cancelable:true, dataTransfer:dt}));
  }, rep);
  await p.waitForTimeout(500);
  ok("a dropped city report is understood as one",
     await p.evaluate(()=>!!REPORTS["lisbon"]));
  ok("and says so", /Lisbon/.test(await p.locator('#toasts .toast').last().innerText()));

  // the backup button records when
  await p.evaluate(()=>{ prefs().lastBackup = Date.now() - 3*86400000; save(); render(); });
  await p.waitForTimeout(300);
  ok("a past backup is dated in words", /3 days ago/.test(await p.locator('.hsmeta').innerText()));

  ok("no page errors", errs.length===0, errs.slice(0,2).join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
