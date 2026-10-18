# Kuluri

**Record once, share with control.**

Kuluri connects farms and seasonal workers through agreements and work records that the workers confirm themselves. Buyers' requests and public administrations' reports are answered from that evidence, with totals only and never personal data.

The app was built by Team 27 at the [EU Agri-Hackathon 2026](https://agrihackathon.iservice-europa.eu/) (DG AGRI), Challenge 3 "Flowing data, empowered collaboration".

- **Live demo: <https://lindangulopez.github.io/kuluri-site/demo/>** — runs in the browser, no sign-up; any email and any code will let you in
- Project site: <https://lindangulopez.github.io/kuluri-site/>
- Task board: [Kuluri, EU Agri-Hackathon](https://github.com/users/lindangulopez/projects/17)
- Status: **prototype**, using synthetic and simulated data. Read the [terms of use](TERMS.md) before using it.

## What is in this repository

| Path | What |
| --- | --- |
| [`app/`](app/) | The app: Vue 3 + Quasar, a web app plus an Android app through Capacitor. Screen-by-screen guide in [`app/README.md`](app/README.md) |
| [`app/scripts/`](app/scripts/) | `extract_farm.py` (farm data from the organisers' dataset) and `fetch_nuts.sh` (NUTS region outlines) |
| [`demo/`](demo/) | The built web app, published at [/demo/](https://lindangulopez.github.io/kuluri-site/demo/). Regenerate with `cd app && npm run build && cp -r dist/. ../demo/` |
| [`deck/`](deck/) | Pitch deck |
| [`diagrams/`](diagrams/) | Architecture diagrams (Archify) |
| `index.md`, `_config.yml` | The project site (GitHub Pages, Jekyll) |
| [`TERMS.md`](TERMS.md) | Terms of use and disclaimer |
| [`AUTHORS.md`](AUTHORS.md), [`CITATION.cff`](CITATION.cff), [`codemeta.json`](codemeta.json) | Who made it, how to cite it, metadata |

## Run it on your computer

The app runs with **no configuration at all**: without any keys it starts in
mock-auth mode (any login is accepted, a demo wallet is created) and serves the
farm data already committed in `app/src/data/`. That is the mode to use for a
demo.

### 1. Node 22 or later

Vite 8 needs at least Node 20.19 and the Capacitor CLI needs 22. Check with
`node --version`. Debian and Ubuntu still ship Node 18, which will fail the
build, so install a current version in your home directory:

```bash
# with nvm, if you have it
nvm install 24 && nvm use 24
```

```bash
# without nvm, no root needed — downloads into ~/.local and puts it first on PATH
mkdir -p ~/.local/node && cd ~/.local/node
curl -LO https://nodejs.org/dist/v24.22.0/node-v24.22.0-linux-x64.tar.xz
tar -xJf node-v24.22.0-linux-x64.tar.xz
ln -sfn ~/.local/node/node-v24.22.0-linux-x64 ~/.local/node/current
ln -sfn ~/.local/node/current/bin/node ~/.local/bin/node
ln -sfn ~/.local/node/current/bin/npm  ~/.local/bin/npm
ln -sfn ~/.local/node/current/bin/npx  ~/.local/bin/npx
node --version   # v24.22.0
```

(`~/.local/bin` is already ahead of `/usr/bin` on most systems. To undo it,
delete those three symlinks.)

### 2. Start it

```bash
git clone https://github.com/lindangulopez/kuluri-site.git
cd kuluri-site/app
npm install
npm run dev          # http://localhost:5173
```

Choose **Farm** for the farmer dashboard, or **Worker** for the worker app —
best in a phone-sized window. The screen-by-screen guide is in
[`app/README.md`](app/README.md).

```bash
npm run build        # production build in app/dist
npm run preview      # serve that build locally
```

If `npm run build` fails with `UNLOADABLE_DEPENDENCY` on `@vue/devtools-api`,
you are on a commit from before the alias in `app/vite.config.js` was made
relative — pull `main`.

### 3. Optional services

Copy `app/.env.example` to `app/.env.local` and fill in only what you need.
Nothing here is required for a demo.

| Variable | What it turns on |
| --- | --- |
| `VITE_PRIVY_APP_ID` | Real Privy login and wallets instead of mock auth |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Persisting users and chat history (schema in [`docs/database.md`](docs/database.md)) |
| `VITE_API_BASE` | Sends service calls to a backend instead of local mock data |
| `VITE_CHAIN_ID`, `VITE_FACTORY_ADDRESS`, `VITE_FORWARDER_ADDRESS` | The anchoring contracts |

`.env.local` is git-ignored. Never commit keys, and never put
`DEPLOYER_PRIVATE_KEY` anywhere the frontend can read it — it belongs to the
relayer and is used server-side only.

**Note**: `.env.example` still names Gnosis Chiado (chain 10200) while the
deployed contracts are on Polygon Amoy (chain 80002). Use the Amoy values from
[`contracts/README.md`](contracts/README.md).

### Android

You need [Android Studio](https://developer.android.com/studio) with an Android
SDK. The app targets API 36, and the minimum is API 24.

```bash
cd app
npm run android:sync   # build the web app and copy it into android/
npm run android:open   # open in Android Studio, then Run on a device or emulator
```

### The contracts

The anchoring contracts are already deployed on the Polygon Amoy testnet, so you
only need this if you want to change or redeploy them.

```bash
cd contracts
npm install
npx hardhat test              # the unit tests
npm run deploy:amoy           # needs DEPLOYER_PRIVATE_KEY and testnet funds
```

Addresses, the gasless relayer design and the faucet links are in
[`contracts/README.md`](contracts/README.md). The app does not call the
contracts yet — see [DATA.md](DATA.md) § 4 for exactly what is live and what is
still simulated.

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

## Thank you

Kuluri exists because four people gave a weekend to Maria and Nikos's problem. Thank you to:

(i) Aayushman Bhaba Padhy ([@ENZOMOTIVE](https://github.com/ENZOMOTIVE)), who built the app in Vue 3 and Quasar, then worked through the night on authentication, the Supabase backend and the anchoring contracts deployed on Polygon Amoy;

(ii) Maria Filippou ([@filippoumaria](https://github.com/filippoumaria)), who kept the farmer's reality in the room and wrote the first draft of the presentation;

(iii) Juan Zotes Orcajo ([@juanzotes](https://github.com/juanzotes)), who brought the data and maps and built the final pitch deck in Canva.

Thank you also to the mentors who questioned our scope early, and to the EU Agri-Hackathon 2026 organisers at DG AGRI for the challenge and the synthetic dataset that showed us the gap: 9,517 hours of labour and not one seasonal worker.

If you pick up Kuluri from here, read [CONTRIBUTING.md](CONTRIBUTING.md) and add yourself to [AUTHORS.md](AUTHORS.md). What would make the next harvest easier to prove?

Linda Angulo López, 18 October 2026

## Cite

See [`CITATION.cff`](CITATION.cff); GitHub shows a "Cite this repository" button. The metadata is also in [`codemeta.json`](codemeta.json).

## Licence

- Code in [`app/`](app/): [MIT](app/LICENSE).
- Text, diagrams and the deck: [CC BY 4.0](LICENSE).
