# Kuluri app (Vue 3 + Quasar + Capacitor)

**Kuluri connects farms and seasonal workers through work records the workers confirm themselves.**
One codebase for the web app (farmer dashboard) and the Android app (worker app).

## Run (web)

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in app/dist
```

## Android

Requires Android Studio (with an Android SDK) on your machine.

```bash
cd app
npm run android:sync   # builds the web app and copies it into android/
npm run android:open   # opens the android/ project in Android Studio -> Run ▶ on a device/emulator
```

## Screens

| Route | Who | Screen |
|---|---|---|
| `#/` | both | Choose: farm or worker |
| `#/farm` | farm | Overview: open jobs, matches, team, confirmations, fair-employer record |
| `#/farm/find` | farm | Post a job, matching workers with verified history, invite |
| `#/farm/availability` | farm | Season planner: skills × weeks heatmap of available workers (Oct 2026 – Jul 2027) with your open jobs outlined (green = enough, red = not enough), "only within 60 km" filter, per-job insights (available for the whole job / part / needed), and a timeline of who is available when; click a skill to filter |
| `#/farm/team` | farm | My workers: contract status, worker confirmations |
| `#/farm/messages` | farm | Messages with workers; seeded messages shown translated (Romanian/Italian/English) with "show original" |
| `#/farm/agreements` | farm | Manage agreements: filter (drafts / waiting / agreed / closed), new agreement from a chat + job, edit draft terms, **agree & send** (posts an agreement card into the worker's chat), withdraw, mark completed, cancel with reason. Terms drafted from the job offer + chat, both confirmations with a SHA-256 fingerprint, a compact "Intent" label (like the match %) from the chat analysis; the full analysis (quotes, extracted points, agreement-vs-chat check) is stored with the agreement and included in the agreement PDF |
| `#/farm/requests` | farm | Buyer requests: suggested answers (farm data + worker-confirmed labour), use / edit, share |
| `#/farm/profile` | farm | Farm data (real records of FARM-13079) |
| `#/worker` | worker (phone) | Profile with verified work history; **availability** (looking for work on/off + from/to dates, feeds the farm planner); **Export PDF**: the worker picks which jobs to include, the PDF lists them with SHA-256 fingerprints (no pay amounts) and opens the Android share sheet (Capacitor Share), Web Share, or downloads |
| `#/worker/chat` | worker | Chat only: messages in the worker's language, agreement cards (open the job's Agreement tab), link to the job, report button |
| `#/worker/jobs` | worker | Compact list of my jobs/invitations (status chip) and other open jobs; tap a job to open it |
| `#/worker/job/:id` | worker | One job in three tabs: **Details** (pay, hours, housing, tasks, fair-employer record, accept/decline, message the farm), **Location** (map + directions), **Agreement** (only after the farm sent it) |
| `#/worker/earnings` | worker | Earnings tab (banking-style): season total, received, still to receive, hours; quick actions; week to confirm; alert when a week was paid less than recorded ("Ask the farm"); weekly day chart with week switcher; activity list by payment date. Kuluri does not hold or pay money |
| `#/worker/confirm` | worker | Opened from Earnings: confirm the week's days, hours and pay – or report a problem. Confirmed records get a SHA-256 fingerprint |

The worker app is available in English and Romanian (toggle in the header).

## Data

- **Real (synthetic dataset):** farm profile, parcels, inputs per season, certificate, regular workers' hours – FARM-13079 (Milano). Extracted with `scripts/extract_farm.py` from `dg-agri-hackathon-datasets/` (git-ignored, ~12 GB) into `src/data/*.json`.
- **Simulated:** job posts, worker pool, seasonal workers, invitations, confirmations. The dataset has no seasonal workers or jobs.
- Map (in the job's Location tab): interactive MapLibre GL JS (same stack as the team's map infrastructure), OpenStreetMap base map, all data in EPSG:4326 (WGS84, same as Google Maps). Panning is limited to continental Europe (`src/data/regions.js`; overseas/outermost regions excluded). Region outline = official NUTS 2024 boundary from Eurostat GISCO (`src/data/nuts/ITC4C.json`, 1:10M); download all eight dataset regions with `scripts/fetch_nuts.sh`. Attribution: © EuroGeographics for the administrative boundaries, © OpenStreetMap contributors. The dataset has no farm coordinates, so the farm pin is a demo location inside the Milano region.
- For many regions/farms later: convert GeoJSON to PMTiles (tippecanoe) and serve as one static file, as in https://github.com/juanzotes/spain-demographic-dynamics-map.
- Chat is simulated and in memory (no server). Live translation of new messages needs a translation service (next step). The PDF uses standard PDF fonts, so diacritics are simplified (ș → s).
- Agreements record agreed terms and intent; they do not replace the written employment contract required by national law. The "AI" chat memorandum is rule-based in the prototype (`src/data/agreements.js`); in the product an LLM would do it, only with both sides' consent, always citing the messages.
- Fingerprints are real SHA-256 hashes; anchoring them on a blockchain is simulated in this prototype.

Matching uses skills, availability, languages and distance only – never nationality, age or gender.
