# GridShift — project guide (for humans and agents)

This document is the **living reference** for repository layout, product direction, dashboard architecture, design tokens, and conventions. Update it when you add major routes, dependencies, or design rules.

For install commands and ERCOT data notes, see the root [README.md](../README.md).

---

## Purpose and direction

GridShift is a **free, public-style dashboard** (portfolio-quality) for Texas **ERCOT** wholesale settlement point prices. It helps people see when real-time prices are high or low so they can **shift flexible loads** (EV charging, pool pumps, dishwashers, etc.) toward cheaper windows. The app is informational; users should confirm actual retail rates with their provider.

**Explicit non-goals (for now):**

- No accounts, auth, or saved per-user preferences.
- No SaaS positioning, subscriptions, or freemium tiers.
- No “productized” billing or feature gating.

**Delivery plan (two tracks, iterated together):**

1. **UI** — Lock in a small set of **core components** with a **polished, cohesive** visual system (typography, spacing, chart + map treatment, light/dark).
2. **Data** — Wire **live or cached** price paths end-to-end (Supabase edge functions + dashboard) for those components, and add any new widgets the design needs.

Design and data work **in tandem** (sketch → build → tune) since this is a single-maintainer project.

---

## Repository layout

| Path | Role |
|------|------|
| [dashboard/](../dashboard/) | **Primary web app** — Vite + React + TypeScript, React Router, Tailwind, shadcn/ui, **Nivo** (`@nivo/line`, `@nivo/geo`) |
| [src/](../src/) (repo root) | Node fetcher (`ercot.mjs`, `ercot-loop.mjs`), shared libs, optional edge function **source** mirrors |
| [supabase/](../supabase/) | `schema.sql`, `config.toml`, edge functions under `functions/*` |

**Note:** Deployed edge functions live under `supabase/functions/`. Keep `src/functions/` in sync if you maintain duplicates for editing workflow.

---

## Dashboard tech stack

- **Build:** Vite 5, TypeScript (strict)
- **UI:** React 18, [shadcn/ui](https://ui.shadcn.com/) (Radix + `class-variance-authority` + `tailwind-merge`), [`cn()` helper](../dashboard/src/lib/utils.ts)
- **Styling:** Tailwind CSS 3, `darkMode: 'class'`
- **Routing:** React Router 7 — [`createBrowserRouter`](../dashboard/src/router.tsx), layout with [`<Outlet />`](../dashboard/src/layouts/AppLayout.tsx)
- **Charts:** `@nivo/line` — price curve in [`Dashboard.tsx`](../dashboard/src/pages/Dashboard.tsx)
- **Geo map:** `@nivo/geo` plus **`d3-geo@1.x`** for `fitExtent` — choropleth in [`ERCOTMap.tsx`](../dashboard/src/components/dashboard/ERCOTMap.tsx)
- **Analytics (optional):** PostHog via [`dashboard/src/lib/analytics.ts`](../dashboard/src/lib/analytics.ts) — only initializes when `VITE_POSTHOG_KEY` is set; pageviews still use `captureAnalytics` from the layout
- **Backend client:** `@supabase/supabase-js` when env is configured

### Environment variables

Copy [`dashboard/.env.example`](../dashboard/.env.example) to `dashboard/.env` locally. **Do not commit** `.env` files or paste real keys into docs or issues.

| Variable | Role |
|----------|------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_FUNCTION_BASE` | Base URL for edge functions (e.g. `…/functions/v1`). If unset, the dashboard can use **demo** price data. |
| `VITE_POSTHOG_KEY` | PostHog project API key; if unset, analytics is disabled |
| `VITE_POSTHOG_HOST` | Optional PostHog API host (defaults to `https://us.i.posthog.com`) |

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
   CSS variables in `dashboard/src/index.css`: `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--ring`, etc. Light and `.dark` values align with GridShift **navy** and **neutral**.

2. **Extended palette (Tailwind)**  
   [dashboard/tailwind.config.js](../dashboard/tailwind.config.js): `navy`, `blue`, `orange`, `amber`, `green`, `neutral` for accents, charts, and one-off UI.

3. **Charts**  
   Nivo uses **explicit hex** where needed; align new series with `blue` / `navy` when possible.

### Theme behavior

- Theme is `light` | `dark`, persisted in `localStorage` (`theme`), applied by toggling the `dark` class on `document.documentElement`.

### Component conventions

- **Primitives:** `dashboard/src/components/ui/*` — shadcn CLI (`npx shadcn@latest add <component>`). **Edit in place** when needed.
- **Composites:** `dashboard/src/components/` for app-specific blocks.
- **Pages:** `dashboard/src/pages/*` — route targets; data loading in pages or layout as appropriate.

### Installed shadcn components (baseline)

`button`, `select`, `card`, `alert`, `badge` — extend with the CLI when new patterns are needed.

---

## Routing

| Path | Page | Notes |
|------|------|------|
| `/` | [HomePage](../dashboard/src/pages/HomePage.tsx) | Price fetch on this route; map + [Dashboard](../dashboard/src/pages/Dashboard.tsx) |
| `/about` | [AboutPage](../dashboard/src/pages/AboutPage.tsx) | Static info |

Shared chrome: [AppLayout](../dashboard/src/layouts/AppLayout.tsx) (header, [LocationBar](../dashboard/src/components/layout/LocationBar.tsx), nav, footer, theme toggle). Hub from location bar; `<Outlet context={…} />` passes hub, prices, errors, theme.

Router: [dashboard/src/router.tsx](../dashboard/src/router.tsx). Entry: [dashboard/src/main.tsx](../dashboard/src/main.tsx).

---

## Conventions for agents

1. **New routes:** Add `dashboard/src/pages/…`, register in `router.tsx`, link from header if global.
2. **New UI primitives:** Prefer `npx shadcn@latest add <name>` for consistency.
3. **Colors:** Semantic tokens for chrome; extended palette for brand and data viz.
4. **Secrets:** Env **names** only in docs; use `.env.example` for shapes; never commit keys.
5. **Analytics:** Use `captureAnalytics` from `@/lib/analytics`, not raw `posthog` calls, so missing config stays safe.

---

## Still to define (intentional gaps)

- Motion / micro-interaction guidelines
- In-app copy style guide
- Empty-state patterns beyond cards
- Dashboard automated tests (Vitest / Playwright)

---

## Maintenance

When you change stack, routes, or tokens, update this file in the same PR. Keep the README pointer to this guide accurate.
