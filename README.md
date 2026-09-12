# Zipr

URL shortener backend — Fastify, TypeScript, Prisma, SQLite.

Short URLs are derived from the database `id` via Base62 (`encodeBase62(id)`).

## Stack

- Node.js + TypeScript (strict)
- Fastify 5
- Prisma 7 + SQLite (`better-sqlite3` adapter)

## Setup

```bash
npm install
cp .env.example .env   # if present; set DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm run build
npm start
```

Server listens on `http://localhost:3000`.

## API (current)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/shorten` | Create short URL (`ownerId`, `longUrl`) |
| `GET` | `/:code` | Redirect to long URL (301) |
| `POST` | `/admin/test-encode` | Dev: Base62 encode `{ "urlId": number }` |
| `POST` | `/admin/test-decode` | Dev: Base62 decode `{ "shortUrl": string }` |

### Examples

```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"ownerId": 1, "longUrl": "https://example.com"}'

curl -X POST http://localhost:3000/admin/test-encode \
  -H "Content-Type: application/json" \
  -d '{"urlId": 12}'
```

## Development

Pre-commit runs [gitleaks](https://github.com/gitleaks/gitleaks) on staged files.

```bash
npm run build
npx tsx src/index.ts   # run without build (dev)
```

## License

ISC
