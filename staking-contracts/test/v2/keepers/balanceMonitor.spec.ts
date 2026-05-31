/**
 * Unit tests for the balanceMonitor keeper.
 *
 * balanceMonitor's testable functions all accept an `ethers.Contract` and a
 * `Config` directly, so no module-level patching is required — a plain fake
 * contract object (see helpers.makeFakeContract) is sufficient.
 *
 * Covered:
 *   verifyGuardianRole — throws when hasRole is false, succeeds when true.
 *   checkOnce          — baseline on first poll; no-op when paused; pauses on
 *                        a drop >= threshold; updates baseline on a sub-threshold drop.
 *   triggerPause       — calls emergencyPauseAll outside dry-run; skips the tx in dry-run.
 */
import {expect} from "chai";
import {ethers} from "ethers";
import {
  verifyGuardianRole,
  checkOnce,
  triggerPause,
  Config,
  State,
} from "../../../scripts/keepers/balanceMonitor";
import {makeFakeContract, makeFakeTx} from "./helpers";

const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
const GUARDIAN_ADDR = "0x00000000000000000000000000000000000000A1";

/** Build a Config with sane defaults; override fields per test. */
function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    rpcUrl: "http://localhost:8545",
    routerAddress: "0x0000000000000000000000000000000000000001",
    guardianKey: "0x" + "1".repeat(64),
    oracleAddress: null,
    moduleIds: [ethers.keccak256(ethers.toUtf8Bytes("MODULE_A"))],
    alertThresholdBps: 500,
    pollIntervalSec: 60,
    maxOracleAgeSec: 3600,
    webhookUrl: null,
    dryRun: false,
    watch: false,
    ...overrides,
  };
}

describe("keepers/balanceMonitor", () => {
  describe("verifyGuardianRole", () => {
    it("throws when hasRole returns false", async () => {
      const router = makeFakeContract({
        GUARDIAN: async () => GUARDIAN_ROLE,
        hasRole: async () => false,
      });
      let threw = false;
      try {
        await verifyGuardianRole(router, GUARDIAN_ADDR);
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("does not hold the GUARDIAN role");
      }
      expect(threw, "expected verifyGuardianRole to throw").to.equal(true);
    });

    it("succeeds when hasRole returns true", async () => {
      const router = makeFakeContract({
        GUARDIAN: async () => GUARDIAN_ROLE,
        hasRole: async (role: string, account: string) => {
          expect(role).to.equal(GUARDIAN_ROLE);
          expect(account).to.equal(GUARDIAN_ADDR);
          return true;
        },
      });
      // Should resolve without throwing.
      await verifyGuardianRole(router, GUARDIAN_ADDR);
    });
  });

  describe("checkOnce", () => {
    it("establishes a baseline on the first call", async () => {
      const pooled = ethers.parseEther("1000");
      const router = makeFakeContract({totalPooledEther: async () => pooled});
      const state: State = {lastPooledEther: null, paused: false};

      await checkOnce(router, makeConfig(), state);

      expect(state.lastPooledEther).to.equal(pooled);
      expect(state.paused).to.equal(false);
      // No pause path touched on the baseline poll.
      expect(router.__calls.emergencyPauseAll).to.equal(undefined);
    });

    it("is a no-op when the protocol is already paused", async () => {
      const router = makeFakeContract({
        totalPooledEther: async () => ethers.parseEther("500"),
      });
      const prev = ethers.parseEther("1000");
      const state: State = {lastPooledEther: prev, paused: true};

      await checkOnce(router, makeConfig(), state);

      // Paused: baseline must not move even though balance fell sharply.
      expect(state.lastPooledEther).to.equal(prev);
      expect(state.paused).to.equal(true);
    });

    it("triggers pause when the drop is >= threshold", async () => {
      // 1000 -> 940 = 60 ETH drop = 600 bps, threshold 500 bps.
      const router = makeFakeContract({
        totalPooledEther: async () => ethers.parseEther("940"),
        emergencyPauseAll: async () => makeFakeTx(),
      });
      const state: State = {lastPooledEther: ethers.parseEther("1000"), paused: false};
      const cfg = makeConfig({alertThresholdBps: 500, dryRun: false});

      await checkOnce(router, cfg, state);

      expect(router.__calls.emergencyPauseAll.length).to.equal(1);
      expect(router.__calls.emergencyPauseAll[0][0]).to.deep.equal(cfg.moduleIds);
      expect(state.paused).to.equal(true);
    });

    it("updates lastPooledEther when the drop is below threshold", async () => {
      // 1000 -> 990 = 10 ETH drop = 100 bps, threshold 500 bps.
      const newPooled = ethers.parseEther("990");
      const router = makeFakeContract({
        totalPooledEther: async () => newPooled,
        emergencyPauseAll: async () => makeFakeTx(),
      });
      const state: State = {lastPooledEther: ethers.parseEther("1000"), paused: false};

      await checkOnce(router, makeConfig({alertThresholdBps: 500}), state);

      expect(state.paused).to.equal(false);
      expect(state.lastPooledEther).to.equal(newPooled);
      expect(router.__calls.emergencyPauseAll.length).to.equal(0);
    });

    it("triggers pause when oracle report is stale beyond threshold", async () => {
      const router = makeFakeContract({
        totalPooledEther: async () => ethers.parseEther("1000"),
        emergencyPauseAll: async () => makeFakeTx(),
      });
      const staleOracle = makeFakeContract({
        lastReportTime: async () => BigInt(Math.floor(Date.now() / 1000) - 7200),
      });
      const state: State = {lastPooledEther: ethers.parseEther("1000"), paused: false};

      await checkOnce(router, makeConfig({maxOracleAgeSec: 3600}), state, staleOracle);

      expect(router.__calls.emergencyPauseAll.length).to.equal(1);
      expect(state.paused).to.equal(true);
    });
  });

  describe("triggerPause", () => {
    it("calls emergencyPauseAll with the configured moduleIds (not dry-run)", async () => {
      const router = makeFakeContract({
        emergencyPauseAll: async () => makeFakeTx(),
      });
      const cfg = makeConfig({dryRun: false});

      await triggerPause(router, cfg, "test reason");

      expect(router.__calls.emergencyPauseAll.length).to.equal(1);
      expect(router.__calls.emergencyPauseAll[0][0]).to.deep.equal(cfg.moduleIds);
    });

    it("skips the transaction in dry-run mode", async () => {
      const router = makeFakeContract({
        emergencyPauseAll: async () => makeFakeTx(),
      });
      const cfg = makeConfig({dryRun: true});

      await triggerPause(router, cfg, "test reason");

      expect(router.__calls.emergencyPauseAll.length).to.equal(0);
    });
  });
});
