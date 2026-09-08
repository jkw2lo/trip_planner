/* Trip Board — folding, finalising and moving things between days.
   A DOM shim thin enough to load the whole board in Node and poke at its logic.
   No dependencies:  node tests/day-moves.test.js  */
const fs = require("fs"), vm = require("vm"), path = require("path");
const HTML = fs.readFileSync(path.join(__dirname, "..", "Trip Board.html"), "utf8");
const src = HTML.slice(HTML.indexOf("<script>") + 8, HTML.lastIndexOf("</script>"));

function mkEl(tag){
  const el = {
    tagName:(tag||"div").toUpperCase(), _html:"", children:[], attrs:{}, style:{}, dataset:{},
    classList:{_s:new Set(), add(){}, remove(){}, contains(){return false;}},
    get innerHTML(){ return this._html; }, set innerHTML(v){ this._html = String(v); },
    get outerHTML(){ return this._html; }, set outerHTML(v){ this._html = String(v); },
    addEventListener(){}, removeEventListener(){}, appendChild(c){ this.children.push(c); return c; },
    removeChild(c){ this.children = this.children.filter(x=>x!==c); return c; },
    remove(){}, setAttribute(k,v){ this.attrs[k]=v; }, getAttribute(k){ return k in this.attrs ? this.attrs[k] : null; },
    querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    contains(){ return false; }, focus(){}, click(){}, getBoundingClientRect(){ return {top:0,bottom:0,left:0,right:0,width:0,height:0}; },
    isConnected:true, parentNode:null, value:"", checked:false, open:false, disabled:false
  };
  return el;
}
const store = {};
const win = {};
const doc = {
  body: mkEl("body"),
  _els: {},
  getElementById(id){ return this._els[id] || (this._els[id] = mkEl("div")); },
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  createElement(t){ return mkEl(t); }, addEventListener(){}, removeEventListener(){},
  documentElement: mkEl("html")
};
const ctx = {
  window: win, document: doc, navigator:{userAgent:"node", clipboard:{writeText(){ return Promise.resolve(); }}},
  localStorage:{ getItem(k){ return k in store ? store[k] : null; }, setItem(k,v){ store[k]=String(v); },
                 removeItem(k){ delete store[k]; } },
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame(fn){ return 0; }, cancelAnimationFrame(){},
  fetch(){ return Promise.reject(new Error("offline in the harness")); },
  Image: function(){ return {}; }, FileReader: function(){ return {}; },
  Math, Date, JSON, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
  Promise, Set, Map, Array, Object, String, Number, Boolean, RegExp, Error
};
ctx.globalThis = ctx;
win.addEventListener = ()=>{}; win.removeEventListener = ()=>{};
win.scrollY = 0; win.innerHeight = 900; win.scrollTo = ()=>{}; win.scrollBy = ()=>{};
win.indexedDB = null; win.showSaveFilePicker = undefined; win.location = {replace(){}};
vm.createContext(ctx);

const EXPORTS = `;globalThis.__T = {DB, view, normalize, moveMagnet, orderBetween, magnetsIn,
  dayLocked, dayFolded, toggleDayFold, toggleDayLock, foldDays, daySummary,
  calendarHTML, dayCardHTML, magnetHTML, moveDay, swapDays, tripDays, dateRange,
  RAIL_TARGETS, uid, computeDayCities, save, render, newTripObject,
  get lastMove(){ return lastMove; }, set lastMove(v){ lastMove = v; },
  toasts: []};`;
vm.runInContext(src + EXPORTS, ctx, {filename:"tripboard.js"});
const T = ctx.__T;

/* capture toasts instead of letting them build DOM we do not have */
let TOASTS = [];
vm.runInContext(`toast = function(m){ globalThis.__toasts.push(String(m)); };
  toastUndo = function(m){ globalThis.__toasts.push(String(m)); };
  render = function(){};`, ctx);
ctx.__toasts = TOASTS;

let pass = 0, fail = 0;
function ok(name, cond, extra){
  if(cond){ pass++; }
  else { fail++; console.log("  FAIL " + name + (extra ? "  <" + extra + ">" : "")); }
}
function eq(name, a, b){ ok(name, a === b, JSON.stringify(a) + " !== " + JSON.stringify(b)); }
function has(name, hay, needle){ ok(name, String(hay).indexOf(needle) >= 0, "missing: " + needle); }
function hasnt(name, hay, needle){ ok(name, String(hay).indexOf(needle) < 0, "unexpected: " + needle); }

/* ---------- a ten day trip, which is the case that started all this ---------- */
function makeTrip(){
  const t = T.newTripObject({
    name:"Ten days", arr:{date:"2026-11-20", time:"09:00", code:"PEK", flightNo:""},
    dep:{date:"2026-11-29", time:"18:00", code:"PEK", flightNo:""},
    cities:[{id:"c1", name:"Beijing", lat:39.9, lon:116.4, code:"PEK"},
            {id:"c2", name:"Tianjin", lat:39.1, lon:117.2, code:"TSN"}],
    interests:[], custom:{}, pace:"balanced"
  });
  T.normalize(t);
  ctx.__T.DB.trips.length = 0;
  ctx.__T.DB.trips.push(t);
  T.view.name = "trip"; T.view.tripId = t.id; T.view.tab = "cal";
  return t;
}
let ORDER = 1000;
function addMag(t, day, slot, label, extra){
  const m = Object.assign({id:T.uid(), kind:"see", board:"cal", day, slot, label, note:"",
                           locked:false, order:(ORDER += 1000)}, extra||{});
  t.magnets.push(m);
  return m;
}
const D = i => T.tripDays(makeTripOnce())[i];
let _t = null;
function makeTripOnce(){ return _t || (_t = makeTrip()); }

console.log("Trip Board — day folding, day locks and the drag rail\n");

/* 1. the shape of a trip */
{
  const t = makeTrip();
  ok("normalize gives a trip a dayLock map", t.dayLock && typeof t.dayLock === "object");
  ok("normalize gives a trip a dayFold map", t.dayFold && typeof t.dayFold === "object");
  const legacy = {id:"x", arr:{date:"2026-01-01"}, dep:{date:"2026-01-03"}};
  T.normalize(legacy);
  ok("a trip saved before all this still loads", !!legacy.dayLock && !!legacy.dayFold);
  eq("ten days is ten days", T.tripDays(t).length, 10);
}

/* 2. folding */
{
  const t = makeTrip(), days = T.tripDays(t);
  ok("nothing is folded to begin with", !T.dayFolded(t, days[0]));
  T.toggleDayFold(t, days[0]);
  ok("folding a day folds it", T.dayFolded(t, days[0]));
  T.toggleDayFold(t, days[0]);
  ok("folding it again opens it", !T.dayFolded(t, days[0]));
  T.foldDays(t, "all");
  eq("fold all folds every day", days.filter(d=>T.dayFolded(t,d)).length, 10);
  T.foldDays(t, "none");
  eq("open all opens every day", days.filter(d=>T.dayFolded(t,d)).length, 0);
  t.dayLock[days[3]] = true; t.dayLock[days[4]] = true;
  T.foldDays(t, "locked");
  eq("fold the finalised folds only those", days.filter(d=>T.dayFolded(t,d)).length, 2);
  ok("and folds the right ones", T.dayFolded(t, days[3]) && T.dayFolded(t, days[4]));
}

/* 3. locking */
{
  const t = makeTrip(), days = T.tripDays(t);
  ok("no day starts finalised", !T.dayLocked(t, days[2]));
  T.toggleDayLock(t, days[2]);
  ok("locking a day finalises it", T.dayLocked(t, days[2]));
  T.toggleDayLock(t, days[2]);
  ok("and unlocking releases it", !T.dayLocked(t, days[2]));
}

/* 4. moving between days — the thing the whole change is for */
{
  const t = makeTrip(), days = T.tripDays(t);
  const m = addMag(t, days[9], "evening", "Peking duck", {kind:"eat"});
  T.moveMagnet(t, m.id, "cal:" + days[0] + ":same", null);
  eq("last day to first day lands on the first day", m.day, days[0]);
  eq("and keeps the slot it had", m.slot, "evening");
  eq("undo remembers where it came from", T.lastMove.prev.day, days[9]);

  const m2 = addMag(t, days[8], "morning", "Great Wall");
  T.moveMagnet(t, m2.id, "cal:" + days[1] + ":afternoon", null);
  eq("an explicit slot still wins", m2.slot, "afternoon");
  eq("on the day you asked for", m2.day, days[1]);

  const m3 = {id:T.uid(), kind:"see", board:"tray", label:"A museum", note:"", locked:false, order:1};
  t.magnets.push(m3);
  T.moveMagnet(t, m3.id, "cal:" + days[2] + ":same", null);
  eq("something with no slot yet lands in the morning", m3.slot, "morning");
  eq("on the right day", m3.day, days[2]);

  const m4 = {id:T.uid(), kind:"see", board:"tray", label:"Sunset bar", note:"", locked:false,
              order:1, time:"19:00"};
  t.magnets.push(m4);
  T.moveMagnet(t, m4.id, "cal:" + days[3] + ":same", null);
  eq("a time on it picks the slot that time belongs to", m4.slot, "evening");
}

/* 5. a finalised day refuses in both directions */
{
  const t = makeTrip(), days = T.tripDays(t);
  const inside = addMag(t, days[5], "morning", "Booked tour");
  const outside = addMag(t, days[1], "morning", "Loose idea");
  T.toggleDayLock(t, days[5]);
  ctx.__toasts.length = 0;
  T.lastMove = null;
  T.moveMagnet(t, outside.id, "cal:" + days[5] + ":same", null);
  eq("nothing lands on a finalised day", outside.day, days[1]);
  ok("and it says why", ctx.__toasts.some(x=>/finalised/.test(x)));
  ok("a refused move leaves nothing to undo", T.lastMove === null);
  T.moveMagnet(t, inside.id, "cal:" + days[1] + ":same", null);
  eq("nothing leaves a finalised day either", inside.day, days[5]);
  T.toggleDayLock(t, days[5]);
  T.moveMagnet(t, inside.id, "cal:" + days[1] + ":same", null);
  eq("unlock it and it moves", inside.day, days[1]);
}

/* 6. undoing a move */
{
  const t = makeTrip(), days = T.tripDays(t);
  const m = addMag(t, days[7], "afternoon", "Tea house");
  const before = {day:m.day, slot:m.slot, order:m.order};
  T.moveMagnet(t, m.id, "cal:" + days[0] + ":same", null);
  const lm = T.lastMove;
  m.board = lm.prev.board; m.day = lm.prev.day; m.slot = lm.prev.slot;
  m.col = lm.prev.col; m.order = lm.prev.order;
  eq("undo puts the day back", m.day, before.day);
  eq("undo puts the slot back", m.slot, before.slot);
  eq("undo puts the order back", m.order, before.order);
}

/* 7. swapping whole days */
{
  const t = makeTrip(), days = T.tripDays(t);
  addMag(t, days[4], "morning", "A");
  T.toggleDayLock(t, days[5]);
  ctx.__toasts.length = 0;
  T.moveDay(days[4], 1);
  eq("a day will not swap into a finalised one", t.magnets.find(m=>m.label==="A").day, days[4]);
  ok("and says which", ctx.__toasts.some(x=>/finalised/.test(x)));
  T.moveDay(days[4], -1);
  eq("but swaps freely with an ordinary one", t.magnets.find(m=>m.label==="A").day, days[3]);
}

/* 8. what a folded day says about itself */
{
  const t = makeTrip(), days = T.tripDays(t);
  addMag(t, days[2], "morning", "Forbidden City");
  addMag(t, days[2], "lunch", "Noodles", {kind:"eat"});
  addMag(t, days[2], "transit", "Metro line 1", {kind:"move"});
  t.dayNotes[days[2]] = "bring the passport";
  const s = T.daySummary(t, days[2]);
  eq("activities are counted apart from meals", s.acts.length, 1);
  eq("meals are their own thing", s.meals.length, 1);
  eq("so are transfers", s.trans.length, 1);
  ok("and a day note is noticed", s.notes);
}

/* 9. what the calendar actually renders */
{
  const t = makeTrip(), days = T.tripDays(t);
  addMag(t, days[2], "morning", "Forbidden City");
  let html = T.calendarHTML(t, days);
  has("every open day offers its morning as a drop target", html, 'data-drop="cal:' + days[2] + ':morning"');
  has("there is a fold control on each day", html, 'data-act="dayfold" data-day="' + days[2] + '"');
  has("and a lock control", html, 'data-act="daylock" data-day="' + days[2] + '"');
  has("with the day tools above the list", html, 'data-act="foldall" data-mode="all"');

  T.toggleDayFold(t, days[2]);
  html = T.calendarHTML(t, days);
  has("a folded day summarises itself", html, "Forbidden City<");
  has("and its chips can be dragged off it", html,
      'data-mag="' + t.magnets.find(m=>m.label==="Forbidden City").id + '"');
  has("a folded day is a drop target as a whole", html, 'data-drop="cal:' + days[2] + ':same"');
  hasnt("and nothing inside it that could change size mid-drag", html,
        'data-drop="cal:' + days[2] + ':evening"');
  hasnt("but is not rendering its full body", html, 'data-act="pickmeal" data-day="' + days[2] + '"');

  T.toggleDayLock(t, days[2]);
  html = T.calendarHTML(t, days);
  has("a finalised day is labelled", html, "finalised");
  hasnt("and offers no drop target at all", html, 'data-drop="cal:' + days[2]);
  T.toggleDayFold(t, days[2]);
  html = T.calendarHTML(t, days);
  hasnt("open and finalised: still no drop targets", html, 'data-drop="cal:' + days[2]);
  hasnt("no meal picker on a finalised day", html, 'data-act="pickmeal" data-day="' + days[2] + '"');
  hasnt("no transport button either", html, 'data-act="addtransport" data-day="' + days[2] + '"');
  hasnt("and no sticky note button", html, 'data-act="addsticky" data-day="' + days[2] + '"');
  has("the city is shown but not editable", html, 'title="Unlock the day to change the city"');
  hasnt("so no city select on that day", html, 'data-act="setcity" data-day="' + days[2] + '"');
  has("other days are untouched", html, 'data-drop="cal:' + days[4] + ':morning"');
}

/* 10. magnets on a finalised day */
{
  const t = makeTrip(), days = T.tripDays(t);
  const m = addMag(t, days[2], "morning", "Forbidden City");
  const loose = T.magnetHTML(m, {});
  has("an ordinary magnet is draggable", loose, 'draggable="true"');
  has("and can be thrown away", loose, 'data-act="delmag"');
  const frozen = T.magnetHTML(m, {frozen:true});
  has("a frozen one is not draggable", frozen, 'draggable="false"');
  hasnt("has no delete button", frozen, 'data-act="delmag"');
  hasnt("and no pin button", frozen, 'data-act="lock"');
  has("but is marked as frozen", frozen, "frozen");
}

/* 11. the rail's targets */
{
  eq("the rail offers six places on a day", T.RAIL_TARGETS.length, 6);
  eq("the last one is the transit lane", T.RAIL_TARGETS[5].t, "transit:{d}");
  ok("and the first three are the day parts",
     T.RAIL_TARGETS.slice(0,3).map(x=>x.label).join(",") === "Morning,Afternoon,Evening");
}

/* 12. regressions — the ordinary paths still work */
{
  const t = makeTrip(), days = T.tripDays(t);
  const a = addMag(t, days[1], "morning", "First");
  const b = addMag(t, days[1], "morning", "Second");
  const c = {id:T.uid(), kind:"see", board:"tray", label:"Third", note:"", locked:false, order:1};
  t.magnets.push(c);
  T.moveMagnet(t, c.id, "cal:" + days[1] + ":morning", b.id);
  const order = T.magnetsIn(t, m=>m.board==="cal"&&m.day===days[1]&&m.slot==="morning").map(m=>m.label);
  eq("dropping above something puts it above", order.join(","), "First,Third,Second");
  const fly = t.magnets.find(m=>m.kind==="fly");
  ok("flights are still pinned", fly.locked === true);
  T.moveMagnet(t, fly.id, "cal:" + days[4] + ":morning", null);
  eq("and refuse to be dragged off their date", fly.day, days[0]);
  T.moveMagnet(t, a.id, "tray", null);
  eq("anything can go back to the tray", a.board, "tray");
  eq("and forgets its day", a.day, null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
