import { randomInt } from "node:crypto";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import { Prisma, CodeStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { requireApiKey } from "./middleware/auth.js";
import { globalLimiter, writeLimiter } from "./middleware/rateLimit.js";
import { normalizeAddress, normalizeCode } from "./lib/normalize.js";

const createCodeSchema = z.object({
  code: z.string().optional(),
  referrerAddress: z.string(),
  createdBy: z.string().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const revokeSchema = z.object({
  reason: z.string().max(240).optional()
});

const listCodesQuerySchema = z.object({
  status: z.enum(["active", "revoked", "all"]).default("all")
});

function httpError(status: number, message: string): never {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  throw err;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

async function nextUniqueCode(): Promise<string> {
  for (let i = 0; i < 16; i += 1) {
    const candidate = randomCode();
    const existing = await prisma.referralCode.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
  httpError(503, "Could not allocate a unique referral code. Retry.");
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(globalLimiter);

  // Simple health check (for backwards compatibility)
  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        ok: true,
        service: "referral-service",
        env: env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        ok: false,
        service: "referral-service",
        error: error instanceof Error ? error.message : "db_unavailable"
      });
    }
  });

  app.post("/v1/codes", requireApiKey, writeLimiter, async (req: Request, res: Response, next) => {
    try {
      const parsed = createCodeSchema.parse(req.body);
      const referrerAddress = normalizeAddress(parsed.referrerAddress);
      const requestedCode = parsed.code ? normalizeCode(parsed.code) : undefined;
      const code = requestedCode ?? (await nextUniqueCode());

      const created = await prisma.referralCode.create({
        data: {
          code,
          referrerAddress,
          createdBy: parsed.createdBy,
          metadata: parsed.metadata ? (parsed.metadata as Prisma.InputJsonValue) : undefined,
          status: CodeStatus.ACTIVE
        }
      });

      res.status(201).json({
        code: created.code,
        referrerAddress: created.referrerAddress,
        status: created.status,
        createdAt: created.createdAt
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({ error: "code_exists", message: "Referral code already exists." });
        return;
      }
      next(error);
    }
  });

  app.get("/v1/codes/:code/resolve", async (req: Request, res: Response, next) => {
    try {
      const code = normalizeCode(req.params.code);
      const found = await prisma.referralCode.findUnique({ where: { code } });

      if (!found || found.status !== CodeStatus.ACTIVE) {
        httpError(404, "Referral code not found.");
      }

      prisma.referralCode
        .update({ where: { code }, data: { lastResolvedAt: new Date() } })
        .catch(() => undefined);

      res.json({
        code: found.code,
        referrerAddress: found.referrerAddress,
        status: found.status
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(
    "/v1/referrers/:referrerAddress/codes",
    requireApiKey,
    async (req: Request, res: Response, next) => {
      try {
        const referrerAddress = normalizeAddress(req.params.referrerAddress);
        const { status } = listCodesQuerySchema.parse(req.query);

        const where: Prisma.ReferralCodeWhereInput = { referrerAddress };
        if (status === "active") where.status = CodeStatus.ACTIVE;
        if (status === "revoked") where.status = CodeStatus.REVOKED;

        const rows = await prisma.referralCode.findMany({
          where,
          orderBy: [{ createdAt: "desc" }],
          select: {
            code: true,
            referrerAddress: true,
            status: true,
            createdAt: true,
            revokedAt: true,
            revokedReason: true,
            metadata: true
          }
        });

        res.json({ referrerAddress, status, count: rows.length, codes: rows });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/v1/codes/:code/revoke",
    requireApiKey,
    writeLimiter,
    async (req: Request, res: Response, next) => {
      try {
        const code = normalizeCode(req.params.code);
        const { reason } = revokeSchema.parse(req.body ?? {});

        const existing = await prisma.referralCode.findUnique({ where: { code } });
        if (!existing) httpError(404, "Referral code not found.");
        if (existing.status === CodeStatus.REVOKED) {
          httpError(409, "Referral code already revoked.");
        }

        const updated = await prisma.referralCode.update({
          where: { code },
          data: {
            status: CodeStatus.REVOKED,
            revokedAt: new Date(),
            revokedReason: reason ?? "revoked_by_admin"
          }
        });

        res.json({
          code: updated.code,
          status: updated.status,
          revokedAt: updated.revokedAt,
          revokedReason: updated.revokedReason
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.use((error: unknown, _req: Request, res: Response, _next: () => void) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "validation_error",
        message: "Invalid request payload.",
        details: error.flatten()
      });
      return;
    }

    if (error instanceof Error && "status" in error && typeof (error as { status?: unknown }).status === "number") {
      const status = (error as { status: number }).status;
      const errorCode =
        "errorCode" in error && typeof (error as { errorCode?: unknown }).errorCode === "string"
          ? (error as { errorCode: string }).errorCode
          : status === 400
            ? "validation_error"
            : "request_error";
      res.status(status).json({ error: errorCode, message: error.message });
      return;
    }

    if (error instanceof Error) {
      res.status(500).json({ error: "internal_error", message: error.message });
      return;
    }

    res.status(500).json({ error: "internal_error", message: "Unknown failure" });
  });

  return app;
}
