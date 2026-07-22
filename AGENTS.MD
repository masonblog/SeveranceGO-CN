# AGENTS.MD

## Project Overview

SeveranceGO-CN is a React 18 + TypeScript + Vite single-page application for estimating China employment termination compensation. It calculates common scenarios such as economic compensation N, illegal termination 2N, Article 40 notice pay, and double-wage exposure for unsigned written labor contracts.

The app is user-facing and law/data sensitive. Treat every change to calculation rules, legal wording, regional wage data, or source links as high-risk and verify it with tests and cited public sources.

## Repository Map

- `src/App.tsx`: Main form, result rendering, and user flow.
- `src/lib/calculator.ts`: Core severance calculation logic and legal-basis version string.
- `src/lib/termination.ts`: Termination reason metadata and grouping.
- `src/lib/validation.ts`: Form validation.
- `src/lib/supabase.ts`: Submission persistence and Supabase error handling.
- `src/data/regions.ts`: Province/city options, average wage presets, minimum wage presets, and source metadata.
- `src/styles.css`: Global UI styling.
- `src/lib/*.test.ts`, `src/data/*.test.ts`: Vitest coverage for calculation and region data.
- `supabase/schema.sql`: Supabase table, RLS, grants, and schema-cache reload.
- `docs/data-sources.md`: Human-readable wage data source notes.
- `.github/workflows/deploy.yml`: Cloudflare Workers primary deploy and GitHub Pages fallback deploy.
- `wrangler.jsonc`: Cloudflare Workers Static Assets config for `dist`.

## Local Setup

Use pnpm through Corepack unless there is a clear reason not to.

```bash
corepack pnpm install
corepack pnpm dev
```

For local Supabase submission testing, copy `.env.example` to `.env.local` and set:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Never put a Supabase `service_role` key in frontend code, `.env.local`, GitHub Pages build variables, or documentation examples intended for the browser.

## Common Commands

```bash
corepack pnpm test
corepack pnpm build
corepack pnpm preview
corepack pnpm deploy:cloudflare
```

`corepack pnpm build` runs `tsc --noEmit` before `vite build`. Run it before handing off changes that affect production code, deployment, or types.

## Verification Expectations

- For calculation-rule changes, add or update Vitest cases in `src/lib/calculator.test.ts`.
- For region data, city coverage, or source metadata changes, add or update tests in `src/data/regions.test.ts`.
- For validation changes, add tests when the behavior has edge cases or can block submissions.
- For UI-only changes, run at least `corepack pnpm build`; run browser/manual checks when layout or form flow changes.
- Before deploying, run `corepack pnpm test` and `corepack pnpm build`.

## Calculation And Legal Rules

- Keep `LEGAL_BASIS_VERSION` in `src/lib/calculator.ts` current when legal assumptions or calculation methodology change.
- Preserve explicit warnings that the tool is an estimate and not legal advice.
- Do not silently change formulas for N, 2N, N+1, double wages, salary caps, or minimum-wage floors. Update tests and explain the basis in code-adjacent docs or README text.
- Use complete ISO date strings (`YYYY-MM-DD`) for form dates and tests.
- Be careful with inclusive day counting in unsigned-contract calculations; this area is easy to regress.

## Regional Wage Data

`src/data/regions.ts` is part of the product logic, not just seed data.

When editing regional data:

- Prefer official government, statistics bureau, human resources bureau, or court/arbitration sources.
- Keep `sourceName`, `sourceUrl`, `level`, `basis`, `description`, and effective dates aligned with the value used.
- If a source is a repost or media summary, say so in the description and prefer replacing it with an official source later.
- Update `docs/data-sources.md` when the data-source story changes.
- Preserve fallback behavior: city override -> subprovince/region override -> province override -> national regional reference.
- Do not remove cities casually; the form depends on broad city coverage.

## Supabase Notes

The browser only uses the anon public key. Anonymous users may insert into `public.severance_submissions`, but must not be able to publicly read submissions.

When changing submitted fields:

- Update `SeveranceForm` or result types if needed.
- Update `src/lib/supabase.ts` submission payload.
- Update `supabase/schema.sql` with `add column if not exists` migrations as well as the create-table shape.
- Keep RLS, grants, and `notify pgrst, 'reload schema';`.
- Avoid adding identity fields such as employee or employer names to `form_payload`; the schema has a guard against known identity keys.

## Deployment

GitHub Actions deploys pushes to `main` or `master`.

- GitHub Pages requires repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Cloudflare Workers is the primary site at `https://severance.masonhu.cc` and deploys when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are configured; GitHub Pages is the fallback site.
- `wrangler.jsonc` deploys `dist` as static assets and falls back to `index.html` for SPA routes.
- Wrangler uses its static-asset manifest to upload only missing or changed assets.
- Do not commit generated `dist`, `.wrangler`, `node_modules`, local env files, or dependency cache folders.

## Coding Style

- Follow the existing TypeScript style: named exports, small pure helpers, explicit domain types in `src/types.ts`.
- Keep user-facing text in Simplified Chinese unless the surrounding UI/documentation clearly uses English.
- Avoid broad refactors when changing legal/data logic; small, reviewable changes are safer.
- Keep comments sparse and useful. Prefer tests and clear names over explanatory noise.
- Use `lucide-react` for icons if adding controls or UI affordances.
- Keep the app accessible and mobile-friendly; this is a form-heavy workflow used for careful data entry.

## Pull Request Checklist

Before finalizing a change, confirm:

- `corepack pnpm test` passes when behavior/data changed.
- `corepack pnpm build` passes for production-impacting changes.
- Legal/data changes include updated tests and source notes.
- Supabase schema and frontend payload stay in sync.
- No secrets or private user data are committed.
