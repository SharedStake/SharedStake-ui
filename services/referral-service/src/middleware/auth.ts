import type { NextFunction, Request, Response } from "express";
import { env } from "../env.js";

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (env.apiKeys.size === 0) {
    res.status(503).json({
      error: "referral_service_misconfigured",
      message: "No API keys configured. Set API_KEYS in environment."
    });
    return;
  }

  const key = req.header("x-api-key")?.trim();
  if (!key || !env.apiKeys.has(key)) {
    res.status(401).json({
      error: "unauthorized",
      message: "Valid x-api-key is required."
    });
    return;
  }

  next();
}
