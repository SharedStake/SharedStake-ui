/**
 * Unit tests for the depositSweep keeper.
 *
 * `sweepOnce` builds its own JsonRpcProvider / Wallet / Contract from the
 * Config, so the test patches those constructors on the shared `ethers`
 * module object (see helpers.patchEthers).
 *
 * `verifyNodeOperatorRole` accepts a Contract directly and needs no patching.
 *
 * Covered:
 *   verifyNodeOperatorRole — throws when the operator lacks the role.
 *   sweepOnce              — skips when bufferedEther < DEPOSIT_AMOUNT;
 *                            in dry-run logs and returns without submitting
 *                            depositToBeaconChain().
 */
import {expect} from "chai";
import {ethers} from "ethers";
import {
  verifyNodeOperatorRole,
  sweepOnce,
  Config,
} from "../../../scripts/keepers/depositSweep";
import {
  makeFakeContract,
  makeFakeProvider,
  makeFakeWallet,
  makeFakeTx,
  patchEthers,
  RestoreFn,
} from "./helpers";

const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));
const OPERATOR_ADDR = "0x00000000000000000000000000000000000000B2";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    rpcUrl: "http://localhost:8545",
    moduleAddress: "0x0000000000000000000000000000000000000002",
    privateKey: "0x" + "2".repeat(64),
    pubkey: "0x" + "ab".repeat(48),
    creds: "0x" + "cd".repeat(32),
    signature: "0x" + "ef".repeat(96),
    depositDataRoot: "0x" + "12".repeat(32),
    dryRun: false,
    watch: false,
    intervalSec: 60,
    maxRetries: 5,
    initialBackoffMs: 1,
    ...overrides,
  };
}

describe("keepers/depositSweep", () => {
  let restore: RestoreFn | null = null;

  afterEach(() => {
    if (restore) {
      restore();
      restore = null;
    }
  });

  describe("verifyNodeOperatorRole", () => {
    it("throws when the operator does not hold the role", async () => {
      const module = makeFakeContract({
        NODE_OPERATOR: async () => NODE_OPERATOR_ROLE,
        hasRole: async () => false,
      });
      let threw = false;
      try {
        await verifyNodeOperatorRole(module, OPERATOR_ADDR);
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("does not hold the NODE_OPERATOR role");
      }
      expect(threw, "expected verifyNodeOperatorRole to throw").to.equal(true);
    });
  });

  describe("sweepOnce", () => {
    /** Wire patched ethers so sweepOnce sees the fake ValidatorModule. */
    function wire(contractMethods: Record<string, unknown>) {
      const module = makeFakeContract({
        expectedWithdrawalCredentials: async () => makeConfig().creds,
        ...contractMethods,
      });
      restore = patchEthers({
        JsonRpcProvider: function () {
          return makeFakeProvider();
        },
        Wallet: function () {
          return makeFakeWallet(OPERATOR_ADDR);
        },
        Contract: function () {
          return module;
        },
      });
      return module;
    }

    it("skips when bufferedEther is below DEPOSIT_AMOUNT", async () => {
      const module = wire({
        bufferedEther: async () => ethers.parseEther("20"),
        DEPOSIT_AMOUNT: async () => ethers.parseEther("32"),
        depositToBeaconChain: async () => makeFakeTx(),
      });

      await sweepOnce(makeConfig());

      expect(module.__calls.depositToBeaconChain.length).to.equal(0);
    });

    it("in dry-run logs and returns without submitting depositToBeaconChain()", async () => {
      // bufferedEther >= DEPOSIT_AMOUNT, but dry-run must short-circuit the tx.
      const module = wire({
        bufferedEther: async () => ethers.parseEther("64"),
        DEPOSIT_AMOUNT: async () => ethers.parseEther("32"),
        depositToBeaconChain: async () => makeFakeTx(),
      });

      await sweepOnce(makeConfig({dryRun: true}));

      expect(module.__calls.depositToBeaconChain.length).to.equal(0);
    });

    it("throws when configured creds mismatch module expectedWithdrawalCredentials", async () => {
      wire({
        bufferedEther: async () => ethers.parseEther("32"),
        DEPOSIT_AMOUNT: async () => ethers.parseEther("32"),
        expectedWithdrawalCredentials: async () => "0x" + "ff".repeat(32),
        depositToBeaconChain: async () => makeFakeTx(),
      });

      let threw = false;
      try {
        await sweepOnce(makeConfig());
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("WITHDRAWAL_CREDS_HEX");
      }
      expect(threw, "expected sweepOnce to throw on credentials mismatch").to.equal(true);
    });

    it("calls depositToBeaconChain when bufferedEther >= DEPOSIT_AMOUNT (not dry-run)", async () => {
      const module = wire({
        bufferedEther: async () => ethers.parseEther("32"),
        DEPOSIT_AMOUNT: async () => ethers.parseEther("32"),
        depositToBeaconChain: async () => makeFakeTx(),
      });
      const cfg = makeConfig({dryRun: false});

      await sweepOnce(cfg);

      expect(module.__calls.depositToBeaconChain.length).to.equal(1);
      const args = module.__calls.depositToBeaconChain[0] as unknown[];
      // pubkey, creds, signature, depositDataRoot, txOpts
      expect(args[0]).to.equal(cfg.pubkey);
      expect(args[1]).to.equal(cfg.creds);
      expect(args[2]).to.equal(cfg.signature);
      expect(args[3]).to.equal(cfg.depositDataRoot);
    });
  });
});
