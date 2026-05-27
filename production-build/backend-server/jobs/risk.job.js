import { Worker } from "bullmq";
import { calculateStopLossPrice, riskCheck } from "../engine/risk.engine.js";
import { queueNames } from "./queues.js";
function startOfUtcDay() {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
}
export function createRiskWorker(connection, prisma, executionQueue) {
    return new Worker(queueNames.risk, async (job) => {
        const [settings, portfolio, tradesToday, openTrades, lastTrade] = await Promise.all([
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
            }),
            prisma.trade.findFirst({
                where: { userId: job.data.userId },
                orderBy: { createdAt: "desc" },
                select: { createdAt: true }
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
            openTrades,
            lastTrade: lastTrade ?? undefined
        });
        if (!result.allowed) {
            return result;
        }
        await executionQueue.add("execute-trade", {
            ...job.data,
            quantity,
            strategy: settings.strategy,
            stopLossPrice: calculateStopLossPrice(job.data.signal, job.data.marketData.price, settings.stopLossPercent),
            idempotencyKey: `${job.data.userId}:${job.data.marketData.symbol}:${job.data.signal}:${job.id}`
        });
        return { allowed: true, quantity };
    }, { connection });
}
