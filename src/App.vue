<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { buildICostRecordUrl } from './icostShortcut.js'
import { calculateDrawdown, calculateRangePosition } from './qqqDashboard.js'

const REFRESH_INTERVAL_SECONDS = 10

const state = reactive({
  isLoading: true,
  error: '',
  lastUpdated: '',
  secondsUntilRefresh: REFRESH_INTERVAL_SECONDS,
  snapshot: null,
  tradeDialog: {
    isOpen: false,
    side: 'buy',
    amount: '',
    error: ''
  }
})

let refreshTimerId = null
let countdownTimerId = null

const dashboard = computed(() => {
  if (!state.snapshot) {
    return {
      highFmt: '--',
      lowFmt: '--',
      nowFmt: '--',
      pctDisplay: '--',
      pctCapDisplay: '--',
      barWidth: 0,
      zoneBadge: '⚪️',
      zoneText: 'Waiting for market data',
      zoneColor: '#94a3b8',
      pctColor: '#94a3b8',
      rangePosition: 0
    }
  }

  const values = {
    currentPrice: state.snapshot.currentPrice,
    week52High: state.snapshot.week52High,
    week52Low: state.snapshot.week52Low
  }

  return {
    ...calculateDrawdown(values),
    rangePosition: calculateRangePosition(values)
  }
})

const progressStyle = computed(() => ({
  width: `${dashboard.value.barWidth}%`,
  background: dashboard.value.zoneColor
}))

const rangeMarkerStyle = computed(() => ({
  left: `${dashboard.value.rangePosition}%`,
  background: dashboard.value.pctColor
}))

const highDate = computed(() => formatDate(state.snapshot?.week52HighTime))
const lowDate = computed(() => formatDate(state.snapshot?.week52LowTime))

async function loadMarketData() {
  state.isLoading = true
  state.error = ''
  state.secondsUntilRefresh = REFRESH_INTERVAL_SECONDS

  try {
    const response = await fetch('/api/qqq')

    if (!response.ok) {
      throw new Error(`Market data request failed: ${response.status}`)
    }

    const snapshot = await response.json()
    state.snapshot = snapshot
    state.lastUpdated = formatDateTime(snapshot.marketTime ?? Date.now())
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Failed to load market data'
  } finally {
    state.isLoading = false
  }
}

function openTradeDialog(side) {
  state.tradeDialog.isOpen = true
  state.tradeDialog.side = side
  state.tradeDialog.amount = ''
  state.tradeDialog.error = ''
}

function closeTradeDialog() {
  state.tradeDialog.isOpen = false
  state.tradeDialog.error = ''
}

function submitTradeRecord() {
  try {
    const recordUrl = buildICostRecordUrl({
      side: state.tradeDialog.side,
      amount: state.tradeDialog.amount
    })

    window.location.href = recordUrl
    closeTradeDialog()
  } catch (error) {
    state.tradeDialog.error = error instanceof Error ? error.message : 'Unable to build iCost record URL'
  }
}

function formatDateTime(value) {
  if (!value) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value))
}

function formatDate(value) {
  if (!value) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(value))
}

onMounted(() => {
  loadMarketData()

  refreshTimerId = window.setInterval(loadMarketData, REFRESH_INTERVAL_SECONDS * 1000)
  countdownTimerId = window.setInterval(() => {
    state.secondsUntilRefresh = state.secondsUntilRefresh > 1
      ? state.secondsUntilRefresh - 1
      : REFRESH_INTERVAL_SECONDS
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimerId)
  window.clearInterval(countdownTimerId)
})
</script>

<template>
  <main class="dashboard-page">
    <section class="dashboard-shell">
      <p class="eyebrow">QQQ DRAWDOWN DASHBOARD</p>

      <section class="summary-grid" aria-label="QQQ drawdown summary">
        <article class="panel metrics-panel">
          <div class="metric-row">
            <span class="metric-label">52W High</span>
            <span class="metric-stack">
              <strong class="metric-value">{{ dashboard.highFmt }}</strong>
              <span class="metric-date">{{ highDate }}</span>
            </span>
          </div>

          <div class="metric-row">
            <span class="metric-label">52W Low</span>
            <span class="metric-stack">
              <strong class="metric-value metric-value--muted">{{ dashboard.lowFmt }}</strong>
              <span class="metric-date">{{ lowDate }}</span>
            </span>
          </div>

          <div class="metric-row">
            <span class="metric-label">Current</span>
            <strong class="metric-value">{{ dashboard.nowFmt }}</strong>
          </div>
        </article>

        <section class="panel range-panel" aria-label="Current price position inside 52 week range">
          <div class="range-header">
            <span>52W Range Position</span>
            <strong>{{ dashboard.rangePosition }}%</strong>
          </div>

          <div class="price-range-bar">
            <span class="range-fill" :style="{ width: `${dashboard.rangePosition}%` }"></span>
            <span class="range-marker" :style="rangeMarkerStyle">
              <span class="range-marker-label">Current {{ dashboard.nowFmt }}</span>
            </span>
          </div>

          <div class="range-labels">
            <span>
              <strong>Low {{ dashboard.lowFmt }}</strong>
              <small>{{ lowDate }}</small>
            </span>
            <span>
              <strong>High {{ dashboard.highFmt }}</strong>
              <small>{{ highDate }}</small>
            </span>
          </div>
        </section>

        <article class="panel status-panel">
          <strong class="drawdown-value" :style="{ color: dashboard.pctColor }">
            {{ dashboard.pctDisplay }}%
          </strong>

          <div class="zone-row">
            <span class="zone-badge">{{ dashboard.zoneBadge }}</span>
            <strong class="zone-text" :style="{ color: dashboard.zoneColor }">
              {{ dashboard.zoneText }}
            </strong>
          </div>
        </article>
      </section>

      <section class="panel progress-panel" aria-label="Drawdown progress">
        <div class="scale-row">
          <span>0%</span>
          <span>10%</span>
          <span>20%</span>
          <span>30%</span>
          <span>100%</span>
        </div>

        <div class="range-track" aria-hidden="true">
          <span class="range-segment range-segment--green"></span>
          <span class="range-segment range-segment--yellow"></span>
          <span class="range-segment range-segment--orange"></span>
          <span class="range-segment range-segment--red"></span>
        </div>

        <div class="progress-overlay" aria-hidden="true">
          <span class="progress-fill" :style="progressStyle"></span>
        </div>

        <div class="progress-caption">
          <span>Absolute move from 52W high</span>
          <strong>{{ dashboard.pctCapDisplay }}%</strong>
        </div>
      </section>

      <section class="panel quick-record-panel" aria-label="Quick iCost record">
        <div class="quick-record-copy">
          <strong>Quick iCost Record</strong>
          <span>Book: Daily · Category: Investment · Currency: USD</span>
        </div>

        <div class="quick-record-actions">
          <button class="trade-button trade-button--buy" type="button" @click="openTradeDialog('buy')">
            Buy
          </button>
          <button class="trade-button trade-button--sell" type="button" @click="openTradeDialog('sell')">
            Sell
          </button>
        </div>
      </section>

      <section class="toolbar" aria-label="Market data status">
        <button class="refresh-button" type="button" :disabled="state.isLoading" @click="loadMarketData">
          {{ state.isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>

        <div class="data-status">
          <span v-if="state.isLoading">Loading real-time QQQ data...</span>
          <span v-else-if="state.error" class="error-text">{{ state.error }}</span>
          <span v-else>
            Last updated {{ state.lastUpdated }} · Auto refresh in {{ state.secondsUntilRefresh }}s · {{ state.snapshot?.currency ?? 'USD' }}
          </span>
        </div>
      </section>

      <div v-if="state.tradeDialog.isOpen" class="modal-backdrop" role="presentation">
        <section class="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-modal-title">
          <div class="trade-modal-header">
            <h2 id="trade-modal-title">
              {{ state.tradeDialog.side === 'buy' ? 'Record QQQ Buy' : 'Record QQQ Sell' }}
            </h2>
            <button class="icon-button" type="button" aria-label="Close" @click="closeTradeDialog">×</button>
          </div>

          <form class="trade-form" @submit.prevent="submitTradeRecord">
            <label class="amount-field">
              <span>Amount</span>
              <input
                v-model="state.tradeDialog.amount"
                type="number"
                inputmode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                autofocus
              >
            </label>

            <p v-if="state.tradeDialog.error" class="error-text">{{ state.tradeDialog.error }}</p>

            <div class="trade-modal-actions">
              <button class="secondary-button" type="button" @click="closeTradeDialog">Cancel</button>
              <button class="primary-button" type="submit">
                Open iCost
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  </main>
</template>
