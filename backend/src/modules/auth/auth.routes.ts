import bcrypt from "bcrypt";
import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { sendValidationError } from "../../utils/validation.js";

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

const loginSchema = registerSchema;

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

function tokenPair(user: { id: string; email: string }) {
  const payload = { sub: user.id, email: user.email };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authRateLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute"
      }
    }
  };

  app.post("/register", authRateLimit, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const existing = await app.prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existing) {
      return reply.status(409).send({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await app.prisma.user.create({
      data: {
        email: parsed.data.email,
        password: hashedPassword,
        settings: { create: {} },
        portfolio: { create: {} }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    return reply.status(201).send({
      user,
      ...tokenPair(user)
    });
  });

  app.post("/login", authRateLimit, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const user = await app.prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return reply.status(401).send({ message: "Invalid email or password" });
    }

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      ...tokenPair(user)
    });
  });

  app.post("/refresh", authRateLimit, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    try {
      const payload = verifyRefreshToken(parsed.data.refreshToken);
      const user = await app.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true }
      });

      if (!user) {
        return reply.status(401).send({ message: "Invalid refresh token" });
      }

      return reply.send(tokenPair(user));
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return reply.status(401).send({ message: "Invalid refresh token" });
      }

      throw error;
    }
  });
};
