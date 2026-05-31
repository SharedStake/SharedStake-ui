import {expect} from "chai";
import {ethers} from "hardhat";

describe("InstitutionalPolicyRegistry", () => {
  const POLICY_ADMIN = ethers.keccak256(ethers.toUtf8Bytes("POLICY_ADMIN"));

  let registry: any;
  let gov: any;
  let admin: any;
  let manager: any;
  let userA: any;
  let userB: any;

  const POLICY = ethers.keccak256(ethers.toUtf8Bytes("INSTITUTIONAL_VAULT_A"));

  beforeEach(async () => {
    [, gov, admin, manager, userA, userB] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("InstitutionalPolicyRegistry");
    registry = await Factory.connect(gov).deploy(gov.address);
    await registry.waitForDeployment();

    await registry.connect(gov).grantRole(POLICY_ADMIN, admin.address);
  });

  it("creates policies and enforces admin-only mutations", async () => {
    await expect(registry.connect(userA).createPolicy(POLICY, 0, manager.address)).to.be.reverted;
    await expect(registry.connect(admin).createPolicy(POLICY, 0, manager.address)).to.not.be.reverted;
  });

  it("permissionless mode allows everyone except blocklisted", async () => {
    await registry.connect(admin).createPolicy(POLICY, 0, manager.address); // Permissionless
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(true);

    await registry.connect(admin).setBlocklisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(false);
  });

  it("allowlist-only mode restricts to allowlisted accounts", async () => {
    await registry.connect(admin).createPolicy(POLICY, 1, manager.address); // AllowlistOnly
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(false);

    await registry.connect(admin).setAllowlisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(true);
  });

  it("blocklist-only mode allows non-blocklisted accounts", async () => {
    await registry.connect(admin).createPolicy(POLICY, 2, manager.address); // BlocklistOnly
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(true);

    await registry.connect(admin).setBlocklisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(false);
  });

  it("private mode allows manager and allowlisted addresses", async () => {
    await registry.connect(admin).createPolicy(POLICY, 3, manager.address); // Private

    expect(await registry.isAllowed(POLICY, manager.address)).to.equal(true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(false);

    await registry.connect(admin).setAllowlisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(true);
  });

  it("private mode still respects blocklist", async () => {
    await registry.connect(admin).createPolicy(POLICY, 3, manager.address);
    await registry.connect(admin).setAllowlisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(true);

    await registry.connect(admin).setBlocklisted(POLICY, userA.address, true);
    expect(await registry.isAllowed(POLICY, userA.address)).to.equal(false);
  });

  it("can change mode and manager", async () => {
    await registry.connect(admin).createPolicy(POLICY, 1, manager.address);
    expect((await registry.getPolicy(POLICY)).mode).to.equal(1n);

    await registry.connect(admin).setPolicyMode(POLICY, 2);
    expect((await registry.getPolicy(POLICY)).mode).to.equal(2n);

    await registry.connect(admin).setPolicyManager(POLICY, userB.address);
    expect((await registry.getPolicy(POLICY)).manager).to.equal(userB.address);
  });
});

