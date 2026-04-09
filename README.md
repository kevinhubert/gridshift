# GridShift

> Stop paying ERCOT's peak tax. Find the cheapest hours to run your flexible loads.

GridShift monitors live and day-ahead electricity prices from ERCOT, then recommends the optimal times to run flexible loads (EV chargers, pool pumps, dishwashers, etc.) based on your household's schedule.

## How it works

ERCOT wholesale electricity prices fluctuate every 15 minutes — sometimes 6–10x between midnight and 4 PM. GridShift watches those prices and tells you when to run your appliances.

## Tech Stack

- **Frontend:** React + Vite (hosted on Vercel)
- **Backend:** Supabase Edge Functions (TypeScript)
- **Database:** Supabase (Postgres + RLS)
- **Data source:** ERCOT public real-time settlement point prices

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (free tier works)

### Install

```bash
npm install
```

### Run the fetcher locally

```bash
# Single fetch
npm run fetch

# Loop (polls every 15 min)
npm run fetch:loop
```

### Supabase setup

1. Create a project at https://supabase.com
2. Run the schema from `supabase/schema.sql`
3. Copy `.env.example` to `.env` and fill in your keys
4. Deploy edge functions with `supabase functions deploy`

### Frontend

```bash
cd dashboard
npm install
npm run dev
```

## Project structure

```
gridshift/
├── src/
│   ├── fetcher/
│   │   ├── ercot.mjs       # Core scraping logic
│   │   └── ercot-loop.mjs  # 15-min polling loop
│   ├── lib/
│   │   └── supabase.ts     # Supabase client
│   └── functions/          # Supabase Edge Functions
│       ├── cache-prices.ts # Cron: fetch + store ERCOT prices
│       ├── get-prices.ts   # Public: fetch latest prices
│       └── get-insights.ts # Calculate optimal windows
└── dashboard/              # React frontend
```

## ERCOT data

GridShift uses ERCOT's public real-time settlement point prices (SPPs), updated every 15 minutes. No API key required — data is scraped from the public HTML dashboard at `https://www.ercot.com/content/cdr/html/real_time_spp.html`.

The most useful hubs for Austin-area residents:
- `LZ_HOUSTON` — Houston load zone (closest to Austin)
- `HB_HOUSTON` — Houston hub
- `LZ_RAYBN` — Rayban zone (sometimes has extreme spreads)

## License

MIT
