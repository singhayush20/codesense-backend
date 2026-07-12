# CodeSense Backend

AI-powered automated code review platform. Integrates with GitHub Apps, processes PR events, and generates reviews via user-configured LLM providers.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 |
| Language | TypeScript (ES2023, nodenext modules) |
| Database | PostgreSQL + TypeORM (migrations-only, `synchronize: false`) |
| Cache & Queue | Redis + BullMQ |
| Auth | Google OAuth 2.0, JWT (access + refresh via HttpOnly cookies), Passport.js |
| LLM SDK | Vercel AI SDK (`ai` + `@ai-sdk/google`, `@ai-sdk/openai-compatible`, `ai-sdk-ollama`) |
| Validation | class-validator, class-transformer, Joi (config schema) |
| Testing | Jest + Supertest |
| Lint | ESLint 9 (typescript-eslint) + Prettier |
| Observability | OpenTelemetry (OTLP HTTP exporter) |
| Scheduling | `@nestjs/schedule` |
| Code Parsing | tree-sitter (web-tree-sitter + tree-sitter-wasms) |

## Modules

| Module | Responsibility |
|--------|---------------|
| Auth | Google OAuth, JWT, refresh token rotation, guards |
| User | User management, roles, RBAC |
| GitHub Integration | GitHub App install, repo sync, selection, webhooks |
| Pull Request | PR sync, code parsing (tree-sitter AST), AI review pipeline, review workflow, SSE events |
| AI | LLM adapter layer (Gemini, Ollama, NVIDIA), registry, retry |
| LLM | LLM provider/credential management, repo config |
| Request Context | Request-scoped CLS context (request ID propagation) |
| Cache | Redis abstraction (idempotency, caching) |
| Queue | BullMQ connection config |

## Project Structure

```
src/
├── main.ts                       # Entry point
├── app.module.ts                 # Root module
├── app.controller.ts             # Health/root endpoint
├── config/                       # Config + TypeORM datasource
├── cache/                        # Redis caching (module, service, keys)
├── queue/                        # BullMQ queue module
├── dtos/                         # Shared DTOs
├── types/                        # Shared types
├── utils/                        # Pagination utility
├── exception-handling/           # Global filter + structured exception codes
├── observability/                # OpenTelemetry setup
├── migrations/                   # TypeORM migrations (timestamp-prefixed)
└── modules/
    ├── auth/                     # Google OAuth, JWT, refresh token, guards
    ├── user/                     # User CRUD, roles
    ├── github-integration/       # GitHub App install, sync, webhooks
    ├── pull-request/             # PR sync, code parsing, AI review, SSE
    ├── ai/                       # LLM adapters (Gemini, Ollama, NVIDIA), registry, retry
    ├── llm/                      # Provider/credential CRUD, repo config
    └── request-context/          # CLS request context
```

## Architecture

```text
PR Event → Webhook → Validation → BullMQ Queue → Worker → AI Review → Results → SSE
```

- Webhooks: HMAC signature verification, Redis idempotency, handles `pull_request` + `installation.deleted`
- Processing: BullMQ queues (`code-review`, `pull-request-review-results`), retry with exponential backoff
- Review workflow: multi-step, cancellable, SSE event stream per review run
- Code parsing: tree-sitter AST-based analysis for review context
- LLM adapters: registry pattern (Gemini, Ollama, NVIDIA), encrypted credential storage
- Observability: OpenTelemetry traces exported via OTLP HTTP to Jaeger

## Prerequisites

- Node.js 20+
- PostgreSQL (pgvector)
- Redis
- Docker (for Jaeger, PostgreSQL, Redis via docker-compose)

## Setup

```bash
# Install
npm install

# Environment (see src/config/configuration.ts for all vars)
cp .env.dev .env.dev  # already exists, edit as needed

# Database
npm run migration:run

# Start infra
docker compose up -d postgres redis jaeger

# Dev
npm run start:dev

# Full dev (migrations + start)
npm run start:dev:full
```

## Scripts

```bash
npm run start:dev          # Dev mode (NODE_ENV=dev)
npm run start:debug        # Debug mode
npm run build              # Compile
npm run lint               # ESLint + Prettier fix
npm run lint:check         # ESLint check only
npm test                   # Unit tests
npm run test:cov           # With coverage
npm run test:e2e           # E2E tests
npm run migration:generate # Generate migration from entities
npm run migration:run      # Apply pending migrations
npm run migration:revert   # Revert last migration
```

## Environment Variables

See `src/config/config-validation-schema.ts` for required vars and `src/config/configuration.ts` for the full config shape. Required:

```
ENVIRONMENT=dev|prod
PORT=3000
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
REDIS_HOST, REDIS_PORT
JWT_SECRET_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, GOOGLE_TOKEN_URL, GOOGLE_USER_INFO_URL, GOOGLE_TOKEN_INFO_URL, GOOGLE_AUTH_URL
```

GitHub App and encryption keys are optional per env:

```
GITHUB_APP_NAME, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GUTHUB_APP_WEBHOOK_SECRET
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_REDIRECT_URI
API_KEY_ENCRYPTION_KEY
```

## Key APIs

Swagger UI: `/api/docs`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/oauth2/google?code=` | OAuth callback (code exchange) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (clear cookies + revoke refresh token) |

### GitHub Integration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/github/oauth/url` | Get GitHub OAuth URL |
| GET | `/api/v1/github/oauth/callback` | Handle GitHub OAuth callback |
| GET | `/api/v1/github/install/url` | Get GitHub App install URL |
| GET | `/api/v1/github/install/callback` | Handle install callback |
| GET | `/api/v1/github/accounts` | List connected accounts |
| POST | `/api/v1/github/repos/sync` | Sync repos for installation |
| POST | `/api/v1/github/repos/select` | Select repos for review |
| PATCH | `/api/v1/github/repos/unselect` | Unselect repos |
| GET | `/api/v1/github/repos/selected` | List selected repos |
| POST | `/api/v1/github/accounts/signout` | Sign out from GitHub account |

### Webhook

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/github-webhook/action` | GitHub webhook receiver (raw body parser) |

### Pull Requests

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/pull-requests` | List PRs (paginated) |
| GET | `/api/v1/pull-requests/:id` | PR details |
| GET | `/api/v1/pull-requests/:id/files` | PR changed files |
| GET | `/api/v1/pull-requests/files/:fileId/content` | File content & diff |
| GET | `/api/v1/pull-requests/:id/reviews` | Review results for a PR |
| SSE | `/api/v1/pull-requests/:id/reviews/events` | Stream review events |
| POST | `/api/v1/pull-requests/:id/sync` | Sync PR from GitHub |

### Review Runs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/review-runs/:runId/workflow` | Review workflow state |
| SSE | `/api/v1/review-runs/:runId/events` | Stream workflow events |

### LLM Providers

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/llm/providers` | Create provider |
| GET | `/api/v1/llm/providers` | List providers |
| POST | `/api/v1/llm/providers/:id/credentials` | Add/update credentials |
| DELETE | `/api/v1/llm/providers/:id` | Delete provider |

### Repo LLM Config

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/repos/:repoId/llm-config` | Upsert repo LLM config |
| GET | `/api/v1/repos/:repoId/llm-config` | Get repo LLM config |
| DELETE | `/api/v1/repos/:repoId/llm-config` | Delete repo LLM config |

## Infrastructure

`docker-compose.yaml` provides:
- **PostgreSQL** with pgvector extension
- **Redis** with RedisInsight UI (port 8001)
- **Jaeger** (OTLP HTTP on port 4318, UI on 16686)
