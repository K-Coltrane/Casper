import type { PrismaClient } from "@prisma/client";
import type { ExecutionJobData } from "../jobs/job.types.js";
import { bybitClient } from "../infrastructure/bybit/client.js";
import { decryptSecret } from "../utils/crypto.js";

const maxAttempts = 3;

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
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      userId: data.userId,
      exchange: "BYBIT"
    },
    orderBy: { createdAt: "desc" }
  });

  const confirmation = await retry(() =>
    bybitClient.placeMarketOrder({
      apiKey: apiKey ? decryptSecret(apiKey.apiKey) : "paper",
      secret: apiKey ? decryptSecret(apiKey.secret) : "paper",
      symbol: data.marketData.symbol,
      side: data.signal,
      quantity: data.quantity
    })
  );

  const trade = await prisma.trade.create({
    data: {
      userId: data.userId,
      symbol: data.marketData.symbol,
      side: data.signal,
      entryPrice: data.marketData.price,
      quantity: data.quantity,
      status: "OPEN"
    }
  });

  return {
    trade,
    confirmation
  };
}
