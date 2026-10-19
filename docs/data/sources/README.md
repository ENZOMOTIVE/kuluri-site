# Data sources and assumptions

Where each input of the business model comes from. "Our assumption" marks a number
we chose ourselves; say so if a jury asks.

## Market size

| Input | Value | Source |
|---|---|---|
| Olive-growing families in Crete | ~95,000 | Secondary source; not verified against an official census. Crete's olive sector overview: [TU Crete, characteristics of oliviculture in Crete](https://www.infoil.tuc.gr/fileadmin/_migrated/content_uploads/Summary_Characteristics_of_oliviculture_in_Crete_EN.pdf) |
| Olive trees in Crete | ~30 million | [TU Crete](https://www.infoil.tuc.gr/fileadmin/_migrated/content_uploads/Summary_Characteristics_of_oliviculture_in_Crete_EN.pdf) |
| Harvest workers missing each season | 10,000+ | [OT.gr (2023)](https://www.ot.gr/2023/10/30/english-edition/olive-oil-workers-from-all-over-greece-in-crete-to-harvestthe-olives) |
| Share of families that hire outside workers | 30% → 28,500 farms | Our assumption |
| Crete's share of Greek olive area | about a quarter | [MDPI Agriculture 13(12):2194](https://www.mdpi.com/2077-0472/13/12/2194) |
| EU farmers sharing no data digitally | 39% | [Challenge 3 brief, EU Agri Hackathon 2026](https://data.europa.eu/en/news-events/events/eu-agri-hackathon-2026) |

## Adoption and pricing

| Input | Value | Source |
|---|---|---|
| Adoption curve | 1.1% → 4.2% → 14% → 23% → 32% of hiring farms (Y1–Y5) | Shaped on Rogers' adopter categories ([Diffusion of innovations](https://en.wikipedia.org/wiki/Diffusion_of_innovations)); our assumption |
| Renewal after the free season | 70% (bear 55%, bull 80%) | Our assumption |
| Season pass | €25 per farm per season | Team decision; under 1% of a small farm's oil income at [Cretan producer prices](https://www.argophilia.com/news/cretan-olive-oil-prices-2026/247343/) (news source) |
| Co-op plan | €5 per member farm per year | Team decision |
| Members per Cretan olive co-op | 315 on average (range 21–1,350, 29 co-ops surveyed) | [Kotsios & Pappa (2022)](https://aer.web.auth.gr/wp-content/uploads/2023/06/4.-KOTSIOS.pdf) |
| Agricultural co-ops in Greece | 1,094 | [COOPinCAP information shot 8 (2025)](https://www.c-gaia.gr/en/cap-and-agricultural-cooperatives-coopincap-information-shot-8/) |
| Co-op members in Greece | ~200,000 → 183 per co-op | [Sustainability 16(16):7202 (2024)](https://doi.org/10.3390/su16167202) |
| Paying co-ops | 0 → 2 → 10 → 25 → 40 joined (Y1–Y5), each pays from its second year | Our assumption |

## Costs and funding

| Input | Value | Source |
|---|---|---|
| Year-1 costs | €6,500 (company + accountant €2.5k, legal + GDPR €1.5k, tech + marketing €2.5k) | Our estimate; founders unpaid |
| Costs Y2–Y5 | €30k → €52k → €63k → €72k, plus 3% card fees | Our estimate; part-time developer at about half a [Greek software salary](https://lifeindexed.com/salary/europe/greece/software-engineer/2024/) (modelled estimate) |
| Early grants | €20k in each of years 1 and 2, 70–80% chance | [EIT Food Seedbed](https://www.eitfood.eu/open-calls/seedbed-2026-2028-call-for-venture-builders) · [ESF+ social innovation](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/esf/wp-call/2022/call-fiche_esf-2022-ncp_en.pdf) |
| Large-grant scenario | €500k over years 2–3 | Size of an ESF+ social-innovation project (€200k–1M), [call fiche](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/esf/wp-call/2022/call-fiche_esf-2022-ncp_en.pdf) |
| Discount rate for NPV | 40% | Typical venture hurdle rate for early-stage start-ups |

## Policy and competition

- CAP social conditionality: Art. 14, [Regulation (EU) 2021/2115](https://eur-lex.europa.eu/eli/reg/2021/2115/oj), mandatory from 2025. Background: [CIHEAM](https://newmedit.ciheam.org/bup/wp-content/uploads/2025/06/03-The-social-conditionality.pdf).
- ERGANI app for instant hiring (July 2026): [OT.gr](https://www.ot.gr/2026/07/31/english-edition/greece-launches-ergani-app-for-instant-digital-hiring/).
- Agro-U (Thessaloniki, 2020): [Google Grow](https://grow.google/intl/europe/story/agro-u/).

## Method

- Base case: deterministic 5-year model.
- First Chicago: bear (adoption × 0.5, 55% renew, 30% of co-ops, costs +15%),
  base, bull (adoption × 1.4, 80% renew, 130% of co-ops), weighted 30 / 50 / 20%.
- Monte Carlo: 10,000 runs, triangular distributions on adoption, renewal, co-op
  uptake and costs; early grants won with 80% / 70% probability; seed 42.

The model's own data are synthetic. No personal data and none of the organisers'
datasets are used.
