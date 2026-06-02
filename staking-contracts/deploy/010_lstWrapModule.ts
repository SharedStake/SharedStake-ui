import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {LSTWrapModule__factory, StEthPriceOracle__factory, StakingRouter__factory} from "../types";
import {parseEther} from "ethers";
import {
  assertGovernanceSigner,
  getGovernanceSigner,
  pauseModuleAfterRegistrationIfRequested,
  readPauseAfterRegistration,
} from "../helpers/moduleDeployment";
import {resolveGovernanceAddress} from "../helpers/governance";

/**
 * Deploys an LSTWrapModule for stETH and registers it with the StakingRouter.
 *
 * Cross-LST mints share the same StToken pool, so we cap LST exposure at
 * 1000 ETH (conservative MVP). Governance can lift the cap via setMintCap once
 * peg-stability monitoring is in place.
 *
 * stETH addresses by network:
 *   - mainnet  → 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
 *   - holesky  → 0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034 (Lido Holesky stETH)
 *   - others   → required as STETH_ADDRESS env var (or skip).
 *
 * Chainlink stETH/ETH feed addresses by network:
 *   - mainnet  → 0x86392dC19c0b719886221c78AB11eb8Cf5c52812
 *   - holesky  → (use mock or skip)
 *   - others   → required as STETH_CHAINLINK_FEED env var (or skip).
 */
const LST_WRAP_STETH = "LST_WRAP_STETH";
const LST_WRAP_PAUSED_ENV_KEYS = ["V2_LST_WRAP_MODULE_PAUSED", "V2_MODULES_DARK_LAUNCH"];

function stethAddressFor(networkName: string): string | undefined {
  switch (networkName) {
    case "mainnet":
      return "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
    case "holesky":
      return "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
    default:
      return process.env.STETH_ADDRESS;
  }
}

function chainlinkFeedAddressFor(networkName: string): string | undefined {
  switch (networkName) {
    case "mainnet":
      return "0x86392dC19c0b719886221c78AB11eb8Cf5c52812";
    case "holesky":
      // Holesky may not have stETH/ETH feed; use env var or skip
      return process.env.STETH_CHAINLINK_FEED;
    default:
      return process.env.STETH_CHAINLINK_FEED;
  }
}

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address} = ship;

  const routerAddress = await address(StakingRouter__factory);
  if (!routerAddress) throw new Error("StakingRouter not deployed");

  const stethAddress = stethAddressFor(hre.network.name);
  if (!stethAddress) {
    console.log(`  Skipping LSTWrapModule on network=${hre.network.name} (no stETH address configured)`);
    return;
  }

  const chainlinkFeedAddress = chainlinkFeedAddressFor(hre.network.name);
  if (!chainlinkFeedAddress) {
    console.log(`  Skipping LSTWrapModule on network=${hre.network.name} (no Chainlink feed address configured)`);
    return;
  }

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = getGovernanceSigner(ship);
  assertGovernanceSigner(ship, gov);
  const pauseAfterRegistration = readPauseAfterRegistration(hre, LST_WRAP_PAUSED_ENV_KEYS, "LSTWrapModule");
  const moduleId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(LST_WRAP_STETH));

  // Deploy the LST module pointing at the on-chain stETH token.
  const {contract: lstMod} = await deploy(LSTWrapModule__factory, {
    from: accounts.deployer,
    args: [routerAddress, moduleId, stethAddress, gov],
    log: true,
  });

  // Deploy the price oracle that round-trips through the canonical stETH contract.
  const {contract: priceOracle} = await deploy(StEthPriceOracle__factory, {
    from: accounts.deployer,
    args: [stethAddress, chainlinkFeedAddress],
    log: true,
  });

  // Wire price oracle on the module.
  console.log("  Setting price oracle on LSTWrapModule...");
  await lstMod.connect(govSigner).setPriceOracle(priceOracle.target as string);

  // Register with the router. Conservative initial cap.
  const router = await connect(StakingRouter__factory);
  const moduleType = await lstMod.moduleType();
  const moduleRuntimeCode = await hre.ethers.provider.getCode(lstMod.target as string);
  const moduleCodeHash = hre.ethers.keccak256(moduleRuntimeCode);
  if (!(await router.moduleCodeHashAllowed(moduleType, moduleCodeHash))) {
    console.log(`  Allowlisting LSTWrapModule code hash (${moduleCodeHash})...`);
    await router.connect(govSigner).setModuleCodeHashAllowed(moduleType, moduleCodeHash, true);
  }
  const existing = await router.modules(moduleId);
  if (existing.addr === "0x0000000000000000000000000000000000000000") {
    const cap = parseEther("1000");
    console.log(`  Registering LSTWrapModule with router (cap=${cap} wei)...`);
    await router.connect(govSigner).registerModule(moduleId, lstMod.target as string, cap);
  }
  await pauseModuleAfterRegistrationIfRequested(router, govSigner, moduleId, "LSTWrapModule", pauseAfterRegistration);
};

export default func;
func.tags = ["modular-staking", "lst-wrap"];
func.dependencies = ["staking-router"];
