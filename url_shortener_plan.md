# Zipr — Plano de Aprendizado e Portfólio

> **Zipr** é um URL shortener production-ready focado em aprendizado de backend e system design.
>
> **Filosofia:** Este não é um projeto para usar o maior número possível de tecnologias. É um projeto para **entender profundamente cada componente**, **implementar sem copiar**, **entregar algo real** e **defender cada decisão em entrevistas de estágio**.

---

## Nome e Domínios

| | Detalhe |
|---|--------|
| **Nome do produto** | **Zipr** |
| **Repositório** | `zipr` (GitHub) |
| **Domínio atual (MVP + V1)** | `zipr.josealberto.com` — subdomínio do domínio pessoal `josealberto.com` |
| **Domínio futuro (opcional)** | `zipr.to` — disponível, mas caro; **só considerar depois** que o projeto estiver validado |

### Por que começar em `zipr.josealberto.com`

1. **Custo zero** — você já controla `josealberto.com`; basta um registro DNS `zipr` → IP do servidor.
2. **Wildcard funciona igual** — `*.zipr.josealberto.com` para subdomínios premium (`joao.zipr.josealberto.com`).
3. **Deploy real antes de investir** — valida o produto, o portfólio e a arquitetura antes de comprar domínio premium.
4. **Migração simples depois** — trocar `BASE_DOMAIN` no env de `zipr.josealberto.com` para `zipr.to` quando fizer sentido.

### Sobre `zipr.to`

- O domínio **está disponível**, mas o preço é alto para quem ainda não começou o projeto.
- **Decisão:** não comprar agora. Usar `zipr.josealberto.com` até ter MVP deployado, demo funcionando e confiança de que vale o investimento.
- Em entrevista: *"Lancei como zipr.josealberto.com no meu domínio pessoal; a arquitetura suporta trocar o apex para zipr.to sem refactor."*

### URLs do produto (domínio atual)

| Tier | Exemplo |
|------|---------|
| **Free** | `zipr.josealberto.com/abc123` |
| **Premium (subdomínio)** | `joao.zipr.josealberto.com` → `https://meusite.com` |
| **App / API** | `zipr.josealberto.com` (apex) |

**Variável de ambiente:**

```bash
BASE_DOMAIN=zipr.josealberto.com
# Futuro: BASE_DOMAIN=zipr.to
```

---

## Objetivo Principal

| Meta | Como medir sucesso |
|------|-------------------|
| Demonstrar domínio de backend moderno | API funcional em produção com auth, cache, testes e CI/CD |
| Ser realista para concluir | MVP em **7 dias**; V1 Premium em **+4–5 dias** |
| Ser excelente para GitHub e currículo | README com arquitetura, SaaS tiers, benchmarks e decisões |
| Priorizar profundidade sobre quantidade | Consegue explicar cache hierarchy, DNS, multi-tenancy e JWT sem olhar código |

---

## Roadmap do Projeto

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MVP — Production-Ready                                   [7 dias] ★   │
│  URL shortening · PostgreSQL · Redis · LRU · JWT · Docker · Deploy     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  V1 PREMIUM — SaaS Features                          [+4–5 dias] ★★    │
│  Custom aliases · User dashboard · Custom subdomains · Plano premium   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  V2 — Escalabilidade                                 [+5–7 dias depois] │
│  Kafka · Analytics · Top-K (LC 347) · Prometheus · Grafana · k6        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  V3 — Avançado                                        [quando quiser]   │
│  Custom domains · Bloom Filter · Consistent Hashing · OTel · K8s       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Priorização: Por que Custom Subdomains vem **antes** de Kafka

| Feature | O que ensina | Valor em entrevista de estágio |
|---------|-------------|-------------------------------|
| **Custom Subdomains (V1)** | DNS, Wildcard DNS, Host Headers, multi-tenancy, reverse proxy, modelagem SaaS, controle de planos | **Alto** — demonstra que você entende a web além do código; recrutadores reconhecem produto real |
| **Kafka (V2)** | Mensageria, event-driven, desacoplamento | Médio — impressiona, mas muitos candidatos nunca viram Kafka em produção |

> **Kafka ensina mensageria.** Custom Subdomains ensina **DNS, SaaS, multi-tenancy, modelagem de dados e arquitetura web** — competências que separam um backend funcional de um engenheiro que pensa em produto.

**Regra:** Não avance para V2 (Kafka) até V1 Premium estar deployada e explicável. O MVP (7 dias) continua focado e intacto.

---

## MVP — Production-Ready (Escopo do Plano de 7 Dias)

### Stack

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Linguagem | **TypeScript 5 + Node.js 22** | Type safety, demanda em estágios, I/O async natural |
| Framework | **Fastify** | Performance, JSON Schema nativo, plugins explícitos |
| Banco | **PostgreSQL 16** | ACID, source of truth, migrations com Prisma |
| ORM | **Prisma** | Schema, migrations, DX; SQL raw opcional no hot path |
| Cache distribuído | **Redis 7** | Cache-aside, rate limiting, TTL |
| Cache local | **LRU in-process (implementação própria)** | LC 146 aplicado; reduz round-trips ao Redis |
| Containers | **Docker + Docker Compose** | Ambiente reproduzível |
| CI/CD | **GitHub Actions** | Lint → Test → Build → Deploy |
| Testes | **Vitest** | Rápido, ESM nativo, ótimo para TDD em `src/lib/` |

### Funcionalidades do MVP

- [ ] `POST /api/v1/shorten` — encurtar URL (autenticado)
- [ ] `GET /:code` — redirect com cache hierarchy
- [ ] Base62 encode/decode (counter → short code)
- [ ] Persistência PostgreSQL via Prisma
- [ ] LRU Cache local (LC 146 — Doubly Linked List + HashMap)
- [ ] Redis cache-aside com TTL
- [ ] JWT Authentication (`register`, `login`)
- [ ] Rate limiting distribuído (Redis)
- [ ] Observabilidade básica (`/health`, `/ready`, logs estruturados)
- [ ] Testes unitários + integração
- [ ] Deploy público (Railway, Fly.io ou VPS)

### O que fica **fora** do MVP

Custom subdomains, custom aliases, dashboard, Kafka, analytics, Top-K, Prometheus/Grafana, custom domains.

---

## V1 Premium — Custom Subdomains e SaaS

### Produto: Free vs Premium

**Plano gratuito:**

```text
zipr.josealberto.com/abc123
```

**Plano premium:**

```text
joao.zipr.josealberto.com        →  https://meusite.com
empresa.zipr.josealberto.com     →  https://empresa.com.br
```

Ao acessar `joao.zipr.josealberto.com`, o usuário é redirecionado para a `target_url` configurada por ele — sem path, sem short code. O subdomínio **é** a identidade do tenant.

### Funcionalidades V1

- [ ] Campo `plan` em users (`free` | `premium`)
- [ ] Custom aliases — `POST /shorten` com `custom_alias` (ex.: `zipr.josealberto.com/meu-link`)
- [ ] `POST /api/v1/subdomains` — registrar subdomínio (premium only)
- [ ] `GET /api/v1/subdomains` — listar subdomínios do usuário
- [ ] `PATCH /api/v1/subdomains/:id` — atualizar `target_url`
- [ ] Redirect via Host Header — `joao.zipr.josealberto.com` → `target_url`
- [ ] Wildcard DNS configurado em produção
- [ ] Nginx/Traefik como reverse proxy
- [ ] Dashboard mínimo (API ou página estática) para gerenciar links e subdomínio
- [ ] Middleware de plano — bloquear features premium para users `free`

### Objetivos de Aprendizado

Esta feature é uma oportunidade deliberada para aprender:

| Conceito | O que você vai fazer na prática |
|----------|------------------------------|
| **DNS** | Configurar registros A/AAAA apontando para o servidor |
| **Wildcard DNS** | `*.zipr.josealberto.com` → mesmo IP; zero registros por tenant |
| **Host Headers** | Fastify lê `Host: joao.zipr.josealberto.com` e resolve o tenant |
| **Multi-tenancy** | Um deploy, milhares de tenants identificados por subdomínio |
| **Reverse Proxies** | Nginx/Traefik termina TLS e encaminha para Fastify |
| **Modelagem de banco** | Tabela `subdomains` com `UNIQUE(subdomain)` |
| **Produtos SaaS** | Tiers free/premium, feature gating, upgrade path |
| **Controle de planos** | Middleware verifica `user.plan` antes de registrar subdomínio |

### Por que isso agrega mais valor de portfólio que Kafka

1. **Visível para não-técnicos:** Um recrutador entende `joao.zipr.josealberto.com` instantaneamente; Kafka não.
2. **Cobre lacunas comuns:** Muitos devs sabem REST mas não sabem como DNS + HTTP headers funcionam juntos.
3. **História de produto:** Você pode dizer *"construí um SaaS com plano free e premium"* — linguagem de negócio.
4. **Diferenciação:** 90% dos URL shorteners de portfólio param no CRUD + Redis. Poucos implementam multi-tenancy real.

---

## Arquitetura — Custom Subdomains (V1)

### Fluxo completo

```text
Browser
   │
   │  GET https://joao.zipr.josealberto.com
   │  Host: joao.zipr.josealberto.com
   ▼
Nginx / Traefik          ← termina TLS, repassa Host header intacto
   │
   ▼
Fastify API
   │
   │  1. Lê request.headers.host  →  "joao.zipr.josealberto.com"
   │  2. Extrai tenant slug       →  "joao"
   │  3. Verifica se é subdomínio de zipr.josealberto.com (não é apex nem www)
   │
   ├── Se subdomínio de tenant:
   │     LRU → Redis → PostgreSQL (subdomains WHERE subdomain = 'joao')
   │     → 302 Redirect para target_url
   │
   └── Se apex (zipr.josealberto.com) ou path (/abc123):
         Fluxo normal de URL shortening
```

### O papel do Host Header

Quando o browser acessa `https://joao.zipr.josealberto.com`, ele envia:

```http
GET / HTTP/1.1
Host: joao.zipr.josealberto.com
User-Agent: Mozilla/5.0 ...
```

**Por que isso importa:**

- O servidor recebe **milhares de subdomínios diferentes** no **mesmo IP** (Wildcard DNS).
- Sem path (`/abc123`), o único identificador do tenant é o **Host header**.
- Fastify expõe isso via `request.headers.host` ou `request.hostname`.
- A app faz parse: `"joao.zipr.josealberto.com"` → slug `"joao"` → lookup no banco.

**Implementação sugerida (`src/middleware/tenant-resolver.ts`):**

```typescript
function extractTenantSlug(host: string, baseDomain: string): string | null {
  // host: "joao.zipr.josealberto.com"  baseDomain: "zipr.josealberto.com"
  if (!host.endsWith(`.${baseDomain}`)) return null;
  const slug = host.slice(0, -(baseDomain.length + 1)); // "joao"
  if (!slug || slug.includes('.')) return null; // rejeita sub.sub.domain
  return slug;
}
```

**Cache key para subdomínios:** `subdomain:joao` → `https://meusite.com` (separado de `code:abc123`).

### Arquitetura — MVP (Fase 1)

```
                         ┌──────────────────┐
                         │     Cliente       │
                         └────────┬─────────┘
                                  │
                    POST /shorten │ GET /:code
                                  ▼
                         ┌──────────────────┐
                         │   Fastify API     │
                         │   (stateless)     │
                         └────────┬─────────┘
                                  │
     Redirect Path (GET /:code):
     ┌─────────────────────────────────────────────────────────┐
     │  1. LRU Cache (in-process)     ~1 μs                    │
     │  2. Redis (cache-aside)        ~1–2 ms                  │
     │  3. PostgreSQL (source of truth) ~3–10 ms               │
     └─────────────────────────────────────────────────────────┘

     Infra: PostgreSQL · Redis · GitHub Actions
```

### Arquitetura — V1 Premium (com Reverse Proxy)

```
                    ┌──────────────────────────────────────┐
                    │  Browser: joao.zipr.josealberto.com             │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  Nginx / Traefik                      │
                    │  TLS termination                      │
                    │  proxy_pass → Fastify:3000            │
                    │  proxy_set_header Host $host;         │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  Fastify                              │
                    │  tenant-resolver middleware           │
                    │  → slug "joao" → subdomains table     │
                    │  → 302 → target_url                   │
                    └──────────────────────────────────────┘
```

---

## DNS — Wildcard DNS

### O problema sem Wildcard

Sem wildcard, cada subdomínio precisaria de um registro DNS manual:

```dns
joao.zipr.josealberto.com     A    203.0.113.10
empresa.zipr.josealberto.com  A    203.0.113.10
teste.zipr.josealberto.com    A    203.0.113.10
... (um registro por tenant — inviável)
```

### A solução: Wildcard DNS

Um único registro captura **todos** os subdomínios:

```dns
*.zipr.josealberto.com    A    203.0.113.10
zipr.josealberto.com      A    203.0.113.10    # apex (opcional, mesmo IP)
```

**Resultado:**

```text
joao.zipr.josealberto.com      →  203.0.113.10  →  Nginx → Fastify
empresa.zipr.josealberto.com   →  203.0.113.10  →  Nginx → Fastify
teste.zipr.josealberto.com     →  203.0.113.10  →  Nginx → Fastify
qualquer.zipr.josealberto.com  →  203.0.113.10  →  Nginx → Fastify
```

### Por que isso elimina registros individuais

1. DNS resolve qualquer `*.zipr.josealberto.com` para o mesmo IP **antes** da requisição chegar à app.
2. A app diferencia tenants pelo **Host header**, não pelo DNS.
3. Registrar um novo subdomínio = **INSERT no banco**, zero mudança no DNS.
4. Escala para milhares de tenants sem tocar no painel DNS.

### Configuração em `josealberto.com` (domínio pessoal)

No painel DNS de `josealberto.com`, criar:

```dns
zipr              A      203.0.113.10    # app Zipr (apex do produto)
*.zipr            A      203.0.113.10    # wildcard — subdomínios premium
```

> **Nota:** O wildcard é `*.zipr.josealberto.com`, configurado como registro `*.zipr` no DNS de `josealberto.com`. Não é necessário comprar domínio novo.

### Configuração em produção (referência)

| Provider | Como configurar |
|----------|----------------|
| Cloudflare (josealberto.com) | Add record → Type A → Name `zipr` → IP · Name `*.zipr` → IP |
| Route 53 | `zipr.josealberto.com` + `*.zipr.josealberto.com` → A record |
| Local dev | `/etc/hosts`: `127.0.0.1 zipr.josealberto.com joao.zipr.josealberto.com` |

**Dev local com Docker:**

```yaml
# docker-compose.yml — adicionar nginx
nginx:
  image: nginx:alpine
  ports: ["80:80", "443:443"]
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on: [api]
```

---

## Banco de Dados — Schema Completo

### Tabela `users`

```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free',  -- 'free' | 'premium'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela `subdomains`

```sql
CREATE TABLE subdomains (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subdomain   VARCHAR(63) NOT NULL,   -- slug: "joao", "empresa"
  target_url  TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT subdomains_subdomain_unique UNIQUE (subdomain)
);

CREATE INDEX idx_subdomains_subdomain ON subdomains(subdomain) WHERE active = TRUE;
```

### Garantindo unicidade de subdomínios

1. **Constraint `UNIQUE(subdomain)`** — PostgreSQL rejeita duplicatas no INSERT; retorne `409 Conflict` na API.
2. **Validação na app** — regex `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$` (RFC 1123); bloquear slugs reservados (`www`, `api`, `admin`, `app`).
3. **Transação atômica** — verificar plano premium + INSERT em uma transaction; evita race condition parcial.
4. **Um subdomínio por user (MVP V1)** — constraint adicional `UNIQUE(user_id)` se quiser limitar a 1 subdomínio no plano premium básico.

### Schema Prisma (MVP + V1)

```prisma
enum Plan {
  free
  premium
}

model User {
  id           BigInt      @id @default(autoincrement())
  email        String      @unique
  passwordHash String      @map("password_hash")
  plan         Plan        @default(free)
  createdAt    DateTime    @default(now()) @map("created_at")
  urls         Url[]
  subdomains   Subdomain[]

  @@map("users")
}

model Url {
  id         BigInt    @id @default(autoincrement())
  shortCode  String    @unique @map("short_code") @db.VarChar(10)
  longUrl    String    @map("long_url")
  customAlias String?  @unique @map("custom_alias") @db.VarChar(50)
  userId     BigInt?   @map("user_id")
  user       User?     @relation(fields: [userId], references: [id])
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime? @map("expires_at")

  @@index([shortCode])
  @@map("urls")
}

model Subdomain {
  id         BigInt   @id @default(autoincrement())
  userId     BigInt   @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subdomain  String   @unique @db.VarChar(63)
  targetUrl  String   @map("target_url")
  active     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([subdomain])
  @@map("subdomains")
}
```

---

## V2 — Escalabilidade (Depois de V1 Premium)

| Componente | Objetivo de aprendizado |
|-----------|------------------------|
| **Kafka / Redpanda** | Desacoplar click tracking do redirect path |
| **Analytics Service** | Consumer separado, persistência de eventos |
| **Top-K Frequent URLs (LC 347)** | Min-Heap + frequency map para `/analytics/top?k=10` |
| **Prometheus + Grafana** | RED metrics, cache hit ratio, latência p95 |
| **Load Testing (k6 / autocannon)** | Validar bottlenecks com dados |
| **Event-driven architecture** | Producer fire-and-forget no redirect |

### LeetCode 347 — Top K Frequent Elements (V2)

**Onde aplica:** Analytics service — `GET /api/v1/analytics/top?k=10`.

**Estrutura:** `Map<string, number>` + Min-Heap de tamanho K → O(n log k).

**Implementação:** `src/lib/top-k.ts` com heap array-based do zero.

**Referências:**
- https://leetcode.com/problems/top-k-frequent-elements/
- https://github.com/senapatisantosh/SystemDesign/blob/main/docs/hld/30-top-k-analysis-part1.md

---

## V3 — Avançado

- **Custom domains** — `links.joaosilva.dev` via CNAME (ver seção abaixo)
- Bloom Filter — verificar existência de short codes sem hit no DB
- Consistent Hashing — routing de cache shards
- Kubernetes — Deployment, Service, HPA
- OpenTelemetry — distributed tracing
- ClickHouse — analytics columnar em escala

---

## Custom Domains — Evolução Futura (V3)

### Migração para `zipr.to` (quando valer o investimento)

Quando o projeto estiver validado e o domínio `zipr.to` for comprado:

```bash
# Só trocar env + DNS — mesma arquitetura
BASE_DOMAIN=zipr.to
```

| Antes | Depois |
|-------|--------|
| `zipr.josealberto.com/abc123` | `zipr.to/abc123` |
| `joao.zipr.josealberto.com` | `joao.zipr.to` |
| `*.zipr.josealberto.com` | `*.zipr.to` |

**Por que esperar:** `zipr.to` está disponível, mas é caro para um projeto que ainda não começou. `zipr.josealberto.com` entrega o mesmo aprendizado e demo com custo zero.

### De subdomínios da plataforma para domínio do cliente

**V1 Premium (subdomínio da plataforma — domínio atual):**

```text
joao.zipr.josealberto.com  →  https://meusite.com
```

**V1 Premium (após migrar para zipr.to):**

```text
joao.zipr.to  →  https://meusite.com
```

**V3 (domínio do cliente):**

```text
links.joaosilva.dev  →  https://meusite.com
go.empresa.com       →  https://empresa.com.br
```

### Como funciona com CNAME

O cliente configura DNS no **próprio domínio**:

```dns
links.joaosilva.dev    CNAME    zipr.josealberto.com
go.empresa.com         CNAME    zipr.josealberto.com
# Após migrar: CNAME → zipr.to
```

**Fluxo:**

```text
Browser → links.joaosilva.dev
   ↓ DNS resolve CNAME → zipr.josealberto.com → IP do servidor
   ↓
Nginx/Traefik recebe Host: links.joaosilva.dev
   ↓
Fastify lookup em custom_domains WHERE domain = 'links.joaosilva.dev'
   ↓
302 → target_url
```

### Diferença técnica: Subdomain vs Custom Domain

| | Platform Subdomain (V1) | Custom Domain (V3) |
|---|------------------------|-------------------|
| DNS | Você controla `*.zipr.josealberto.com` | Cliente configura CNAME |
| Host header | `joao.zipr.josealberto.com` | `links.joaosilva.dev` |
| Tabela | `subdomains.slug` | `custom_domains.domain` |
| TLS | Wildcard cert `*.zipr.josealberto.com` | Cert por domínio (Let's Encrypt ACME) |
| Complexidade | Baixa | Alta (SSL provisioning automático) |

### Como plataformas profissionais fazem

- **Vercel, Netlify, Shopify:** Cliente aponta CNAME → plataforma verifica ownership → emite cert SSL via ACME (Let's Encrypt) → roteia por Host header.
- **Bitly, Rebrandly:** Custom domains são feature premium; onboarding inclui wizard de DNS.
- **Padrão:** Tabela `custom_domains (domain, user_id, verified, ssl_status)` + job que poll DNS até CNAME propagar.

> **Para entrevista:** *"V1 usa subdomínios com Wildcard DNS — simples e sob nosso controle. V3 evolui para custom domains com CNAME + ACME, como Vercel faz, porque o cliente quer branding no próprio domínio."*

---

## Estratégia de Caching

### Padrões

| Padrão | Como funciona | Vantagens | Desvantagens | Caso de uso |
|--------|--------------|-----------|--------------|-------------|
| **Cache-aside** | App lê cache; em miss, lê DB e popula cache | Simples, cache só guarda o hot | Risco de stale data; lógica na app | **Redirect lookup** (nosso caso) |
| **Write-through** | App escreve cache e DB juntos (sync) | Cache sempre consistente | Write mais lento; cache poluído com dados frios | Configs, sessões críticas |
| **Write-back (write-behind)** | App escreve cache; flush async para DB | Writes muito rápidos | Risco de perda de dados; complexidade | Write-heavy, tolerância a perda |

### Por que Redis usa cache-aside neste projeto

1. **Read-heavy:** Redirects são ~100× mais frequentes que creates.
2. **TTL resolve staleness:** URL raramente muda; TTL de 24h é aceitável.
3. **Falha graceful:** Se Redis cair, LRU + PostgreSQL ainda funcionam.
4. **Simplicidade:** Write path não precisa sincronizar duas escritas atômicas.

### Hierarquia de cache

```
GET /:code  ou  Host: joao.zipr.josealberto.com
        │
        ▼
┌───────────────────────┐
│  L1: LRU (in-process) │  ~1 μs    key: code:abc123 | subdomain:joao
└───────────┬───────────┘
            │ miss
            ▼
┌───────────────────────┐
│  L2: Redis            │  ~1–2 ms  TTL 24h
└───────────┬───────────┘
            │ miss
            ▼
┌───────────────────────┐
│  L3: PostgreSQL       │  ~3–10 ms  urls | subdomains
└───────────────────────┘
```

### Invalidação

- **TTL-based (MVP/V1):** Redis expira em 24h; LRU evicta por capacidade.
- **Event-based (V2):** Kafka consumer invalida cache quando URL/subdomínio é atualizado.

---

## LeetCode 146 — LRU Cache (Obrigatório no MVP)

### Por que é relevante em sistemas reais

Hot URLs e subdomínios ativos seguem distribuição de Pareto. LRU local captura o working set **sem round-trip de rede**.

### Requisitos de implementação

- Arquivo: `src/lib/lru-cache.ts`
- Estrutura: **Doubly Linked List + HashMap** → O(1) `get` e `put`
- **Não usar** `Map` insertion order como atalho
- Testes: `tests/lib/lru-cache.test.ts` (TDD)
- Integração: redirect path (`/:code`) e subdomain path (Host header)

### Referências

- https://leetcode.com/problems/lru-cache/
- https://leetcopilot.dev/blog/lru-cache-leetcode-solution
- https://www.techinterview.org/post/3233474787/lru-cache-design-system-design-gateway/

---

## Cronograma — 7 Dias (MVP Only)

> **Carga:** ~6–7h/dia · Total: ~46–53h

### Dia 1 — System Design, Arquitetura, Setup, Base62

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Estudar system design (2 artigos) | Notas em `docs/decisions.md` | 2h |
| Desenhar arquitetura MVP | Diagrama no README | 1h |
| Setup: TS, ESLint, Vitest, Fastify | `GET /health` | 1.5h |
| `src/lib/base62.ts` + testes | encode/decode | 1h |
| Contratos de API | `src/types/` | 0.5–1h |

### Dia 2 — PostgreSQL, Prisma, CRUD, URL Shortening

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Docker Compose + PostgreSQL | DB rodando | 0.5h |
| Prisma schema + migration | `users`, `urls` | 1h |
| Repository + `POST /shorten` | CRUD funcional | 3h |
| `GET /:code` redirect 302 | Redirect funcional | 1h |
| Testes de integração | shorten + redirect | 1h |

### Dia 3 — LRU Cache (LC 146)

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| LC 146 no LeetCode | Entendimento | 1h |
| `LRUCache` from scratch | Testes 100% | 2.5h |
| Integrar no redirect | LRU → DB | 1.5h |
| Nota de latência | `docs/decisions.md` | 0.5h |

### Dia 4 — Redis, Cache-Aside, Cache Hierarchy

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Redis no Docker Compose | Rodando | 0.5h |
| Cache-aside | LRU → Redis → PG | 3.5h |
| Logs hit/miss | Contadores | 0.5h |
| Testes com Redis | Integração | 1.5h |

### Dia 5 — JWT + Rate Limiting

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Auth: register, login, JWT | Endpoints + middleware | 3.5h |
| Rate limiter Redis | 429 após limite | 2h |
| Testes auth + rate limit | Vitest | 1h |

### Dia 6 — Testes, Docker, CI/CD

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Suite de testes completa | `npm test` verde | 2h |
| Dockerfile multi-stage | ~150MB | 1h |
| Docker Compose (api + pg + redis) | `docker compose up` | 1h |
| GitHub Actions | Pipeline verde | 2h |
| `/health`, `/ready`, SIGTERM | Graceful shutdown | 1h |

### Dia 7 — Deploy, README, Benchmark, Polish

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Deploy público | URL live | 1.5h |
| Benchmark (autocannon) | Resultados no README | 1h |
| README de portfólio | Diagrama, API, decisões | 2h |
| `docs/decisions.md` | 5+ ADRs | 1h |
| Polish + edge cases | Validação zod | 1h |

---

## Cronograma — V1 Premium (+4–5 Dias)

> Executar **após** MVP deployado e explicável.

### Dia 8 — Modelagem SaaS + Custom Aliases

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Migration: `plan` em users, `custom_alias` em urls | Schema atualizado | 1h |
| Middleware `requirePremium` | 403 para features premium | 1h |
| Custom alias no `POST /shorten` | `zipr.josealberto.com/meu-link` | 2h |
| Lista de slugs reservados | `www`, `api`, `admin` | 0.5h |
| Testes | Alias único, conflito 409 | 1.5h |

### Dia 9 — Subdomains: Banco + API

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Migration: tabela `subdomains` | UNIQUE constraint | 1h |
| `POST /api/v1/subdomains` | Registrar (premium) | 2h |
| `GET/PATCH /api/v1/subdomains` | CRUD básico | 1.5h |
| Validação slug RFC 1123 | Regex + reserved list | 1h |
| Testes: unicidade, plano free bloqueado | Vitest | 1.5h |

### Dia 10 — Host Header + Tenant Resolver

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| `tenant-resolver.ts` middleware | Parse Host → slug | 2h |
| Redirect por subdomínio | 302 → target_url | 2h |
| Cache hierarchy para subdomains | `subdomain:joao` keys | 1.5h |
| Testes com Host header mock | Supertest | 1.5h |

### Dia 11 — DNS + Nginx + Deploy Premium

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Configurar Wildcard DNS | `*.zipr.josealberto.com` → IP | 1h |
| Nginx reverse proxy + TLS | proxy_set_header Host | 2h |
| Deploy com subdomínio funcional | `joao.zipr.josealberto.com` live | 2h |
| Dashboard mínimo | Gerenciar subdomínio + links | 2h |

### Dia 12 — Polish V1 + README

| Etapa | Entregável | Tempo |
|-------|-----------|-------|
| Atualizar README | Free vs Premium, diagrama DNS | 2h |
| ADRs: Wildcard DNS, multi-tenancy | `docs/decisions.md` | 1h |
| Demo gravada | Subdomínio funcionando | 1h |
| Revisão entrevista | Ensaiar explicação 5 min | 1h |

---

## Estrutura de Pastas (MVP + V1)

```
zipr/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── shorten.ts
│   │   ├── redirect.ts
│   │   ├── auth.ts
│   │   └── subdomains.ts        # V1
│   ├── services/
│   │   ├── url.service.ts
│   │   ├── auth.service.ts
│   │   └── subdomain.service.ts # V1
│   ├── repositories/
│   │   ├── url.repository.ts
│   │   └── subdomain.repository.ts
│   ├── middleware/
│   │   ├── rate-limiter.ts
│   │   ├── auth.ts
│   │   ├── require-premium.ts   # V1
│   │   └── tenant-resolver.ts   # V1
│   ├── cache/
│   │   ├── redis.ts
│   │   └── local.ts
│   ├── lib/
│   │   ├── base62.ts
│   │   ├── lru-cache.ts
│   │   └── slug-validator.ts    # V1
│   └── config/
│       └── env.ts
├── nginx/
│   └── nginx.conf               # V1
├── prisma/
├── tests/
├── docs/
│   └── decisions.md
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## O Que Falar na Entrevista

Para cada tópico: **o que é**, **por que escolheu**, **alternativas**, **trade-offs**.

---

### Base62 vs UUID

| | Base62 | UUID |
|---|--------|------|
| **O que é** | Encoding de integer → URLs curtas (`abc12X`) | 128-bit identifier |
| **Por que escolhemos** | URLs legíveis, curtas, SEO-friendly | — |
| **Alternativas** | Hash truncation, random string, NanoID | UUID v4, ULID, Snowflake |
| **Trade-offs** | Counter+Base62 = zero collision; expõe volume | Sem coordenação; 36 chars |

---

### Cache-Aside / LRU / Redis / JWT / Rate Limiting / 301 vs 302

*(Ver seções anteriores do plano — mantidos no MVP.)*

---

### Custom Subdomains — Perguntas de Entrevista

#### 1. Como você garante unicidade de subdomínios?

**Resposta:**

- **Constraint `UNIQUE(subdomain)` no PostgreSQL** — o banco rejeita duplicatas atomicamente; a API retorna `409 Conflict`.
- **Validação na app antes do INSERT** — regex RFC 1123, lista de slugs reservados (`www`, `api`, `admin`), normalização para lowercase.
- **Transação** — verificar plano premium + INSERT na mesma transaction evita estado inconsistente.
- **Alternativa descartada:** check-then-insert sem constraint — race condition entre dois requests simultâneos.

---

#### 2. Como milhares de subdomínios apontam para a mesma aplicação?

**Resposta:**

- **Wildcard DNS:** registro `*.zipr.josealberto.com A 203.0.113.10` faz qualquer subdomínio resolver para o mesmo IP.
- **Um processo Fastify** atende todos os tenants — stateless, escala horizontalmente.
- **Identificação por Host header:** `Host: joao.zipr.josealberto.com` → slug `joao` → lookup no banco.
- **Não precisa** criar registro DNS por tenant — escala infinita no DNS, limitada só pelo banco.

---

#### 3. O que é Wildcard DNS?

**Resposta:**

- Registro DNS com asterisco: `*.zipr.josealberto.com` captura **qualquer** subdomínio não explicitamente definido.
- `joao.zipr.josealberto.com`, `empresa.zipr.josealberto.com`, `xyz.zipr.josealberto.com` → todos resolvem para o mesmo IP.
- **Prioridade:** registros explícitos (`api.zipr.josealberto.com`) sobrescrevem o wildcard.
- **Limitação:** wildcard cobre apenas **um nível** — `*.zipr.josealberto.com` não captura `a.b.zipr.josealberto.com` (precisaria `*.*.zipr.josealberto.com`, raramente suportado).

---

#### 4. Como identificar qual cliente está acessando o sistema?

**Resposta:**

- **HTTP Host header** — enviado automaticamente pelo browser em toda requisição.
- Parse: `"joao.zipr.josealberto.com"` → extrair slug `"joao"` → `SELECT target_url FROM subdomains WHERE subdomain = 'joao'`.
- **Alternativas descartadas:**
  - Path-based (`zipr.josealberto.com/joao`) — funciona, mas premium quer subdomínio branded.
  - Header custom (`X-Tenant-ID`) — não funciona em browser com redirect público.
  - JWT no redirect — impossível; redirect é anônimo.

---

#### 5. Como implementar multi-tenancy usando Host Header?

**Resposta:**

```text
1. Middleware early no pipeline Fastify
2. Ler request.headers.host
3. Se host != apex (zipr.josealberto.com):
     slug = extractSlug(host)
     tenant = await subdomainRepo.findBySlug(slug)
     if (tenant) return redirect(tenant.targetUrl)
4. Se host == apex:
     fluxo normal (/:code ou API)
```

- **Shared database, shared schema** — coluna `subdomain` identifica tenant (padrão SaaS early-stage).
- **Isolamento:** queries sempre filtram por `user_id` na API autenticada; redirect público filtra por slug.
- **Evolução:** schema-per-tenant ou DB-per-tenant só se compliance exigir (enterprise).

---

#### 6. Como evoluir de subdomínios para domínios personalizados?

**Resposta:**

| Etapa | Mecanismo |
|-------|-----------|
| **V1** | `joao.zipr.josealberto.com` — Wildcard DNS sob nosso controle |
| **V3** | `links.joaosilva.dev` — cliente configura `CNAME → zipr.josealberto.com` |
| **Verificação** | Job poll DNS até CNAME propagar; marca `verified = true` |
| **TLS** | ACME (Let's Encrypt) emite cert por domínio automaticamente |
| **Roteamento** | Mesmo Host header parsing, tabela `custom_domains` em vez de `subdomains` |

- **Referência:** Vercel, Netlify, Shopify — onboarding wizard de DNS + SSL automático.
- **Trade-off:** Custom domains exigem infra de cert management; subdomínios são 80% do valor com 20% da complexidade.

---

## README Strategy — O Que o Recrutador Deve Ver

### Checklist do README (atualizado pós-V1)

```markdown
# Zipr — Production-Ready SaaS Backend

> Encurtador com cache hierarchy, JWT, rate limiting e subdomínios premium.
> MVP em 7 dias · V1 Premium com multi-tenancy via Host Header.

## Demo
- zipr.josealberto.com/abc123 (free)
- joao.zipr.josealberto.com → meusite.com (premium)

## Architecture
[Diagrama: Browser → Wildcard DNS → Nginx → Fastify → Host Header → DB]

## Plans
| Free | Premium |
|------|---------|
| zipr.josealberto.com/code | joao.zipr.josealberto.com |
| 10 links/day | Custom aliases + subdomain |

## Tech Stack
TS · Fastify · PostgreSQL · Prisma · Redis · Nginx · Docker · GitHub Actions

## Key Features
- Cache hierarchy: LRU → Redis → PostgreSQL
- Multi-tenancy via Host Header + Wildcard DNS
- SaaS tiers (free/premium)
- JWT + distributed rate limiting

## Design Decisions
→ docs/decisions.md
```

### O que cada persona procura

| Persona | O que olha | Como impressionar |
|---------|-----------|-------------------|
| **Recrutador** | Demo live com subdomínio, README claro | `joao.zipr.josealberto.com` funcionando na demo |
| **Engenheiro** | Multi-tenancy, DNS, cache, testes | ADR de Wildcard DNS; tenant-resolver explicado |
| **Tech lead** | Priorização sensata | MVP enxuto → V1 SaaS → V2 Kafka (não overengineering) |

---

## Checklist de Progresso

### MVP (Dias 1–7)

- [ ] URL shorten + redirect em produção
- [ ] LRU → Redis → PG funcionando
- [ ] JWT + rate limiting
- [ ] CI verde
- [ ] README impressiona em 60 segundos

### V1 Premium (Dias 8–12)

- [ ] Campo `plan` + middleware premium
- [ ] Custom aliases funcionando
- [ ] Tabela `subdomains` com UNIQUE constraint
- [ ] `POST /subdomains` (premium only)
- [ ] Tenant resolver via Host header
- [ ] Wildcard DNS configurado
- [ ] Nginx reverse proxy em produção
- [ ] `joao.zipr.josealberto.com` redireciona live
- [ ] README atualizado com free vs premium
- [ ] Consigo explicar multi-tenancy em 5 minutos

### Definition of Done (V1)

- [ ] Subdomínio premium funciona end-to-end (DNS → Nginx → Fastify → DB → redirect)
- [ ] Unicidade garantida (constraint + testes de conflito)
- [ ] Plano free bloqueado corretamente
- [ ] ADRs documentam Wildcard DNS e Host Header strategy

---

## Regras de Ouro

1. **Escreva cada linha.** Pesquise docs — não copie soluções completas.
2. **Commits frequentes e atômicos.** Um commit = uma feature/teste.
3. **TDD em `src/lib/`.** Base62, LRU e slug-validator são perfeitos para test-first.
4. **Documente decisões em `docs/decisions.md`.** Formato ADR: Contexto → Decisão → Consequências.
5. **MVP primeiro, premium depois.** Não misture V1 no cronograma de 7 dias.
6. **Custom Subdomains antes de Kafka.** Produto > infra quando o objetivo é portfólio.
7. **`strict: true` no tsconfig.** Zero `any` escapando.

---

## Referências de Estudo

### System Design

- https://crackingwalnuts.com/post/url-shortener-system-design
- https://sujeet.pro/articles/url-shortener-design
- https://singhajit.com/tinyurl-system-design/

### DNS e Multi-tenancy

- https://dev.to/aws-builders/multi-tenancy-with-subdomains-and-wildcard-dns-4k8e
- https://vercel.com/docs/projects/domains/working-with-domains/add-a-domain
- RFC 1034 — Domain Names (wildcard specification)

### SaaS e Produto

- https://stripe.com/docs/billing/subscriptions/overview (referência de tiers)
- *Designing Data-Intensive Applications* (Kleppmann) — caps. 1–3, 6 (partitioning)

### Node.js / Fastify / Infra

- https://fastify.dev/docs/latest/Guides/Recommendations/
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- https://doc.traefik.io/traefik/routing/routers/

---

## Próximos Passos Imediatos

1. Criar repositório GitHub `zipr`
2. Executar **Dia 1** do cronograma MVP
3. Abrir `docs/decisions.md` — primeira ADR: *"Por que Fastify e não Express"*
4. Resolver LC 146 no LeetCode antes do Dia 3
5. **Após MVP deployado:** planejar V1 Premium com Wildcard DNS no provider escolhido

> **Lembrete final:** O objetivo não é impressionar com Kafka. É entrar na entrevista e dizer: *"Implementei o Zipr, um URL shortener SaaS. No plano free você usa zipr.josealberto.com/code; no premium, joao.zipr.josealberto.com aponta pro seu site via Wildcard DNS e Host Header multi-tenancy. Lancei no meu domínio pessoal; quando validar, migro pro zipr.to. Deixa eu te explicar como garanti unicidade de subdomínios."*
