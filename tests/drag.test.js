/* Trip Board — the drag itself: that picking something up works every time, that
   nothing shifts under the cursor, and that a drag that fails is not read as a click.
   Needs Playwright (npm i -D playwright):  node tests/drag.test.js  */
const { chromium } = require('playwright');
const path = require('path');
const BOARD = 'file://' + path.join(__dirname, '..', 'Trip Board.html');
const SEED = {
  "trips": [
    {
      "id": "t1",
      "name": "Ten days",
      "createdAt": 1788850880417,
      "arr": {
        "date": "2026-11-20",
        "time": "09:00",
        "code": "PEK",
        "flightNo": ""
      },
      "dep": {
        "date": "2026-11-29",
        "time": "18:00",
        "code": "PEK",
        "flightNo": ""
      },
      "cities": [
        {
          "id": "c1",
          "name": "Beijing",
          "lat": 39.9042,
          "lon": 116.4074,
          "code": "PEK"
        }
      ],
      "interests": [],
      "custom": {},
      "pace": "balanced",
      "dayCity": {},
      "dayNotes": {},
      "dayImages": {},
      "stickies": {},
      "dayPin": {},
      "stays": [],
      "magnets": [
        {
          "id": "m1",
          "kind": "see",
          "board": "cal",
          "day": "2026-11-29",
          "slot": "evening",
          "label": "Duck dinner",
          "note": "",
          "locked": false,
          "order": 100
        },
        {
          "id": "m2",
          "kind": "see",
          "board": "cal",
          "day": "2026-11-24",
          "slot": "morning",
          "label": "Great Wall",
          "note": "",
          "locked": false,
          "order": 200
        },
        {
          "id": "m3",
          "kind": "see",
          "board": "tray",
          "label": "Hutong walk",
          "note": "",
          "locked": false,
          "order": 300
        }
      ],
      "wx": {
        "seasonal": {},
        "live": {},
        "liveAt": null
      },
      "decks": {},
      "verdicts": {},
      "tray": {
        "dismissed": []
      }
    }
  ]
};
const S = JSON.parse(JSON.stringify(SEED));
S.trips[0].dayFold = {"2026-11-21":true,"2026-11-22":true,"2026-11-23":true,"2026-11-25":true};
S.trips[0].magnets.push({id:"a9",kind:"see",board:"cal",day:"2026-11-22",slot:"afternoon",
  label:"Silk Market",note:"",locked:false,order:900});
let pass=0, fail=0;
const ok=(n,c,x)=>c?pass++:(fail++,console.log("  FAIL "+n+(x?"  <"+x+">":"")));
(async()=>{
  const b = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(s=>localStorage.setItem("tripBoard.v1",JSON.stringify(s)),S);
  await p.goto(BOARD);
  await p.click('.trip-card'); await p.waitForSelector('.cal .day');

  // real mouse drag, with folded days in the list (the old layout-shift trap)
  const mag = p.locator('.magnet[data-mag="m1"]');
  await mag.scrollIntoViewIfNeeded();
  const before = await p.evaluate(()=>document.body.scrollHeight);
  let box = await mag.boundingBox();
  await p.mouse.move(box.x+box.width/2, box.y+box.height/2);
  await p.mouse.down();
  await p.mouse.move(box.x+box.width/2+25, box.y+box.height/2+8, {steps:8});
  await p.waitForTimeout(150);
  const during = await p.evaluate(()=>document.body.scrollHeight);
  ok("the page does not change height when a drag starts", before===during, before+" -> "+during);
  ok("the rail is up", await p.locator('#dayrail').count()===1);
  const pos = await p.evaluate(()=>{
    const r=document.querySelector('#dayrail').getBoundingClientRect();
    const d=document.querySelector('.magnet[data-mag="m1"]').closest('.day').getBoundingClientRect();
    return {gap:Math.round(r.left-d.right), w:Math.round(r.width)};
  });
  ok("beside the day card", pos.gap>=0 && pos.gap<40, "gap="+pos.gap);
  // drop two days earlier
  const row = await p.locator('#dayrail .railrow[data-day="2026-11-27"]').boundingBox();
  const travel = Math.round(Math.hypot(row.x-box.x, row.y-box.y));
  await p.mouse.move(row.x+row.width/2, row.y+row.height/2, {steps:10});
  await p.mouse.up();
  await p.waitForTimeout(250);
  const m1 = await p.evaluate(()=>JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0].magnets.find(m=>m.id==="m1"));
  ok("a real drag onto the rail lands", m1.day==="2026-11-27", m1.day);
  ok("the rail is gone after the drop", await p.locator('#dayrail').count()===0);
  console.log("  travel from magnet to rail row: " + travel + "px");

  // a plain click still opens the editor
  await p.locator('.magnet[data-mag="m2"] .body').click();
  await p.waitForTimeout(200);
  ok("a click still opens the editor", await p.locator('#e-label').count()===1);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);

  // a press that travelled but produced no drag must not open the editor
  const m2 = await p.locator('.magnet[data-mag="m2"]').boundingBox();
  await p.mouse.move(m2.x+30, m2.y+m2.height/2);
  await p.mouse.down();
  await p.mouse.move(m2.x+30, m2.y+m2.height/2+40, {steps:5});
  await p.mouse.up();
  await p.waitForTimeout(250);
  ok("a failed drag does not open the editor instead", await p.locator('#e-label').count()===0);
  await p.evaluate(()=>{document.body.classList.remove('dragging');});

  // a rail left behind by a drag that never ended gets cleared
  await p.evaluate(()=>{ dragActive = true; beginDrag("m2", document.querySelector('.magnet[data-mag="m2"]'), {x:400,y:400}); dragActive = false; });
  await p.waitForTimeout(50);
  ok("a stranded rail exists to begin with", await p.locator('#dayrail').count()===1);
  await p.mouse.move(700, 500);
  await p.waitForTimeout(100);
  ok("and the watchdog clears it", await p.locator('#dayrail').count()===0);

  // drag an activity straight off a folded day
  const chip = p.locator('.day.folded .dsumchip[draggable="true"]').first();
  await chip.scrollIntoViewIfNeeded();
  await p.waitForTimeout(150);
  const n = await p.locator('.day.folded .dsumchip[draggable="true"]').count();
  ok("folded days hand their activities back", n >= 1, "chips=" + n);
  if(n){
    const cb = await chip.boundingBox();
    const label = await chip.innerText();
    await p.mouse.move(cb.x+cb.width/2, cb.y+cb.height/2);
    await p.mouse.down();
    await p.mouse.move(cb.x+cb.width/2+30, cb.y+cb.height/2+6, {steps:8});
    await p.waitForTimeout(200);
    ok("dragging a chip opens the rail", await p.locator('#dayrail').count()===1);
    const r2 = await p.locator('#dayrail .railrow[data-day="2026-11-20"]').boundingBox();
    await p.mouse.move(r2.x+r2.width/2, r2.y+r2.height/2, {steps:8});
    await p.mouse.up();
    await p.waitForTimeout(250);
    const moved = await p.evaluate(l=>{
      const t=JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0];
      return t.magnets.find(m=>m.label===l.trim());
    }, label);
    ok("and it lands on the day you dropped it on", !!moved && moved.day==="2026-11-20",
       moved && moved.day);
  }

  ok("no page errors", errs.length===0, errs.join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
