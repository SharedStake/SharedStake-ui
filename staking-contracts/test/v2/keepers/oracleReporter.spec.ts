/**
 * Unit tests for the oracleReporter keeper.
 *
 * `reportOnce` builds its own JsonRpcProvider / Wallet / Contract from the
 * Config (patched via helpers.patchEthers) and additionally calls the global
 * `fetch` to query the Beacon REST API. The fetch is replaced with a fake for
 * the duration of each test and restored in afterEach.
 *
 * `verifySubmitterRole` accepts a Contract directly and needs no patching.
 *
 * Covered:
 *   verifySubmitterRole — throws when the submitter lacks the role.
 *   reportOnce          — skips when the last report is still fresh; fetches
 *                         beacon data and (in dry-run) logs + returns without
 *                         submitting submitReport().
 */
import {expect} from "chai";
import {ethers} from "ethers";
import {
  verifySubmitterRole,
  reportOnce,
  Config,
} from "../../../scripts/keepers/oracleReporter";
import {
  makeFakeContract,
  makeFakeProvider,
  makeFakeWallet,
  makeFakeTx,
  patchEthers,
  RestoreFn,
} from "./helpers";

const SUBMITTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SUBMITTER"));
const SUBMITTER_ADDR = "0x00000000000000000000000000000000000000C3";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    beaconApi: "http://beacon.local",
    rpcUrl: "http://localhost:8545",
    oracleAddress: "0x0000000000000000000000000000000000000003",
    privateKey: "0x" + "3".repeat(64),
    pubkeys: ["0x" + "aa".repeat(48)],
    dryRun: false,
    watch: false,
    intervalSec: 900,
    minReportIntervalSec: 21600,
    maxRetries: 5,
    initialBackoffMs: 1,
    ...overrides,
  };
}

/** Build a fake fetch Response for a beacon validators query. */
function makeBeaconResponse(validators: Array<{balance: string; status: string; pubkey: string}>): any {
  return {
    ok: true,
    status: 200,
    text: async () => "",
    json: async () => ({
      data: validators.map(v => ({
        balance: v.balance,
        status: v.status,
        validator: {pubkey: v.pubkey},
      })),
    }),
  };
}

describe("keepers/oracleReporter", () => {
  let restore: RestoreFn | null = null;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    if (restore) {
      restore();
      restore = null;
    }
    globalThis.fetch = originalFetch;
  });

  describe("verifySubmitterRole", () => {
    it("throws when the submitter does not hold the role", async () => {
      const oracle = makeFakeContract({
        SUBMITTER: async () => SUBMITTER_ROLE,
        hasRole: async () => false,
      });
      let threw = false;
      try {
        await verifySubmitterRole(oracle, SUBMITTER_ADDR);
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("does not hold the SUBMITTER role");
      }
      expect(threw, "expected verifySubmitterRole to throw").to.equal(true);
    });
  });

  describe("reportOnce", () => {
    /** Wire patched ethers so reportOnce sees the fake OracleAdapter. */
    function wire(contractMethods: Record<string, unknown>) {
      const oracle = makeFakeContract(contractMethods);
      restore = patchEthers({
        JsonRpcProvider: function () {
          return makeFakeProvider();
        },
        Wallet: function () {
          return makeFakeWallet(SUBMITTER_ADDR);
        },
        Contract: function () {
          return oracle;
        },
      });
      return oracle;
    }

    it("skips when the last report is still fresh (within maxStalenessSeconds)", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      // Last report 100s ago; minReportInterval 21600s → still fresh.
      const oracle = wire({
        lastReportTime: async () => BigInt(nowSec - 100),
        submitReport: async () => makeFakeTx(),
      });
      let fetchCalled = false;
      globalThis.fetch = (async () => {
        fetchCalled = true;
        return makeBeaconResponse([]);
      }) as typeof globalThis.fetch;

      await reportOnce(makeConfig({minReportIntervalSec: 21600}));

      // Fresh report: no beacon fetch, no submitReport.
      expect(fetchCalled, "fetch should not run when the report is fresh").to.equal(false);
      expect(oracle.__calls.submitReport.length).to.equal(0);
    });

    it("fetches beacon data and (dry-run) returns without submitting submitReport()", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      // Last report 30000s ago → stale, proceed.
      const oracle = wire({
        lastReportTime: async () => BigInt(nowSec - 30000),
        submitReport: async () => makeFakeTx(),
      });
      const cfg = makeConfig({dryRun: true, minReportIntervalSec: 21600});

      let fetchCalled = false;
      globalThis.fetch = (async (url: string) => {
        fetchCalled = true;
        expect(url).to.contain("/eth/v1/beacon/states/head/validators");
        return makeBeaconResponse([
          {balance: "32000000000", status: "active_ongoing", pubkey: cfg.pubkeys[0]},
        ]);
      }) as typeof globalThis.fetch;

      await reportOnce(cfg);

      // Stale → beacon fetched; dry-run → submitReport NOT called.
      expect(fetchCalled, "fetch should run when the report is stale").to.equal(true);
      expect(oracle.__calls.submitReport.length).to.equal(0);
    });

    it("submits submitReport() with beacon totals when stale and not in dry-run", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const oracle = wire({
        lastReportTime: async () => BigInt(nowSec - 30000),
        submitReport: async () => makeFakeTx(),
      });
      const cfg = makeConfig({dryRun: false, minReportIntervalSec: 21600});

      globalThis.fetch = (async () =>
        makeBeaconResponse([
          {balance: "32000000000", status: "active_ongoing", pubkey: cfg.pubkeys[0]},
        ])) as typeof globalThis.fetch;

      await reportOnce(cfg);

      expect(oracle.__calls.submitReport.length).to.equal(1);
      const args = oracle.__calls.submitReport[0] as unknown[];
      // submitReport(beaconValidators, beaconBalance, reportTimestamp, txOpts)
      expect(args[0]).to.equal(1); // one active validator
      // 32000000000 Gwei * 1e9 = 32 ETH in wei.
      expect(args[1]).to.equal(32000000000n * 10n ** 9n);
    });
  });
});
