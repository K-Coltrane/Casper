# Casper Production Build

This folder is tracked on the `cursor/integration-3ea2` branch so you can download it with the branch.

## Contents

- `frontend-static/` - compiled Vite frontend. Serve this folder with any static host.
- `backend-server/` - compiled Fastify backend JavaScript.
- `backend-prisma/` - Prisma schema and migrations for the backend database.
- `casper-debug.apk` - installable Android APK built from the integrated frontend.
- `frontend.env.example` - frontend build-time environment example.
- `backend.env.example` - backend runtime environment example.

## Android APK

Install `casper-debug.apk` on an Android device:

```bash
adb install production-build/casper-debug.apk
```

This APK contains the Casper mobile frontend. The Fastify/Postgres/Redis trading backend is a server system and must be running separately. This build was compiled with:

```bash
VITE_API_BASE_URL=http://10.0.2.2:4000
```

That address works for an Android emulator talking to a backend running on the host machine. For a physical phone, rebuild with `VITE_API_BASE_URL` set to your backend server URL.

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
