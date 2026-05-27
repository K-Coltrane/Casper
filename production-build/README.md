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

This APK contains the Casper mobile frontend. The Fastify/Postgres/Redis trading backend is a server system and must be running separately.

For a real phone:

1. Start or host the backend somewhere your phone can reach.
2. Open the Casper app.
3. Go to Settings.
4. Enter your backend URL, for example:
   - `https://api.yourdomain.com`
   - `http://192.168.1.25:4000` for a computer on the same Wi-Fi network
5. Tap `SAVE BACKEND URL`.

Do not use `10.0.2.2` on a real phone. That address is only for Android emulators.

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
