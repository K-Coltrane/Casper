import pino from "pino";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/prisma/client.js";
import { createRedisConnection } from "./infrastructure/redis/client.js";
import { createExecutionWorker } from "./jobs/execution.job.js";
import { createMarketWorker } from "./jobs/market.job.js";
import { createRiskWorker } from "./jobs/risk.job.js";
import { createQueues } from "./jobs/queues.js";
import { createSignalWorker } from "./jobs/signal.job.js";

const { queues, connection: queueConnection } = createQueues();
const workerConnection = createRedisConnection();
const logger = pino({
  level: "info",
  redact: ["apiKey", "secret", "*.apiKey", "*.secret"]
});
const workers = [
  createMarketWorker(workerConnection, prisma, queues.signalQueue),
  createSignalWorker(workerConnection, prisma, queues.riskQueue),
  createRiskWorker(workerConnection, prisma, queues.executionQueue),
  createExecutionWorker(workerConnection, prisma)
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    logger.info({ worker: worker.name, jobId: job.id }, "job completed");
  });
  worker.on("failed", (job, error) => {
    logger.error(
      { worker: worker.name, jobId: job?.id ?? "unknown", err: error },
      "job failed"
    );
  });
}

await Promise.all(
  env.TRADING_PAIRS.split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => symbol.length > 0)
    .map((symbol) =>
      queues.marketQueue.add(
        "fetch-market",
        { symbol },
        {
          jobId: `scheduled-market-${symbol}`,
          repeat: { every: 60_000 }
        }
      )
    )
);

async function shutdown() {
  logger.info("shutting down worker");
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all([
    queues.marketQueue.close(),
    queues.signalQueue.close(),
    queues.riskQueue.close(),
    queues.executionQueue.close(),
    workerConnection.quit(),
    queueConnection.quit(),
    prisma.$disconnect()
  ]);
}

process.on("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});

logger.info({ pairs: env.TRADING_PAIRS }, "Casper trading worker started");
