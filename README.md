# Trip Board

A trip planner built to replace the spreadsheet — the one where you type a date in
column A and a guess in column B, then retype the whole thing when the days move.

Everything here is drag-and-drop instead of typing, and everything you drop can be
**pinned** once it's certain. One file, no install, no account, no server.

---

## Getting started

Double-click **`Trip Board.html`**. It opens in your browser and that's the whole app.

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

### To-do

Four columns — Before, Pack, There, Done — with a magnet tray of the things that are
easy to forget. Drag one across and it leaves the tray, so what's left is what you
still have to think about.

### Coverage

A drawn map per city with every planned day laid over the last. It answers a
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

The `City Reports/` folder holds long-form guides in `cityreport.v1` format:

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

**To add a city:** ask Claude for a report in `cityreport.v1` format and save it into
this folder as `cityname.json` — lowercase, no spaces. The trip settings screen will
write the exact prompt for you. You can also paste one straight into the app.

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

**Out** — **Export** gives you either a printable itinerary (print to PDF) including
hotels, day notes, sticky notes and your annotated images, or a JSON file you can
import back. Export All backs up everything.

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

Maps are **drawn, not tiled** — plain SVG from coordinates. That means they work
offline, they print, and no map provider sees where you're going.

---

## Known edges

- File linking needs a Chromium browser. Safari and Firefox get browser storage only.
- Images are downscaled to 1200px and stored inside your trip file, so a trip with
  many screenshots gets large. Three per day, four per hotel is the cap.
- A trip longer than 400 days is refused as a data error rather than rendered.
- Live decks depend on OpenStreetMap coverage. Sparse regions give thin decks — a
  city report is the fix.

---

## Under the hood

One self-contained HTML file, about 9,300 lines. No build step, no framework, no
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

There's a Node harness that runs the app against a DOM shim: **402 checks** covering
the planning logic, the maps, the decks, coverage and gap arithmetic, the display
settings, and a set of deliberately malformed trips. It also parses the file the way
a browser would, which catches a class of bug Node's parser silently accepts.

It lives outside this folder in the working directory — ask Claude to re-run it after
any change.

---

*Built with Claude. Ask it for changes in plain English; it has the whole file.*
