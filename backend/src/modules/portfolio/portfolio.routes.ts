import type { FastifyPluginAsync } from "fastify";
import { calculatePortfolioSummary } from "../../engine/portfolio.engine.js";

export const portfolioRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async (request) => {
    const portfolio = await calculatePortfolioSummary(app.prisma, request.auth.id);

    return { portfolio };
  });
};
