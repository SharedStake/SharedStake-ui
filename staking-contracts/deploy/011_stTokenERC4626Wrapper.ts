import {DeployFunction} from "hardhat-deploy/types";
import {parseEther} from "ethers";
import Ship from "../utils/ship";
import {StTokenERC4626Wrapper__factory, StToken__factory} from "../types";

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
 * Seed deposit: a small initial deposit (SEED_AMOUNT) is made by the deployer
 * immediately after deployment on live networks. Without it, an attacker can
 * deposit 1 wei, donate a large stToken amount to the vault, and cause all
 * subsequent normal-sized deposits to round to 0 shares and revert with
 * ZeroSharesDeposit — a griefing DoS. The seed establishes the exchange rate
 * before the vault is public. Skipped on hardhat/local networks.
 */

const SEED_AMOUNT = parseEther("0.001"); // 0.001 stToken — enough to anchor the rate

const func: DeployFunction = async hre => {
  const {deploy, connect, address, accounts} = await Ship.init(hre);
  const isLocal = hre.network.tags.hardhat || hre.network.name === "localhost";

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  console.log(`  Deploying StTokenERC4626Wrapper (stToken=${stTokenAddress})...`);
  const {contract: wrapper} = await deploy(StTokenERC4626Wrapper__factory, {
    from: accounts.deployer,
    args: [stTokenAddress],
    log: true,
  });

  if (!isLocal) {
    const stToken = await connect(StToken__factory, stTokenAddress);
    console.log(`  Seeding ERC4626Wrapper with ${SEED_AMOUNT} stToken to prevent inflation-attack DoS...`);
    const approveTx = await stToken.connect(accounts.deployer).approve(wrapper.target, SEED_AMOUNT);
    await approveTx.wait();
    const depositTx = await wrapper.connect(accounts.deployer).deposit(SEED_AMOUNT, accounts.deployer.address);
    await depositTx.wait();
    console.log(`  Seed deposit complete. Deployer holds initial wrapper shares.`);
  }
};

export default func;
func.tags = ["modular-staking", "erc4626-wrapper"];
func.dependencies = ["stToken"];
