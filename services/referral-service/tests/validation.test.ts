import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { normalizeAddress, normalizeCode } from "../src/lib/normalize.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.API_KEYS = "local-dev-key-change-me";
  const { createApp } = await import("../src/app.js");
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not bind test server");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("referral input validation", () => {
  test("normalizes codes and addresses", () => {
    expect(normalizeCode(" launch-01 ")).toBe("LAUNCH-01");
    expect(normalizeAddress("0x0000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000"
    );
  });

  test("returns 400 for malformed public referral codes", async () => {
    const response = await fetch(`${baseUrl}/v1/codes/bad!/resolve`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("validation_error");
  });

  test("returns 400 for malformed admin referrer addresses before auth-dependent data access", async () => {
    const response = await fetch(`${baseUrl}/v1/referrers/not-an-address/codes`, {
      headers: { "x-api-key": "local-dev-key-change-me" }
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("validation_error");
  });
});
