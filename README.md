# NASDAQ Explore

NASDAQ Explore is a small Vue 3 + Vite project for exploring NASDAQ-related market signals through focused, practical dashboard modules.

The current homepage is the first module: **QQQ Drawdown Dashboard**. It tracks where QQQ sits relative to its 52-week range, calculates the current drawdown from the 52-week high, and visualizes both the drawdown zone and the current price position between the 52-week low and high.

This module is expected to become one section of a broader NASDAQ exploration tool as more features are added.

## Features

Current QQQ Drawdown Dashboard features:

- Live QQQ price data through a Vercel API route.
- 52-week high and low display with the date each level occurred.
- Current drawdown from the 52-week high.
- Drawdown zone labels:
  - Normal fluctuation: under 10%.
  - Mild discount: 10% to 20%.
  - Bear-market discount: 20% to 30%.
  - Deep discount: 30% and above.
- Horizontal 52-week range chart showing the current price position.
- Automatic refresh every 10 seconds.
- Manual refresh button.

Planned direction:

- Add more NASDAQ-focused modules beyond QQQ drawdown.
- Keep each module small, readable, and useful as a standalone market signal.
- Grow the homepage into a navigation surface for multiple exploration tools.

## Data Source

The API route in `api/qqq.js` requests QQQ chart data from Yahoo Finance and derives:

- Current price.
- 52-week high.
- 52-week high date.
- 52-week low.
- 52-week low date.

The frontend reads from `/api/qqq`, so the browser does not need to call Yahoo Finance directly.

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

## Vercel Deployment

Use these project settings on Vercel:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Vercel will automatically expose `api/qqq.js` as a serverless API route.

## Acknowledgements

The QQQ Drawdown Dashboard module is based on [Nick Wang](https://github.com/nickwangk)'s initial idea and design, originally expressed through [Nick Wang](https://github.com/nickwangk)'s iOS Shortcuts workflow. Special thanks to [Nick Wang](https://github.com/nickwangk) for shaping the concept and visual direction of this first module.
