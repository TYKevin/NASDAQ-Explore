import { extractQqqSnapshot } from '../src/qqqDashboard.js'

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=1y&interval=1d'

export default async function handler(request, response) {
  try {
    const snapshot = await fetchQqqSnapshot()

    response.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30')
    response.status(200).json(snapshot)
  } catch (error) {
    response.status(502).json({
      message: error instanceof Error ? error.message : 'Failed to fetch QQQ market data'
    })
  }
}

export async function fetchQqqSnapshot(fetcher = fetch) {
  const marketResponse = await fetcher(YAHOO_CHART_URL, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0'
    }
  })

  if (!marketResponse.ok) {
    throw new Error(`Yahoo Finance request failed: ${marketResponse.status}`)
  }

  return extractQqqSnapshot(await marketResponse.json())
}
