import rateLimit from "express-rate-limit";
import { env } from "../env.js";

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limited",
    message: "Too many requests. Try again shortly."
  }
});

export const writeLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_WRITE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "write_rate_limited",
    message: "Too many write requests. Try again shortly."
  }
});
