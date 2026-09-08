/* Trip Board — the sample trip on the front page: that it builds, that it is a real
   trip rather than a picture of one, and that the features it is meant to show off
   are actually in it. Tiles are stubbed; nothing here touches the network.
   Needs Playwright (npm i -D playwright):  node tests/sample.test.js  */
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
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**://tile.openstreetmap.org/**', r=>r.fulfill({status:200,contentType:'image/png',body:TILE}));
  await p.goto(BOARD);                       // no seeded storage: a brand new user
  await p.waitForSelector('.trip-grid');
  eq("a new user is offered the sample", await p.locator('[data-act="demo"]').count(), 1);

  await p.click('[data-act="demo"]');
  await p.waitForSelector('.cal .day');
  await p.waitForTimeout(1200);
  const t = await p.evaluate(()=>JSON.parse(localStorage.getItem("tripBoard.v1")).trips.find(x=>x.id==="sample-trip"));
  ok("it saved as a real trip", !!t);
  eq("eight days", await p.locator('.cal > .day').count(), 8);
  eq("three cities on the overview", await p.locator('.ovrow:not(.ovhead)').count(), 3);
  eq("three hotels", t.stays.length, 3);
  const placed = t.magnets.filter(m=>m.board==="cal" && m.place);
  ok("most of the plan has real coordinates", placed.length >= 22, "placed=" + placed.length);
  ok("the maps drew", await p.locator('.daymap .tilemap').count() >= 5);
  ok("one day is finalised", await p.locator('.day.locked').count()===1);
  ok("something is pinned down", await p.locator('.magnet.locked').count() >= 3);
  ok("and something is optional", await p.locator('.magnet.optional').count() >= 3);
  ok("the sample says it is one", await p.locator('.demobar').count()===1);
  ok("stickies are there", await p.locator('.sticky').count() >= 2);
  ok("the shortlist has kept items", await p.locator('.shortpanel').count()===1);
  const bad = await p.evaluate(()=>{
    const t = JSON.parse(localStorage.getItem("tripBoard.v1")).trips.find(x=>x.id==="sample-trip");
    return t.magnets.filter(m=>m.board==="cal" && m.kind!=="fly" && m.kind!=="move" && !m.place).map(m=>m.label);
  });
  ok("every activity found its coordinates", bad.length===0, bad.join(", "));

  await p.click('[data-tab="todo"]'); await p.waitForTimeout(300);
  ok("the to-do board is filled in", await p.locator('.board .magnet').count() >= 6);
  await p.click('[data-tab="cover"]'); await p.waitForTimeout(500);
  ok("coverage draws a map per city", await p.locator('.citymap').count() >= 2);
  await p.click('[data-tab="eats"]'); await p.waitForTimeout(300);
  ok("eat & drink has a list", await p.locator('.board .magnet').count() >= 5);
  await p.click('[data-tab="guide"]'); await p.waitForTimeout(500);
  ok("all three guides are there", await p.locator('.gtab').count()===3);
  ok("with no 'no report' gaps", await p.locator('.gtab.pend').count()===0);
  await p.click('[data-tab="cal"]'); await p.waitForTimeout(600);
  const disc = await p.locator('.discovercol').innerText();
  ok("Discover shows deck progress", /\d+ (of|\/)|left|kept|start/i.test(disc), disc.slice(0,90).replace(/\n/g,"|"));


  // back home: the card is badged, and the offer is gone
  await p.click('[data-act="home"]'); await p.waitForTimeout(300);
  eq("the sample now has its own card", await p.locator('.trip-card.sample').count(), 1);
  eq("and is not offered twice", await p.locator('[data-act="demo"]').count(), 0);

  ok("no page errors", errs.length===0, errs.slice(0,2).join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
