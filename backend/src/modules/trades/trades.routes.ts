import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendValidationError } from "../../utils/validation.js";

const createTradeSchema = z.object({
  symbol: z.string().min(3).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  status: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
  exitPrice: z.number().positive().optional(),
  pnl: z.number().optional()
});

export const tradesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async (request) => {
    const trades = await app.prisma.trade.findMany({
      where: { userId: request.auth.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return { trades };
  });

  app.post("/", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = createTradeSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const trade = await app.prisma.trade.create({
      data: {
        userId: request.auth.id,
        symbol: parsed.data.symbol,
        side: parsed.data.side,
        entryPrice: parsed.data.entryPrice,
        quantity: parsed.data.quantity,
        status: parsed.data.status,
        exitPrice: parsed.data.exitPrice,
        pnl: parsed.data.pnl,
        closedAt: parsed.data.status === "CLOSED" ? new Date() : undefined
      }
    });

    return reply.status(201).send({ trade });
  });
};
