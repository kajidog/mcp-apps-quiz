# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A quiz **MCP Apps** server. The AI authors a quiz via an MCP tool; the same React UI renders it
both inside an MCP host (Claude Desktop etc., as an iframe) and standalone in a browser. The MCP
path talks over `app.callServerTool`; the browser path talks over GraphQL. Both ultimately call the
same `QuizService` in `@quiz/core`.

## Commands

```bash
pnpm install                   # workspace install (pnpm 10)
pnpm -F @quiz/ui build         # build the single-file UI bundle (REQUIRED before the server can serve real UI)
pnpm -F @quiz/server start     # HTTP mode: /mcp + /graphql + UI at :3001 (run with tsx, no build step)
pnpm -F @quiz/server start:stdio  # stdio MCP mode

pnpm -F @quiz/core test        # Vitest (service-layer unit tests)
pnpm -F @quiz/core test -t "採点"   # run a single test by name
pnpm -r typecheck              # type-check every package
pnpm lint                      # Biome (use `pnpm format` to auto-fix)

pnpm -F @quiz/server codegen   # regen server resolver types from shared SDL
pnpm -F @quiz/ui codegen       # regen UI typed GraphQL client (client-preset) from shared SDL
```

Env: `PORT` (3001), `QUIZ_DB_PATH` (`quiz.sqlite`, `:memory:` for tests), `MCP_API_KEY` (when set,
requires `X-API-Key` or `Authorization: Bearer`).

## Architecture

Three packages, one direction of dependency: `apps/server` and `packages/quiz-ui` both depend on
`packages/quiz-core`. quiz-core depends on nothing in the repo.

- **`packages/quiz-core`** — the single source of truth. Domain types, Drizzle/SQLite schema +
  repository, and `QuizService` (which owns *all* scoring/validation logic). Every MCP tool and
  every GraphQL resolver is a thin wrapper that delegates here. Inputs are validated with zod
  (`schemas.ts`) at the service boundary.
- **`apps/server`** — one Hono app (`src/http.ts`) exposing `/mcp` (stateless
  `WebStandardStreamableHTTPServerTransport`, fresh server per request, shared service injected),
  `/graphql` (`@hono/graphql-server` + `makeExecutableSchema`), and the browser UI at `/`. `main.ts`
  switches to stdio with `--stdio`.
- **`packages/quiz-ui`** — React + Vite + Tailwind, bundled to a single `dist/mcp-app.html` via
  `vite-plugin-singlefile`. The server serves this exact file both as the MCP UI resource and at `/`.

### The dual-transport abstraction (the core idea)

`packages/quiz-ui/src/client/` defines `QuizClient` with two implementations: `McpQuizClient`
(`app.callServerTool`) and `GraphQLQuizClient` (typed documents → `/graphql`). `provider.tsx` picks
one at runtime: `window.parent !== window` ⇒ embedded ⇒ MCP; top-level ⇒ browser ⇒ GraphQL. The MCP
host also pushes the initial `quiz_create`/`quiz_present` result into the UI via `app.ontoolresult`
(captured as `initialPayload`). Keep both client implementations in sync with the `QuizClient`
interface and with the corresponding server-side operations.

### MCP tools (`apps/server/src/mcp/tools.ts`)

Model-facing tools (`quiz_create`, `quiz_present`, `quiz_search`, `quiz_edit`, `quiz_history`) carry
`_meta.ui.resourceUri` so the host renders the UI. App-only tools (`_get_quiz`, `_submit_attempt`,
`_toggle_favorite`, `_search_quizzes`, `_recent_attempts`) use `visibility: ["app"]` — hidden from
the model, called by the UI, and map 1:1 to the GraphQL operations. Tools return both a `text`
fallback (for non-UI hosts) and `structuredContent: { kind, ... }` that the UI parses.

### Shared GraphQL schema

The SDL lives at `packages/quiz-core/schema.graphql` (not in the backend) and is exposed via the
package `exports` map (`@quiz/core/schema.graphql`). Both codegen configs resolve it with
`require.resolve("@quiz/core/schema.graphql")` — do **not** reintroduce cross-package relative paths.
Editing the SDL means: update resolvers (`apps/server/src/graphql/resolvers.ts`), the UI documents in
`graphql.ts`, then rerun both `codegen` scripts.

## Gotchas

- **`better-sqlite3` native build**: pnpm 10 blocks install scripts. Allowed via root
  `package.json` `pnpm.onlyBuiltDependencies`. If `bindings`/`.node` errors appear, the addon never
  compiled — rebuild it (`npm run build-release` in its node_modules dir).
- **Drizzle relational queries are sync here**: with better-sqlite3, `db.query.x.findFirst(...)`
  returns a query object — you must call `.sync()` to execute. Forgetting it yields `undefined`
  fields.
- **UI must be built before the server serves real UI**: the server reads `@quiz/ui/mcp-app.html`
  (resolved through the UI package's `exports`); without a build it serves a placeholder.
- **Generated code is gitignored and lint-ignored**: `**/__generated__/**` and
  `packages/quiz-ui/src/gql/**`. Don't hand-edit; rerun codegen.
- **MCP host smoke test**: run the server, then `tmp/ext-apps/examples/basic-host` with
  `SERVERS='["http://localhost:3001/mcp"]'` and open its page.
