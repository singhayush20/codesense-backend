# CodeSense Backend — AGENTS.md

## Overview

CodeSense is a NestJS backend for AI-powered automated code review. It integrates with GitHub Apps, processes PR events, and generates reviews via user-configured LLM providers.

## Tech Stack

| Layer         | Technology                                                                            |
| ------------- | ------------------------------------------------------------------------------------- |
| Framework     | NestJS 11                                                                             |
| Language      | TypeScript (ES2023, nodenext modules)                                                 |
| Database      | PostgreSQL + TypeORM (migrations-only, `synchronize: false`)                          |
| Cache & Queue | Redis + BullMQ                                                                        |
| Auth          | Google OAuth 2.0, JWT (access + refresh via HttpOnly cookies), Passport.js            |
| LLM SDK       | Vercel AI SDK (`ai` + `@ai-sdk/google`, `@ai-sdk/openai-compatible`, `ai-sdk-ollama`) |
| Validation    | class-validator, class-transformer, Joi (config schema)                               |
| Testing       | Jest + Supertest                                                                      |
| Lint          | ESLint 9 (typescript-eslint) + Prettier                                               |
| Observability | OpenTelemetry (OTLP HTTP exporter)                                                    |
| Scheduling    | `@nestjs/schedule`                                                                    |

## Project Structure

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module (imports all feature modules)
├── app.controller.ts                # Health/root endpoint
├── app.service.ts                   # Root service
├── config/                          # App configuration & TypeORM data source
├── cache/                           # Redis caching layer
│   ├── redis/                       # Redis client service
│   ├── cache.module.ts
│   ├── cache.service.ts
│   └── cache.keys.ts
├── queue/                           # BullMQ queue module
├── common/                          # (reserved for shared utilities)
├── dtos/                            # Shared DTOs (e.g. paginated-response)
├── types/                           # Shared TypeScript types
├── utils/                           # Shared utilities (e.g. pagination)
├── exception-handling/              # Global exception filter + structured exception codes
├── observability/                   # OpenTelemetry telemetry setup
├── migrations/                      # TypeORM migrations (timestamp-prefixed)
└── modules/
    ├── auth/                        # Google OAuth, JWT, refresh token rotation, guards
    ├── user/                        # User management, roles, RBAC
    ├── github-integration/          # GitHub App install, repo sync, selection, webhooks
    ├── pull-request/                # PR processing pipeline (sync, analysis, review, query)
    ├── ai/                          # LLM adapter layer (Gemini, Ollama, NVIDIA), registry, retry
    ├── llm/                         # LLM provider/credential management, repo config
    └── request-context/             # Request-scoped context (CLS)
```

## Module Architecture

Each feature module follows this convention:

```
<module>/
├── controller/          # Route handlers
├── service/             # Business logic (subdirectories per concern)
├── entity/              # TypeORM entities
├── dto/                 # Data transfer objects (one file per DTO)
├── repository/          # Custom TypeORM repositories (if needed)
├── enums/               # TypeScript enums
├── mapper/              # Entity↔DTO mappers
├── processor/           # BullMQ queue processors
├── cron/                # Scheduled task handlers
├── util/                # Pure utility functions
├── errors/              # Error mappers / exception definitions
├── exceptions/          # Custom exception classes
├── registry/            # Provider/service registries
├── schema/              # Zod / schema definitions
├── llm-adapter/         # LLM provider adapters
├── tools/               # AI tool services
├── guard/               # NestJS guards
├── strategy/            # Passport strategies
├── decorator/           # Custom decorators
└── <module>.module.ts   # Module definition
```

## Coding Conventions

- **Imports**: NestJS modules first, then project modules, relative paths
- **Exports**: Default export per file, named exports for types/interfaces
- **Naming**: PascalCase for classes/types, camelCase for instances/methods, kebab-case for files
- **Entities**: Single file per entity, use TypeORM decorators
- **DTOs**: Single file per DTO, use `class-validator` decorators
- **Mappers**: Static methods, named `toDto` / `toEntity` / `toResponse`
- **No `any`** (enforced by `@typescript-eslint/no-explicit-any: 'off'` — relaxed, but prefer typed)
- **No comments** unless necessary for clarification
- **Single quotes**, trailing commas (Prettier enforced)

## Testing

- Tests co-located with source files (`*.spec.ts`)
- NestJS `@nestjs/testing` `Test.createTestingModule`
- Mock repositories/services, use `getRepositoryToken`
- Coverage threshold not enforced, but expected for business logic

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage
npm run test:e2e      # E2E tests (separate jest config)
```

## Scripts

```bash
npm run start:dev        # Dev mode (NODE_ENV=dev)
npm run start:debug      # Debug mode
npm run build            # Compile
npm run lint             # ESLint + Prettier fix
npm run lint:check       # ESLint check only
npm run migration:run    # Apply pending migrations
npm run migration:generate  # Generate migration from entities
npm run migration:revert # Revert last migration
```

## Common Patterns

- **Transactional operations**: TypeORM transactions for critical workflows
- **Idempotency**: Redis-based for webhook processing
- **Retry**: BullMQ built-in retry + `p-retry` for LLM calls
- **Async processing**: PR analysis queued via BullMQ, processed by workers
- **Error handling**: Global `ExceptionFilter` + structured `ExceptionCodes` + custom exceptions per domain
- **Secrets**: API keys encrypted with `API_KEY_ENCRYPTION_KEY`, never stored in plaintext
