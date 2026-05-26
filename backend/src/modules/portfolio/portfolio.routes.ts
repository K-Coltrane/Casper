import type { FastifyPluginAsync } from "fastify";

export const portfolioRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async (request) => {
    const portfolio = await app.prisma.portfolio.upsert({
      where: { userId: request.auth.id },
      update: {},
      create: { userId: request.auth.id }
    });

    return { portfolio };
  });
};
