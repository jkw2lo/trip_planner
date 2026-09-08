/* Trip Board — the reports that ship inside the file: that they load with no folder
   linked, feed the guide, the decks and the food list, and that the prompt for
   writing a new one is there and carries the format.
   Needs Playwright (npm i -D playwright):  node tests/reports.test.js  */
const { chromium } = require('playwright');
const path = require('path');
const BOARD = 'file://' + path.join(__dirname, '..', 'Trip Board.html');
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
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
S.trips[0].cities = [{id:"c1",name:"Beijing",lat:39.9042,lon:116.4074,code:"PEK"},
                     {id:"c2",name:"Reykjavik",lat:64.1466,lon:-21.9426,code:"KEF"}];
let pass=0,fail=0;
const ok=(n,c,x)=>c?pass++:(fail++,console.log("  FAIL "+n+(x?"  <"+x+">":"")));
const eq=(n,a,b)=>ok(n,a===b,JSON.stringify(a)+" !== "+JSON.stringify(b));
(async()=>{
  const b = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**://tile.openstreetmap.org/**', r=>r.fulfill({status:200,contentType:'image/png',body:TILE}));
  await p.addInitScript(s=>localStorage.setItem("tripBoard.v1",JSON.stringify(s)),S);
  await p.goto(BOARD);
  await p.click('.trip-card'); await p.waitForSelector('.cal .day');

  const n = await p.evaluate(()=>builtinCityNames());
  eq("ten cities ship with the file", n.length, 10);
  ok("Beijing is one of them", n.includes("Beijing"), n.join(","));
  ok("and the New York alias resolves to the same object",
     await p.evaluate(()=>REPORTS["new-york"] === REPORTS["new-york-city"]));

  await p.click('[data-tab="guide"]'); await p.waitForTimeout(500);
  ok("the guides tab opens straight into a report with no folder linked",
     await p.locator('.report').count()===1);
  ok("it is the built-in Beijing one",
     (await p.locator('.report h2').innerText()).includes("Beijing"));
  ok("and says so", /built in/i.test(await p.locator('.rorigin').first().innerText()));
  ok("the city without a report is flagged", await p.locator('.gtab.pend').count()===1);
  ok("with the prompt offered", await p.locator('.promptbox').count()>=1);
  const prompt = await p.locator('.promptpre').first().textContent();
  ok("the prompt names the missing city", prompt.includes("Reykjavik"), prompt.slice(0,80));
  ok("and carries the format", prompt.includes('"schema": "cityreport.v1"') && prompt.includes('"coords"'));
  ok("the prompt is substantial", prompt.length > 2000, "len=" + prompt.length);

  // the report content actually rendered
  const body = await p.locator('.report').innerText();
  ok("the report has real content", body.length > 4000, "len=" + body.length);
  ok("including food", /Peking duck|duck/i.test(body));

  // the deck and the food list are fed by it too
  await p.click('[data-tab="eats"]'); await p.waitForTimeout(400);
  ok("the food panel is populated from the built-in report",
     await p.locator('.foodpanel .fpitem').count() > 5);
  await p.click('[data-tab="cal"]'); await p.waitForTimeout(500);
  const deck = await p.locator('.deckcard, .deckrow, .shortpanel, .discovercol').first().innerText().catch(()=>"");
  ok("Discover has a Beijing deck ready", /Beijing/.test(deck), deck.slice(0,60));

  // search across the built-ins
  await p.click('[data-tab="guide"]'); await p.waitForTimeout(300);
  await p.fill('#askq', 'best noodles');
  await p.click('[data-act="ask"]'); await p.waitForTimeout(400);
  ok("you can search the built-in reports", await p.locator('.askhit').count() > 0);

  ok("no page errors", errs.length===0, errs.slice(0,2).join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
