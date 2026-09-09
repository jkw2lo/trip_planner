/* Trip Board — the things that hang off the board: how full a day is, what it costs,
   when a place is shut, the calendar export, the printed copy, finding something
   again, and Today. Tiles are stubbed, so this never touches the network.
   Needs Playwright (npm i -D playwright):  node tests/extras.test.js  */
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
  await p.goto(BOARD);
  await p.waitForSelector('.trip-grid'); await p.click('[data-act="demo"]');
  await p.waitForSelector('.cal .day'); await p.waitForTimeout(1200);

  // day load
  const load = await p.evaluate(()=>{ const t=trip(); const d=tripDays(t);
    return d.map(x=>({d:x, ...dayLoad(t,x)})); });
  ok("every day gets a time estimate", load.every(l=>l.total>=0));
  ok("a full day reads as several hours", load[1].total > 200, JSON.stringify(load[1]));
  eq("the chips are on the board", await p.locator('.dload').count(), load.filter(l=>l.total>0).length);

  // toasts queue
  await p.evaluate(()=>{ toast("one"); toast("two"); toastUndo("three","undodel"); });
  await p.waitForTimeout(150);
  eq("toasts stack in one column", await p.locator('#toasts .toast').count(), 3);
  const boxes = await p.evaluate(()=>[...document.querySelectorAll('#toasts .toast')]
    .map(e=>Math.round(e.getBoundingClientRect().top)));
  ok("and do not sit on top of each other", new Set(boxes).size === 3, JSON.stringify(boxes));
  await p.evaluate(()=>{ document.getElementById("toasts").innerHTML=""; });

  // closed days
  await p.evaluate(()=>{ const t=trip();
    const m=t.magnets.find(x=>x.label==="Forbidden City");
    m.closed = "monday"; save(); render(); });
  await p.waitForTimeout(300);
  const shutCount = await p.evaluate(()=>{ const t=trip();
    return t.magnets.filter(m=>magnetShut(m)).length; });
  const isMon = await p.evaluate(()=>{ const t=trip();
    const m=t.magnets.find(x=>x.label==="Forbidden City");
    return parseD(m.day).getDay()===1; });
  eq("a closed day is only flagged when the day matches", shutCount, isMon?1:0);
  await p.evaluate(()=>{ const t=trip();
    const m=t.magnets.find(x=>x.label==="Forbidden City");
    // force the flag on whatever weekday it actually falls on
    m.closed = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][parseD(m.day).getDay()];
    save(); render(); });
  await p.waitForTimeout(300);
  eq("and then it shows on the magnet", await p.locator('.magnet.shut').count(), 1);
  ok("with a badge", await p.locator('.shutbadge').count() >= 1);
  ok("and a line in the notes", (await p.locator('.gap').first().innerText()).includes("closed"));

  // costs
  await p.evaluate(()=>{ const t=trip(); t.currency="¥";
    const d=tripDays(t);
    t.magnets.filter(m=>m.board==="cal"&&m.day===d[1]).slice(0,2).forEach((m,i)=>{ m.cost = 100*(i+1); });
    t.magnets.filter(m=>m.optional)[0].cost = 500;
    t.stays[0].cost = 4000;
    save(); render(); });
  await p.waitForTimeout(300);
  ok("a day shows its cost", await p.locator('.dcost').count() >= 1);
  const head = await p.locator('.tripcost').innerText();
  ok("the trip total counts the beds", head.includes("4,300"), head);
  ok("and keeps the optional money separate", head.includes("500"), head);

  // ics
  await p.click('[data-act="exporttrip"]'); await p.waitForTimeout(300);
  ok("the export offers a calendar", await p.locator('[data-act="ex-ics"]').count()===1);
  const ics = await p.evaluate(()=>tripICS(trip()));
  ok("it is a calendar", ics.startsWith("BEGIN:VCALENDAR") && ics.trim().endsWith("END:VCALENDAR"));
  ok("with the flights in it", /SUMMARY:Land PEK/.test(ics), ics.slice(0,200));
  ok("and the hotels", /SUMMARY:Check in . The Orchid/.test(ics));
  ok("times float, with no zone", /DTSTART:\d{8}T\d{6}\r\n/.test(ics) && !/DTSTART:\d{8}T\d{6}Z/.test(ics));
  ok("commas are escaped", !/SUMMARY:[^\r\n]*[^\\],/.test(ics));
  const n = (ics.match(/BEGIN:VEVENT/g)||[]).length;
  ok("a sensible number of events", n >= 8 && n < 40, "n="+n);
  ok("nothing vague got in", !/SUMMARY:A tea house/.test(ics));
  await p.keyboard.press('Escape');

  // print
  const pr = await p.evaluate(()=>itineraryHTML(trip()));
  ok("the printout has a map per planned day", (pr.match(/pmapsvg/g)||[]).length >= 5);
  ok("and coordinates", /class="pgeo">39\./.test(pr));
  ok("and a costed line", /Costed so far/.test(pr));
  ok("and time estimates", /about \dh/.test(pr));


  // ---- find anything on the board ----
  await p.fill('#boardq', 'wall');
  await p.waitForTimeout(300);
  ok("search finds what is on the board", await p.locator('.findhit').count() >= 1);
  const where = await p.locator('.findhit .fw').first().innerText();
  ok("and says where it is", /Day \d/.test(where), where);
  await p.locator('.findhit').first().click();
  await p.waitForTimeout(500);
  ok("clicking it flashes the thing itself", await p.locator('.magnet.flash').count() >= 1);
  await p.fill('#boardq', 'zzzznothing');
  await p.waitForTimeout(200);
  ok("and says so when there is nothing", await p.locator('.findnone').count()===1);
  await p.fill('#boardq', '');

  // ---- today, on a trip that is running ----
  await p.evaluate(()=>{
    const t = trip();
    const today = todayStr();
    const days = tripDays(t);
    const shift = daysBetween(days[0], today) - 2;      // land today on day 3
    const move = d => addDays(d, shift);
    t.magnets.forEach(m=>{ if(m.day) m.day = move(m.day); });
    ["dayNotes","dayImages","stickies","dayPin","dayLock","dayFold","dayCity"].forEach(k=>{
      const o = t[k] || {}; const n = {};
      Object.keys(o).forEach(d=>{ n[move(d)] = o[d]; });
      t[k] = n;
    });
    t.stays.forEach(st=>{ st.from = move(st.from); st.to = move(st.to); });
    t.arr.date = move(t.arr.date); t.dep.date = move(t.dep.date);
    save(); render();
  });
  await p.waitForTimeout(500);
  eq("a running trip shows Today at the top", await p.locator('.todaybar').count(), 1);
  const td = await p.locator('.todaybar').innerText();
  ok("it says which day of the trip this is", /Day 3 of 8/.test(td), td.split("\n").slice(0,3).join(" | "));
  ok("it lists what is on today", await p.locator('.tdlist li').count() >= 2);
  ok("it says where you sleep tonight", /Tonight/i.test(td));
  ok("and what the next leg is", /Next leg/i.test(td));
  await p.locator('.tdlist li').first().click();
  await p.waitForTimeout(400);
  ok("tapping something in Today jumps to it", await p.locator('.magnet.flash').count() >= 1);
  eq("today's card is marked on the board", await p.locator('.day.today').count(), 1);

  ok("no page errors", errs.length===0, errs.slice(0,3).join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
