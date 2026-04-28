import { describe, expect, it } from 'vitest'
import { calculateDrawdown, calculateRangePosition, extractQqqSnapshot } from './qqqDashboard.js'
import { buildICostRecordUrl } from './icostShortcut.js'

describe('calculateDrawdown', () => {
  it('matches the shortcut drawdown math for a mild discount', () => {
    const result = calculateDrawdown({
      currentPrice: 90,
      week52High: 100,
      week52Low: 70
    })

    expect(result.pctSigned).toBe(-10)
    expect(result.pctDisplay).toBe('-10.00')
    expect(result.pctCap).toBe(10)
    expect(result.barWidth).toBe(25)
    expect(result.pctColor).toBe('#ef4444')
    expect(result.zoneBadge).toBe('🟢')
    expect(result.zoneText).toBe('Normal fluctuation (<10%)')
    expect(result.lowFmt).toBe('70.00')
  })

  it('uses the deep discount zone and caps the progress width at 100', () => {
    const result = calculateDrawdown({
      currentPrice: 40,
      week52High: 100,
      week52Low: 30
    })

    expect(result.pctCap).toBe(60)
    expect(result.barWidth).toBe(100)
    expect(result.zoneBadge).toBe('🔴')
    expect(result.zoneText).toBe('Deep discount (≥30%)')
    expect(result.zoneColor).toBe('#ef4444')
  })

  it('shows upside moves in green while preserving absolute progress math', () => {
    const result = calculateDrawdown({
      currentPrice: 105,
      week52High: 100,
      week52Low: 80
    })

    expect(result.pctSigned).toBe(5)
    expect(result.pctDisplay).toBe('5.00')
    expect(result.pctColor).toBe('#22c55e')
    expect(result.barWidth).toBe(13)
  })
})

describe('extractQqqSnapshot', () => {
  it('extracts current price and 52 week high/low from Yahoo chart data', () => {
    const snapshot = extractQqqSnapshot({
      chart: {
        result: [
          {
            meta: {
              symbol: 'QQQ',
              currency: 'USD',
              regularMarketPrice: 431.25,
              regularMarketTime: 1710000000
            },
            timestamp: [1700000000, 1700086400, 1700172800, 1700259200],
            indicators: {
              quote: [
                {
                  high: [420, null, 452.5, 440],
                  low: [390.1, 401, null, 375.75],
                  close: [410, 430, 431.25]
                }
              ]
            }
          }
        ]
      }
    })

    expect(snapshot).toEqual({
      symbol: 'QQQ',
      currency: 'USD',
      currentPrice: 431.25,
      week52High: 452.5,
      week52HighTime: 1700172800000,
      week52Low: 375.75,
      week52LowTime: 1700259200000,
      marketTime: 1710000000000
    })
  })
})

describe('calculateRangePosition', () => {
  it('returns the current price position inside the 52 week low/high range', () => {
    expect(calculateRangePosition({
      currentPrice: 150,
      week52Low: 100,
      week52High: 200
    })).toBe(50)
  })

  it('clamps out-of-range current prices', () => {
    expect(calculateRangePosition({
      currentPrice: 250,
      week52Low: 100,
      week52High: 200
    })).toBe(100)
  })
})

describe('buildICostRecordUrl', () => {
  it('builds an iCost expense URL for QQQ buy records in the Daily book', () => {
    expect(buildICostRecordUrl({
      side: 'buy',
      amount: '123.45'
    })).toBe('iCost://expense?amount=123.45&currency=USD&category=Investment&book=Daily&remark=QQQ+Buy')
  })

  it('builds an iCost income URL for QQQ sell records in the Daily book', () => {
    expect(buildICostRecordUrl({
      side: 'sell',
      amount: 88
    })).toBe('iCost://income?amount=88&currency=USD&category=Investment&book=Daily&remark=QQQ+Sell')
  })

  it('rejects invalid amounts', () => {
    expect(() => buildICostRecordUrl({
      side: 'buy',
      amount: 'abc'
    })).toThrow('Amount must be a positive number')
  })
})
