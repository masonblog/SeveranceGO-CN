# AGENTS.MD

## Project Overview

SeveranceGO-CN is a native WeChat Mini Program written in TypeScript for estimating China employment termination compensation. It calculates common scenarios such as economic compensation N, illegal termination 2N, Article 40 notice pay, and double-wage exposure for unsigned written labor contracts.

The app is user-facing and law/data sensitive. Treat every change to calculation rules, legal wording, regional wage data, or source links as high-risk and verify it with tests and cited public sources.

The current Mini Program version is local-only: it does not collect contact information, does not submit consultation leads, and should not make network requests.

## Repository Map

- `app.json`, `app.ts`, `app.wxss`: Mini Program global configuration and styles.
- `pages/index/`: Main form, user flow, and result rendering.
- `src/lib/calculator.ts`: Core severance calculation logic and legal-basis version string.
- `src/lib/termination.ts`: Termination reason metadata and grouping.
- `src/lib/validation.ts`: Form validation.
- `src/data/regions.ts`: Province/city options, average wage presets, minimum wage presets, and source metadata.
- `src/lib/*.test.ts`, `src/data/*.test.ts`: Vitest coverage for calculation, validation, and region data.
- `docs/data-sources.md`: Human-readable wage data source notes.

## Local Setup

Use pnpm through Corepack unless there is a clear reason not to.

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```

Open the repository root in WeChat Developer Tools for preview, simulator checks, and upload. `project.config.json` uses `touristappid` by default; replace it with the real Mini Program AppID before production upload.

## Verification Expectations

- For calculation-rule changes, add or update Vitest cases in `src/lib/calculator.test.ts`.
- For region data, city coverage, or source metadata changes, add or update tests in `src/data/regions.test.ts`.
- For validation changes, add tests when the behavior has edge cases or can block calculation.
- For UI-only changes, run at least `corepack pnpm build` and manually check the Mini Program in WeChat Developer Tools.
- Before release, run `corepack pnpm test`, `corepack pnpm build`, and a WeChat Developer Tools compile/preview check.

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

## Mini Program Notes

- Keep user-facing text in Simplified Chinese unless the surrounding documentation clearly uses English.
- Use native Mini Program components for form controls.
- Do not add contact collection, login, cloud development, payment, subscription messages, or outbound requests unless explicitly requested.
- Keep the app accessible and mobile-friendly; this is a form-heavy workflow used for careful data entry.

## Pull Request Checklist

Before finalizing a change, confirm:

- `corepack pnpm test` passes when behavior/data changed.
- `corepack pnpm build` passes for production-impacting changes.
- Legal/data changes include updated tests and source notes.
- No secrets or private user data are committed.
- WeChat Developer Tools can open and compile the project.
