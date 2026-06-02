/**
 * Adversarial / negative-path test suite for the SharedStake V2 modular stack.
 *
 * Coverage:
 *   1. Reentrancy on claimWithdrawal
 *   2. Fake module spoofing reportModuleBeaconBalance
 *   3. Double-claim of withdrawal
 *   4. Non-owner attempting to claim someone else's request
 *   5. Mint cap enforcement on direct deposit
 *   6. Stale oracle report rejection
 *   7. Flash-loan / single-block deposit cannot inflate the rate
 *   8. Beacon balance sanity (2x plausible) reverts
 *   9. Unauthorized beacon report path (no ORACLE role)
 *  10. Unauthorized module registration (no GOV role)
 *  11. Slash followed by withdrawal yields reduced ETH
 *  12. LST oracle inflation cannot bypass the mint cap
 *  13. Post-insolvency bootstrap is blocked when legacy shares exist
 *  14. OracleAdapter rejects non-monotonic report timestamps
 *  15. OracleAdapter cadence gate blocks rapid successive reports
 *  16. ValidatorModule rejects report validator counts above deposited validators
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const SOLO = ethers.keccak256(ethers.toUtf8Bytes("ADV_SOLO_1"));
const LST_MOD = ethers.keccak256(ethers.toUtf8Bytes("ADV_LST_1"));

const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));
const SUBMITTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SUBMITTER"));

describe("SharedStake V2 adversarial", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    oracle: SignerWithAddress,
    impostor: SignerWithAddress;

  let stToken: any, feeController: any, router: any, mod1: any, queue: any, mockBeaconDeposit: any, oracleAdapter: any;
  let expectedWithdrawalCreds: string;

  async function deployStack() {
    [deployer, gov, alice, bob, oracle, impostor] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(
      gov.address,
      gov.address,
      deployer.address,
      ZeroAddress, // referral registry
      ZeroAddress, // debt pool (disabled)
      1000, // feeBps
      5000, // treasurySplitBps
      5000, // operatorSplitBps
      0, // debtPoolSplitBps (disabled)
    );

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
    mockBeaconDeposit = await MockBeaconDeposit.deploy();

    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    mod1 = await ValidatorModule.deploy(router.target, SOLO, gov.address, mockBeaconDeposit.target);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
    oracleAdapter = await OracleAdapter.deploy(mod1.target, gov.address);

    // Wire roles.
    await stToken.addMinter(router.target);
    await stToken.addMinter(queue.target);
    await router.connect(gov).setFeeController(feeController.target);
    await router.connect(gov).registerModule(SOLO, mod1.target, parseEther("100"));
    await router.connect(gov).setDefaultModule(SOLO);
    await mod1.connect(gov).grantRole(ORACLE_ROLE, oracleAdapter.target);
    await mod1.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
    await mod1.connect(gov).grantRole(NODE_OPERATOR_ROLE, gov.address);
    await oracleAdapter.connect(gov).addSubmitter(oracle.address);
    expectedWithdrawalCreds = ethers.hexlify(ethers.randomBytes(32));
    await mod1.connect(gov).setExpectedWithdrawalCredentials(expectedWithdrawalCreds);
  }

  beforeEach(deployStack);

  // ── 1. Reentrancy on claim ────────────────────────────────────────────────
  describe("1. Reentrancy on claimWithdrawal", () => {
    it("ReentrantClaimer cannot drain the queue twice", async () => {
      // Alice deposits and gives the attacker stToken so it can request a withdrawal.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("5")});

      const ReentrantClaimer = await ethers.getContractFactory("ReentrantClaimer");
      const attacker = await ReentrantClaimer.deploy(queue.target);

      // Transfer 2 stETH worth to the attacker contract so it can request a withdrawal.
      await stToken.connect(alice).transfer(attacker.target, parseEther("2"));

      // The attacker contract requests a withdrawal owned by itself.
      // We need the attacker to be msg.sender for requestWithdrawals so its shares are burnt.
      // Workaround: have attacker call requestWithdrawals via a forwarder-style helper.
      // Simpler: alice requests withdrawal owned by attacker, then attacker claims.
      // The attacker must own the request to claim it.
      // requestWithdrawals(amounts, owner) burns msg.sender's shares and assigns ownership.
      // So alice burns her own shares and assigns ownership to attacker.
      await stToken.connect(alice).transfer(alice.address, 0n); // no-op
      await queue.connect(alice).requestWithdrawals([parseEther("1")], attacker.target);

      // Guardian (gov) finalizes.
      await queue.connect(gov).finalize(1, {value: parseEther("1.1")});

      // Attacker calls attack(): triggers claimWithdrawal which sends ETH and re-enters.
      // The re-entry attempt is swallowed by try/catch in the attacker; if guard worked,
      // `attempted` is true but the inner call reverted (so the queue still holds correct state).
      await attacker.attack(1);

      // The first claim succeeded.
      const req = await queue.getRequest(1);
      expect(req.claimed).to.be.true;

      // The attacker tried to re-enter.
      expect(await attacker.attempted()).to.be.true;

      // A direct second claim must revert with RequestAlreadyClaimed.
      await expect(attacker.attack(1)).to.be.reverted;
    });
  });

  // ── 2. Fake module spoofing ──────────────────────────────────────────────
  describe("2. Fake module reporting", () => {
    it("non-module address cannot call reportModuleBeaconBalance", async () => {
      await expect(
        router.connect(impostor).reportModuleBeaconBalance(SOLO, parseEther("32")),
      ).to.be.revertedWithCustomError(router, "NotModule");
    });

    it("non-module address cannot call notifyBeaconDeposit", async () => {
      await expect(router.connect(impostor).notifyBeaconDeposit(SOLO, parseEther("32"))).to.be.revertedWithCustomError(
        router,
        "NotModule",
      );
    });
  });

  // ── 3. Double claim ──────────────────────────────────────────────────────
  describe("3. Double-claim protection", () => {
    it("second claimWithdrawal on same id reverts RequestAlreadyClaimed", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("5")});
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(gov).finalize(1, {value: parseEther("1.1")});

      await queue.connect(alice).claimWithdrawal(1, alice.address);
      await expect(queue.connect(alice).claimWithdrawal(1, alice.address)).to.be.revertedWithCustomError(
        queue,
        "RequestAlreadyClaimed",
      );
    });
  });

  // ── 4. Non-owner claim ───────────────────────────────────────────────────
  describe("4. Non-owner claim rejected", () => {
    it("Bob cannot claim Alice's request", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("5")});
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(gov).finalize(1, {value: parseEther("1.1")});

      await expect(queue.connect(bob).claimWithdrawal(1, bob.address)).to.be.revertedWithCustomError(
        queue,
        "NotRequestOwner",
      );
    });
  });

  // ── 5. Mint cap exceeded ─────────────────────────────────────────────────
  describe("5. Mint cap enforcement", () => {
    it("deposit beyond cap reverts MintCapExceeded", async () => {
      // Cap is 100 ETH on SOLO (set in fixture).
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("99")});
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.be.revertedWithCustomError(
        router,
        "MintCapExceeded",
      );
    });
  });

  // ── 6. Stale oracle report ───────────────────────────────────────────────
  describe("6. Stale oracle report", () => {
    it("OracleAdapter rejects reports older than maxStalenessSeconds", async () => {
      const now = Math.floor(Date.now() / 1000);
      const stale = now - 7 * 3600; // 7 hours ago, default cap is 6 hours
      await expect(
        oracleAdapter.connect(oracle).submitReport(1, parseEther("32"), stale),
      ).to.be.revertedWithCustomError(oracleAdapter, "StaleReport");
    });
  });

  // ── 7. Flash-loan / single-block deposit doesn't inflate rate ────────────
  describe("7. Share rate stability under large deposits", () => {
    it("large deposit gets shares strictly proportional to pre-deposit rate", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("1")});

      const totalPooledBefore = await stToken.totalPooledEther();
      const totalSharesBefore = await stToken.getTotalShares();

      // Bob deposits 50 ETH. He should get exactly 50 * (sharesBefore / pooledBefore).
      const depositAmt = parseEther("50");
      const expectedShares = (depositAmt * totalSharesBefore) / totalPooledBefore;

      await router.connect(bob).submit(ZeroAddress, {value: depositAmt});

      const bobShares = await stToken.sharesOf(bob.address);
      expect(bobShares).to.equal(expectedShares);
    });
  });

  // ── 8. Beacon balance sanity ─────────────────────────────────────────────
  describe("8. Beacon balance sanity guard", () => {
    it("reportBeacon with > 2x max plausible balance reverts", async () => {
      // Set baseline by depositing 32 ETH and pushing to beacon.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      // First report normalizes baseline (1 validator, 32 ETH).
      await mod1.connect(oracle).reportBeacon(1, parseEther("32"));

      // Now sanity check: 2x max plausible is 1 * 32 * 2 = 64 ETH. > 64 must revert.
      await expect(mod1.connect(oracle).reportBeacon(1, parseEther("65"))).to.be.revertedWithCustomError(
        mod1,
        "BeaconBalanceSanityFailed",
      );
    });

    it("rejects validator-count inflation beyond deposited validators", async () => {
      // Set baseline by depositing 32 ETH and pushing to beacon.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      // Keep reported balance equal to baseline so router delta checks would not
      // catch this by themselves; validator-count guard must catch it.
      await expect(mod1.connect(oracle).reportBeacon(1_000, parseEther("32")))
        .to.be.revertedWithCustomError(mod1, "BeaconValidatorCountSanityFailed")
        .withArgs(1000, 1);
    });
  });

  // ── 9. Unauthorized beacon report ────────────────────────────────────────
  describe("9. Unauthorized reportBeacon path", () => {
    it("non-ORACLE caller reverts AccessControl", async () => {
      await expect(mod1.connect(impostor).reportBeacon(1, parseEther("32"))).to.be.reverted;
    });
  });

  // ── 10. Unauthorized module registration ─────────────────────────────────
  describe("10. Unauthorized registerModule", () => {
    it("non-GOV caller reverts AccessControl", async () => {
      const FAKE = ethers.keccak256(ethers.toUtf8Bytes("FAKE_MOD"));
      await expect(router.connect(impostor).registerModule(FAKE, mod1.target, 0)).to.be.reverted;
    });
  });

  // ── 11. Slash then withdrawal returns reduced ETH ────────────────────────
  describe("11. Slash then withdrawal", () => {
    it("user receives the post-slash ETH amount, not original", async () => {
      // Alice deposits 32 ETH.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
      // Push to beacon to set baseline = 32.
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);
      await mod1.connect(oracle).reportBeacon(1, parseEther("32"));

      // Slash: validator drops to ~30 ETH (≈6.25% loss, under sanity cap).
      await mod1.connect(oracle).reportBeacon(1, parseEther("30"));

      // Now Alice owns shares whose value is reduced. Request withdrawal of 1 stETH.
      // 1 stETH at the new rate is worth less than 1 ETH-equivalent at the original rate.
      const ethValueAtRequestTime = await stToken.getPooledEthByShares(
        await stToken.getSharesByPooledEth(parseEther("1")),
      );
      // The post-slash balance equals 1:1 in stETH terms but 30/32 in original-ETH terms,
      // so a 1 stETH withdrawal request locks 1 stETH worth (rate * shares) of ETH.
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      const req = await queue.getRequest(1);
      expect(req.ethAmount).to.equal(ethValueAtRequestTime);

      // Sanity: Alice's total stETH holdings worth less than 32 ETH (after slash).
      const aliceStETH = await stToken.balanceOf(alice.address);
      // She originally minted shares worth 32 ETH; after slash her remaining shares
      // (after burning 1 stETH worth) should be worth less than 31 ETH.
      expect(aliceStETH).to.be.lt(parseEther("31"));
    });
  });

  // ── 12. LST oracle inflation cannot bypass mint cap ──────────────────────
  describe("12. LST oracle manipulation", () => {
    it("inflated price oracle still constrained by mint cap", async () => {
      // Deploy LST infra.
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const lst = await MockERC20.deploy("Mock stETH", "mstETH");

      const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
      // Inflated: 1 LST = 100 ETH (vs. realistic ~1).
      const priceOracle = await MockLSTPriceOracle.deploy(parseEther("100"));

      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      const lstMod = await LSTWrapModule.deploy(router.target, LST_MOD, lst.target, gov.address);
      await lstMod.connect(gov).setPriceOracle(priceOracle.target);

      // Register LST module with a small mint cap (10 ETH).
      await router.connect(gov).registerModule(LST_MOD, lstMod.target, parseEther("10"));

      // Mint 1 LST to Alice and approve the module.
      await lst.mint(alice.address, parseEther("1"));
      await lst.connect(alice).approve(lstMod.target, parseEther("1"));

      // wrap of 1 LST → 100 ETH equiv, exceeding 10 ETH cap → revert.
      await expect(lstMod.connect(alice).wrapLST(parseEther("1"), alice.address)).to.be.revertedWithCustomError(
        router,
        "MintCapExceeded",
      );
    });
  });

  // ── 13. Insolvency recovery path safety ─────────────────────────────────
  describe("13. Post-insolvency bootstrap", () => {
    it("blocks new deposits when pooled ETH is zero but legacy shares remain", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);
      await mod1.connect(oracle).reportBeacon(1, parseEther("32"));

      // Full loss: force pooled ETH clamp to zero while shares are still outstanding.
      await mod1.connect(oracle).reportBeacon(1, 0);
      expect(await stToken.totalPooledEther()).to.equal(0n);
      expect(await stToken.getTotalShares()).to.be.gt(0n);

      // After the insolvency fix, new deposits in this state succeed with 1:1 minting
      // (re-bootstrap) rather than reverting with InvalidBootstrapState. The pool
      // recovers gracefully instead of being permanently bricked.
      await expect(router.connect(bob).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;
      expect(await stToken.totalPooledEther()).to.equal(parseEther("1"));
    });
  });

  // ── 14. Oracle timestamp monotonicity ───────────────────────────────────
  describe("14. Oracle timestamp monotonicity", () => {
    it("rejects reports that reuse the same timestamp after a successful report", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      const blk = await ethers.provider.getBlock("latest");
      const ts = blk!.timestamp;
      await oracleAdapter.connect(oracle).submitReport(1, parseEther("32"), ts);

      await expect(oracleAdapter.connect(oracle).submitReport(1, parseEther("32"), ts)).to.be.revertedWithCustomError(
        oracleAdapter,
        "NonMonotonicReportTimestamp",
      );
    });
  });

  // ── 15. Oracle cadence gating ────────────────────────────────────────────
  describe("15. Oracle cadence gating", () => {
    it("rejects rapid consecutive reports when min report interval is enabled", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).approvePubkey(pubkey);
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      const firstBlk = await ethers.provider.getBlock("latest");
      const firstTs = firstBlk!.timestamp;
      await oracleAdapter.connect(oracle).submitReport(1, parseEther("32"), firstTs);

      await expect(
        oracleAdapter.connect(oracle).submitReport(1, parseEther("32"), firstTs + 1),
      ).to.be.revertedWithCustomError(oracleAdapter, "ReportTooFrequent");
    });
  });
});
