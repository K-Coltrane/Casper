import type { FastifyReply } from "fastify";
import type { ZodError, ZodSchema } from "zod";

export function parseWithSchema<T>(schema: ZodSchema<T>, value: unknown): T {
  return schema.parse(value);
}

export function sendValidationError(reply: FastifyReply, error: ZodError) {
  return reply.status(400).send({
    message: "Validation failed",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }))
  });
}
