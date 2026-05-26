# Casper Backend

Fastify + TypeScript backend for the Casper trading control panel.

## Layers

- **API server:** Fastify routes for auth, portfolio, trades, market data, settings, bot control, and encrypted API keys.
- **Trading worker:** BullMQ workers that process market data, signals, risk checks, and execution.
- **Data layer:** PostgreSQL via Prisma and Redis via BullMQ.

## Local setup

1. Copy environment variables:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in secure JWT and encryption secrets.
3. Start PostgreSQL and Redis.
4. Generate Prisma client and run migrations:

   ```bash
   pnpm --filter @casper/backend prisma:generate
   pnpm --filter @casper/backend prisma:migrate
   ```

5. Run API and worker:

   ```bash
   pnpm backend:dev
   pnpm backend:worker
   ```

Live Bybit order placement is disabled unless `BYBIT_ENABLE_LIVE_TRADING=true`; paper confirmations are used by default.
