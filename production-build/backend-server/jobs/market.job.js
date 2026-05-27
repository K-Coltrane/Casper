import { Worker } from "bullmq";
import { bybitClient } from "../infrastructure/bybit/client.js";
import { queueNames } from "./queues.js";
export function createMarketWorker(connection, prisma, signalQueue) {
    return new Worker(queueNames.market, async (job) => {
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
        const marketData = await bybitClient.getTicker(job.data.symbol);
        await prisma.marketSnapshot.create({
            data: {
                symbol: marketData.symbol,
                price: marketData.price,
                volume: marketData.volume,
                volatility: marketData.volatility,
                changePercent: marketData.changePercent
            }
        });
        await signalQueue.add("generate-signal", {
            userId: job.data.userId,
            marketData
        });
        return { marketData };
    }, { connection });
}
