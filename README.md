# Merito Tracker

> **Live:** <https://merito-tracker.pages.dev/>

Static tracker for Colombia's public-sector job contests (CNSC/SIMO). Browse hundreds of indexed vacancies, check how well they match your profile, track key dates, and keep a local checklist of documents — all without a backend, all in the browser.

## Why it exists

Colombia's public contest portal (SIMO) is hard to navigate: hundreds of PDF-based vacancies, no per-vacancy "am I a fit?" answer, and dates buried across pages. Merito Tracker extracts the official data into a browseable, queryable dataset and pairs it with a client-side profile matcher.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (static export) | Zero server, deployable to any static host |
| UI | React 19 + Tailwind CSS 4 | Small surface, utility-first styling |
| Domain | Pure TypeScript modules | Testable without a browser |
| Tests | Vitest + Testing Library, `node:test` | UI coverage and fast domain coverage |
| Package manager | pnpm | Deterministic installs, disk-efficient |
| ETL | Node script (`etl/extract.ts`) | Official PDFs → typed JSON dataset |

## Quick path

```bash
pnpm install
pnpm dev        # start the dev server at http://localhost:3000
```

```bash
pnpm build                  # static export into out/
pnpm start                  # serve the static export locally
pnpm lint                   # ESLint
pnpm test:ui                # Vitest component tests
pnpm test:domain            # node:test domain tests
```

## Dataset

All vacancy data lives in `data/vacancies.v1.json` (tracked, generated from official sources). The app imports it directly at build time — no runtime fetch, no API keys.

The ETL pipeline in `etl/` converts official PDF announcements into this dataset:

```bash
pnpm etl                    # extract + normalize official PDFs
pnpm validate:normalization # sanity-check the normalized dataset
```

## Architecture

```text
src/
  app/          Next.js pages (static routes)
  components/   React UI (presentational, no data fetching)
  domain/       Pure logic: scoring, matching, dates, documents — zero React
  lib/          Client stores and helpers (localStorage-backed)
etl/            Offline extraction pipeline (PDF → JSON)
data/           Generated dataset (tracked)
```

Design rules:

- **Domain purity**: `src/domain/*` never imports React or the DOM. Screens and stores are thin adapters over it.
- **Browser-only state**: profile, favorites, applications, and document checklists live in `localStorage` behind small `useSyncExternalStore` providers. Nothing leaves the device.
- **Configurable time**: the key-dates engine accepts an injectable `actualDate`, so date logic and countdowns are deterministic in tests.
- **No invented dates**: stages the CNSC has not published are shown as "por confirmar" — the domain never fabricates official dates.

## Testing

Two suites, no server:

```bash
pnpm test:ui       # Vitest + Testing Library (components interact with real DOM)
pnpm test:domain   # node:test on pure domain modules (fast, no jsdom)
```

Dates are the main gotcha: every test that depends on "today" must inject `actualDate`/`today` instead of reading the clock.

## Privacy

There is no account system and no telemetry. Profile, favorites, applications, and checked documents are stored only in the browser's `localStorage`. Clearing site data erases everything.

## License

MIT — see [LICENSE](./LICENSE).