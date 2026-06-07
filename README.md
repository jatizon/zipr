# Zipr

URL shortener em Node.js + TypeScript + Fastify + Prisma (SQLite).

## Pré-requisitos

- **Node.js** 20+ (recomendado 22+)
- **npm**

## Setup inicial (primeira vez)

```bash
npm install

# Criar .env na raiz (ver abaixo)
npx prisma migrate dev   # cria o banco SQLite + Prisma Client
npm run build
npm start
```

### Arquivo `.env`

```env
DATABASE_URL="file:./prisma/dev.db"
```

Usado por `prisma.config.ts` e `lib/prisma.ts`. SQLite é arquivo local — não precisa subir servidor de banco.

---

## TypeScript: build e execução

O projeto usa **ES modules** (`"type": "module"`). Código-fonte em `src/` e `lib/`; saída compilada em `dist/`.

### Produção / “como vai rodar de verdade”

```bash
npm run build    # tsc → dist/ + tsc-alias (resolve paths @lib/*, @generated/*)
npm start        # node dist/src/index.js
```

`npm run build` roda `tsc -p tsconfig.json && tsc-alias`. Sem o alias, o Node não encontra imports como `@lib/prisma.js`.

### Desenvolvimento (sem build)

```bash
npx tsx src/index.ts              # roda o entrypoint direto
npx tsx watch src/index.ts        # hot-reload ao salvar arquivos
npx tsx src/script.ts             # script de exemplo/seed com Prisma
```

Use `tsx` enquanto edita; rode `npm run build` antes de commitar ou testar o fluxo compilado.

### Quando recompilar

| Mudou | O que rodar |
|-------|-------------|
| Código em `src/` ou `lib/` | `npm run build` (ou só `tsx` em dev) |
| `schema.prisma` | `npx prisma migrate dev` + `npm run build` |
| Só generator/output do Prisma | `npx prisma generate` + `npm run build` |
| Paths no `tsconfig.json` | `npm run build` |

### Paths e imports

No `tsconfig.json`:

- `@lib/*` → `./lib/*` (ex.: `@lib/prisma.js`)
- `@generated/*` → `./generated/*` (Prisma Client)

Em runtime compilado, o `tsc-alias` reescreve esses paths nos `.js` de `dist/`.

---

## Prisma (referência)

`migrate dev` aplica migrations pendentes **e** regenera o client em `generated/prisma/`.

```bash
npx prisma migrate dev --name descricao   # criar/aplicar migration (dev)
npx prisma migrate status                 # ver o que já foi aplicado
npx prisma migrate deploy                 # aplicar pendentes (CI/prod)
npx prisma migrate reset                  # APAGA dados e reaplica tudo (dev)
npx prisma generate                       # só regenerar client (sem migration)
npx prisma studio                         # UI em http://localhost:5555
npx prisma validate && npx prisma format    # checar/formatar schema
```

---

## Estrutura relevante

```
zipr/
├── src/              # app (entry: index.ts)
├── lib/              # utilitários compartilhados (ex.: prisma.ts)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── dev.db        # SQLite (gerado pelas migrations)
├── generated/prisma/ # Prisma Client (gerado — não editar)
├── dist/             # JS compilado (gitignore recomendado)
├── prisma.config.ts
└── .env
```

---

## Troubleshooting

**`Cannot find module '@generated/prisma/client.js'`**
→ `npx prisma migrate dev` (ou `generate`) e depois `npm run build`.

**Migration falhou / banco inconsistente (dev)**
→ `npx prisma migrate reset` (apaga dados).

**Erro de unique constraint em `src/script.ts`**
→ Email já existe no banco; apague no Studio ou mude no script.

**Import `@lib/*` ou `@generated/*` quebra só no `node dist/...`**
→ Rode `npm run build` (precisa do `tsc-alias`).
