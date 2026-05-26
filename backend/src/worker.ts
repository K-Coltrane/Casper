import { prisma } from "./infrastructure/prisma/client.js";
import { createRedisConnection } from "./infrastructure/redis/client.js";
import { createExecutionWorker } from "./jobs/execution.job.js";
import { createMarketWorker } from "./jobs/market.job.js";
import { createRiskWorker } from "./jobs/risk.job.js";
import { createQueues } from "./jobs/queues.js";
import { createSignalWorker } from "./jobs/signal.job.js";

const { queues, connection: queueConnection } = createQueues();
const workerConnection = createRedisConnection();
const workers = [
  createMarketWorker(workerConnection, prisma, queues.signalQueue),
  createSignalWorker(workerConnection, prisma, queues.riskQueue),
  createRiskWorker(workerConnection, prisma, queues.executionQueue),
  createExecutionWorker(workerConnection, prisma)
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`Completed ${worker.name} job ${job.id}`);
  });
  worker.on("failed", (job, error) => {
    console.error(`Failed ${worker.name} job ${job?.id ?? "unknown"}: ${error.message}`);
  });
}

async function shutdown() {
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

console.log("Casper trading worker started");
