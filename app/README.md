# Kuluri – farmer app (front end)

React + Vite front end for Kuluri: a farmer uploads a buyer's questionnaire, Kuluri drafts the answers from the farm's own data (including worker-confirmed labour records), and the farmer reviews, decides what to share, and downloads the result.

Layout inspired by questionnaire-automation tools such as turnus.ai, adapted for farms. UI built with [Mantine](https://mantine.dev) 8 (theme in `src/theme.js`: strong green sidebar, white content) and lucide icons.

## Run

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in app/dist
```

## Screens

| Route | Screen |
|---|---|
| `#/` | Home: upload questionnaire / provide data |
| `#/questionnaires` | Upload → questions extracted → suggested answers → farmer uses each suggestion or edits it, chooses what to share → final preview, download, complete |
| `#/history` | Recently worked-on documents and what was shared |
| `#/assistant` | AI assistant over the farm's data (mocked) |
| `#/data` | Farm profile, operations, certificates, labour records, documents |

## Real data (demo farm)

`scripts/extract_farm.py` reads the organisers' CSVs from `dg-agri-hackathon-datasets/` (git-ignored, ~12 GB) and writes small JSON files for one holding to `src/data/` (`sales_*.json`, `profile_*.json`). Default demo farm: **FARM-13079** (Milano, organic, 62 parcels, 22 buyers since 2017).

```bash
python3 app/scripts/extract_farm.py FARM-13079
```

The Buyers page, farm profile, certificates, seasonal inputs and most questionnaire suggestions use this real (synthetic) data. Labour/seasonal workers and worker confirmations are still simulated: the dataset has no seasonal workers.

## Status

Front end only. All data is **synthetic** and lives in `src/data/farm.js`; question extraction, answer generation and the assistant are mocked with timeouts and keyword matching. Next steps: connect to the organisers' dataset (SQLite) and an LLM backend, then the browser extension for buyer portals.
