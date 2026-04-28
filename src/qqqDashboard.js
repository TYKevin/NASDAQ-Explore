const ZONES = [
  {
    max: 10,
    badge: "🟢",
    text: "Normal fluctuation (<10%)",
    color: "#22c55e"
  },
  {
    max: 20,
    badge: "🟡",
    text: "Mild discount (10%–20%)",
    color: "#eab308"
  },
  {
    max: 30,
    badge: "🟠",
    text: "Bear-market discount (20%–30%)",
    color: "#f97316"
  },
  {
    max: Infinity,
    badge: "🔴",
    text: "Deep discount (≥30%)",
    color: "#ef4444"
  }
]

const DOWNSIDE_COLOR = "#ef4444"
const UPSIDE_COLOR = "#22c55e"

export function formatPrice(value) {
  return formatNumber(value, 2)
}

export function formatPercent(value) {
  return formatNumber(value, 2)
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "--"
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

export function calculateDrawdown({ currentPrice, week52High, week52Low }) {
  if (!isPositiveNumber(currentPrice) || !isPositiveNumber(week52High)) {
    throw new Error("currentPrice and week52High must be positive numbers")
  }

  const pctSigned = ((currentPrice - week52High) / week52High) * 100
  const pctAbs = Math.abs(pctSigned)
  const pctCap = Math.min(pctAbs, 100)
  const zone = ZONES.find((item) => pctCap <= item.max)
  const barWidth = Math.min(100, Math.round((pctCap / 40) * 100))

  return {
    currentPrice,
    week52High,
    week52Low,
    highFmt: formatPrice(week52High),
    lowFmt: formatPrice(week52Low),
    nowFmt: formatPrice(currentPrice),
    pctSigned,
    pctDisplay: formatPercent(pctSigned),
    pctAbs,
    pctCap,
    pctCapDisplay: formatPercent(pctCap),
    barWidth,
    zoneBadge: zone.badge,
    zoneText: zone.text,
    zoneColor: zone.color,
    pctColor: pctSigned < 0 ? DOWNSIDE_COLOR : UPSIDE_COLOR
  }
}

export function calculateRangePosition({ currentPrice, week52Low, week52High }) {
  if (!isPositiveNumber(currentPrice) || !isPositiveNumber(week52Low) || !isPositiveNumber(week52High)) {
    return 0
  }

  const range = week52High - week52Low

  if (range <= 0) {
    return 0
  }

  const position = ((currentPrice - week52Low) / range) * 100

  return Math.min(100, Math.max(0, Math.round(position)))
}

export function extractQqqSnapshot(chartPayload) {
  const result = chartPayload?.chart?.result?.[0]
  const quote = result?.indicators?.quote?.[0]
  const meta = result?.meta

  if (!result || !quote || !meta) {
    throw new Error("Yahoo Finance chart response is missing quote data")
  }

  const highs = quote.high ?? []
  const lows = quote.low ?? []
  const closes = quote.close?.filter(isPositiveNumber) ?? []
  const week52HighPoint = findExtremePricePoint(highs, result.timestamp, 'max')
  const week52LowPoint = findExtremePricePoint(lows, result.timestamp, 'min')
  const currentPrice = firstPositiveNumber([
    meta.regularMarketPrice,
    meta.postMarketPrice,
    closes.at(-1)
  ])

  if (!isPositiveNumber(currentPrice) || !week52HighPoint || !week52LowPoint) {
    throw new Error("Yahoo Finance chart response has incomplete price data")
  }

  return {
    symbol: meta.symbol ?? "QQQ",
    currency: meta.currency ?? "USD",
    currentPrice,
    week52High: week52HighPoint.price,
    week52HighTime: week52HighPoint.time,
    week52Low: week52LowPoint.price,
    week52LowTime: week52LowPoint.time,
    marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()
  }
}

export function firstPositiveNumber(values) {
  return values.find(isPositiveNumber)
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0
}

function findExtremePricePoint(values, timestamps = [], mode) {
  return values.reduce((selected, value, index) => {
    if (!isPositiveNumber(value)) {
      return selected
    }

    const isBetter = !selected
      || (mode === 'max' ? value > selected.price : value < selected.price)

    if (!isBetter) {
      return selected
    }

    return {
      price: value,
      time: timestamps[index] ? timestamps[index] * 1000 : null
    }
  }, null)
}
