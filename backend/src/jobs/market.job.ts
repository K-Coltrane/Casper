import { Worker, type Queue } from "bullmq";
import type { PrismaClient } from "@prisma/client";
import { getExchangeClient, getUserExchange } from "../infrastructure/exchange/exchange.js";
import type { RedisConnection } from "../infrastructure/redis/client.js";
import { queueNames } from "./queues.js";
import type { MarketJobData, SignalJobData } from "./job.types.js";

export function createMarketWorker(
  connection: RedisConnection,
  prisma: PrismaClient,
  signalQueue: Queue<SignalJobData>
) {
  return new Worker<MarketJobData>(
    queueNames.market,
    async (job) => {
      const globalState = await prisma.botState.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global" }
      });

      if (!globalState.enabled || globalState.emergencyStopped) {
        return { skipped: true, reason: "Bot is disabled" };
      }

      if (job.data.userId) {
        const settings = await prisma.settings.findUnique({
          where: { userId: job.data.userId }
        });

        if (!settings?.botEnabled) {
          return { skipped: true, reason: "User bot is disabled" };
        }
      }

      const exchange = job.data.userId ? await getUserExchange(prisma, job.data.userId) : "BYBIT";
      const client = getExchangeClient(exchange);
      const marketData = await client.getTicker(job.data.symbol);
      await prisma.marketSnapshot.create({
        data: {
          symbol: marketData.symbol,
          price: marketData.price,
          volume: marketData.volume,
          volatility: marketData.volatility,
          changePercent: marketData.changePercent,
          source: exchange
        }
      });

      await signalQueue.add("generate-signal", {
        userId: job.data.userId,
        marketData
      });

      return { marketData };
    },
    { connection }
  );
}
