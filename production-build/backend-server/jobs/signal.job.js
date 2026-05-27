import { Worker } from "bullmq";
import { generateSignal } from "../engine/signal.engine.js";
import { queueNames } from "./queues.js";
export function createSignalWorker(connection, prisma, riskQueue) {
    return new Worker(queueNames.signal, async (job) => {
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
        await Promise.all(activeUsers.map((user) => riskQueue.add("risk-check", {
            userId: user.userId,
            marketData: job.data.marketData,
            signal
        })));
        return { signal, usersQueued: activeUsers.length };
    }, { connection });
}
