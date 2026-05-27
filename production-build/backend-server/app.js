import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { loggerOptions } from "./config/logger.js";
import { createQueues } from "./jobs/queues.js";
import { apiKeyRoutes } from "./modules/api-keys/api-keys.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { botRoutes } from "./modules/bot/bot.routes.js";
import { marketRoutes } from "./modules/market/market.routes.js";
import { metricsRoutes } from "./modules/observability/metrics.routes.js";
import { portfolioRoutes } from "./modules/portfolio/portfolio.routes.js";
import { settingsRoutes } from "./modules/settings/settings.routes.js";
import { tradesRoutes } from "./modules/trades/trades.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { prisma } from "./infrastructure/prisma/client.js";
import { registerMarketStream } from "./websocket/market.stream.js";
import { verifyAccessToken } from "./utils/jwt.js";
export async function buildApp() {
    const app = Fastify({ logger: loggerOptions });
    const { queues, connection } = createQueues();
    app.decorate("prisma", prisma);
    app.decorate("queues", queues);
    app.decorate("authenticate", async (request, reply) => {
        const authorization = request.headers.authorization;
        const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
        if (!token) {
            return reply.status(401).send({ message: "Missing bearer token" });
        }
        try {
            const payload = verifyAccessToken(token);
            request.auth = {
                id: payload.sub,
                email: payload.email
            };
        }
        catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return reply.status(401).send({ message: "Invalid bearer token" });
            }
            throw error;
        }
    });
    await app.register(helmet);
    await app.register(cors, {
        origin: env.FRONTEND_ORIGIN,
        credentials: true
    });
    await app.register(rateLimit, {
        global: true,
        max: 100,
        timeWindow: "1 minute"
    });
    app.get("/health", async () => ({ ok: true }));
    await registerMarketStream(app);
    await app.register(authRoutes, { prefix: "/auth" });
    await app.register(usersRoutes, { prefix: "/users" });
    await app.register(portfolioRoutes, { prefix: "/portfolio" });
    await app.register(tradesRoutes, { prefix: "/trades" });
    await app.register(marketRoutes, { prefix: "/market" });
    await app.register(settingsRoutes, { prefix: "/settings" });
    await app.register(botRoutes, { prefix: "/bot" });
    await app.register(apiKeyRoutes, { prefix: "/api-keys" });
    await app.register(metricsRoutes);
    app.setErrorHandler((error, _request, reply) => {
        app.log.error({ err: error }, "request failed");
        return reply.status(error.statusCode ?? 500).send({
            message: error.statusCode && error.statusCode < 500 ? error.message : "Internal server error"
        });
    });
    app.addHook("onClose", async () => {
        await Promise.all([
            queues.marketQueue.close(),
            queues.signalQueue.close(),
            queues.riskQueue.close(),
            queues.executionQueue.close(),
            connection.quit(),
            prisma.$disconnect()
        ]);
    });
    return app;
}
