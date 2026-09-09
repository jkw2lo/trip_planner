/* Trip Board — dragging with a finger. Real touch events, dispatched through CDP, in a
   context that reports touch support — a swipe must scroll, a hold must pick up, a
   tap must still open the editor.
   Needs Playwright (npm i -D playwright):  node tests/touch.test.js  */
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
  const ctx=await b.newContext({viewport:{width:900,height:760}, hasTouch:true});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**://tile.openstreetmap.org/**', r=>r.fulfill({status:200,contentType:'image/png',body:TILE}));
  await p.goto(BOARD);
  await p.waitForSelector('.trip-grid');
  await p.click('[data-act="demo"]');
  await p.waitForSelector('.cal .day');
  await p.waitForTimeout(1200);

  const cdp = await ctx.newCDPSession(p);
  const pt = (x,y)=>({x, y, radiusX:12, radiusY:12, force:1, id:1});
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent',
    {type, touchPoints: type === 'touchEnd' ? [] : [pt(x,y)]});

  // find something to drag: an activity on day 2
  const mag = p.locator('.magnet[data-mag]').filter({hasText:'Jingshan Park'}).first();
  await mag.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  let box = await mag.boundingBox();

  // 1. a swipe is a scroll, not a drag. Only meaningful if the harness can dispatch
  //    the swipe faster than the hold it is meant to beat.
  const y0 = await p.evaluate(()=>window.scrollY);
  const t0 = Date.now();
  await touch('touchStart', box.x+40, box.y+10);
  for(let i=1;i<=6;i++) await touch('touchMove', box.x+40, box.y+10-i*22);
  const swift = Date.now() - t0 < 240;
  const picked = await p.locator('#dayrail').count();
  await touch('touchEnd');
  await p.waitForTimeout(300);
  const y1 = await p.evaluate(()=>window.scrollY);
  if(swift){
    eq("a swipe does not pick anything up", picked, 0);
    ok("it scrolls the page instead", y1 > y0, "scrolled to " + y1);
  }else{
    console.log("  (skipped the swipe check — this machine took " + (Date.now()-t0) + "ms to send it)");
  }

  // 2. press and hold picks it up. Put the piece back where it started first: on a
  //    slow machine the swipe above can turn into a real drag, and phase 2 should
  //    not inherit that.
  const before = await p.evaluate(()=>{
    const t = trip(), m = t.magnets.find(x=>x.label==="Jingshan Park");
    m.board = "cal"; m.day = tripDays(t)[1]; m.slot = "afternoon"; m.col = null;
    save(); render();
    return m.day;
  });
  await p.waitForTimeout(400);
  await mag.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  box = await mag.boundingBox();
  await touch('touchStart', box.x+40, box.y+10);
  await p.waitForTimeout(420);
  ok("holding still picks it up", await p.locator('.magnet.ghost').count()===1);
  eq("and the rail comes up with it", await p.locator('#dayrail').count(), 1);
  eq("the original is shown as lifted", await p.locator('.magnet.dragging').count(), 1);

  // 3. drag it onto another day in the rail
  const row = await p.locator('#dayrail .railrow[data-drop]').first().boundingBox();
  const target = await p.locator('#dayrail .railrow[data-drop]').first().getAttribute('data-day');
  for(let i=1;i<=8;i++){
    await touch('touchMove', box.x+40 + (row.x+row.width/2-box.x-40)*i/8,
                             box.y+10 + (row.y+row.height/2-box.y-10)*i/8);
    await p.waitForTimeout(20);
  }
  await p.waitForTimeout(120);
  ok("the row under the finger lights up", await p.locator('#dayrail .railrow.drop-on').count()===1);
  await touch('touchEnd');
  await p.waitForTimeout(350);
  const after = await p.evaluate(()=>trip().magnets.find(m=>m.label==="Jingshan Park").day);
  eq("letting go moves it to that day", after, target);
  ok("and it did move", after !== before, before + " -> " + after);
  eq("the ghost is gone", await p.locator('.magnet.ghost').count(), 0);
  eq("the rail is gone", await p.locator('#dayrail').count(), 0);
  eq("the editor did not open behind it", await p.locator('#e-label').count(), 0);
  ok("with an undo offered", await p.locator('#toasts .toast .undo').count() >= 1);

  // 4. a hold with no move, released in place, is still not a click into the editor
  const m2 = p.locator('.magnet[data-mag]').filter({hasText:'Tiananmen Square'}).first();
  await m2.scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
  const b2 = await m2.boundingBox();
  await touch('touchStart', b2.x+40, b2.y+10);
  await p.waitForTimeout(420);
  await touch('touchMove', b2.x+44, b2.y+12);
  await touch('touchEnd');
  await p.waitForTimeout(400);
  eq("a hold and release opens nothing", await p.locator('#e-label').count(), 0);

  // 5. a plain tap still opens the editor
  await m2.scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
  const b3 = await m2.boundingBox();
  await touch('touchStart', b3.x+40, b3.y+10);
  await p.waitForTimeout(60);
  await touch('touchEnd');
  await p.waitForTimeout(400);
  eq("a tap still opens the editor", await p.locator('#e-label').count(), 1);
  await p.keyboard.press('Escape');

  ok("no page errors", errs.length===0, errs.slice(0,2).join(" | "));
  console.log("\n"+pass+" passed, "+fail+" failed");
  await b.close(); process.exit(fail?1:0);
})();
