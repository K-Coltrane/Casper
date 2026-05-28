import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getExchangeClient, getUserExchange } from "../../infrastructure/exchange/exchange.js";
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
  app.get("/pairs", { preHandler: app.authenticate }, async (request) => {
    const exchange = await getUserExchange(app.prisma, request.auth.id);
    const client = getExchangeClient(exchange);
    return { pairs: client.listConfiguredPairs() };
  });

  app.get("/", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = marketQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const exchange = await getUserExchange(app.prisma, request.auth.id);
    const client = getExchangeClient(exchange);
    const ticker = await client.getTicker(parsed.data.symbol);
    const snapshot = await app.prisma.marketSnapshot.create({
      data: {
        symbol: ticker.symbol,
        price: ticker.price,
        volume: ticker.volume,
        volatility: ticker.volatility,
        changePercent: ticker.changePercent,
        source: exchange
      }
    });

    return {
      market: {
        symbol: snapshot.symbol,
        price: snapshot.price,
        volume: snapshot.volume,
        changePercent: snapshot.changePercent,
        volatility: snapshot.volatility,
        source: snapshot.source,
        timestamp: snapshot.createdAt
      }
    };
  });
};
