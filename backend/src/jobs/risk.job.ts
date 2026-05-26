import { Worker, type Queue } from "bullmq";
import type { PrismaClient } from "@prisma/client";
import { riskCheck } from "../engine/risk.engine.js";
import type { RedisConnection } from "../infrastructure/redis/client.js";
import { queueNames } from "./queues.js";
import type { ExecutionJobData, RiskJobData } from "./job.types.js";

function startOfUtcDay() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function createRiskWorker(
  connection: RedisConnection,
  prisma: PrismaClient,
  executionQueue: Queue<ExecutionJobData>
) {
  return new Worker<RiskJobData>(
    queueNames.risk,
    async (job) => {
      const [settings, portfolio, tradesToday, openTrades] = await Promise.all([
        prisma.settings.findUnique({ where: { userId: job.data.userId } }),
        prisma.portfolio.findUnique({ where: { userId: job.data.userId } }),
        prisma.trade.count({
          where: {
            userId: job.data.userId,
            createdAt: { gte: startOfUtcDay() }
          }
        }),
        prisma.trade.findMany({
          where: {
            userId: job.data.userId,
            status: "OPEN"
          },
          select: {
            entryPrice: true,
            quantity: true
          }
        })
      ]);

      if (!settings?.botEnabled || !portfolio) {
        return { allowed: false, reason: "User bot is disabled or portfolio missing" };
      }

      const tradeBudget = portfolio.balance * settings.maxTradePercent;
      const quantity = Number((tradeBudget / job.data.marketData.price).toFixed(8));
      const proposedTrade = {
        userId: job.data.userId,
        symbol: job.data.marketData.symbol,
        side: job.data.signal,
        entryPrice: job.data.marketData.price,
        quantity
      };
      const result = riskCheck(proposedTrade, {
        settings,
        portfolio,
        tradesToday,
        openTrades
      });

      if (!result.allowed) {
        return result;
      }

      await executionQueue.add("execute-trade", {
        ...job.data,
        quantity
      });

      return { allowed: true, quantity };
    },
    { connection }
  );
}
