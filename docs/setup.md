# Local Setup & Workspace Run Manual

Follow these steps to run the workspaces locally:

## Prerequisites
- Node.js (v18 or v20 recommended)
- PostgreSQL (running locally or relative server)

## 1. Setup Dependencies
From the repository root, install and link all workspaces:
```bash
npm install
```

## 2. Start PostgreSQL Local Server
You can run the portable db script inside the database workspace or let backend run it:
```bash
npm run db:start
```
To stop the server later:
```bash
npm run db:stop
```

## 3. Seed Mock Data
Apply migrations and run the seeding script via the backend wrapper:
```bash
npx prisma migrate dev --schema=backend/prisma/schema.prisma
npm run db:seed --workspace=crewora-backend
```

## 4. Run Development Servers
- Start backend API server:
  ```bash
  npm run dev:backend
  ```
- Start Next.js web application:
  ```bash
  npm run dev:web
  ```
- Start Next.js mobile application:
  ```bash
  npm run dev:mobile
  ```
