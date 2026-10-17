// Bounding boxes (WGS84 lat/lng – the same coordinate system Google Maps / OpenStreetMap use)
// for the eight NUTS3 regions in the organisers' dataset. Mainland extent only.
// APPROXIMATE values, only used for quick checks. The map draws the official boundary from src/data/nuts/<NUTS_ID>.json
// (download with scripts/fetch_nuts.sh – Eurostat GISCO, https://ec.europa.eu/eurostat/web/nuts).
// Format: [[south, west], [north, east]]

// Kuluri is for European agriculture only: the map never leaves continental Europe.
// Covers the EU mainland, Ireland, the Nordics, the Mediterranean islands and Cyprus.
// Overseas/outermost regions (e.g. French Guiana, Réunion, Canary Islands, Azores, Madeira) are outside
// this box on purpose – they could be shown later as separate inset maps.
export const EUROPE_BBOX = [[34.5, -10.8], [71.3, 34.8]]

export const REGION_BBOX = {
  ITC4C: { name: 'Milano', bbox: [[45.16, 8.70], [45.65, 9.55]] },
  ITH55: { name: 'Bologna', bbox: [[44.05, 10.80], [44.81, 11.85]] },
  ITF63: { name: 'Catanzaro', bbox: [[38.45, 16.05], [39.20, 16.90]] },
  DE242: { name: 'Bayreuth (Kreisfreie Stadt)', bbox: [[49.90, 11.52], [49.99, 11.65]] },
  ES418: { name: 'Valladolid', bbox: [[41.08, -5.62], [42.33, -4.08]] },
  FRB06: { name: 'Loiret', bbox: [[47.48, 1.51], [48.35, 3.13]] },
  NL226: { name: 'Arnhem/Nijmegen', bbox: [[51.75, 5.55], [52.25, 6.25]] },
  PL415: { name: 'Miasto Poznań', bbox: [[52.29, 16.73], [52.51, 17.07]] },
}

// Is a point inside a bbox? Used to check that a farm pin lies in its NUTS3 region.
export const inBox = ([lat, lng], [[s, w], [n, e]]) => lat >= s && lat <= n && lng >= w && lng <= e
