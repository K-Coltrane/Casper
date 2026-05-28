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

const productsQuerySchema = z.object({
  search: z.string().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(60),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

export const marketRoutes: FastifyPluginAsync = async (app) => {
  app.get("/pairs", { preHandler: app.authenticate }, async (request) => {
    const exchange = await getUserExchange(app.prisma, request.auth.id);
    const client = getExchangeClient(exchange);
    return { pairs: client.listConfiguredPairs() };
  });

  app.get("/products", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = productsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const exchange = await getUserExchange(app.prisma, request.auth.id);
    const client = getExchangeClient(exchange) as unknown as { listSpotSymbols?: () => Promise<string[]> };

    if (!client.listSpotSymbols) {
      return reply.status(501).send({ message: "Exchange does not support product listing" });
    }

    // Simple in-memory cache (per server process) to avoid refetching huge catalogs.
    const cacheKey = `market.products.${exchange}`;
    const now = Date.now();
    const cached = (app as unknown as { _casperCache?: Map<string, { expiresAt: number; value: string[] }> })._casperCache;
    const cache = cached ?? new Map<string, { expiresAt: number; value: string[] }>();
    (app as unknown as { _casperCache?: Map<string, { expiresAt: number; value: string[] }> })._casperCache = cache;

    const existing = cache.get(cacheKey);
    const allSymbols =
      existing && existing.expiresAt > now ? existing.value : await client.listSpotSymbols();

    if (!existing || existing.expiresAt <= now) {
      cache.set(cacheKey, { expiresAt: now + 5 * 60_000, value: allSymbols });
    }
    const search = parsed.data.search?.trim().toUpperCase();
    const filtered = search ? allSymbols.filter((symbol) => symbol.includes(search)) : allSymbols;

    const items = filtered.slice(parsed.data.offset, parsed.data.offset + parsed.data.limit);
    return {
      products: items,
      total: filtered.length
    };
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
