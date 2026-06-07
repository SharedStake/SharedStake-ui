import {DeployFunction} from "hardhat-deploy/types";
import {parseEther} from "ethers";
import Ship from "../utils/ship";
import {StTokenERC4626Wrapper__factory, StToken__factory} from "../types";

const DEFAULT_WRAPPER_SEED_AMOUNT = "0.001";

/**
 * Deploys the StTokenERC4626Wrapper — a permissionless ERC-4626 vault that wraps
 * the rebasing stToken into a non-rebasing vault token.
 *
 * No role grants are required: the wrapper only calls view functions and
 * `transferFrom`/`transfer` on the stToken ERC-20 interface.
 *
 * This enables DeFi composability (Aave, Compound, Pendle, etc.) without
 * requiring any protocol permission changes.
 *
 * Live-network deployment seeds the wrapper with a small deployer deposit by
 * default. OZ ERC-4626 virtual assets/shares make first-deposit donation attacks
 * non-profitable, and this seed further raises the cost of griefing users into
 * zero-share deposits. Set V2_WRAPPER_SEED_AMOUNT=0 only for an intentionally
 * unseeded deploy.
 */
const func: DeployFunction = async hre => {
  const {deploy, connect, address, accounts} = await Ship.init(hre);
  const isLocal = hre.network.name === "hardhat" || hre.network.name === "localhost";

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  console.log(`  Deploying StTokenERC4626Wrapper (stToken=${stTokenAddress})...`);
  const {contract: wrapper} = await deploy(StTokenERC4626Wrapper__factory, {
    from: accounts.deployer,
    args: [stTokenAddress],
    log: true,
  });
  const wrapperContract = wrapper as any;

  if (isLocal) return;

  const seedAmount = parseEther(process.env.V2_WRAPPER_SEED_AMOUNT ?? DEFAULT_WRAPPER_SEED_AMOUNT);
  if (seedAmount === 0n) {
    console.warn("  Skipping ERC4626 wrapper seed because V2_WRAPPER_SEED_AMOUNT=0");
    return;
  }

  const totalSupply = await wrapperContract.totalSupply();
  if (totalSupply > 0n) {
    console.log("  ERC4626 wrapper already seeded; skipping seed deposit.");
    return;
  }

  const stToken = (await connect(StToken__factory, stTokenAddress)) as any;
  const deployer = accounts.deployer;
  const deployerBalance = await stToken.balanceOf(deployer.address);
  if (deployerBalance < seedAmount) {
    throw new Error(
      `Deployer has ${deployerBalance.toString()} stToken, but ${seedAmount.toString()} is required to seed StTokenERC4626Wrapper. ` +
        "Fund the deployer with stToken first, or set V2_WRAPPER_SEED_AMOUNT=0 for an intentionally unseeded deploy.",
    );
  }

  const wrapperAddress = await wrapperContract.getAddress();
  const allowance = await stToken.allowance(deployer.address, wrapperAddress);
  if (allowance < seedAmount) {
    console.log(`  Approving ${seedAmount.toString()} stToken for ERC4626 wrapper seed...`);
    const approveTx = await stToken.connect(deployer).approve(wrapperAddress, seedAmount);
    await approveTx.wait();
  }

  console.log(`  Seeding ERC4626 wrapper with ${seedAmount.toString()} stToken...`);
  const depositTx = await wrapperContract.connect(deployer).deposit(seedAmount, deployer.address);
  await depositTx.wait();
  console.log("  ERC4626 wrapper seed deposit complete.");
};

export default func;
func.tags = ["modular-staking", "erc4626-wrapper"];
func.dependencies = ["stToken"];
