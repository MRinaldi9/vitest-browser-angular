# AGENTS.md

## Project

`vitest-browser-angular` renders Angular components in Vitest Browser Mode. This is a fork published under the scoped name `@wismaz/vitest-browser-angular`; README/examples use the unscoped `vitest-browser-angular` for consumers. Don't be confused by the mismatch.

The library targets **zoneless Angular** (zoneless-first). The `zone` Vitest project exists only as zone.js compatibility coverage.

## Commands

Package manager is **pnpm** (>=11). Node 24.x in CI.

- `pnpm _test` — hub: runs `pnpm build` then Vitest in **watch mode** (`watch: true` in `vitest.config.ts`). For a one-shot run: `pnpm _test --run`.
- `pnpm test:zoneless` / `pnpm test:zone` / `pnpm test:types` — one-shot per Vitest project (`pnpm _test --run --project <name>`); each builds first too.
- `pnpm _test --run <file>` — single file. `pnpm _test --run -t "name"` — single test by name.
- `pnpm build` — tsdown to `dist/` (ESM + dts + publint). Tests import from `dist/`, so you need `dist/` present. The `_test` hub builds first; only run `pnpm build` manually when running vitest directly (e.g. `pnpm vitest run` skips the build).
- `pnpm lint` / `pnpm lint:fix` — oxlint. `pnpm fmt` / `pnpm fmt:check` — oxfmt.
- `pnpm test:types` — the type-level suite (Vitest typecheck on `test/**/*.test-d.ts`); `pnpm exec tsc --noEmit -p tsconfig.test.json` covers it equivalently.
- **There is no `test` script** — `_test` + `test:*` replaced it, but `.github/actions/setup-and-test/action.yml` still runs `pnpm test`; reconcile before the next CI run.

CI order: **lint → test** (the test run also covers type checking via the `types` project).

## Testing

- Runs in a real browser via **Playwright Chromium**. First run needs `pnpm exec playwright install --with-deps`.
- Tests import from `@wismaz/vitest-browser-angular` which `vitest.config.ts` aliases to `dist/index.mjs`. **`dist/` must exist** — the `_test` hub builds it automatically; skip it only when running directly via `pnpm vitest run`.
- `vitest.config.ts` derives `browser.headless` from `VITEST_VSCODE`/`CI` (`toBool` treats `"false"`/`"0"` as falsy). Env vars read in configs are typed via the `NodeJS.ProcessEnv` augmentation in `env.d.ts` (included through `tsconfig.node.json`) — add new ones there, or dot notation fails under `noPropertyAccessFromIndexSignature`.
- **Vitest globals are on** (`globals: true`): `test`, `expect`, `vi`, `describe`, `beforeEach`, `afterEach`, and `vitest` (lowercase, for fake timers) are available without import.
- Three Vitest projects, routed by filename:
  - **`zoneless`** (primary): only `**/zoneless.test.ts`, zoneless setup.
  - **`zone`** (compat coverage): every other `*.test.ts`, with zone.js.
  - **`types`**: no runtime tests (`include: []`), runs Vitest's `typecheck` on `test/**/*.test-d.ts`.
  - So a file named `foo.test.ts` runs under `zone`; name it `zoneless.test.ts` to run zoneless; a `*.test-d.ts` file runs only in the typechecker.
- `teardown.destroyAfterEach` is `false` in both setups; cleanup runs via the `vitest:component-cleanup` hook registered in `src/index.ts`.
- **Type-level tests** live in `test/types/*.test-d.ts`, split per feature (mirroring the runtime files: `render`, `routed`, `render-directive`, `override-providers`, `defer`) using `expectTypeOf` + `@ts-expect-error`, with the shared fixture in `test/components/type-fixture.component.ts`. The `*.test-d.ts` name keeps them out of the runtime browser runs (they never execute); they are checked by the `types` Vitest project (`test:types`, also run by the default `_test`) and by the Angular plugin's `tsconfig.test.json`. Tests are real `test()`/`describe()` lists. Note: `@ts-expect-error` requires the errored statement on a single line (oxfmt wraps long object literals, breaking adjacency); and a `boolean`-typed const initialized with a literal gets flow-narrowed inside arrow callbacks, so declare it as `true as boolean` when overload discrimination matters.

## Code style & hooks

- Formatter is **oxfmt** (single quotes, `arrowParens: 'avoid'`), linter is **oxlint** — not prettier/eslint. `no-explicit-any` and `no-unused-vars` are errors.
- **Lefthook** pre-commit auto-runs `pnpm fmt` + `pnpm lint:fix` on staged `.ts`/`.json` files; no manual formatting needed before commit.
- TypeScript strict (`tsconfig.base.json`). Three configs: `tsconfig.app.json` (`src`), `tsconfig.test.json` (`test`, `experimentalDecorators` + `vitest/globals` types), `tsconfig.node.json` (`*.config.ts` + `env.d.ts`).

## Architecture

- `src/index.ts` — default entry (`.`). Extends Vitest's `page` with `render`/`renderDirective` and registers auto-cleanup `beforeEach`. Use this in tests.
- `src/pure.ts` — `/pure` entry. Just `render`, `renderDirective`, `cleanup`; no `page` extension, no auto-cleanup.
- `src/types/render.ts` — all public types.
- `render()` is routing-aware: `withRouting: true | RoutingConfig` returns `RoutedRenderResult` (adds `router` + `routerHarness`). With routing on, `inputs`/`outputs` are ignored — pass data via route `data`/params instead.

## Release (provisional — changeset is being removed)

- Release tooling is mid-migration away from changesets; treat `.changeset/` and the CI `release` job as in flux.
- `pnpm-workspace.yaml` sets `publishBranch: develop`.
- Every PR publishes a per-commit build via `pkg-pr-new` (`pnpm release.pkg-pr-new`).
