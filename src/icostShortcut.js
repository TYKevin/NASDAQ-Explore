const SIDE_CONFIG = {
  buy: {
    action: 'expense',
    remark: 'QQQ Buy'
  },
  sell: {
    action: 'income',
    remark: 'QQQ Sell'
  }
}

export function buildICostRecordUrl({
  side,
  amount,
  currency = 'USD',
  category = 'Investment',
  book = 'Daily'
}) {
  const config = SIDE_CONFIG[side]
  const normalizedAmount = normalizeAmount(amount)

  if (!config) {
    throw new Error('Side must be buy or sell')
  }

  const params = new URLSearchParams({
    amount: normalizedAmount,
    currency,
    category,
    book,
    remark: config.remark
  })

  return `iCost://${config.action}?${params.toString()}`
}

function normalizeAmount(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number')
  }

  return String(value).trim()
}
