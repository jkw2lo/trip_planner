/* Trip Board — the maps: that the tile layer lines its markers up with the tiles
   themselves, that the switch works, and that losing the network is survivable.
   Tiles are stubbed, so this never touches the network.
   Needs Playwright (npm i -D playwright):  node tests/maps.test.js  */
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
const P = (id,n,lat,lon,slot,kind)=>({id, kind:kind||"see", board:"cal", day:"2026-11-21",
  slot, label:n, note:"", locked:false, order:100+id.length, place:{lat,lon,area:"Beijing"}});
S.trips[0].cities[0].lat = 39.9042; S.trips[0].cities[0].lon = 116.4074;
S.trips[0].magnets = S.trips[0].magnets.filter(m=>m.kind==="fly");
S.trips[0].magnets.push(
  P("q1","Forbidden City",39.9163,116.3972,"morning"),
  P("q2","Jingshan Park",39.9280,116.3900,"afternoon"),
  P("q3","Temple of Heaven",39.8822,116.4066,"evening"),
  P("q4","Siji Minfu",39.9105,116.4030,"dinner","eat"));

let pass=0, fail=0;
const ok=(n,c,x)=>c?pass++:(fail++,console.log("  FAIL "+n+(x?"  <"+x+">":"")));
const eq=(n,a,b)=>ok(n,a===b,JSON.stringify(a)+" !== "+JSON.stringify(b));

(async()=>{
  const b = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  let asked = [];
  await p.route('**://tile.openstreetmap.org/**', route=>{
    asked.push(route.request().url());
    route.fulfill({status:200, contentType:'image/png', body:TILE});
  });
  await p.addInitScript(s=>localStorage.setItem("tripBoard.v1",JSON.stringify(s)),S);
  await p.goto(BOARD);
  await p.click('.trip-card'); await p.waitForSelector('.cal .day');

  const dayMap = p.locator('.day').nth(1).locator('.daymap');
  await dayMap.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  eq("the day with places gets a tile map", await dayMap.locator('.tilemap').count(), 1);
  ok("tiles were actually requested", asked.length > 0, "asked=" + asked.length);
  ok("they come from the standard OSM host", asked.every(u=>/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(u)), asked[0]);
  eq("attribution is on the map", await dayMap.locator('.tileattr').count(), 1);

  // the real check: does a marker land where its own tile says it should?
  const align = await p.evaluate(() => {
    // the map belonging to the day that actually has the stops on it
    const day = document.querySelector('[data-mag="q1"]').closest('.day');
    const box = day.querySelector('.daymap .tilemap');
    const br = box.getBoundingClientRect();
    const z = Number(box.querySelector('img.tile').src.split('/').slice(-3)[0]);
    const TP = 256;
    const gx = lon => (lon+180)/360 * TP * Math.pow(2,z);
    const gy = lat => { const s=Math.sin(lat*Math.PI/180);
      return (0.5 - Math.log((1+s)/(1-s))/(4*Math.PI)) * TP * Math.pow(2,z); };
    // where the app drew the first stop
    const c = box.querySelector('svg g circle');
    const cr = c.getBoundingClientRect();
    const drawnX = cr.left + cr.width/2 - br.left, drawnY = cr.top + cr.height/2 - br.top;
    // where that stop belongs, measured off the tile images themselves
    const pt = {lat:39.9163, lon:116.3972};
    const tx = Math.floor(gx(pt.lon)/TP), ty = Math.floor(gy(pt.lat)/TP);
    const img = [...box.querySelectorAll('img.tile')].find(i=>{
      const s = i.src.split('/').slice(-3); return Number(s[1])===tx && Number(s[2].replace('.png',''))===ty;
    });
    if(!img) return {err:"no tile holds the first stop"};
    const ir = img.getBoundingClientRect();
    const trueX = ir.left - br.left + (gx(pt.lon) - tx*TP);
    const trueY = ir.top - br.top + (gy(pt.lat) - ty*TP);
    return {z, dx: Math.abs(drawnX-trueX), dy: Math.abs(drawnY-trueY)};
  });
  ok("the first stop sits exactly where its tile puts it",
     !align.err && align.dx < 1.5 && align.dy < 1.5, JSON.stringify(align));
  ok("and the zoom is a sensible city-scale one", align.z >= 11 && align.z <= 16, "z=" + align.z);

  // a day with nothing pinned now shows the city rather than a blank strip
  const empty = p.locator('.day').nth(3).locator('.daymap');
  await empty.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  eq("an empty day still gets a map of the city", await empty.locator('.tilemap').count(), 1);
  ok("and says what is missing", (await empty.locator('.dmempty').innerText()).includes("Nothing with a location"));

  // coverage tab
  await p.click('[data-tab="cover"]'); await p.waitForTimeout(400);
  eq("the coverage map is a tile map too", await p.locator('.citymap .tilemap').count(), 1);
  await p.click('[data-tab="cal"]'); await p.waitForTimeout(300);

  // the switch
  await p.locator('[data-act="maptoggle"]').first().click();
  await p.waitForTimeout(300);
  eq("switching off leaves no tile maps", await p.locator('.tilemap').count(), 0);
  ok("and the drawn map is back", await p.locator('.dmsvg').count() > 0);
  ok("the preference is remembered", await p.evaluate(()=>JSON.parse(localStorage.getItem("tripBoard.v1")).prefs.tiles===false));
  await p.locator('[data-act="maptoggle"]').first().click();
  await p.waitForTimeout(400);
  ok("switching back brings tiles", await p.locator('.tilemap').count() > 0);

  // when the tiles will not come
  await p.unroute('**://tile.openstreetmap.org/**');
  await p.route('**://tile.openstreetmap.org/**', r=>r.abort());
  await p.reload(); await p.waitForTimeout(200);
  await p.click('.trip-card'); await p.waitForSelector('.cal .day');
  await p.locator('.day').nth(1).locator('.daymap').scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  ok("a failed tile falls back to the drawn grid",
     await p.locator('.tilemap.notiles').count() > 0);
  ok("and says why", await p.locator('.tilemap.notiles .tilewarn').first().isVisible());
  ok("no page errors", errs.length===0, errs.slice(0,2).join(" | "));

  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
