// Buyer relationships derived from the farm's real (synthetic) sales.
// Source: combined_challenge3_sales_certification_ready (see app/scripts/extract_farm.py)
import salesData from './sales_farm13079.json'

export const TODAY = new Date('2026-10-17')
export const sales = salesData.sales
export const certificates = salesData.certificates
export const CERT_DATA_FROM = 2024 // certificates in the dataset only cover 2024–2026

const yearAgo = new Date(TODAY)
yearAgo.setFullYear(yearAgo.getFullYear() - 1)

// value-weighted mean price deviation vs. monthly reference
function weightedDev(list) {
  const withRef = list.filter((s) => s.price_dev_pct !== null)
  const v = withRef.reduce((a, s) => a + s.value_eur, 0)
  return v ? withRef.reduce((a, s) => a + s.price_dev_pct * s.value_eur, 0) / v : null
}

export const buyers = Object.values(
  sales.reduce((acc, s) => {
    const b = (acc[s.buyer] ??= { id: s.buyer, sales: [] })
    b.sales.push(s)
    return acc
  }, {}),
)
  .map((b) => {
    const last = b.sales[b.sales.length - 1]
    return {
      id: b.id,
      sales: b.sales,
      count: b.sales.length,
      first: b.sales[0].date,
      last: last.date,
      active: new Date(last.date) >= yearAgo,
      products: [...new Set(b.sales.map((s) => s.product))],
      contracts: [...new Set(b.sales.map((s) => s.contract))],
      volume: b.sales.reduce((a, s) => a + s.volume_t, 0),
      value: b.sales.reduce((a, s) => a + s.value_eur, 0),
      dev: weightedDev(b.sales),
    }
  })
  .sort((a, b) => b.last.localeCompare(a.last))

export const summary = (() => {
  const s25 = sales.filter((s) => s.year === 2025)
  const certEra = sales.filter((s) => s.year >= CERT_DATA_FROM)
  return {
    buyersTotal: buyers.length,
    buyersActive: buyers.filter((b) => b.active).length,
    value2025: s25.reduce((a, s) => a + s.value_eur, 0),
    sales2025: s25.length,
    dev: weightedDev(sales),
    certCovered: certEra.filter((s) => s.certified).length,
    certTotal: certEra.length,
  }
})()

export const byYearContract = (() => {
  const years = [...new Set(sales.map((s) => s.year))].sort()
  return years.map((y) => {
    const row = { year: String(y), SPOT: 0, FORWARD: 0, COOPERATIVE: 0 }
    sales.filter((s) => s.year === y).forEach((s) => { row[s.contract] += Math.round(s.value_eur) })
    return row
  })
})()

export const fmtEur = (v) => '€' + Math.round(v).toLocaleString('en')
export const fmtPct = (v) => (v === null ? '–' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`)
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
