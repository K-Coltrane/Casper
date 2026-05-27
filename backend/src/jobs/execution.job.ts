import { Worker } from "bullmq";
import type { PrismaClient } from "@prisma/client";
import { executeTrade } from "../engine/execution.engine.js";
import type { RedisConnection } from "../infrastructure/redis/client.js";
import type { ExecutionJobData } from "./job.types.js";
import { queueNames } from "./queues.js";

export function createExecutionWorker(connection: RedisConnection, prisma: PrismaClient) {
  return new Worker<ExecutionJobData>(
    queueNames.execution,
    async (job) => executeTrade(prisma, job.data),
    { connection }
  );
}
