"""Extract one demo farm's sales/buyer data from the organisers' CSVs into a small JSON for the app.

Usage (from repo root):
    python3 app/scripts/extract_farm.py FARM-13079

Reads:  dg-agri-hackathon-datasets/ (not committed, see .gitignore)
Writes: app/src/data/sales_<farm>.json

Sources (all synthetic, see the dataset guide):
  combined_challenge3_sales_certification_ready  -> sales, buyer, contract, reference price, certificate status
  synthetic_traceability                           -> certificates of the holding
  synthetic_market_price                           -> monthly reference prices per product
"""
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "dg-agri-hackathon-datasets"
FARM = sys.argv[1] if len(sys.argv) > 1 else "FARM-13079"
NA = ["\\N"]


def main():
    chunks = pd.read_csv(
        DATA / "combined" / "combined_challenge3_sales_certification_ready.csv",
        dtype={"holding_id": str, "buyer_id": str}, na_values=NA, chunksize=200_000,
    )
    sales = pd.concat(c[c.holding_id == FARM] for c in chunks).sort_values("txn_date")

    certs = pd.read_csv(DATA / "synthetic" / "synthetic_traceability.csv", dtype={"holding_id": str})
    certs = certs[certs.holding_id == FARM]

    prices = pd.read_csv(DATA / "synthetic" / "synthetic_market_price.csv")
    prices = prices[prices["product"].isin(sales["product"].unique())]

    out = {
        "farm": FARM,
        "source": "combined_challenge3_sales_certification_ready, synthetic_traceability, synthetic_market_price (synthetic)",
        "sales": [
            {
                "id": int(r.transaction_id),
                "date": r.txn_date,
                "year": int(r.year),
                "product": r["product"],
                "volume_t": round(float(r.volume_t), 2),
                "price_eur_t": round(float(r.price_eur_t), 2),
                "value_eur": round(float(r.derived_sale_value_eur), 2),
                "ref_price_eur_t": None if pd.isna(r.synthetic_reference_price_eur_t) else round(float(r.synthetic_reference_price_eur_t), 2),
                "price_dev_pct": None if pd.isna(r.derived_price_deviation_pct) else round(float(r.derived_price_deviation_pct), 2),
                "buyer": r.buyer_id,
                "grade": r.quality_grade,
                "contract": r.contract_type,
                "certified": r.certification_status != "no_date_valid_holding_certificate",
                "cert_status": r.certification_status,
            }
            for _, r in sales.iterrows()
        ],
        "certificates": [
            {"scheme": r.scheme, "body": r.certification_body, "from": r.valid_from, "to": r.valid_to, "lot_prefix": r.lot_prefix}
            for _, r in certs.iterrows()
        ],
        "reference_prices": [
            {"product": r["product"], "year": int(r.year), "month": int(r.month), "price_eur_t": float(r.price_eur_t)}
            for _, r in prices.iterrows()
        ],
    }
    dest = ROOT / "app" / "src" / "data" / f"sales_{FARM.lower().replace('-', '')}.json"
    dest.write_text(json.dumps(out, indent=1))
    print(f"{len(out['sales'])} sales, {sales.buyer_id.nunique()} buyers -> {dest}")

    write_profile()


def load_parcel_events(pattern, ids):
    frames = []
    for f in sorted((DATA / "synthetic").glob(pattern)):
        for c in pd.read_csv(f, dtype={"parcel_id": str}, na_values=NA, chunksize=500_000):
            frames.append(c[c.parcel_id.isin(ids)])
    return pd.concat(frames)


def write_profile():
    """Farm profile: holding, parcels, yearly input/harvest totals, labour (static)."""
    s = {"holding_id": str, "parcel_id": str}
    hold = pd.read_csv(DATA / "synthetic" / "synthetic_holding.csv", dtype=s)
    h = hold[hold.holding_id == FARM].iloc[0]
    parcels = pd.read_csv(DATA / "synthetic" / "synthetic_parcel.csv", dtype=s,
                          usecols=["parcel_id", "holding_id", "area_ha", "crop_current", "tenure"])
    p = parcels[parcels.holding_id == FARM]
    ids, area = set(p.parcel_id), p.set_index("parcel_id").area_ha
    total_area = float(area.sum())

    fe = load_parcel_events("synthetic_fertilisation_20*.csv", ids)
    pp = load_parcel_events("synthetic_plant_protection_20*.csv", ids)
    hv = load_parcel_events("synthetic_harvest_20*.csv", ids)
    ir = load_parcel_events("synthetic_irrigation_20*.csv", ids)
    fe["n_kg"] = fe.n_kg_ha * fe.parcel_id.map(area)
    hv["t"] = hv.yield_t_ha * hv.parcel_id.map(area)
    ir["m3"] = ir.water_mm * ir.parcel_id.map(area) * 10  # 1 mm on 1 ha = 10 m3

    years = sorted(fe.year.unique())
    yearly = []
    for y in years:
        f, q = fe[fe.year == y], pp[pp.year == y]
        yearly.append({
            "year": int(y),
            "n_kg_ha": round(f.n_kg.sum() / total_area, 1),
            "n_mineral_kg_ha": round(f[f.product_type == "MINERAL"].n_kg.sum() / total_area, 1),
            "n_organic_kg_ha": round(f[f.product_type == "ORGANIC"].n_kg.sum() / total_area, 1),
            "pp_applications": int(len(q)),
            "pp_parcels": int(q.parcel_id.nunique()),
            "pp_by_type": {k: int(v) for k, v in q.product_type.value_counts().items()},
            "harvest_t": round(float(hv[hv.year == y].t.sum()), 0),
            "irrigation_m3": round(float(ir[ir.year == y].m3.sum()), 0),
        })

    labour = pd.read_csv(DATA / "synthetic" / "synthetic_labour.csv", dtype=s)
    lab = labour[labour.holding_id == FARM]
    profile = {
        "farm": FARM,
        "source": "synthetic_holding, synthetic_parcel, synthetic_fertilisation, synthetic_plant_protection, synthetic_harvest, synthetic_irrigation, synthetic_labour (synthetic)",
        "holding": {"nuts3": h.nuts3, "uaa_ha": float(h.uaa_ha), "organic": int(h.organic), "farm_type_tf8": int(h.farm_type_tf8),
                    "natura2000": int(h.natura2000_flag)},
        "parcels": [{"id": r.parcel_id, "crop": r.crop_current, "area_ha": float(r.area_ha), "tenure": r.tenure} for _, r in p.iterrows()],
        "yearly": yearly,
        "labour": [{"category": r.worker_category, "annual_hours": int(r.annual_hours), "awu": float(r.awu)} for _, r in lab.iterrows()],
    }
    dest = ROOT / "app" / "src" / "data" / f"profile_{FARM.lower().replace('-', '')}.json"
    dest.write_text(json.dumps(profile, indent=1))
    print(f"profile -> {dest}")


if __name__ == "__main__":
    main()
