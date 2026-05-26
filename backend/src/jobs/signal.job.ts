import { Worker, type Queue } from "bullmq";
import type { PrismaClient } from "@prisma/client";
import { generateSignal } from "../engine/signal.engine.js";
import type { RedisConnection } from "../infrastructure/redis/client.js";
import { queueNames } from "./queues.js";
import type { RiskJobData, SignalJobData } from "./job.types.js";

export function createSignalWorker(
  connection: RedisConnection,
  prisma: PrismaClient,
  riskQueue: Queue<RiskJobData>
) {
  return new Worker<SignalJobData>(
    queueNames.signal,
    async (job) => {
      const signal = generateSignal(job.data.marketData);

      if (signal === "HOLD") {
        return { signal };
      }

      if (job.data.userId) {
        await riskQueue.add("risk-check", {
          userId: job.data.userId,
          marketData: job.data.marketData,
          signal
        });

        return { signal, usersQueued: 1 };
      }

      const activeUsers = await prisma.settings.findMany({
        where: { botEnabled: true },
        select: { userId: true }
      });

      await Promise.all(
        activeUsers.map((user) =>
          riskQueue.add("risk-check", {
            userId: user.userId,
            marketData: job.data.marketData,
            signal
          })
        )
      );

      return { signal, usersQueued: activeUsers.length };
    },
    { connection }
  );
}
