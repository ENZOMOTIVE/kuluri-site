# Data and AI declaration

Kuluri was built at the EU Agri-Hackathon 2026 (DG AGRI), Challenge 3. This page
states exactly which data the prototype uses, what is real and what is simulated,
and how AI was used to build it. Everything here can be checked against the code.

## 1. Sources

**DG AGRI synthetic dataset — farm FARM-13079** (Milano, NUTS3 ITC4C).
Extracted by [`app/scripts/extract_farm.py`](app/scripts/extract_farm.py) into
[`app/src/data/profile_farm13079.json`](app/src/data/profile_farm13079.json) and
[`app/src/data/sales_farm13079.json`](app/src/data/sales_farm13079.json). Source
tables, as recorded in the files themselves: `synthetic_holding`,
`synthetic_parcel`, `synthetic_fertilisation`, `synthetic_plant_protection`,
`synthetic_harvest`, `synthetic_irrigation`, `synthetic_labour`,
`combined_challenge3_sales_certification_ready`, `synthetic_traceability`,
`synthetic_market_price`.

**Eurostat GISCO** — NUTS 2024 outlines, fetched by
[`app/scripts/fetch_nuts.sh`](app/scripts/fetch_nuts.sh), used for the 60 km
season-planner map.

The dataset itself is not in this repository (about 12 GB, git-ignored). The
extracted farm files are, so the app runs without it.

## 2. The farm, as the data describes it

| | |
| --- | --- |
| Utilised agricultural area | 371.1 ha across 62 parcels |
| Crops | Common wheat 137.0 ha · barley 83.2 · maize 62.2 · sunflower 60.6 · rapeseed 28.0 |
| Status | Organic holding · inside Natura 2000 · farm type TF8 = 1 (field crops) |
| Production, 2017-2026 | 2,548-2,833 t harvested per year · 48,212-179,237 m³ irrigation · 83-102 plant-protection applications |
| Recorded labour | 9,517 annual hours · 5.28 AWU · 8 records |
| Sales, 2017-2026 | 30 transactions · 9,949 t · €2.62M · 22 distinct buyers · forward, cooperative and spot contracts |
| Certification | ORGANIC, body CB-FR-02, lot prefix ORG-13079, valid 2024-01-01 to 2026-12-31 |

## 3. What the data told us, and what we built because of it

**The seasonal workers are not in the data.** All 9,517 recorded hours fall under
`HOLDER`, `OTHER_FAMILY` or `PAID_REGULAR`. There is not one seasonal record, on
a 371 ha farm harvesting about 2,600 t a year. The work that gets done at harvest
is the work nobody logs — so Kuluri records it, and the worker confirms their own
week rather than having it confirmed for them.

**Two thirds of sales cannot prove the claim at the moment of sale.** The holding
certificate is valid for 2024-2026 only, and 20 of the 30 sales carry
`no_date_valid_holding_certificate`; the other 10 are
`holding_certificate_context_only`. So Buyer requests answers from confirmed
records, and returns totals only.

**Proof has to travel to 22 different buyers.** Over ten years the farm sold to 22
distinct buyers, 15 of the 30 sales below the reference price. One record, re-used
for every buyer and for CAP social-conditionality checks, is worth more than a
document per request.

To reproduce these figures, place the dataset in `dg-agri-hackathon-datasets/` and
run `python app/scripts/extract_farm.py`.

## 4. Real, simulated, and not yet built

**From the dataset**: the farm profile, parcels, inputs, certificate, sales and
the regular workers' hours.

**Simulated for the demo**: job posts, the worker pool, seasonal workers, chats,
agreements and confirmations. The dataset contains none of these.

**Real cryptography**: every confirmed agreement and week of work gets a SHA-256
fingerprint. If a record changes, the fingerprint no longer matches.

**Simulated in this prototype**: writing those fingerprints to a blockchain. The
Confirm screen says so on screen. Only salted hashes, never personal data, would
go on a chain.

No real personal data is used anywhere, and none was sent to any AI tool.

## 5. AI use

**To build it.** AI assistants helped with scoping (idea and dataset exploration,
feasibility and market modelling), with generating the app code (Vue 3 / Quasar /
Capacitor), with the documentation and diagrams in this repository, and with the
pitch deck. Every output was reviewed before it was merged and is owned by a named
team member; the git history records which commits, and commits carry
`Co-Authored-By` trailers where an assistant was involved.

**Inside the product: none.** No AI model is queried anywhere in the prototype.
The "chat analysis" that drafts agreement terms is transparent rule-based
extraction over the chat — see the header comment in
[`app/src/data/agreements.js`](app/src/data/agreements.js). This is deliberate: a
product whose job is to make labour records trustworthy should not start with a
non-deterministic core.

**AI-generated demo content**, illustrative and not verified data: the seeded chat
messages, the worker pool, the job posts, and the Romanian interface strings
(machine-translated, not reviewed by a native speaker).

**Planned, with safeguards**: transcription and translation of voice messages by an
AI service, with the original always shown beside it — the original is what counts.
Any future LLM-assisted agreement drafting would require both parties' consent and
would always cite the messages it used.

**Authorship.** AI tools are instruments used by the authors, never authors
themselves. [`CITATION.cff`](CITATION.cff) and [`AUTHORS.md`](AUTHORS.md) list the
four people who built Kuluri.

---

Team 27 · EU Agri-Hackathon 2026 · Challenge 3 "Flowing data, empowered collaboration"
