# Docs

Everything behind the pitch: the deck, the jury Q&A, the business model and the
data it rests on.

| Folder | What is in it |
|---|---|
| [`pitch/`](pitch/) | `kuluri_pitch_deck.pdf`: the full Canva deck, 22 slides (pitch 1–10, live demo 11, team 12, backup 13–22). |
| [`qa/`](qa/) | `kuluri_qa_prep.html`: one-page Q&A prep for the jury. Each answer names the backup slide to jump to, a line to say and the numbers behind it. Download it and open it in a browser. |
| [`analysis/`](analysis/) | `kuluri_business_model.ipynb`: the 5-year business model, risk analysis and every chart in the deck. `figures/` holds the PNGs it draws. |
| [`data/results/`](data/results/) | CSV outputs of the notebook, grouped by what they hold. See its [README](data/results/README.md). |
| [`data/sources/`](data/sources/) | Every public source and assumption used in the analysis, with links. See its [README](data/sources/README.md). |
| [`database.md`](database.md) | The app's database design. |

## Pricing used everywhere

| Who | Pays | For |
|---|---|---|
| Workers | €0, always | Profile, jobs, their own agreements |
| Farmers | €25 per season, first season free | Unlimited agreements and their own records |
| Co-ops | €5 per member farm per year, first year free | The aggregated, anonymised view across their member farms |

The two paid products are separate and add up: whoever uses the data pays for it.
Ads appear in the deck only as a future option and count for €0 in every scenario.

## Headline numbers (base case, illustrative)

- Profitable without grants from year 4.
- Year 5: 4,588 paying farms, revenue €154k, profit €77k.
- Cumulative profit by year 5: +€78k (lowest point −€20k in year 3).
- Bear / base / bull (30 / 50 / 20%): −€120k / +€78k / +€217k, expected +€46k.
- Monte Carlo (10,000 runs): profitable in year 5 in 99% of runs; all early losses
  recovered by year 5 in 68%.
- €500k EU grant scenario (Greece from year 3): +€91k cumulative by year 5, 22k farms.

These are model estimates, not results. The assumptions are listed in the notebook
and in [`data/sources/README.md`](data/sources/README.md).

## Re-running the model

From the repository root:

```bash
cd docs/analysis
uv run --with jupyter --with nbconvert --with pandas --with matplotlib --with numpy \
  jupyter nbconvert --to notebook --execute --inplace kuluri_business_model.ipynb
```

The notebook rewrites `docs/data/results/` and `docs/analysis/figures/`. The Monte
Carlo uses a fixed seed (42), so re-runs give the same numbers.
