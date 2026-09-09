# Trip Board

A trip planner built to replace the spreadsheet — the one where you type a date in
column A and a guess in column B, then retype the whole thing when the days move.

Everything here is drag-and-drop instead of typing — with a mouse or with a finger —
and everything you drop can be **pinned** once it's certain. One file, no install, no
account, no server.

---

## Getting started

Double-click **`Trip Board.html`**. It opens in your browser and that's the whole app.

**Or open the shared link.** The board is also published as a Claude artifact, which
is the same file running in someone else's browser — handy for showing it to a travel
companion. Three things do not survive that trip: map tiles and the weather (the page
is not allowed to fetch them), and saving files (Export hands you the text to copy
instead). Trips there are kept in that browser only. The file on your own computer is
the full-strength version.

**Start with the sample.** The front page offers a finished trip — eight days across
Beijing, Suzhou and Shanghai, with hotels, a settled day, a waiting list, notes and
half a deck swiped. Almost nothing here explains itself on an empty board, and all of
it explains itself on a full one. It is a real trip, not a screenshot: drag things
about, break it, delete it when you are done. It is rebuilt from today's date each
time, so it is never a trip that already happened.

Your trips save automatically to that browser's storage. That's a real place and it
persists, but it's tied to one browser on one computer — so the first thing worth
doing is **linking a file**:

> Click the **Saved in this browser** chip at the top → **Link a file** → pick where
> to keep `trips.json`.

From then on every change writes straight to that file. Put it in Dropbox or iCloud
and your trips follow you. The browser copy stays as a mirror, so nothing is lost if
you decline or the file goes missing.

Chrome, Edge and Arc support file linking. Safari and Firefox don't — there the
browser copy is the only copy, so use **Export** before anything drastic.

---

## The idea

A trip has three states and the app keeps them visibly separate:

- **Ideas** — things you might do. They live in the deck and the waiting list.
- **Pencilled in** — placed on a day, but not settled. Marked *optional*.
- **Pinned** — decided. 📌 locks it so a drag can't knock it loose.

Nothing forces you up that ladder. A trip that's 80% ideas two weeks out is a normal
trip, and the board is designed to be readable in that state.

---

## The tabs

### Calendar

The main view. Three columns: the days, your magnets, and Discover.

**Trip overview** — a grid of days across, cities down. Click a cell to say "I'm in
Shanghai that day", drag across several to do a stretch. Every day after follows
along until the next change, so you only mark the days you actually move.

**Hotels** — sits directly under the overview and lines up with it column for column,
so you can read the two together: right city, right dates, right hotel.

It works in **nights**, not days. Check in on the 12th and out on the 15th and you've
covered the nights of the 12th, 13th and 14th — the departure column stays blank,
because you don't need a bed that morning. One city across two hotels is the normal
case and reads correctly.

- **Pencilled in** (striped) vs **Booked** (solid). An option never counts as
  coverage, so a gap stays visible until you actually commit.
- Gaps are named in plain words: *"No booking yet for Sep 4–Sep 5."*
- Click a hotel's name to **expand it in place** — status, area, nights, both times,
  notes, screenshots — without opening the editor. Edit is a button inside.
- The **↗** on each row opens the booking directly. Check-in/out times show on the row.
- **Drag across the strip** to change which nights a hotel covers.
- **+ add a hotel** starts at the first uncovered night and runs to the end of that
  open run, so filling a visible hole is usually one click and a name.

**Each day** has a plan on the right and a pad on the left.

The plan is morning / afternoon / evening, plus lunch and dinner, a map of that day's
stops, and a Getting around strip for trains and transfers. The **↑ ↓** in the day
header swap that whole day with its neighbour — activities, meals, notes, stickies,
images and the city pin all travel together. Flights stay on their real dates.

The pad is for what *isn't* decided: sticky notes, and one of the day's three images
shown large. Click the image to zoom, pan and draw on it — circle a neighbourhood on
a map screenshot, arrow the entrance you actually want.

**Optimise order** on any day reorders the stops to cut the walking. Meals stay put;
the morning, afternoon and evening blocks move around them, and only into slots each
thing is actually suited to. A full-day trip to the Great Wall won't get slotted into
an evening.

**Folding a day** — the caret at the left of any day header collapses it to a single
line: what's on it, in order, plus a word about the notes and images underneath. Ten
days is a lot of screen and you are usually working on one of them. **Fold all**,
**Open all** and **Fold the finalised** sit above the list. A folded day still works:
drop something on it and it lands there, and the chips on it can be dragged straight
off onto another day. Folding never costs you a drop.

**Finalising a day** — the padlock in the day header means *plans are settled*. The
whole day freezes: activities, meals, transport, the day note, the sticky notes and
the city. Nothing can be dragged in or out, the ↑ ↓ swap and Optimise order refuse it,
and it greys out everywhere else. One click gives it all back. It is the difference
between a day you have not filled in and a day you have finished with — the board
could not tell them apart before.

**Moving something to a day that's off-screen** — pick anything up and a list of every
day appears in the gutter beside the day you took it from, with that day's own row
under your cursor: the day before and the day after are a few pixels away, and the far
end of the trip is a short slide rather than a scroll. Drop it on a day and it lands
there in the slot it already had, so an evening thing stays an evening thing. Hover a
day for a beat and its slots fan out if you want a different one; there's a row at the
bottom for putting it back in your magnets. It only exists while you are dragging, it
never covers the day card you might be rearranging, and the board scrolls on its own if
you drag near the top or bottom edge. Every move offers an **Undo**.

Not a dragger? The magnet editor has a **Which day** picker that does the same thing.

**Maps** — every map on the board has two modes, and the button in the *Map & order*
strip switches all of them at once:

- **Street map** (the default) — real tiles from OpenStreetMap under your stops, so you
  can see the park, the river, and the six lanes of traffic between two things you put
  on the same morning. It needs the network, and the tile server sees roughly which
  corner of the world you are looking at. Tiles load only for days you scroll to.
- **Plain map** — the original: drawn from coordinates, no network, nothing sent
  anywhere, and it prints. If tiles cannot load, this comes back on its own and says so.

A day with nothing pinned yet now shows the city itself rather than an empty
rectangle, so there is always something to place things against. **Open in Maps** hands
that day's stops to Google Maps as a route.

**On a phone or tablet**, press and hold anything to pick it up, then drag. A swipe
that starts moving straight away scrolls the page as usual, so the board still reads
normally; it is the holding still for a moment that means "I want to move this". The
rail, the drop zones and the rules about where things can land are the same ones the
mouse uses.

**Search** — the box in the trip header finds anything on the trip by name or note and
says which day it is on. Click a result to jump to it.

**How full a day is** — each day header carries a rough total: time on site plus the
time it takes to get between the stops. It turns red when the day needs more hours
than it has. Busy is a matter of taste; not fitting is arithmetic.

**Costs** — put a number on anything (and on hotels) and the day header, the trip
header and the printout add them up. Optional things are counted separately, which is
the point of marking them optional. Set the currency symbol in trip settings.

**Opening hours** — a report can carry an `hours` block, and anything on the board can
be told by hand which day it closes. Put it on a day it is shut and it says so — on
the magnet, in the notes at the top, and in the editor.

### Today

While the trip is actually running, today comes to the top of the calendar: what is
on, in order, where you sleep tonight, and what the next leg is. The board opens on
today rather than day one. Out of those dates it isn't there at all.

### To-do

Four columns — Before, Pack, There, Done — with a magnet tray of the things that are
easy to forget. Drag one across and it leaves the tray, so what's left is what you
still have to think about.

### Coverage

A map per city with every planned day laid over the last. It answers a
different question from the calendar: *have I actually seen enough of this place, or
am I covering the same six blocks three times?*

### Eat & drink

A list per city. Clicking a food option doesn't close the panel, so you can keep
adding until you're done.

### City guides

The long-form report for each city — see [City Reports](#city-reports) below.

---

## Discover

For each city, a deck of 15–30 cards: the things a first-time visitor would regret
missing. Swipe right to keep, left to skip — or use the four buttons if you're on a
laptop. Each card carries how iconic it is, how long to allow, and how much walking
it involves.

When the deck's done it clusters what you kept by proximity and proposes a day split.
Anything you place leaves the deck; anything you mark optional stays. Anything you
skipped is still reachable — nothing is thrown away.

**48 cities ship with hand-written decks** (825 cards, 223 with hand-set durations
and difficulty). Anywhere else builds a deck live from OpenStreetMap, ranked by how
many Wikipedia languages an entry appears in — which is a decent proxy for "would a
visitor have heard of this", and keeps hospitals and office blocks out.

---

## City Reports

**Ten cities are already inside the file** — Beijing, Shanghai, Tianjin, Suzhou,
Hangzhou, Tokyo, London, Sydney, Melbourne and New York. Open the app on any of them
and the guides tab, the deck and the food list are full on the first run, with no
folder to link and nothing to import. They are marked *built in*, and they are the
lowest-priority source: put your own `beijing.json` in a linked folder, or paste one
in, and yours takes over and is never overwritten.

The `City Reports/` folder holds the same guides as files, in `cityreport.v1` format:

```
City Reports/
  AI_City_Travel_Report_Structure.docx   ← the template these follow
  beijing.json  shanghai.json  tianjin.json  suzhou.json  hangzhou.json
```

Each is a full guide — at a glance, history, things to do, an essential ten, food and
a must-eat ten, restaurants, experiences, a neighbourhood guide, timing, day trips,
practicalities — plus a `coords` block (around 40–50 places with real coordinates)
that lets the app cluster and map what the report mentions.

When you create a trip, the app **loads** any report it already has rather than
regenerating it. Reports feed the decks, the food panel and the guide tab.

**To add a city:** the guides tab carries the prompt. Open *The prompt for writing
one*, copy it, and hand it to Claude or any other model — it names your cities and
carries the whole format with it, including the `coords` block the planner needs, so
what comes back is a file rather than an essay. Paste the JSON straight back into the
app, or save it as `cityname.json` (lowercase, no spaces) in your folder.

If Claude is already looking at your City Reports folder, the short version — *"write
a city report for X in cityreport.v1 and save it into my City Reports folder"* — is
enough, and there's a button for that too.

Link the folder once via the guides tab and the app remembers it.

---

## Reading it comfortably

**Text size** — the `A` `A` control in the tab bar, 80% to 120%. It resizes *type
only*; boxes, spacing and images hold still, so more or less text fits in the same
space. Your browser's own zoom is separate and works on top of it.

**Sections** — fold the map, meals, notes or Getting around away on every day at
once. A slim strip stays behind so you can bring them back.

**The side columns** — the `–` in Your magnets or Discover collapses that column to a
tab, giving the plan the full width.

All three are preferences: they follow you across trips and stay out of the export.

---

## Getting things in and out

**In** — drop a booking confirmation (PDF, or a screenshot) onto the new-trip screen
and it reads the flight details out. It picks a plausible travel window; fare
deadlines and rebooking cut-offs look a lot like travel dates, so check what it got.

**Out** — **Export** gives you three things:

- a **printable itinerary** (print to PDF) with hotels, day notes, sticky notes, your
  annotated images, and — because this is the copy that works with no signal — a drawn
  map per day and the coordinates of every stop;
- a **calendar file** (.ics) of the committed half of the trip: flights, trains,
  hotels, and anything you gave a time or pinned. Times carry no zone, so they read as
  local wherever you are;
- a **trip JSON** you can import back, or hand to someone else with the app.

Export All backs up everything. Importing a trip you already have now asks whether to
replace it rather than quietly skipping it.

---

## What it talks to

No account, no analytics, no server of its own. It calls a handful of public APIs
only when it needs them:

| What | Where | When |
|---|---|---|
| Weather | Open-Meteo | seasonal averages on load, live forecast on request |
| Places | OpenStreetMap (Overpass), Nominatim | building a deck for a city with no report |
| Notability | Wikidata, Wikipedia | ranking those places |
| PDF and image reading | pdf.js, tesseract.js from cdnjs | only when you drop a file in |
| Map tiles | OpenStreetMap | street-map mode only, and only for days on screen |

Maps come in two modes. **Plain map** is the original promise — plain SVG drawn from
coordinates, so it works offline, it prints, and no map provider sees where you are
going. **Street map** trades that for real streets from OpenStreetMap. One button,
everywhere, and it remembers which you chose.

---

## Known edges

- File linking needs a Chromium browser. Safari and Firefox get browser storage only.
- Images are downscaled to 1200px and stored inside your trip file, so a trip with
  many screenshots gets large. Three per day, four per hotel is the cap.
- The ten built-in city reports are about 300KB of the file. That is the price of the
  guides tab having something in it before you have set anything up.
- Street-map mode needs the network. It falls back to the drawn map on its own; the
  printed itinerary always uses the drawn one, so paper never depends on a tile server.
- Costs are a number you type, not a currency conversion. One symbol per trip.
- The day-length estimate assumes you walk anything under about a kilometre and take
  the metro otherwise. It is a sanity check, not a schedule.
- A trip longer than 400 days is refused as a data error rather than rendered.
- Live decks depend on OpenStreetMap coverage. Sparse regions give thin decks — a
  city report is the fix.

---

## Under the hood

One self-contained HTML file, about 9,700 lines plus the reports that ship inside it. No build step, no framework, no
dependencies to install. Open it in an editor and it's all there: the CSS at the top,
then data tables, then the app in numbered sections.

Trips are stored as plain JSON:

```
trip
├── arr, dep          flights, dates, times
├── cities[]          with coordinates
├── interests[], pace
├── dayCity{}         which city each day
├── magnets[]         everything placed anywhere
├── stays[]           hotels: dates, times, link, notes, screenshots
├── dayNotes{}, stickies{}, dayImages{}, dayPin{}
├── decks{}, verdicts{}, tray{}
└── wx{}              cached weather
```

Data loaded from disk is repaired on the way in rather than trusted — bad coordinates,
malformed drawing strokes and missing fields are cleaned before anything renders, and
the whole render is wrapped so a bad trip shows an error instead of a blank page.

### Tests

`tests/day-moves.test.js` runs the app against a DOM shim in plain Node — no
dependencies, no install:

```
node tests/day-moves.test.js
```

68 checks covering folding, finalising, moving between days, the "same slot" rule,
undo, and the day-swap and ordering behaviour it would be easy to break.

Seven more drive the real thing in Chromium and need Playwright (`npm i -D playwright`):

```
node tests/browser.test.js     # 42 checks
node tests/drag.test.js        # 13 checks
node tests/maps.test.js        # 16 checks
node tests/reports.test.js     # 17 checks
node tests/sample.test.js      # 23 checks
node tests/extras.test.js      # 36 checks
node tests/touch.test.js       # 15 checks
```

The first: the board renders, days fold and lock, the rail opens beside the right day
with the right days droppable, its slot fan-out is positioned and not clipped, a drop
moves the right thing and can be undone, and the editor's day picker works.

`maps.test.js` stubs the tile server, so it never touches the network, and checks the
part that is easy to get subtly wrong: that a marker lands exactly where its own tile
says it should, that the switch works both ways and is remembered, and that a failed
tile falls back to the drawn grid rather than a blank box.

`reports.test.js` covers the built-in reports — that they load with no folder linked,
render, feed the decks and the food list, are searchable, and that the prompt is there
and carries the format.

`sample.test.js` opens the front page with empty storage, the way a new user does, and
checks the sample trip is a real one: eight days, three cities, three hotels, every
activity carrying real coordinates, a finalised day, stickies, a waiting list, and all
five tabs populated.

`extras.test.js` covers what hangs off the board: the day-length estimate, costs and
their totals, closed days, the calendar export (a real .ics, parsed and checked),
the printed copy, search, and Today on a trip whose dates have been shifted to be
running now.

`touch.test.js` dispatches real touch events through CDP in a context that reports
touch support: a swipe must scroll, a press-and-hold must pick something up, a drop on
the rail must move it, and a plain tap must still open the editor.

`drag.test.js` is about the gesture itself, which is easy to break and hard to notice:
that a real mouse drag picks things up with folded days on screen, that the page does
not change height under the cursor while a drag is starting, that a drag which fails
to take is not read as a click into the editor, and that a rail left behind by a drag
that never ended gets cleared instead of sitting there swallowing clicks.

An earlier and much larger harness (402 checks over the maps, decks, coverage and
malformed trips) was written outside this folder and is not in the repo. Ask Claude to
re-run whatever harness you have after any change.

---

*Built with Claude. Ask it for changes in plain English; it has the whole file.*
