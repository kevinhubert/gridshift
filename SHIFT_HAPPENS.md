# GridShift — "ShiftHappens"

## What We Built Tonight

**GridShift** is an ERCOT energy price optimization dashboard. The idea: monitor real-time settlement point prices, identify cheapest times to run flexible loads (EV, pool pump, dishwasher, etc.), and give Kevin a dashboard that tells him "run your laundry at 9 AM, not 6 PM" to save money.

### Architecture

```
ERCOT HTML Scraping → Supabase Edge Functions → React Dashboard
     (every 15 min)        (cache-prices)         (get-prices)
                            (get-insights)
```

### What's Working
- ✅ `cache-prices` edge function — scrapes ERCOT public HTML, inserts into `price_cache` table (runs via pg_cron every 15 min)
- ✅ `get-prices` edge function — returns price history for a hub/day
- ✅ `get-insights` edge function — calculates cheapest 4-hour windows per device type
- ✅ Supabase project wired up, schema deployed, functions live
- ✅ GitHub repo: https://github.com/kevinhubert/gridshift
- ✅ Dashboard scaffold (React + Vite + Tailwind + Recharts) running at localhost:3000

### What's Broken / TODO
- ❌ Dashboard still shows demo data (not pulling from edge function)
- ❌ `get-prices` returns data for `2026-04-08` but frontend isn't picking it up
- ❌ 9 duplicate entries per interval in price_cache (parser issue — 9 hubs parsed, should be more)
- ❌ `get-prices` only returns data through 18:00 (missing evening peak data from cache-prices run)
- ❌ Dashboard needs real data wired up, then needs UI polish

### Key Files
```
gridshift/
├── supabase/
│   ├── schema.sql              # DB schema with RLS policies
│   └── functions/
│       ├── cache-prices/       # Scrapes ERCOT, populates price_cache
│       ├── get-prices/         # Returns price data by hub/day
│       └── get-insights/       # Calculates optimal windows
├── dashboard/                  # React frontend
│   ├── src/App.tsx             # Main app with data fetching
│   ├── src/pages/Dashboard.tsx # Dashboard page
│   └── .env                    # Supabase config (VITE_* vars)
└── README.md
```

### Next Steps (Brainstorm)
1. **Fix dashboard data fetching** — App.tsx has the fetch logic but isn't connecting to live data correctly. Debug why `get-prices` response isn't feeding into state.
2. **Fix the duplicate parser issue** — `cache-prices/index.ts` is inserting 9x records per interval. Something in the row parsing is producing duplicates.
3. **Data完整性** — get-prices only returning through 18:00. Evening prices (peak at 8-9 PM) are missing from what we can see. Need to figure out if ERCOT page updates later or if there's a data gap.
4. **Dashboard UI** — Real data chart, hub selector, device cards showing optimal windows
5. **Auth** — Add Supabase auth so users can save their devices and preferences
6. **Notifications** — "Prices are low right now, run your dishwasher" via email/Push
7. **Home Assistant / Google Home integration** — actual smart home control, not just recommendations
8. **Home batteries (Tesla Powerwall)** — with ERCOT RTC+B live, batteries can now do real arbitrage (buy low/sell high on the real-time market)

## The "ShiftHappens" Concept

The name GridShift came first. ShiftHappens happened when Kevin said "well, it's GridShift — shit happens, grid happens, you know."

Core insight: **the grid is predictable chaos**. Prices spike at predictable times (evenings, hot summer afternoons). If you're smart about *when* you use energy, you can cut bills significantly. Texas has some of the most volatile spot prices in the country — great for optimization.

Target persona: Texas homeowners with EVs, pools, or smart appliances who want to be intentional about their energy usage without thinking about it.

## Tech Stack Decisions
- **HTML scraping over ERCOT API**: ERCOT's API requires OAuth + subscription keys. The public HTML page has the same data, free, no auth. Easy choice.
- **Supabase Edge Functions over raw Node cron**: Cleaner deployment, auto-scales, native DB access, built-in cron.
- **Service role key for DB access**: Edge functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS on public price data.
- **Auth deferred**: Dashboard first, auth later. MVP should be testable without login.

## Kevin's Context
- 36, Staff Software Engineer, Austin TX
- Philosophy major at Texas A&M (2011)
- Has Tesla EV, pool pump, smart home (Google ecosystem)
- Building this to "learn about the universe" and "build cool shit"
- Works full-time, evenings after kids sleep
- Follows space/Artemis as emotional grounding
- Anti-war, quit drinking July 2025

## Revenue Model (Brainstorm)
- SaaS subscription: $5-20/month for home users, higher tiers for small commercial
- "GridShift Pro": smarter predictions, home battery optimization, smart home integrations
- Adjacent: energy consulting for businesses, demand response aggregation

---

*Session log: April 8, 2026. Started from scratch, had working prototype by end of night. Kevin called it "pretty awesome."*