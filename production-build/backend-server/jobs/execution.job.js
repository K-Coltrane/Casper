import { Worker } from "bullmq";
import { executeTrade } from "../engine/execution.engine.js";
import { queueNames } from "./queues.js";
export function createExecutionWorker(connection, prisma) {
    return new Worker(queueNames.execution, async (job) => executeTrade(prisma, job.data), { connection });
}
