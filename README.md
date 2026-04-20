# GridShift

> Free dashboard for ERCOT wholesale prices — see when power is cheap so you can time flexible loads.

GridShift reads **public** ERCOT real-time settlement point prices and presents them in a small, polished UI (map + price curve and related views). There are **no accounts**; it is a single shared experience suitable for a **public portfolio** repo.

**Documentation:** Layout, stack, design tokens, and agent conventions live in [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md).

## How it works

ERCOT wholesale prices move every 15 minutes. This project scrapes the public HTML table (no OAuth API key), optionally stores history in **Supabase**, and serves it through **edge functions** to the **Vite + React** dashboard. Without Supabase env vars, the UI still runs using **demo** price data.

## Tech stack

- **Frontend:** React + Vite, React Router, Tailwind, shadcn/ui
- **Optional backend:** Supabase (Postgres + RLS) + Edge Functions
- **Data source:** ERCOT public real-time SPP page

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npm install --prefix dashboard
```

### Frontend (local)

```bash
npm run dev
```

Opens the Vite app (default [http://localhost:3000](http://localhost:3000)). Configure optional backends:

```bash
cp dashboard/.env.example dashboard/.env
# Edit dashboard/.env — see PROJECT_GUIDE for variable meanings
```

### Run the fetcher locally (optional)

```bash
npm run fetch        # single scrape
npm run fetch:loop   # poll every 15 minutes
```

### Supabase (optional, for live data)

1. Create a project at [https://supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Set `VITE_*` variables in `dashboard/.env` from `.env.example`
4. Deploy functions: `supabase functions deploy`

## Project structure

```
gridshift/
├── src/
│   └── fetcher/           # ERCOT HTML scrape (Node)
├── supabase/
│   ├── schema.sql
│   └── functions/         # cache-prices, get-prices, get-insights
└── dashboard/             # React frontend
```

## ERCOT data

Data source: `https://www.ercot.com/content/cdr/html/real_time_spp.html` — no API key.

Example hubs:

- `LZ_HOUSTON` — Houston load zone
- `HB_HOUSTON` — Houston hub
- `LZ_RAYBN` — Rayburn zone

## License

MIT
