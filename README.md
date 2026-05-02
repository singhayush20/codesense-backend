## 🚀 CodeSense Backend

A **backend application** for automated, AI-powered code review platform.
CodeSense integrates with GitHub Apps, processes PR events, and generates code reviews using user-configured LLM providers.

---

## ✨ What is CodeSense?

CodeSense acts like a **senior engineer reviewing every PR automatically**.

It goes beyond linting by:

* Understanding code changes
* Analyzing repository context
* Generating meaningful AI-powered review feedback

---

## 🔥 Core Features

### 🔐 Authentication & User Management

* Google OAuth 2.0 login (**secure, industry-standard flow**)
* JWT-based authentication (access + refresh tokens via HttpOnly cookies)
* Session management with refresh token rotation
* Role-based access control (RBAC)

---

### 🌐 Google OAuth Integration

* Secure OAuth flow using authorization code grant
* Backend token exchange (no tokens exposed to frontend)
* HttpOnly cookie-based session management
* State validation to prevent CSRF attacks
* Designed for production-grade security (no localStorage token usage)

---

### 🔗 GitHub App Integration

* Connect GitHub accounts via GitHub App installation
* Installation-based authentication (more secure than OAuth)
* Supports multiple repositories per installation
* Handles installation lifecycle via webhooks

---

### 📦 Repository Management

* Sync repositories from GitHub installations
* Select/unselect repositories for code review
* Ownership validation (prevents unauthorized access)

---

### 🤖 AI Code Review Engine

* Triggered automatically on PR events
* Queue-based async processing using BullMQ
* Designed for multi-LLM provider support
* Extensible architecture for future AI workflows

---

### ⚡ Webhook Processing System

* Secure GitHub webhook handling (HMAC signature verification)
* Idempotent processing using Redis (prevents duplicate execution)
* Handles:

  * PR events (`opened`, `synchronize`)
  * GitHub App uninstall (`installation.deleted`)
* Fault-tolerant with retry mechanisms

---

### 🧠 Smart Processing Pipeline

```text
PR Event → Webhook → Validation → Queue → Worker → AI Review → Output
```

* Asynchronous processing via BullMQ
* Retry with exponential backoff
* Designed for horizontal scalability

---

### 🗄️ Data Management

* PostgreSQL with TypeORM
* Optimized indexing strategy for performance
* Transaction-safe operations for critical workflows

---

### ⚡ Caching Layer

* Redis-based caching
* Used for:

  * Webhook idempotency
  * Performance optimization

---

### 🛡️ Security

* Google OAuth secure flow (no token leakage)
* GitHub webhook signature verification
* Strict ownership validation
* Protection against replay attacks
* No storage of sensitive third-party API keys

---

### ❗ Exception Handling

* Centralized error handling
* Structured exception codes
* Consistent API responses

---

## 🏗️ System Architecture

### 📦 Modules

| Module             | Responsibility                        |
| ------------------ | ------------------------------------- |
| Auth               | Google OAuth, JWT, session management |
| User               | User management, roles                |
| GitHub Integration | App install, repo sync, selection     |
| Webhook            | GitHub event handling                 |
| PR Processing      | Async AI review pipeline              |
| Cache              | Redis abstraction                     |
| Exception          | Global error handling                 |

---

### 🔄 High-Level Flow

```text
User logs in via Google OAuth
   ↓
JWT session established (HttpOnly cookies)
   ↓
User connects GitHub App
   ↓
Repositories synced
   ↓
User selects repos
   ↓
PR created/updated
   ↓
GitHub webhook triggers
   ↓
Event validated + queued
   ↓
Worker processes PR
   ↓
AI generates review
```

---

## 🧰 Tech Stack

### Backend

* **Framework:** NestJS
* **Language:** TypeScript

### Database

* **PostgreSQL**
* **TypeORM**

### Cache & Queue

* **Redis**
* **BullMQ**

### Authentication

* **Google OAuth 2.0**
* **JWT (Access + Refresh tokens)**
* **Passport.js**

### Integrations

* **GitHub App API**
* **GitHub Webhooks**

### Validation & Quality

* **class-validator**
* **ESLint**
* **Jest**

---

## 📁 Project Structure

```bash
src/
├── modules/
│   ├── auth/                
│   ├── user/
│   ├── github-integration/
│   ├── webhook/
│   ├── pr-processing/
│   └── cache/
├── common/
├── exception-handling/
├── config/
└── main.ts
```

---

## ⚙️ Environment Setup
Checkout the `src/config/configurations.ts` file to configure your environment variables.

### `.env.dev`

```env
NODE_ENV=dev

PORT=8080

DATABASE_URL=postgresql://user:password@localhost:5432/codesense

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# LLM Providers
API_KEY_ENCRYPTION_KEY=your_encryption_key
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/singhayush20/codesense-backend.git
cd codesense-backend
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Setup Database

```bash
npm run migration:run
```

---

### 4. Start Redis

```bash
redis-server
```

---

### 5. Run Application

```bash
npm run start:dev
```

---

## 🔗 Key APIs

Checkout Swagger UI for a complete list of APIs: `/api/docs`

### Auth (Google OAuth)

* `GET /api/v1/auth/google/start` → Start OAuth flow
* `GET /api/v1/auth/google/callback` → Handle OAuth callback
* `POST /api/v1/auth/refresh` → Refresh access token
* `POST /api/v1/auth/logout` → Logout user

---

### GitHub Integration

* `GET /api/v1/github/connect`
* `GET /api/v1/github/install/callback`
* `GET /api/v1/github/accounts`
* `POST /api/v1/github/repos/sync`
* `POST /api/v1/github/repos/select`
* `POST /api/v1/github/repos/unselect`
* `GET /api/v1/github/repos/selected`
* `POST /api/v1/github/accounts/unlink`

---

### Webhooks

* `POST /api/v1/github/webhook`

Handles:

* `pull_request`
* `installation.deleted`

---


## 📈 Scalability Considerations

* Queue-based processing (BullMQ)
* Stateless backend design
* Redis-backed idempotency
* Transactional DB operations
* Horizontally scalable workers

---

## 🛣️ Roadmap

* 🔜 AI-generated PR comments posting
* 🔜 Multi-LLM provider per repository
* 🔜 Advanced diff + AST-based analysis
* 🔜 Dashboard with review insights
* 🔜 Organization/team support

---
