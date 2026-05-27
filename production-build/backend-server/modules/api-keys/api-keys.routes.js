import { z } from "zod";
import { encryptSecret } from "../../utils/crypto.js";
import { sendValidationError } from "../../utils/validation.js";
const upsertApiKeySchema = z.object({
    exchange: z.enum(["BYBIT"]).default("BYBIT"),
    apiKey: z.string().min(1),
    secret: z.string().min(1)
});
export const apiKeyRoutes = async (app) => {
    app.get("/", { preHandler: app.authenticate }, async (request) => {
        const apiKeys = await app.prisma.apiKey.findMany({
            where: { userId: request.auth.id },
            select: {
                id: true,
                exchange: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: "desc" }
        });
        return { apiKeys };
    });
    app.post("/", { preHandler: app.authenticate }, async (request, reply) => {
        const parsed = upsertApiKeySchema.safeParse(request.body);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }
        const apiKey = await app.prisma.apiKey.create({
            data: {
                userId: request.auth.id,
                exchange: parsed.data.exchange,
                apiKey: encryptSecret(parsed.data.apiKey),
                secret: encryptSecret(parsed.data.secret)
            },
            select: {
                id: true,
                exchange: true,
                createdAt: true
            }
        });
        return reply.status(201).send({ apiKey });
    });
};
