import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {StakingRouter__factory, ValidatorModule__factory, WithdrawalQueueV2__factory} from "../types";
import type {ValidatorModule} from "../types";
import {
  allowlistModuleCodeHash,
  assertGovernanceSigner,
  enableCodeHashAllowlistEnforcement,
  getGovernanceSigner,
  grantNodeOperatorRole,
  readMintCapWei,
  readPauseAfterRegistration,
  registerOrUpdateModule,
  resolveBeaconDeposit,
  wireWithdrawalCredentials,
} from "../helpers/moduleDeployment";
import {resolveGovernanceAddress, resolveNodeOperatorAddress} from "../helpers/governance";

const VALIDATOR_MINT_CAP_ENV_KEYS = ["V2_VALIDATOR_MINT_CAP_ETH"];
const VALIDATOR_PAUSED_ENV_KEYS = ["V2_VALIDATOR_MODULE_PAUSED", "V2_MODULES_DARK_LAUNCH"];

/**
 * Deploys the solo-validator ValidatorModule, registers it with the StakingRouter,
 * and sets it as the default route for `submit()` calls.
 *
 * Beacon-deposit-contract address is selected per-network:
 *   - mainnet/hoodi → 0x00000000219ab540356cBB839Cbe05303d7705Fa (canonical)
 *   - holesky       → 0x4242424242424242424242424242424242424242
 *   - hardhat/local → dedicated MockBeaconDeposit deployed by this script
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {connect, accounts, address, hre: hardhat} = ship;
  const networkName = hardhat.network.name;
  const isLocal = hardhat.network.tags.hardhat || networkName === "localhost";

  const routerAddress = await address(StakingRouter__factory);
  if (!routerAddress) throw new Error("StakingRouter not deployed");

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = getGovernanceSigner(ship);
  assertGovernanceSigner(ship, gov);
  const nodeOperator = resolveNodeOperatorAddress(gov);
  const mintCapWei = readMintCapWei(hre, VALIDATOR_MINT_CAP_ENV_KEYS, isLocal, "validator");
  const beaconDeposit = await resolveBeaconDeposit(hre, ship);
  const pauseAfterRegistration = readPauseAfterRegistration(hre, VALIDATOR_PAUSED_ENV_KEYS, "ValidatorModule");

  // Use a deterministic moduleId derived from a human-readable label so off-chain
  // tooling can compute it without needing a deployment artifact.
  const moduleId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("SOLO_VALIDATOR_1"));

  // Deploy ValidatorModule as UUPS proxy (idempotent)
  const existingVM = await hre.deployments.getOrNull("ValidatorModule");

  let proxyAddress: string;
  if (existingVM) {
    console.log("  ValidatorModule already deployed at:", existingVM.address);
    proxyAddress = existingVM.address;
  } else {
    const Factory = await hre.ethers.getContractFactory("ValidatorModule", accounts.deployer);
    const proxy = await hre.upgrades.deployProxy(Factory, [routerAddress, moduleId, gov, beaconDeposit], {
      kind: "uups",
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    proxyAddress = await proxy.getAddress();

    const artifact = await hre.artifacts.readArtifact("ValidatorModule");
    await hre.deployments.save("ValidatorModule", {
      address: proxyAddress,
      abi: artifact.abi,
      transactionHash: proxy.deploymentTransaction()?.hash,
    });
    console.log("  ValidatorModule deployed (UUPS proxy) at:", proxyAddress);
  }

  const validatorModule: ValidatorModule = ValidatorModule__factory.connect(proxyAddress, accounts.deployer);

  await grantNodeOperatorRole(validatorModule, govSigner, nodeOperator, "ValidatorModule");

  // Register with the router. mintCapEth = 0 means unlimited (MVP); production
  // deployments should set a sane risk budget here.
  const router = await connect(StakingRouter__factory);
  const moduleType = await validatorModule.moduleType();
  const moduleRuntimeCode = await hre.ethers.provider.getCode(proxyAddress);
  const moduleCodeHash = hre.ethers.keccak256(moduleRuntimeCode);
  await allowlistModuleCodeHash(router, moduleType, moduleCodeHash, govSigner, "ValidatorModule");
  await enableCodeHashAllowlistEnforcement(router, govSigner);
  await registerOrUpdateModule(
    router,
    govSigner,
    moduleId,
    proxyAddress,
    mintCapWei,
    "ValidatorModule",
    {setDefault: true, verify: true, pauseAfterRegistration, guardianSigner: govSigner},
  );

  const withdrawalQueueAddress = await address(WithdrawalQueueV2__factory);
  if (!withdrawalQueueAddress) throw new Error("WithdrawalQueueV2 not deployed");
  await wireWithdrawalCredentials(validatorModule, govSigner, withdrawalQueueAddress);
};

export default func;
func.tags = ["modular-staking", "validator-module"];
func.dependencies = ["staking-router", "withdrawalQueueV2"];
