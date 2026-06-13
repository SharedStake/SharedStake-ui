import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {StakingRouter__factory, WithdrawalQueueV2__factory} from "../types";
import {
  allowlistModuleCodeHash,
  assertGovernanceSigner,
  getGovernanceSigner,
  grantNodeOperatorRole,
  readMintCapWei,
  readPauseAfterRegistration,
  registerOrUpdateModule,
  resolveBeaconDeposit,
  wireWithdrawalCredentials,
} from "../helpers/moduleDeployment";
import {resolveGovernanceAddress, resolveNodeOperatorAddress} from "../helpers/governance";

const DVT_MINT_CAP_ENV_KEYS = ["V2_DVT_MINT_CAP_ETH"];
const DVT_PAUSED_ENV_KEYS = ["V2_DVT_MODULE_PAUSED", "V2_MODULES_DARK_LAUNCH"];

/**
 * Deploys the DVTModule (Distributed Validator Technology variant) as a UUPS proxy.
 * Mirrors 008_validatorModule.ts deploy pattern but uses DVTModule contract and
 * DVT_VALIDATOR_1 moduleId. Does NOT set as default (solo validator remains default).
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
  const mintCapWei = readMintCapWei(hre, DVT_MINT_CAP_ENV_KEYS, isLocal, "DVT");
  const beaconDeposit = await resolveBeaconDeposit(hre, ship);
  const pauseAfterRegistration = readPauseAfterRegistration(hre, DVT_PAUSED_ENV_KEYS, "DVTModule");

  const moduleId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DVT_VALIDATOR_1"));

  // Deploy DVTModule as UUPS proxy (idempotent)
  const existingDVT = await hre.deployments.getOrNull("DVTModule");

  let proxyAddress: string;
  if (existingDVT) {
    console.log("  DVTModule already deployed at:", existingDVT.address);
    proxyAddress = existingDVT.address;
  } else {
    const Factory = await hre.ethers.getContractFactory("DVTModule", accounts.deployer);
    const proxy = await hre.upgrades.deployProxy(Factory, [routerAddress, moduleId, gov, beaconDeposit], {
      kind: "uups",
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    proxyAddress = await proxy.getAddress();

    const artifact = await hre.artifacts.readArtifact("DVTModule");
    await hre.deployments.save("DVTModule", {
      address: proxyAddress,
      abi: artifact.abi,
      transactionHash: proxy.deploymentTransaction()?.hash,
    });
    console.log("  DVTModule deployed (UUPS proxy) at:", proxyAddress);
  }

  // Connect using ethers signer (DVTModule__factory not available until typechain regenerates)
  const DVTModuleArtifact = await hre.artifacts.readArtifact("DVTModule");
  const dvtModule = new hre.ethers.Contract(proxyAddress, DVTModuleArtifact.abi, accounts.deployer) as any;

  await grantNodeOperatorRole(dvtModule, govSigner, nodeOperator, "DVTModule");

  const router = await connect(StakingRouter__factory);
  const moduleType = await dvtModule.moduleType();
  const moduleRuntimeCode = await hre.ethers.provider.getCode(proxyAddress);
  const moduleCodeHash = hre.ethers.keccak256(moduleRuntimeCode);
  await allowlistModuleCodeHash(router, moduleType, moduleCodeHash, govSigner, "DVTModule");
  await registerOrUpdateModule(router, govSigner, moduleId, proxyAddress, mintCapWei, "DVTModule", {
    pauseAfterRegistration,
    guardianSigner: govSigner,
  });

  const withdrawalQueueAddress = await address(WithdrawalQueueV2__factory);
  if (!withdrawalQueueAddress) throw new Error("WithdrawalQueueV2 not deployed");
  await wireWithdrawalCredentials(dvtModule, govSigner, withdrawalQueueAddress);
};

export default func;
func.tags = ["modular-staking", "dvt-module"];
func.dependencies = ["staking-router", "withdrawalQueueV2"];
