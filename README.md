# Kuluri

**Record once, share with control.**

Kuluri connects farms and seasonal workers through agreements and work records that the workers confirm themselves. Buyers' requests and public administrations' reports are answered from that evidence, with totals only and never personal data.

The app was built by Team 27 at the [EU Agri-Hackathon 2026](https://agrihackathon.iservice-europa.eu/) (DG AGRI), Challenge 3 "Flowing data, empowered collaboration".

- Project site: <https://lindangulopez.github.io/kuluri-site/>
- Task board: [Kuluri, EU Agri-Hackathon](https://github.com/users/lindangulopez/projects/17)
- Status: **prototype**, using synthetic and simulated data. Read the [terms of use](TERMS.md) before using it.

## What is in this repository

| Path | What |
| --- | --- |
| [`app/`](app/) | The app: Vue 3 + Quasar, a web app plus an Android app through Capacitor. Screen-by-screen guide in [`app/README.md`](app/README.md) |
| [`app/scripts/`](app/scripts/) | `extract_farm.py` (farm data from the organisers' dataset) and `fetch_nuts.sh` (NUTS region outlines) |
| [`deck/`](deck/) | Pitch deck |
| [`diagrams/`](diagrams/) | Architecture diagrams (Archify) |
| `index.md`, `_config.yml` | The project site (GitHub Pages, Jekyll) |
| [`TERMS.md`](TERMS.md) | Terms of use and disclaimer |
| [`AUTHORS.md`](AUTHORS.md), [`CITATION.cff`](CITATION.cff), [`codemeta.json`](codemeta.json) | Who made it, how to cite it, metadata |

## Run it on your computer

You need **Node.js 22** or later and Git. Vite 8 needs at least 20.19, and the Capacitor CLI needs 22. To check your version, run `node --version`. To install Node 22 with [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 22 && nvm use 22
```

Then:

```bash
git clone https://github.com/lindangulopez/kuluri-site.git
cd kuluri-site/app
npm install
npm run dev          # open http://localhost:5173
```

At `http://localhost:5173`, choose **Farm** to open the farmer dashboard, or **Worker** to open the worker app (best in a phone-sized window).

```bash
npm run build        # production build in app/dist
npm run preview      # serve the build locally
```

### Android

You need [Android Studio](https://developer.android.com/studio) with an Android SDK. The app targets API 36, and the minimum is API 24.

```bash
cd app
npm run android:sync   # build the web app and copy it into android/
npm run android:open   # open the project in Android Studio, then Run ▶ on a device or emulator
```

### Refreshing the data (optional)

The farm data in `app/src/data/` was already extracted from the organisers' synthetic dataset, so you do not need the dataset to run the app. To extract it again, place the dataset in `dg-agri-hackathon-datasets/` at the repository root (it is git-ignored, about 12 GB), then run:

```bash
python app/scripts/extract_farm.py
bash app/scripts/fetch_nuts.sh      # NUTS 2024 outlines from Eurostat GISCO
```

## Data

- **From the synthetic dataset**: the farm FARM-13079 (Milano, NUTS3 ITC4C) — 371.1 ha across 62 parcels, organic, inside Natura 2000, with ten years of harvests, inputs, irrigation, sales and the regular workers' hours.
- **Simulated**: job posts, the worker pool, seasonal workers, chats, agreements and confirmations. The dataset has no seasonal workers or jobs.
- No real personal data is used.

Three findings from that data shaped the product: the dataset records 9,517 hours of labour and **not one seasonal worker**; 20 of its 30 sales have no date-valid holding certificate at the moment of sale; and proof has to reach 22 different buyers. **[DATA.md](DATA.md) sets out every source, figure and simulated element in full**, with the commands to reproduce them.

## AI in the product

- The "chat analysis" that drafts agreement terms is **rule-based** in this prototype (`app/src/data/agreements.js`). No AI model is queried anywhere in the app.
- AI-generated demo content, illustrative and not verified data: the seeded chats, the worker pool, the job posts and the Romanian interface strings (machine-translated, not reviewed by a native speaker).
- Planned: transcription and translation of voice messages by an AI service, always shown next to the original, which is what counts.
- AI tools (coding assistants, Archify diagrams) helped develop the prototype, its documentation and the pitch deck. Every output was reviewed before merging and is owned by a named team member. Full declaration in [DATA.md](DATA.md) § 5.

## Agreements, fingerprints and blockchain

- Each confirmed agreement or week of work gets a SHA-256 fingerprint. If anyone changes the record, the fingerprint no longer matches.
- The anchoring contracts are **deployed on the Polygon Amoy testnet** (chain 80002, addresses and tests in [`contracts/`](contracts/README.md)); users pay no gas and need no crypto knowledge. The app does not call them yet, so anchoring from the Confirm screen is still **simulated** and says so on screen. Only salted hashes, never personal data, go on the chain. See [DATA.md](DATA.md) § 4.
- An agreement in Kuluri records the agreed terms and the intention to work together. **It is not an employment contract, and Kuluri does not guarantee that either party respects it.** See the [terms of use](TERMS.md), section 3.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: pick or open an issue, work on a branch, make a small pull request, and never commit the dataset, keys or real personal data.

## Cite

See [`CITATION.cff`](CITATION.cff); GitHub shows a "Cite this repository" button. The metadata is also in [`codemeta.json`](codemeta.json).

## Licence

- Code in [`app/`](app/): [MIT](app/LICENSE).
- Text, diagrams and the deck: [CC BY 4.0](LICENSE).
