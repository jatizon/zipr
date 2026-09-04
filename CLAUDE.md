# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Zipr — URL shortener backend: Fastify 5 + TypeScript (strict, ESM/`nodenext`) + Prisma 7 over SQLite (`better-sqlite3` adapter). Server listens on port 3000.

## Commands

```bash
npm run build                # tsc -p tsconfig.json && tsc-alias  (tsc-alias rewrites @src/@lib/@generated in dist/)
npm start                    # node dist/src/main.js
npx tsx src/main.ts          # run without building

npx prisma generate          # required after clone and after any schema change (output is gitignored)
npx prisma migrate dev       # dev database

npm test                     # full Jest suite
npm run test:integration     # src/tests/integration only
npm run test:performance     # autocannon benchmark (tsx, no Jest)
npm test -- src/helpers/url.test.ts        # single file
npm test -- -t "round trip"                # single test by name
npm test -- --no-cache                     # required after touching babel.config.js
npx eslint .
```

Always run tests through the npm scripts: they set `DOTENV_CONFIG_PATH=.env.test`. `src/tests/setup/guard.ts` compares `DATABASE_URL` against the value declared in `.env.test` and aborts the run otherwise — the suite calls `deleteMany()`, so a bare `npx jest` would wipe the development database.

## Architecture

**Composition root.** `src/main.ts` is the only place that reads `DATABASE_URL`, builds the Prisma client, and starts the server. `buildFastify(dependencies, fastifyOptions)` in `src/build.ts` returns a wired but unstarted instance; `src/server.ts` only calls `listen`. That split is what lets tests build an app against their own database and drive it with `app.inject()` — no listening socket.

**Dependency injection through plugin options.** Routes are Fastify plugins with signature `(fastify, {prisma}: Dependencies)`. Fastify hands the *entire* options object to the plugin, so dependencies must sit at the top level of the register call (`{ prefix, ...dependencies }`) — nesting them under a `dependencies` key silently yields `undefined`. Route prefixes live in one map in `build.ts` (`''`, `/admin`, `/shorten`, `/user`); paths declared inside a plugin must be relative to the prefix.

**Base62 short codes.** `ShorteningTypes.Auto` derives the slug from the row's autoincrement `id` (`encodeBase62(createdUrl.id)`, written back in a second update), so resolving an Auto slug is `decodeBase62` → primary-key lookup with no extra column read. `ShorteningTypes.Custom` stores a user-supplied slug and resolves through the `@@unique([shortUrl, shorteningType])` compound key. Nothing stops the same owner from shortening the same long URL twice: the `@@unique([ownerId, longUrl, shorteningType])` constraint was deliberately dropped (migration `20260826050404_drop_user_name`), so each request creates its own row and its own slug.

**Module resolution.** `nodenext` requires `.js` extensions on relative *and* aliased imports (`@src/helpers/url.js`). Three different mechanisms undo that at runtime: Jest's `moduleNameMapper` (generated from the tsconfig paths) inside tests, the babel plugin described under *Test setup* for the global hooks, and `tsc-alias` at build time. `tsx` handles it natively, which is why the benchmark needs none of them. The Prisma client is generated to `generated/prisma/` (gitignored) and imported as `@generated/prisma/client.js`.

## Test setup

Jest runs TypeScript through babel-jest (`babel.config.js`), not ts-jest — `babel-plugin-transform-import-meta` is required because the generated Prisma 7 client uses `import.meta.url`, and `@babel/preset-env`/`transform-import-meta` are pinned to majors compatible with `@babel/core` 7.

**The global hooks and the `.js` → `.ts` rewrite.** `globalSetup`/`globalTeardown` load outside Jest's module registry: they *are* transpiled by babel-jest, but they receive neither `moduleNameMapper` nor a custom `resolver`, so a `.js` specifier reaches Node unresolved — and so does every specifier in whatever they import. `babel.config.js` therefore carries a plugin that rewrites internal `.js` specifiers to `.ts` at transform time. The guard is on the *specifier*, not on the importing file (inside this project `.js` always means `.ts`, while `pkg/dist/x.js` must be left alone), so coverage follows the real import graph with no file list to maintain. Alias prefixes and the whole `moduleNameMapper` come from `tsconfigAliases.js`, which reads `compilerOptions.paths` — `tsconfig.json` is the only place an alias is declared. Jest caches transforms, so any change here needs `jest --no-cache` to take effect.

Databases are per test *file*, because Jest runs files in parallel workers:

- `setup/globalSetup.ts` calls `removeTestDatabases()` then `createTemplateDatabase()`, both from `tests/helpers/db.ts`; the second runs `prisma migrate deploy` against `prisma/test_databases/template.db`.
- Each integration file calls `setupTestDb(import.meta.url)`, which substitutes `{TEST_NAME}` in the `.env.test` `DATABASE_URL`, copies the template into place, and returns the connection string. `{TEST_NAME}` is the repo-relative path with separators turned into `-` (`src-tests-integration-redirect`), so files sharing a basename cannot collide.
- `setup/globalTeardown.ts` calls the same `removeTestDatabases()`, which empties the directory — template included. The next run migrates a fresh one.
- `tests/performance/autocannon.ts` runs under `tsx` with no Jest hooks, so it calls `createTemplateDatabase()` itself.

`src/tests/fixtures/urls.ts` holds URL cases verified against `is-url-http` itself; several plausible-looking invalid URLs (`http:/example.com`, `http://localhost`, `http://127.0.0.1`) are accepted by the library, so verify new fixture entries before adding them.

## Postgres test isolation — evaluation notes

The SQLite-era strategy (copy `template.db`, one file per test) is being redesigned for Postgres; `src/tests/helpers/db.ts` is mid-migration. Under evaluation: cloning the migrated `template` schema into a per-test-file schema. `CREATE TABLE ... LIKE template.t INCLUDING ALL` was ruled out — it never copies foreign keys, and it copies a `SERIAL` column's default (`nextval('template.x_id_seq'::regclass)`) as literal text, so a cloned table keeps writing into the *template's* sequence instead of getting its own. `pg_dump`/`pg_restore` was ruled out too — neither has a schema-rename option, only schema filters (`-n`/`-N`); renaming needs text-editing the dump.

**If [pg-clone-schema](https://github.com/denishpatel/pg-clone-schema) ends up wired in** (candidate because it's schema-level — no new database/connection per test file, unlike `CREATE DATABASE ... TEMPLATE`, and it does handle FKs and sequences correctly), remember before debugging:

- It clones views/functions by textually substituting the schema name inside their body. Same fragility class as hand-editing a dump — breaks if the source schema name coincidentally appears inside a string literal or a `$$...$$` body. Not a problem while the schema has no views/functions; becomes one the day it does.
- It cannot reliably clone the `public` schema — only source/target/`public`-referenced objects are supported. `template` and per-test schemas must never be named `public`.
- In `DDLONLY` mode, cloned index/constraint names can diverge from the source (Postgres's auto-naming). Only matters if a test or route ever inspects a constraint name from a Postgres error.
- A SQL-language function calling another function can fail to clone if the callee isn't created yet — creation-order dependent; workaround is `check_function_bodies = off` or writing it in PL/pgSQL instead.
- It's a third-party PL/pgSQL script installed into the database, not core Postgres — check its own repo's activity before leaning on it long-term; it isn't under active verification here.
- **Reproduced 2026-09-03 against `postgres:18` (this project's compose image):** `clone_schema(source, dest, 'DDLONLY')` with default params throws `cache lookup failed for type <oid>` while cloning schema-level ACLs (`PRIVS: Schema` step). The script's last changelog entry is 2024-01-15, predating this Postgres major. Workaround: pass `NOACL` too — `clone_schema('template', 'trial', 'DDLONLY', 'NOACL')` — which skips the crashing step entirely (fine here since no per-role grants exist on the test schemas). Re-check this against whatever Postgres image is in use if it ever gets upgraded.
- Benchmarked the same day against `CREATE DATABASE ... TEMPLATE`, a hand-rolled `LIKE`+FK/sequence fix, and raw migration SQL applied per schema (with and without going through `npx prisma migrate deploy` as a subprocess) — full methodology and numbers in the Obsidian vault note "Zipr — Mudanças da Sessão" ("Mudanças da sessão — 2026-09-03", §7), not in this repo. Headline: the Prisma CLI subprocess per test file is ruled out categorically (~750-800ms/file, independent of row count); every other option sits within single-digit to a few dozen ms with an empty template, which is this project's actual usage pattern (no seeded template data).

## Known gaps

- `README.md` documents an older route shape (`POST /shorten`); the real routes are `POST /shorten/auto`, `POST /shorten/custom`, `POST /user/create`, `POST /admin/test-encode`, `POST /admin/test-decode`, `GET /health`, `GET /a/:shortUrl` (Auto) and `GET /:shortUrl` (Custom).
- No Fastify body/params schemas anywhere: a missing `ownerId` becomes `where: { id: undefined }`, which counts every row instead of failing.
- `GET /` matches `/:shortUrl` with an empty param, so the API root answers `400 Invalid Url` rather than 404.
- The port is hardcoded in `src/server.ts` while `PORT` sits unused in `.env`/`.env.test`, and no `host` is set — Fastify defaults to `127.0.0.1`, unreachable from a container.
- `src/tests/performance/autocannon.ts` benchmarks `GET /`, which returns 400 without touching the database; the numbers measure the validation path, not redirect resolution.
- Vitest is still installed and configured (`vitest.config.ts`) but unused — Jest is the runner.

## Conventions

- Indentation is 4 spaces in routes/tests and 2 in the older `utils/`, `lib/` files — follow the file you are in. Trailing commas on multiline lists, semicolons enforced by ESLint.
- Comments explain *why* a non-obvious constraint exists (see `babel.config.js`, `tests/helpers/db.ts`); keep that density rather than narrating what the code does. Prefer expressing a constraint as a test over a comment when it is testable.
- **Integration proves the wiring, unit proves the variation.** An integration test gets one case per distinct response (one 400, one 404, one happy path) and arranges its own data inside the test body — no shared `beforeEach` seeding rows nobody reads. Fan-out over an input space belongs in a unit test, and only where a function actually branches on the value: `test.each` over inputs the code never inspects buys nothing.
- **A negative test needs a distractor.** A 404 against an empty table is true even when the lookup is broken; insert one row so the assertion means "it looked and correctly found nothing".
- **No URL or slug literals in tests** — everything comes from `tests/fixtures/urls.ts`, so a case is picked by what it exercises rather than by hand-typed text.
- Session/working notes (changelog-style write-ups of what changed and why, research/benchmark write-ups, decision logs) do not go in this repo — they go in the Obsidian vault at `~/Documents/General/Projects/Zipr/`. Written in Portuguese, matching the vault's existing notes for this project.
