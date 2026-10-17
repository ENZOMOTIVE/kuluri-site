#!/usr/bin/env bash
# Download official NUTS 2024 region boundaries (Eurostat GISCO) for the dataset's eight NUTS3 regions.
# Coordinate system: EPSG:4326 (WGS84, same as Google Maps / OpenStreetMap). Scale 1:10M (small files).
# Source: https://ec.europa.eu/eurostat/web/nuts  ·  Attribution required: © EuroGeographics for the administrative boundaries.
# Usage (from repo root):  bash app/scripts/fetch_nuts.sh
set -euo pipefail
OUT="$(dirname "$0")/../src/data/nuts"
mkdir -p "$OUT"
for id in DE242 ES418 FRB06 ITC4C ITF63 ITH55 NL226 PL415; do
  curl -sSf "https://gisco-services.ec.europa.eu/distribution/v2/nuts/distribution/${id}-region-10m-4326-2024.geojson" -o "$OUT/${id}.json"
  echo "saved $OUT/${id}.json"
done
