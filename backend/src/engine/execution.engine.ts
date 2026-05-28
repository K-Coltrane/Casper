import type { PrismaClient } from "@prisma/client";
import pino from "pino";
import type { ExecutionJobData } from "../jobs/job.types.js";
import { getExchangeClient, getUserExchange } from "../infrastructure/exchange/exchange.js";
import { decryptSecret } from "../utils/crypto.js";
import { updatePortfolioAfterExecution } from "./portfolio.engine.js";

const maxAttempts = 3;
const logger = pino({
  level: "info",
  redact: ["apiKey", "secret", "*.apiKey", "*.secret"]
});

async function retry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  throw lastError;
}

export async function executeTrade(prisma: PrismaClient, data: ExecutionJobData) {
  const existingTrade = await prisma.trade.findUnique({
    where: { idempotencyKey: data.idempotencyKey }
  });

  if (existingTrade) {
    logger.info(
      { tradeId: existingTrade.id, idempotencyKey: data.idempotencyKey },
      "duplicate execution ignored"
    );

    return {
      trade: existingTrade,
      confirmation: {
        exchange: "BYBIT" as const,
        orderId: existingTrade.exchangeOrderId ?? "duplicate",
        status: "SUBMITTED" as const
      },
      duplicate: true
    };
  }

  const exchange = await getUserExchange(prisma, data.userId);
  const client = getExchangeClient(exchange);
  const apiKey = await prisma.apiKey.findFirst({
    where: { userId: data.userId, exchange },
    orderBy: { createdAt: "desc" }
  });

  try {
    const confirmation = await retry(() =>
      client.placeMarketOrder({
        apiKey: apiKey ? decryptSecret(apiKey.apiKey) : "paper",
        secret: apiKey ? decryptSecret(apiKey.secret) : "paper",
        symbol: data.marketData.symbol,
        side: data.signal,
        quantity: data.quantity,
        idempotencyKey: data.idempotencyKey
      })
    );

    const trade = await prisma.trade.create({
      data: {
        userId: data.userId,
        symbol: data.marketData.symbol,
        side: data.signal,
        entryPrice: data.marketData.price,
        quantity: data.quantity,
        status: "OPEN",
        strategy: data.strategy,
        idempotencyKey: data.idempotencyKey,
        exchangeOrderId: confirmation.orderId,
        stopLossPrice: data.stopLossPrice
      }
    });

    await updatePortfolioAfterExecution(prisma, data.userId);
    logger.info(
      {
        tradeId: trade.id,
        userId: data.userId,
        symbol: data.marketData.symbol,
        side: data.signal,
        exchangeOrderId: confirmation.orderId
      },
      "trade execution saved"
    );

    return {
      trade,
      confirmation,
      duplicate: false
    };
  } catch (error) {
    await prisma.trade.create({
      data: {
        userId: data.userId,
        symbol: data.marketData.symbol,
        side: data.signal,
        entryPrice: data.marketData.price,
        quantity: data.quantity,
        status: "CLOSED",
        strategy: data.strategy,
        idempotencyKey: data.idempotencyKey,
        stopLossPrice: data.stopLossPrice,
        pnl: 0,
        closedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Execution failed"
      }
    });
    logger.error(
      {
        err: error,
        userId: data.userId,
        symbol: data.marketData.symbol,
        idempotencyKey: data.idempotencyKey
      },
      "trade execution failed"
    );

    throw error;
  }
}
