# WealthOS — Net Worth Operating System

Every asset, every liability. One beautiful dashboard. One source of truth.

Dark-first, Apple/Linear-grade wealth dashboard. Next.js 16 (App Router) · TypeScript ·
Tailwind v4 · Framer Motion · Recharts · Supabase (Postgres + RLS).

## Run

```bash
npm install
npm run dev
```

Opens on <http://localhost:3000> → `/dashboard`. With no backend configured it runs in
**demo mode** on a realistic sample portfolio (badge shown top-right). The finance math
(net worth, XIRR, CAGR, allocation, health score) is real — only the source rows are seeded.

## Wire a real backend

1. Create a Supabase project.
2. Run the migration: `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. Enable auth providers: Email OTP, Google, Apple.
4. Copy env:

   ```bash
   cp .env.local.example .env.local
   # fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

Demo mode switches off automatically once those are set. Middleware then guards every route
and redirects unauthenticated users to `/login`.

## What's built

- **Dashboard** — net worth hero + animated count-up, live area chart, KPI grid
  (invested, current, unrealized gain, XIRR, CAGR, passive income), asset-class allocation
  donut + bars, portfolio health gauge, emergency-fund + concentration, upcoming maturities/dues,
  recent activity.
- **Assets** — sortable holdings table across 27 asset kinds, gain %.
- **Liabilities** — outstanding, EMI, rate, due dates; net worth auto-computed.
- **Transactions** — signed ledger feed.
- **Command palette** (⌘K), sidebar nav, PWA manifest, dark-first design system.
- **Data layer** — single `loadPortfolio()` reads Supabase when configured, else demo.
- **Schema** — normalized Postgres, indexes, RLS on every table, audit log, net-worth snapshots.

## Roadmap (next modules)

Stubbed routes (`/analytics`, `/goals`, `/insights`, `/import`, `/settings`) list their planned
scope in-app. Priority order:

1. **Write path** — add/edit asset & liability forms, optimistic updates, undo.
2. **Import engine** — CSV/Excel/PDF/CAS parsing, column mapping, dedup, audit.
3. **Live market data** — price/NAV/forex refresh via Edge Functions + cron.
4. **Analytics** — sector/country/AMC breakdowns, drawdown, rolling returns, benchmarks.
5. **Goals** — targets, projections, Monte-Carlo success probability.
6. **Smart insights + AI copilot** — daily insights, portfolio Q&A (no regulated advice).
7. **Reports** — PDF exports. **Notifications**. **2FA / biometric**.

## Tests

```bash
npx tsx src/lib/finance.test.ts   # finance engine self-check
npm run build                     # typecheck + prod build
```
