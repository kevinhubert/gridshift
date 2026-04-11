# GridShift — project guide (for humans and agents)

This document is the **living reference** for repository layout, product context, dashboard architecture, design tokens, and conventions. Update it when you add major routes, dependencies, or design rules.

For a short product overview and setup commands, see the root [README.md](../README.md).

---

## Purpose

GridShift helps Texas electricity customers on ERCOT see when wholesale-style prices are high or low so they can **shift flexible loads** (EV charging, pool pumps, dishwashers, etc.) toward cheaper hours. The app is informational; users should confirm actual rates with their retail provider.

---

## Repository layout

| Path | Role |
|------|------|
| [dashboard/](../dashboard/) | **Primary web app** — Vite + React + TypeScript, React Router, Tailwind, shadcn/ui, **Nivo** (`@nivo/line`, `@nivo/geo`) |
| [src/](../src/) (repo root) | Node fetcher (`ercot.mjs`, `ercot-loop.mjs`), shared libs, Supabase edge function **source** (see below) |
| [supabase/](../supabase/) | `schema.sql`, `config.toml`, deployed edge functions under `functions/*` |

**Note:** Edge function implementations may also live under `src/functions/` in some setups; the deployed copies are under `supabase/functions/`. Align with whatever the team uses for `supabase functions deploy`.

---

## Dashboard tech stack

- **Build:** Vite 5, TypeScript (strict)
- **UI:** React 18, [shadcn/ui](https://ui.shadcn.com/) (Radix primitives + `class-variance-authority` + `tailwind-merge`), [`cn()` helper](../dashboard/src/lib/utils.ts)
- **Styling:** Tailwind CSS 3, `darkMode: 'class'`
- **Routing:** React Router 7 — [`createBrowserRouter`](../dashboard/src/router.tsx), layout with [`<Outlet />`](../dashboard/src/layouts/AppLayout.tsx)
- **Charts:** `@nivo/line` — today’s price curve in [`Dashboard.tsx`](../dashboard/src/pages/Dashboard.tsx) (`ResponsiveLine`, area gradient, average marker).
- **Geo map:** `@nivo/geo` plus **`d3-geo@1.x`** (same major as Nivo’s dependency) for `fitExtent` — scale/translate must match Nivo’s internal projection or the map renders microscopic. Choropleth in [`ERCOTMap.tsx`](../dashboard/src/components/dashboard/ERCOTMap.tsx), **static** import from [`HomePage`](../dashboard/src/pages/HomePage.tsx).
- **Analytics:** PostHog (`posthog-js`) — SPA pageviews captured on route change (see layout)
- **Backend client:** `@supabase/supabase-js` where used

### Environment variables (names only)

Defined in `dashboard/.env` (not committed with real secrets in a proper setup):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FUNCTION_BASE` — base URL for edge functions (e.g. `…/functions/v1`). If unset, the dashboard uses **demo price data**.

---

## Design system

### Brand assets

- **Logo:** Inline SVG + wordmark in [dashboard/src/components/brand/GridShiftLogo.tsx](../dashboard/src/components/brand/GridShiftLogo.tsx); `variant` is `light` or `dark` for “grid” text color (header passes theme).
- **Favicon:** `dashboard/public/favicon-blue.svg` (referenced from `index.html`).

### Typography

- **Primary font:** **Inter** (Google Fonts) — loaded in [dashboard/index.html](../dashboard/index.html). Weights in use: 400, 600.
- Body applies Inter via [dashboard/src/index.css](../dashboard/src/index.css).

### Color model

1. **Semantic tokens (shadcn / UI)**  
   CSS variables in `dashboard/src/index.css`: `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--ring`, etc. Light and `.dark` values are tuned to match GridShift **navy** and **neutral** (not generic gray).

2. **Extended palette (Tailwind)**  
   [dashboard/tailwind.config.js](../dashboard/tailwind.config.js) defines full scales: `navy`, `blue`, `orange`, `amber`, `green`, `neutral`. Use these for **marketing accents**, **charts**, and **one-off** UI (e.g. section headings, Nivo line/area hex colors).

3. **Charts**  
   Nivo line/choropleth use **explicit hex** where needed (e.g. `#4DA3FF`, `#132B45`) for series, gradients, and grid lines. Prefer aligning new chart colors with the `blue` / `navy` scales when possible.

### Theme behavior

- Theme is `light` | `dark`, persisted in `localStorage` (`theme`), applied by toggling the `dark` class on `document.documentElement`.

### Component conventions

- **Primitives:** `dashboard/src/components/ui/*` — generated/maintained via shadcn CLI (`npx shadcn@latest add <component>`). Do not treat these as an external package; **edit in place** when needed.
- **Composites:** Prefer `dashboard/src/components/` for app-specific building blocks (create as needed).
- **Pages:** `dashboard/src/pages/*` — route targets; keep data-loading in pages or layout as appropriate.

### Installed shadcn components (baseline)

`button`, `select`, `card`, `alert`, `badge` — extend with the CLI when new patterns are needed.

---

## Routing

| Path | Page | Notes |
|------|------|--------|
| `/` | [HomePage](../dashboard/src/pages/HomePage.tsx) | Fetches prices when the user is on this route; ERCOT map + [Dashboard](../dashboard/src/pages/Dashboard.tsx) |
| `/about` | [AboutPage](../dashboard/src/pages/AboutPage.tsx) | Static info; no price fetch |

Shared chrome: [AppLayout](../dashboard/src/layouts/AppLayout.tsx) (header, [LocationBar](../dashboard/src/components/layout/LocationBar.tsx) under header, nav, footer, theme toggle). Hub is set from the location bar (or stays default); child routes receive context via `<Outlet context={…} />` (hub, prices, errors, theme).

Router definition: [dashboard/src/router.tsx](../dashboard/src/router.tsx). App entry: [dashboard/src/main.tsx](../dashboard/src/main.tsx) (`RouterProvider`).

---

## Conventions for agents

1. **New routes:** Add a file under `dashboard/src/pages/`, register a `Route` in `router.tsx`, and link from the header nav if it should be global.
2. **New UI primitives:** Prefer `npx shadcn@latest add <name>` so styling stays consistent; then compose in pages or `src/components/`.
3. **Colors:** Prefer semantic `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground` for layout chrome; use extended `navy` / `blue` / etc. for brand and data viz.
4. **Do not duplicate secrets** in docs or commits; reference env **names** only.
5. **PostHog:** `capture_pageview` is disabled in init; layout fires `$pageview` when `location` changes — preserve that when refactoring routing.

---

## Still to define (intentional gaps)

- Motion / micro-interaction guidelines
- Content voice and in-app copy style guide
- Standard empty-state illustrations or patterns beyond cards
- Automated testing strategy for dashboard (Vitest / Playwright)

---

## Maintenance

When you change stack, routes, or tokens, update this file in the same PR. Optionally add a line to the README pointing here (see README “Documentation”).
