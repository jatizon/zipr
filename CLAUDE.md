# CLAUDE.md

_Last updated: 2026-10-26_

## Project

Zipr — URL shortener backend: Fastify 5 + TypeScript (strict, ESM/`nodenext`) + Prisma 7 over PostgreSQL (`@prisma/adapter-pg` over a `pg` `Pool`), with a two-level best-effort cache (in-memory, then Redis via `ioredis`) in front of URL and user lookups. JWT auth (`jose`) + bcrypt gate `/shorten` and `/admin`; role/tier authorization is enforced per route. Server listens on `API_PORT` (no `host` set, so Fastify binds `127.0.0.1` — see Known gaps).

## Commands

```bash
npm run build                # tsc -p tsconfig.json && tsc-alias  (tsc-alias rewrites @src/@generated/@prismabox in dist/)
npm start                    # node dist/src/main.js
npx tsx src/main.ts          # run without building

npx prisma generate          # required after clone and after any schema change (output is gitignored)
npx prisma migrate dev       # dev database

npm test                     # unit + integration (jest --selectProjects unit-tests integration-tests)
npm run test:unit            # everything outside tests/integration
npm run test:integration     # tests/integration only
npm run test:performance     # autocannon load test via Jest --runInBand (see Known gaps — currently missing from the working tree)
npm run performance:report   # renders a report from the latest test:performance JSON output
npm test -- src/helpers/url.test.ts        # single file
npm test -- -t "round trip"                # single test by name
npm test -- --no-cache                     # required after touching babel.config.js
npx eslint .

npm run db:psql                            # docker exec -it zipr-postgres-1 psql -U postgres
sudo docker compose up postgres redis -d   # local dev: just the DB + cache; app runs outside docker
```

Always run tests through the npm scripts: they set `DOTENV_CONFIG_PATH=.env.test`. `tests/setup/guard.ts` compares `POSTGRES_DB` against the value declared in `.env.test` and aborts the run otherwise — the suite drops/recreates a whole database and truncates per-test schemas, so a bare `npx jest` risks pointing at the wrong Postgres instance.

## Architecture

**Composition root.** `src/main.ts` is the only place that reads the Postgres/Redis env vars, builds the Prisma client (`@src/clients/prisma.js`), the Redis client (`@src/clients/redis.js`) and the `MultiLevelCacheManager` over `[InMemoryCacheService, RedisService]`, and starts the server. `buildFastify(fastifyArgs, dependencies, plugins)` in `src/build.ts` returns a wired but unstarted instance; `src/server.ts` only calls `listen`. That split is what lets tests build an app against their own Postgres schema and drive it with `app.inject()` — no listening socket. Tests pass `pluginsWithoutRateLimit` (`tests/mocks/fastify.ts`) so `@fastify/rate-limit` doesn't throttle repeated requests inside a suite.

**Dependency injection through plugin options.** Routes are Fastify plugins with signature `(fastify, {prisma, cacheManager}: Dependencies)`. Fastify hands the *entire* options object to the plugin, so dependencies must sit at the top level of the register call (`{ prefix, ...dependencies }`) — nesting them under a `dependencies` key silently yields `undefined`. Route prefixes live in one map in `build.ts` (`''`, `/admin`, `/shorten`, `/user`); paths declared inside a plugin must be relative to the prefix.

**Auth and authorization.** `POST /user/create` hashes the password with bcrypt (`src/helpers/auth.ts`, `BCRYPT_SALT_ROUNDS`) and creates the row with `role: User`, `tier: Free`. `POST /user/login` takes `email` + `password` and returns a JWT (HS256 via `jose`, `JWT_EXPIRATION_TIME`, signed with `JWT_SECRET`). `src/hooks/auth.ts` is a `preHandler` that validates the `Authorization: Bearer <token>` header and decorates `request.userId`; handlers then call `loadUserById` (`src/repositories/user.ts`) for the full `Domain.User` and check `ensureRoleIn`/`ensureTierIn` (`src/helpers/authorization.ts`) against the allow-lists in `src/config/authorization.ts` (currently: `/admin/dummy` requires `Role.Admin`, `POST /shorten/custom` requires `Tier.Pro`).

**Database vs Domain types.** `Database.*` (`src/database/`) are the `prismabox` TypeBox schemas of the Prisma rows (`UrlPlain`, `UserPlain`), including `passwordHash`. `Domain.*` (`src/domain/`) are hand-written TypeBox schemas (`additionalProperties: false`) of what the rest of the app and the client see — `Domain.User` has no `passwordHash`. Each is exported as value + `Static` type, and `urlDomainFromDatabase`/`userDomainFromDatabase` map between them. Repositories return `Domain.*`; code that needs a database-only field reads it through a repository function that returns the `Database.*` row and skips the cache — `loadUserWithPasswordHashByEmail`, used by `POST /user/login` for `passwordHash`.

**Caching.** Reads and writes go through `src/repositories/url.ts` and `src/repositories/user.ts` (`loadUrlById`, `loadUrlByShortUrlAndType`, `saveUrl`, `loadUserById`, `loadUserByEmail`, `saveUser`); routes never touch the cache. `MultiLevelCacheManager` (`src/cache/manager.ts`) walks its levels in order — `InMemoryCacheService`, then `RedisService` — and a hit on a deeper level is propagated to the upper ones in the background; `set` writes every key to every level. A load validates the cached JSON against the TypeBox schema (`parseAndValidateJson`) before trusting it and falls back to Prisma on a miss or an invalid entry, then populates the cache without awaiting it; a save writes Postgres first and only then the cache. Keys are `buildCacheKey(resource, identifier, value)` (`url:id:<id>`, `url:shortUrl_<type>:<slug>`, `user:id:<id>`, `user:email:<email>`); the URL cache holds the `Database.Url` row, the user cache holds the `Domain.User` (so no password hash lands in Redis). Cache failures never throw — the manager swallows level errors, so a down Redis degrades to hitting Postgres instead of failing requests. There is no invalidation yet: nothing updates or deletes rows, so entries never go stale; whoever adds update/delete must also evict the keys.

**Base62 short codes.** `ShorteningTypes.Auto` gets its id from `getAndConsumeNextId` (`src/database/postgres.ts`), a raw `nextval()` against the `urls` table's sequence — this lets the slug (`encodeBase62(id)`) be computed *before* the insert, so `saveUrl` writes the row with `id` and `shortUrl` already set in one call, no follow-up update. `ShorteningTypes.Custom` stores a user-supplied slug and resolves through the `@@unique([shortUrl, type])` compound key; `src/helpers/url.ts` bounds it to `MAX_SLUG_LENGTH` (20) and rejects any slug that collides with a registered route prefix (`customSlugCollidesWithRoute`, checked against `fastify.routes` from `@fastify/routes`). Nothing stops the same owner from shortening the same long URL twice: there's no `@@unique([ownerId, longUrl, type])` constraint, so each request creates its own row and its own slug.

**Request validation.** Every route declares a TypeBox `schema` (body/params/headers): model shapes come from `prismabox` output generated into `prisma/prismabox/` (imported via the `@prismabox/*` alias), route-specific shapes are hand-written in `src/routes/types/*.types.ts`. Fastify rejects malformed requests before the handler runs.

**Module resolution.** `nodenext` requires `.js` extensions on relative *and* aliased imports (`@src/helpers/url.js`). Three different mechanisms undo that at runtime: Jest's `moduleNameMapper` (generated from the tsconfig paths) inside tests, the babel plugin described under *Test setup* for the global hooks, and `tsc-alias` at build time. `tsx` handles it natively, which is why running without a build needs none of them. The Prisma client generates to `generated/prisma/` (gitignored, imported as `@generated/prisma/client.js`); prismabox schemas generate to `prisma/prismabox/` (imported as `@prismabox/*`).

## Test setup

Jest runs TypeScript through babel-jest (`babel.config.js`), not ts-jest — `babel-plugin-transform-import-meta` is required because the generated Prisma 7 client uses `import.meta.url`, and `@babel/preset-env`/`transform-import-meta` are pinned to majors compatible with `@babel/core` 7.

**The global hooks and the `.js` → `.ts` rewrite.** `globalSetup`/`globalTeardown` load outside Jest's module registry: they *are* transpiled by babel-jest, but they receive neither `moduleNameMapper` nor a custom `resolver`, so a `.js` specifier reaches Node unresolved — and so does every specifier in whatever they import. `babel.config.js` therefore carries a plugin that rewrites internal `.js` specifiers to `.ts` at transform time. The guard is on the *specifier*, not on the importing file (inside this project `.js` always means `.ts`, while `pkg/dist/x.js` must be left alone), so coverage follows the real import graph with no file list to maintain. Alias prefixes and the whole `moduleNameMapper` come from `tsconfigAliases.js`, which reads `compilerOptions.paths` — `tsconfig.json` is the only place an alias is declared. Jest caches transforms, so any change here needs `jest --no-cache` to take effect.

**Postgres isolation: one database, one schema per test file.** `tests/helpers/db.ts` settled this after benchmarking `pg-clone-schema`, `CREATE DATABASE ... TEMPLATE`, a hand-rolled `LIKE`+FK/sequence fix, and going through `npx prisma migrate deploy` as a subprocess — see this file's git history for the full evaluation notes (the Prisma CLI subprocess was ruled out categorically at ~750-800ms/file; raw SQL replay won).

- `globalSetup` calls `createTestDb()`, which drops and recreates the single database named by `POSTGRES_DB` in `.env.test`, using the `ADMIN_POSTGRES_DB` admin connection.
- Each integration file calls `getTestSchemaNameFromFileUrl(import.meta.url)` for a stable per-file schema name (repo-relative path, separators turned into `_`), then `buildTestSchema(schema)` in `beforeAll`: drops the schema if present and replays every migration's raw `migration.sql`, read straight off disk from `prisma/migrations/*/` and concatenated — not run through the Prisma CLI.
- `afterEach` calls `clearTestSchema(schema)`, which `TRUNCATE ... RESTART IDENTITY`s every table in that schema (introspected from `information_schema.tables`, excluding `_prisma_migrations`).
- `globalTeardown` closes the pooled connections only; `dropTestDb()` is commented out, so the database itself persists across runs and only its schemas get rebuilt.
- `buildPrismaClient({ connectionString, schema })` takes the schema explicitly and sets `search_path` via the `@prisma/adapter-pg` options, so each test file's Prisma client only ever sees its own schema.

`tests/fixtures/urls.ts` holds URL cases verified against `is-url-http` itself; several plausible-looking invalid URLs (`http:/example.com`, `http://localhost`, `http://127.0.0.1`) are accepted by the library, so verify new fixture entries before adding them.

## Known gaps

- `GET /` still matches `/:shortUrl` with an empty param (verified via `app.inject`), so the API root answers `400 Invalid Url` rather than 404.
- No `host` is set on `fastify.listen`, so Fastify defaults to `127.0.0.1` — unreachable from a container even though the `web` service's port is mapped in `docker-compose.yaml`. (The port itself is no longer hardcoded: `src/server.ts` reads `API_PORT`.) Planned fix, not done: read `API_HOST` in `src/server.ts` (default `127.0.0.1`, so running outside docker stays loopback-only) and set `API_HOST=0.0.0.0` on the `web` service in `docker-compose.yaml`.
- The working tree currently has `src/tests/performance/*` and its `workerRequestHelpers/*.cjs` deleted (uncommitted), while `package.json`'s `test:performance` / `performance:report` scripts still point at them — check `git status` before relying on either script. At the last commit (`eda8a7e`) they ran a real autocannon sweep against `GET /a/:shortUrl` and `GET /:shortUrl` with seeded rows (not empty-table hits) across a range of connection counts, and `performance:report` rendered a report from the JSON they wrote.

## Conventions

- Indentation is 4 spaces throughout `src/`. Trailing commas on multiline lists, semicolons enforced by ESLint.
- Comments explain *why* a non-obvious constraint exists (see `babel.config.js`, `tests/helpers/db.ts`); keep that density rather than narrating what the code does. Prefer expressing a constraint as a test over a comment when it is testable.
- **Integration proves the wiring, unit proves the variation.** An integration test gets one case per distinct response (one 400, one 404, one happy path) and arranges its own data inside the test body — no shared `beforeEach` seeding rows nobody reads. Fan-out over an input space belongs in a unit test, and only where a function actually branches on the value: `test.each` over inputs the code never inspects buys nothing.
- **A negative test needs a distractor.** A 404 against an empty table is true even when the lookup is broken; insert one row so the assertion means "it looked and correctly found nothing".
- **No URL or slug literals in tests** — everything comes from `tests/fixtures/urls.ts`, so a case is picked by what it exercises rather than by hand-typed text.
- Session/working notes (changelog-style write-ups of what changed and why, research/benchmark write-ups, decision logs) do not go in this repo — they go in the Obsidian vault at `~/Documents/General/Projects/Zipr/`. Written in Portuguese, matching the vault's existing notes for this project.
