# AGENTS.md

## Project

`vitest-browser-angular` renders Angular components in Vitest Browser Mode. This is a fork published under the scoped name `@wismaz/vitest-browser-angular`; README/examples use the unscoped `vitest-browser-angular` for consumers. Don't be confused by the mismatch.

The library targets **zoneless Angular** (zoneless-first). The `zone` Vitest project exists only as zone.js compatibility coverage.

## Commands

Package manager is **pnpm** (>=11). Node 24.x in CI.

- `pnpm test` — runs Vitest in **watch mode** (`watch: true` in `vitest.config.ts`). **Auto-builds first** via `pretest` script (`"pretest": "pnpm build"`). For a one-shot run: `pnpm test --run`.
- `pnpm test --run <file>` — single file. `pnpm test --run -t "name"` — single test by name.
- `pnpm build` — tsdown to `dist/` (ESM + dts + publint). Tests import from `dist/`, so you need `dist/` present. The `pretest` script handles this automatically; only run `pnpm build` manually when developing without `pnpm test` (e.g. `pnpm vitest run` skips pretest).
- `pnpm lint` / `pnpm lint:fix` — oxlint. `pnpm fmt` / `pnpm fmt:check` — oxfmt.

CI order: **lint → test** (test includes build via `pretest`). No standalone `typecheck` script.

## Testing

- Runs in a real browser via **Playwright Chromium**. First run needs `pnpm exec playwright install --with-deps`.
- Tests import from `@wismaz/vitest-browser-angular` which `vitest.config.ts` aliases to `dist/index.mjs`. **`dist/` must exist** — `pretest` builds it automatically; skip it only when running diretly via `pnpm vitest run`.
- **Vitest globals are on** (`globals: true`): `test`, `expect`, `vi`, `describe`, `beforeEach`, `afterEach`, and `vitest` (lowercase, for fake timers) are available without import.
- Two Vitest projects, routed by filename:
  - **`zoneless`** (primary): only `**/zoneless.test.ts`, zoneless setup.
  - **`zone`** (compat coverage): every other `*.test.ts`, with zone.js.
  - So a file named `foo.test.ts` runs under `zone`; name it `zoneless.test.ts` to run zoneless.
- `teardown.destroyAfterEach` is `false` in both setups; cleanup runs via the `vitest:component-cleanup` hook registered in `src/index.ts`.

## Code style & hooks

- Formatter is **oxfmt** (single quotes, `arrowParens: 'avoid'`), linter is **oxlint** — not prettier/eslint. `no-explicit-any` and `no-unused-vars` are errors.
- **Lefthook** pre-commit auto-runs `pnpm fmt` + `pnpm lint:fix` on staged `.ts`/`.json` files; no manual formatting needed before commit.
- TypeScript strict (`tsconfig.base.json`). Three configs: `tsconfig.app.json` (`src`), `tsconfig.test.json` (`test`, `experimentalDecorators` + `vitest/globals` types), `tsconfig.node.json` (`*.config.ts`).

## Architecture

- `src/index.ts` — default entry (`.`). Extends Vitest's `page` with `render`/`renderDirective` and registers auto-cleanup `beforeEach`. Use this in tests.
- `src/pure.ts` — `/pure` entry. Just `render`, `renderDirective`, `cleanup`; no `page` extension, no auto-cleanup.
- `src/types/render.ts` — all public types.
- `render()` is routing-aware: `withRouting: true | RoutingConfig` returns `RoutedRenderResult` (adds `router` + `routerHarness`). With routing on, `inputs`/`outputs` are ignored — pass data via route `data`/params instead.

## Release (provisional — changeset is being removed)

- Release tooling is mid-migration away from changesets; treat `.changeset/` and the CI `release` job as in flux.
- `pnpm-workspace.yaml` sets `publishBranch: develop`.
- Every PR publishes a per-commit build via `pkg-pr-new` (`pnpm release.pkg-pr-new`).
