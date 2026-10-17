<script setup>
// Interactive map for workers: where the farm is and how to get there.
// Stack aligned with the team's map infrastructure: MapLibre GL JS, OpenStreetMap base map,
// all data in EPSG:4326 (WGS84 lat/lng – same as Google Maps), official NUTS boundaries from Eurostat GISCO.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { lang, t } from '../data/i18n.js'
import { EUROPE_BBOX, inBox } from '../data/regions.js'

const props = defineProps({
  location: { type: Object, required: true }, // { lat, lng, approximate }
  housing: { type: Object, default: null }, // { lat, lng }
  region: { type: Object, default: null }, // GeoJSON FeatureCollection of the farm's NUTS3 region (EPSG:4326)
})
const el = ref(null)
let map

// MapLibre uses [lng, lat] order
const [[S, W], [N, E]] = EUROPE_BBOX
const EUROPE = [[W, S], [E, N]]

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

function pinEl(color, icon) {
  const d = document.createElement('div')
  d.innerHTML = `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #f5f2eb;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:pointer">
    <span class="material-icons" style="transform:rotate(45deg);color:#f5f2eb;font-size:18px">${icon}</span></div>`
  return d
}

function boundsOf(fc) {
  const b = new maplibregl.LngLatBounds()
  const walk = (c) => (typeof c[0] === 'number' ? b.extend(c) : c.forEach(walk))
  fc.features.forEach((f) => walk(f.geometry.coordinates))
  return b
}

function render() {
  map?.remove()
  const { lat, lng, approximate } = props.location
  if (!inBox([lat, lng], EUROPE_BBOX)) console.warn('Farm location is outside the Europe map area', lat, lng)

  map = new maplibregl.Map({
    container: el.value,
    style: OSM_STYLE,
    bounds: props.region ? boundsOf(props.region) : undefined,
    fitBoundsOptions: { padding: 24 },
    center: props.region ? undefined : [lng, lat],
    zoom: props.region ? undefined : 12,
    maxBounds: EUROPE, // Europe only – no overseas territories
    renderWorldCopies: false,
    attributionControl: { compact: true, customAttribution: props.region ? '© EuroGeographics (NUTS boundaries)' : undefined },
    dragRotate: false,
  })
  map.touchZoomRotate.disableRotation()
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

  map.on('load', () => {
    if (props.region) {
      map.addSource('region', { type: 'geojson', data: props.region })
      map.addLayer({ id: 'region-fill', type: 'fill', source: 'region', paint: { 'fill-color': '#5f7556', 'fill-opacity': 0.07 } })
      map.addLayer({ id: 'region-line', type: 'line', source: 'region', paint: { 'line-color': '#3e4c39', 'line-width': 2, 'line-dasharray': [3, 2] } })
      const name = props.region.features[0]?.properties
      const label = document.createElement('div')
      label.innerHTML = `<div style="white-space:nowrap;font:700 11px system-ui;color:#3e4c39;background:#f5f2ebdd;padding:2px 6px;border-radius:6px">NUTS3 ${name?.NUTS_ID} · ${name?.NUTS_NAME}</div>`
      const b = boundsOf(props.region)
      new maplibregl.Marker({ element: label, anchor: 'top-left' }).setLngLat([b.getWest(), b.getNorth()]).addTo(map)
    }

    if (approximate) {
      // ~900 m uncertainty circle as a polygon (64 points)
      const ring = Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * 2 * Math.PI
        return [lng + (0.9 / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (0.9 / 110.57) * Math.sin(a)]
      })
      map.addSource('approx', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } } })
      map.addLayer({ id: 'approx', type: 'fill', source: 'approx', paint: { 'fill-color': '#5f7556', 'fill-opacity': 0.12 } })
    }

    if (props.housing) {
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[props.housing.lng, props.housing.lat], [lng, lat]] } } })
      map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#668b86', 'line-width': 3, 'line-dasharray': [2, 2] } })
      new maplibregl.Marker({ element: pinEl('#668b86', 'home'), anchor: 'bottom' })
        .setLngLat([props.housing.lng, props.housing.lat])
        .setPopup(new maplibregl.Popup({ offset: 30 }).setText(t('housingPin')))
        .addTo(map)
    }

    const farmPopup = new maplibregl.Popup({ offset: 30 }).setHTML(`<b>FARM-13079</b><br>${t('yard')}`)
    new maplibregl.Marker({ element: pinEl('#5f7556', 'agriculture'), anchor: 'bottom' }).setLngLat([lng, lat]).setPopup(farmPopup).addTo(map).togglePopup()
  })
}

function zoomToFarm() {
  map?.flyTo({ center: [props.location.lng, props.location.lat], zoom: 14 })
}
defineExpose({ zoomToFarm })

onMounted(render)
watch(lang, render)
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div class="map-wrap">
    <div ref="el" class="farm-map" />
    <q-btn round unelevated size="sm" color="primary" icon="o_my_location" class="zoom-farm" @click="zoomToFarm" :aria-label="t('yard')" />
  </div>
</template>

<style scoped>
.map-wrap { position: relative; }
.farm-map { height: 360px; width: 100%; border-radius: 14px; border: 1px solid var(--line); overflow: hidden; background: #e5e0d4; }
.zoom-farm { position: absolute; top: 10px; right: 10px; z-index: 2; }
.farm-map :deep(.maplibregl-ctrl-attrib) { font-size: 10px; }
</style>
