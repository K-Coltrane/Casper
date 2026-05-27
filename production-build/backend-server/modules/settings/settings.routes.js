import { z } from "zod";
import { sendValidationError } from "../../utils/validation.js";
const updateSettingsSchema = z.object({
    maxTradePercent: z.number().positive().max(1).optional(),
    dailyLossLimit: z.number().positive().optional(),
    dailyTarget: z.number().positive().optional(),
    strategy: z.enum(["conservative", "balanced", "aggressive"]).optional(),
    memeCoins: z.boolean().optional(),
    botEnabled: z.boolean().optional(),
    maxTradesPerDay: z.number().int().positive().max(100).optional(),
    maxDrawdownPercent: z.number().positive().max(100).optional(),
    maxOpenTrades: z.number().int().positive().max(100).optional(),
    maxExposurePercent: z.number().positive().max(1).optional(),
    tradeCooldownSecs: z.number().int().min(0).max(86_400).optional(),
    stopLossPercent: z.number().positive().max(100).optional()
});
export const settingsRoutes = async (app) => {
    app.get("/", { preHandler: app.authenticate }, async (request) => {
        const settings = await app.prisma.settings.upsert({
            where: { userId: request.auth.id },
            update: {},
            create: { userId: request.auth.id }
        });
        return { settings };
    });
    app.put("/", { preHandler: app.authenticate }, async (request, reply) => {
        const parsed = updateSettingsSchema.safeParse(request.body);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }
        const settings = await app.prisma.settings.upsert({
            where: { userId: request.auth.id },
            update: parsed.data,
            create: {
                userId: request.auth.id,
                ...parsed.data
            }
        });
        return { settings };
    });
};
