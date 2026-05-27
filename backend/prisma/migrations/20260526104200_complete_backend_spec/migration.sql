-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN "realizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "portfolios" ADD COLUMN "unrealizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "portfolios" ADD COLUMN "openPositionValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "trades" ADD COLUMN "strategy" TEXT NOT NULL DEFAULT 'balanced';
ALTER TABLE "trades" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "trades" ADD COLUMN "exchangeOrderId" TEXT;
ALTER TABLE "trades" ADD COLUMN "stopLossPrice" DOUBLE PRECISION;
ALTER TABLE "trades" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "trades" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN "maxOpenTrades" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "settings" ADD COLUMN "maxExposurePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
ALTER TABLE "settings" ADD COLUMN "tradeCooldownSecs" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "settings" ADD COLUMN "stopLossPercent" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "market_snapshots" ADD COLUMN "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "trades_idempotencyKey_key" ON "trades"("idempotencyKey");
