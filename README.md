# Crewora Monorepo

Welcome to the **Crewora** monorepo. Crewora is a professional marketplace connecting customers with verified blue-collar workers (plumbers, electricians, carpenters, etc.) without middlemen.

## Project Overview
This repository contains the backend APIs, the database setup scripts, shared core packages (types, clients, and design system components), and the client interfaces (the main website and the native mobile wrapper).

---

## Architecture Diagram

```mermaid
graph TD
    subgraph Client Apps
        Web[apps/web - Next.js Website]
        Mobile[apps/mobile - Next.js/Capacitor App]
    end

    subgraph Core Shared Packages
        UI[@crewora/ui - Design System Components]
        API[@crewora/api-client - Axios SDK]
        Shared[@crewora/shared - Types & Validators]
    end

    subgraph Backend Server
        Server[backend - Express API Server]
        Prisma[Prisma Client ORM]
        DB[(PostgreSQL Database)]
    end

    Web --> UI
    Web --> API
    Mobile --> UI
    Mobile --> API
    API --> Shared
    UI --> Shared
    Server --> Shared
    Server --> Prisma
    Prisma --> DB
```

---

## Folder Structure

```
Crewora/
├── apps/
│   ├── web/               # Responsive website (Next.js App router)
│   └── mobile/            # Native-like mobile client (Next.js statically exported via Capacitor)
├── backend/               # Express API backend with Prisma PostgreSQL adapter
├── database/              # Database management scripts and local instance setups
├── packages/
│   ├── shared/            # Common domain types, translation strings, and Zod schemas
│   ├── ui/                # Shared layout elements, UI buttons, and globals.css stylesheet
│   └── api-client/        # In-memory JWT token store and Axios interceptors
├── docs/                  # In-depth architectural documentation
├── infrastructure/        # Dockerfiles, Nginx configurations, and Github actions
└── uploads/               # Static folder serving media and photos
```

---

## Local Development Setup

To configure the workspace on your machine, follow these steps:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize local PostgreSQL Database**:
   ```bash
   npm run db:start
   ```

3. **Deploy Migrations & Seed Mock Data**:
   ```bash
   npx prisma migrate dev --schema=backend/prisma/schema.prisma
   npm run db:seed --workspace=crewora-backend
   ```

4. **Launch Dev Workspaces**:
   - Web application: `npm run dev:web`
   - Mobile application: `npm run dev:mobile`
   - Backend APIs: `npm run dev:backend`

---

## Deployment

### Docker Deployment
The repository provides production-ready Dockerfiles under `infrastructure/docker/` and a sample Nginx reverse proxy routing definition in `infrastructure/nginx/nginx.conf`.

### Mobile Application Build
To bundle the mobile web client assets and build the native Android container:
1. Export static files:
   ```bash
   npm run build:mobile
   ```
2. Sync files into Capacitor Android project:
   ```bash
   npm run cap:sync --workspace=@crewora/mobile
   ```
3. Open compile tooling inside Android Studio:
   ```bash
   npm run cap:open-android --workspace=@crewora/mobile
   ```

---

## Coding Standards & Feature Development Workflow

When introducing new functionalities or models, adhere strictly to the following layered schema:

```
[New Feature Request]
        │
        ├── 1. Business Logic / DTOs / Schemas ────> packages/shared/
        │
        ├── 2. HTTP Requests / Auth / Fetch ──────> packages/api-client/
        │
        ├── 3. Custom UI / Buttons / Cards ────────> packages/ui/
        │
        ├── 4. Composition for Web ────────────────> apps/web/src/app/
        │
        └── 5. Composition for Android ────────────> apps/mobile/src/app/
```
