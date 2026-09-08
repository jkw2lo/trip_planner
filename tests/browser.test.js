/* Trip Board — the same ground as day-moves.test.js, but in a real browser:
   rendering, the fold and lock controls, and the drag rail end to end.
   Needs Playwright (npm i -D playwright):  node tests/browser.test.js  */
const { chromium } = require('playwright');
const path = require('path');
const BOARD = 'file://' + path.join(__dirname, '..', 'Trip Board.html');

const SEED = {
  trips: [{
    id: "t1", name: "Ten days", createdAt: Date.now(),
    arr: {date:"2026-11-20", time:"09:00", code:"PEK", flightNo:""},
    dep: {date:"2026-11-29", time:"18:00", code:"PEK", flightNo:""},
    cities: [{id:"c1", name:"Beijing", lat:39.9042, lon:116.4074, code:"PEK"}],
    interests: [], custom: {}, pace: "balanced",
    dayCity: {}, dayNotes: {}, dayImages: {}, stickies: {}, dayPin: {}, stays: [],
    magnets: [
      {id:"m1", kind:"see", board:"cal", day:"2026-11-29", slot:"evening", label:"Duck dinner", note:"", locked:false, order:100},
      {id:"m2", kind:"see", board:"cal", day:"2026-11-24", slot:"morning", label:"Great Wall", note:"", locked:false, order:200},
      {id:"m3", kind:"see", board:"tray", label:"Hutong walk", note:"", locked:false, order:300}
    ],
    wx: {seasonal:{}, live:{}, liveAt:null}, decks: {}, verdicts: {}, tray: {dismissed:[]}
  }]
};

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? pass++ : (fail++, console.log("  FAIL " + n + (x ? "  <" + x + ">" : "")));
const eq = (n, a, b) => ok(n, a === b, JSON.stringify(a) + " !== " + JSON.stringify(b));

(async () => {
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: {width: 1440, height: 900} });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  // the sandbox has no network, so weather and font fetches fail here and that is fine
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text()))
    errors.push("console: " + m.text()); });

  await page.addInitScript(seed => {
    localStorage.setItem("tripBoard.v1", JSON.stringify(seed));
  }, SEED);
  await page.goto(BOARD);
  await page.click('.trip-card');
  await page.waitForSelector('.cal .day');

  eq("ten day cards render", await page.locator('.cal > .day').count(), 10);
  ok("no page errors on load", errors.length === 0, errors.join(" | "));

  // ---- fold ----
  const day10 = '2026-11-29';
  await page.click(`.dayfold[data-day="${day10}"]`);
  await page.waitForSelector(`.day.folded`);
  eq("folding gives one folded card", await page.locator('.day.folded').count(), 1);
  ok("the folded card summarises the day",
     (await page.locator('.day.folded .dsum').innerText()).includes("Duck dinner"));
  eq("a folded day takes a drop as a whole",
     await page.locator(`.day.folded[data-drop="cal:${day10}:same"]`).count(), 1);
  await page.click('[data-act="foldall"][data-mode="all"]');
  eq("fold all folds them all", await page.locator('.day.folded').count(), 10);
  await page.click('[data-act="foldall"][data-mode="none"]');
  eq("open all opens them all", await page.locator('.day.folded').count(), 0);

  // ---- lock ----
  const day5 = '2026-11-24';
  await page.click(`.lockbtn[data-day="${day5}"]`);
  await page.waitForSelector('.day.locked');
  eq("locking marks one day finalised", await page.locator('.day.locked').count(), 1);
  eq("its magnets stop being draggable",
     await page.locator(`.day.locked .magnet[draggable="false"]`).count(), 1);
  eq("and it has no drop zones", await page.locator('.day.locked [data-drop]').count(), 0);
  await page.click(`.lockbtn[data-day="${day5}"]`);
  eq("unlocking gives them back", await page.locator('.day.locked').count(), 0);

  // ---- the rail, driven by real drag events ----
  const fire = async (sel, type, opts) => page.evaluate(([sel, type, opts]) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error("no element for " + sel);
    const ev = new DragEvent(type, Object.assign({bubbles: true, cancelable: true}, opts || {}));
    Object.defineProperty(ev, 'dataTransfer', {
      value: window.__dt || (window.__dt = new DataTransfer())
    });
    el.dispatchEvent(ev);
  }, [sel, type, opts]);

  await fire('.magnet[data-mag="m1"]', 'dragstart');
  await page.waitForSelector('#dayrail.on', {timeout: 2000});
  const place = await page.evaluate(() => {
    const r = document.querySelector('#dayrail').getBoundingClientRect();
    const d = document.querySelector('.magnet[data-mag="m1"]').closest('.day').getBoundingClientRect();
    return {gap: Math.round(r.left - d.right), onScreen: r.top >= 0 && r.bottom <= innerHeight};
  });
  ok("the rail opens in the gutter beside the day, not at the window edge",
     place.gap >= 0 && place.gap < 40, "gap=" + place.gap);
  ok("and fits on screen", place.onScreen);
  eq("the rail lists every day", await page.locator('#dayrail .railscroll .railrow').count(), 10);
  eq("the day it is already on is not a target",
     await page.locator('#dayrail .railrow.here').count(), 1);
  eq("nine days are droppable", await page.locator('#dayrail .railscroll .railrow[data-drop]').count(), 9);
  ok("plus a way back to the magnets", await page.locator('#dayrail .railtray').count() === 1);
  eq("the board knows a drag is running", await page.locator('body.dragging').count(), 1);

  // force a re-render while the drag is live — this used to double-wire the rail
  await page.evaluate(() => render());
  await page.waitForTimeout(50);
  eq("the rail survives a re-render mid-drag", await page.locator('#dayrail').count(), 1);
  const row1 = '#dayrail .railrow[data-day="2026-11-20"]';
  await fire(row1, 'dragover', {clientX: 1380, clientY: 300});
  await page.waitForTimeout(400);
  eq("the fan-out is not clipped by the scrolling list",
     await page.locator('#dayrail .railslots').isVisible(), true);
  eq("hovering a row for a beat fans out its slots",
     await page.locator('#dayrail .railslots .railslot').count(), 6);
  const align = await page.evaluate(() => {
    const r = document.querySelector('#dayrail .railrow[data-day="2026-11-20"]').getBoundingClientRect();
    const b = document.querySelector('#dayrail .railslots').getBoundingClientRect();
    return {dy: Math.round(b.top - r.top), gap: Math.round(r.left - b.right)};
  });
  ok("the fan-out lines up with its row", Math.abs(align.dy) <= 8, "dy=" + align.dy);
  ok("and touches it, so the pointer never leaves the rail", align.gap <= 0, "gap=" + align.gap);
  await fire(row1, 'drop');
  await page.waitForTimeout(200);

  const m1 = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0].magnets.find(m => m.id === "m1"));
  eq("dropping on the rail moves it to that day", m1.day, "2026-11-20");
  eq("and keeps the slot it had", m1.slot, "evening");
  eq("the rail goes away afterwards", await page.locator('#dayrail').count(), 0);
  // other toasts can pile up behind this one, so find the one carrying the undo
  const undoToast = page.locator('.toast').filter({has: page.locator('.undo')}).last();
  ok("with an undo offered", (await undoToast.textContent()).includes("Moved to Nov 20"));
  await undoToast.locator('.undo').click();
  const m1b = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0].magnets.find(m => m.id === "m1"));
  eq("and undo puts it back", m1b.day, "2026-11-29");

  // ---- rail refuses a finalised day ----
  await page.click(`.lockbtn[data-day="2026-11-20"]`);
  await fire('.magnet[data-mag="m2"]', 'dragstart');
  await page.waitForSelector('#dayrail.on');
  eq("a finalised day is greyed out in the rail",
     await page.locator('#dayrail .railrow.locked').count(), 1);
  eq("and is not droppable",
     await page.locator('#dayrail .railrow[data-day="2026-11-20"][data-drop]').count(), 0);
  await fire('.magnet[data-mag="m2"]', 'dragend');
  await page.waitForTimeout(100);
  eq("dragend takes the rail away", await page.locator('#dayrail').count(), 0);

  // ---- a tray stamp opens the rail too ----
  await fire('.magnet[data-mag="m3"]', 'dragstart');
  await page.waitForSelector('#dayrail.on');
  ok("dragging from the magnets column shows the rail too", true);
  await fire('#dayrail .railrow[data-day="2026-11-23"]', 'drop');
  await page.waitForTimeout(300);
  const m3 = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0].magnets.find(m => m.id === "m3"));
  eq("a magnet dropped from the tray lands on the day", m3.day, "2026-11-23");
  eq("in the morning by default", m3.slot, "morning");

  // ---- editor fallback ----
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.click('.magnet[data-mag="m2"] .body');
  await page.waitForSelector('#e-day');
  ok("the editor offers a day picker", await page.locator('#e-day').count() === 1);
  ok("a finalised day is disabled in it",
     await page.locator('#e-day option[disabled]').count() >= 1);
  await page.selectOption('#e-day', '2026-11-26');
  await page.waitForTimeout(120);
  await page.selectOption('#e-slot', 'evening');
  await page.waitForTimeout(120);
  await page.click('[data-act="e-save"]');
  await page.waitForTimeout(200);
  const m2 = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tripBoard.v1")).trips[0].magnets.find(m => m.id === "m2"));
  eq("picking a day in the editor moves it", m2.day, "2026-11-26");
  eq("with the slot you picked", m2.slot, "evening");

  ok("still no page errors", errors.length === 0, errors.slice(0,3).join(" | "));

  console.log("\n" + pass + " passed, " + fail + " failed");
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
