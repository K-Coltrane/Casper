import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { bybitClient } from "../../infrastructure/bybit/client.js";
import { sendValidationError } from "../../utils/validation.js";

const marketQuerySchema = z.object({
  symbol: z
    .string()
    .min(3)
    .max(20)
    .optional()
    .default("BTCUSDT")
    .transform((value) => value.toUpperCase())
});

export const marketRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = marketQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const ticker = await bybitClient.getTicker(parsed.data.symbol);
    const snapshot = await app.prisma.marketSnapshot.create({
      data: {
        symbol: ticker.symbol,
        price: ticker.price,
        volume: ticker.volume,
        volatility: ticker.volatility
      }
    });

    return {
      market: {
        symbol: snapshot.symbol,
        price: snapshot.price,
        volume: snapshot.volume,
        volatility: snapshot.volatility,
        source: snapshot.source,
        createdAt: snapshot.createdAt
      }
    };
  });
};
