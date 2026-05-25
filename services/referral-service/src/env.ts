import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().default("file:../data/referrals.db"),
  API_KEYS: z.string().default(""),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WRITE_MAX: z.coerce.number().int().positive().default(20),
  CHAIN_ID: z.coerce.number().int().positive().default(1),
  RPC_URL: z.string().url().optional(),
  ONCHAIN_REFERRAL_REGISTRY_ADDRESS: z.string().optional(),
  SYNC_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
  SYNC_CONFIRMATIONS: z.coerce.number().int().nonnegative().default(3),
  SYNC_MAX_BLOCK_RANGE: z.coerce.number().int().positive().default(2_000),
  SYNC_START_BLOCK: z.coerce.bigint().nonnegative().optional()
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid referral-service environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const apiKeys = new Set(
  parsed.data.API_KEYS.split(",")
    .map(key => key.trim())
    .filter(Boolean)
);

if (parsed.data.NODE_ENV === "production" && apiKeys.size === 0) {
  console.error("Invalid referral-service environment: API_KEYS is required in production.");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  apiKeys
};
