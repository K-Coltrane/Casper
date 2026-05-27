# Casper Production Build

This folder is tracked on the `cursor/integration-3ea2` branch so you can download it with the branch.

## Contents

- `frontend-static/` - compiled Vite frontend. Serve this folder with any static host.
- `backend-server/` - compiled Fastify backend JavaScript.
- `backend-prisma/` - Prisma schema and migrations for the backend database.
- `frontend.env.example` - frontend build-time environment example.
- `backend.env.example` - backend runtime environment example.

## Install and run from the downloaded branch

```bash
pnpm install
cp production-build/backend.env.example backend/.env
pnpm --filter @casper/backend prisma:generate
pnpm --filter @casper/backend prisma:migrate
node production-build/backend-server/server.js
```

Serve the frontend:

```bash
npx serve production-build/frontend-static
```

Set real production secrets in `backend/.env` before using real API keys or live trading.
