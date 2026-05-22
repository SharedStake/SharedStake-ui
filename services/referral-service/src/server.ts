import dotenv from "dotenv";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./db.js";

dotenv.config();

const app = createApp();
const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`[referral-service] listening on http://${env.HOST}:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`[referral-service] received ${signal}, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
