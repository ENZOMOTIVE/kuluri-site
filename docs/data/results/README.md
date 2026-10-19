# Model results

CSV outputs of [`../../analysis/kuluri_business_model.ipynb`](../../analysis/kuluri_business_model.ipynb).
All money is in euros, years run 1–5, and every figure is an illustrative estimate.

## `model/`: the base case

| File | What it holds |
|---|---|
| `base_case_5_years.csv` | Year by year: active and paying farms, paying co-ops, members covered, revenue by stream (season passes, co-ops, grants), costs, profit with and without grants, cumulative profit. |
| `headline_numbers.csv` | One row: first year profitable without grants, paying farms, revenue and profit in year 5, cumulative profit and its lowest point. |
| `unit_economics.csv` | Season-pass price, co-op price per member, what an average Cretan co-op pays, year-1 costs, season passes needed to cover year-5 costs. |
| `price_sensitivity.csv` | The headline numbers at season-pass prices from €10 to €35. |
| `deck_numbers.txt` | The figures quoted on the slides, in plain text. |

## `risk/`: how sure we are

| File | What it holds |
|---|---|
| `first_chicago_cases.csv` | Bear, base and bull cases with their weights (30 / 50 / 20%) and headline numbers. |
| `cumulative_profit_by_case.csv` | Cumulative profit per year for each case (the chart on slide 21). |
| `monte_carlo_summary.csv` | 10,000 runs: share profitable in year 5, share with cumulative profit above zero, P10 / median / P90 / mean. |
| `monte_carlo_distribution.csv` | Descriptive statistics of the 10,000 runs (cumulative and year-5 profit). |
| `npv.csv` | Net present value at a 40% venture hurdle rate. |

## `scenarios/`: if we win a large grant

| File | What it holds |
|---|---|
| `eu_grant_5_years.csv` | Year by year for a €500k EU grant (years 2–3), Crete in year 1 and the rest of Greece from year 3, co-ops at the Greek average size (183 members). Same columns as the base case. |
| `current_plan_vs_eu_grant.csv` | Cumulative profit and active farms for both plans side by side (the chart on slide 22). |
