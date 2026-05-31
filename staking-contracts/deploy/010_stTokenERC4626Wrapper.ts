import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {StTokenERC4626Wrapper__factory, StToken__factory} from "../../types";

/**
 * Deploys the StTokenERC4626Wrapper — a permissionless ERC-4626 vault that wraps
 * the rebasing stToken into a non-rebasing vault token.
 *
 * No role grants are required: the wrapper only calls view functions and
 * `transferFrom`/`transfer` on the stToken ERC-20 interface.
 *
 * This enables DeFi composability (Aave, Compound, Pendle, etc.) without
 * requiring any protocol permission changes.
 */
const func: DeployFunction = async hre => {
  const {deploy, address, accounts} = await Ship.init(hre);

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  console.log(`  Deploying StTokenERC4626Wrapper (stToken=${stTokenAddress})...`);
  await deploy(StTokenERC4626Wrapper__factory, {
    from: accounts.deployer,
    args: [stTokenAddress],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "erc4626-wrapper"];
func.dependencies = ["stToken"];
