import { z } from "zod";
import { sendValidationError } from "../../utils/validation.js";
const emergencyStopSchema = z.object({
    reason: z.string().max(250).optional()
});
async function ensureGlobalBotState(app) {
    return app.prisma.botState.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global" }
    });
}
export const botRoutes = async (app) => {
    app.get("/status", { preHandler: app.authenticate }, async (request) => {
        const [globalState, settings, portfolio] = await Promise.all([
            ensureGlobalBotState(app),
            app.prisma.settings.upsert({
                where: { userId: request.auth.id },
                update: {},
                create: { userId: request.auth.id }
            }),
            app.prisma.portfolio.upsert({
                where: { userId: request.auth.id },
                update: {},
                create: { userId: request.auth.id }
            })
        ]);
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const tradesToday = await app.prisma.trade.count({
            where: {
                userId: request.auth.id,
                createdAt: { gte: startOfDay }
            }
        });
        return {
            global: globalState,
            user: {
                botEnabled: settings.botEnabled,
                maxTradesPerDay: settings.maxTradesPerDay,
                tradesToday,
                pnlToday: portfolio.pnlToday
            }
        };
    });
    app.post("/start", { preHandler: app.authenticate }, async (request, reply) => {
        const state = await ensureGlobalBotState(app);
        if (state.emergencyStopped) {
            return reply.status(423).send({ message: "Bot is emergency stopped" });
        }
        await Promise.all([
            app.prisma.botState.update({
                where: { id: "global" },
                data: { enabled: true, reason: null }
            }),
            app.prisma.settings.upsert({
                where: { userId: request.auth.id },
                update: { botEnabled: true },
                create: { userId: request.auth.id, botEnabled: true }
            }),
            app.queues.marketQueue.add("fetch-market", {
                userId: request.auth.id,
                symbol: "BTCUSDT"
            })
        ]);
        return { status: "started" };
    });
    app.post("/stop", { preHandler: app.authenticate }, async (request) => {
        await app.prisma.settings.upsert({
            where: { userId: request.auth.id },
            update: { botEnabled: false },
            create: { userId: request.auth.id, botEnabled: false }
        });
        return { status: "stopped" };
    });
    app.post("/emergency-stop", { preHandler: app.authenticate }, async (request, reply) => {
        const parsed = emergencyStopSchema.safeParse(request.body ?? {});
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }
        const state = await app.prisma.botState.upsert({
            where: { id: "global" },
            update: {
                enabled: false,
                emergencyStopped: true,
                reason: parsed.data.reason ?? "Manual emergency stop"
            },
            create: {
                id: "global",
                enabled: false,
                emergencyStopped: true,
                reason: parsed.data.reason ?? "Manual emergency stop"
            }
        });
        return { status: "emergency_stopped", global: state };
    });
    app.post("/resume", { preHandler: app.authenticate }, async () => {
        const state = await app.prisma.botState.upsert({
            where: { id: "global" },
            update: {
                emergencyStopped: false,
                reason: null
            },
            create: {
                id: "global",
                emergencyStopped: false
            }
        });
        return { status: "resumed", global: state };
    });
};
