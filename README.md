# CodeSense Backend

A SaaS platform that enables automated code reviews on pull request triggers using user-provided AI API keys. Developers can integrate their repositories (e.g., via GitHub webhooks) to receive AI-powered feedback on code changes, improving code quality without manual intervention.

## Features

- **Automated Code Reviews**: Trigger reviews on PR events using configurable AI models (e.g., OpenAI, Anthropic).
- **User Management**: Role-based authentication with JWT and refresh token support.
- **Secure API Key Handling**: Users provide their own AI keys; the platform acts as a proxy without storing sensitive data.
- **Caching**: Redis-based caching for performance optimization.
- **Database**: PostgreSQL with TypeORM for data persistence and migrations.
- **Exception Handling**: Global error handling with custom exception codes.
- **Validation**: Strict input validation using class-validator.

## Architecture

The backend is built with a modular architecture using NestJS:

- **Modules**:
  - `Auth`: Handles JWT authentication, refresh tokens, and user sessions.
  - `User`: Manages user entities, roles, and permissions.
  - `Cache`: Provides Redis-based caching services.
  - `Exception Handling`: Centralized error management.

- **Core Components**:
  - **Controllers**: Handle HTTP requests (e.g., auth endpoints, user management).
  - **Services**: Business logic for auth, users, and caching.
  - **Entities**: TypeORM models for database tables (users, refresh tokens, etc.).
  - **DTOs**: Data transfer objects for request/response validation.
  - **Guards/Strategies**: JWT-based authentication guards.

- **Data Flow**:
  1. User authenticates via OAuth (e.g., Google) or JWT.
  2. PR webhook triggers code review request.
  3. Platform fetches PR diff, sends to AI API with user's key.
  4. AI response is processed and posted as PR comments.

- **Tech Stack**:
  - **Framework**: NestJS (Node.js)
  - **Database**: PostgreSQL with TypeORM
  - **Cache**: Redis
  - **Authentication**: Passport.js with JWT
  - **Validation**: class-validator
  - **Testing**: Jest
  - **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/singhayush20/codesense-backend.git
   cd codesense-backend