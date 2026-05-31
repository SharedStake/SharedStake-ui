import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {
  DVTModule__factory,
  StakingRouter__factory,
  WithdrawalQueueV2__factory,
} from "../../types";
import {
  allowlistModuleCodeHash,
  assertGovernanceSigner,
  getGovernanceSigner,
  grantNodeOperatorRole,
  readMintCapWei,
  registerOrUpdateModule,
  resolveBeaconDeposit,
  wireWithdrawalCredentials,
} from "../helpers/moduleDeployment";
import {resolveGovernanceAddress, resolveNodeOperatorAddress} from "../helpers/governance";

const DVT_MINT_CAP_ENV_KEYS = ["V2_DVT_MINT_CAP_ETH"];

/**
 * Deploys the DVTModule (Distributed Validator Technology variant).
 * Mirrors the ValidatorModule deploy but uses DVTModule contract and
 * DVT_VALIDATOR_1 moduleId. Does NOT set as default (solo validator remains default).
 *
 * Clustered deposits are supported by current module logic; higher threshold
 * multi-operator execution remains intentionally guarded by module-level checks.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address, hre: hardhat} = ship;
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

  const moduleId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DVT_VALIDATOR_1"));

  const {contract: dvtModule} = await deploy(DVTModule__factory, {
    from: accounts.deployer,
    args: [routerAddress, moduleId, gov, beaconDeposit],
    log: true,
  });

  await grantNodeOperatorRole(dvtModule, govSigner, nodeOperator, "DVTModule");

  const router = await connect(StakingRouter__factory);
  const moduleType = await dvtModule.moduleType();
  const moduleRuntimeCode = await hre.ethers.provider.getCode(dvtModule.target as string);
  const moduleCodeHash = hre.ethers.keccak256(moduleRuntimeCode);
  await allowlistModuleCodeHash(router, moduleType, moduleCodeHash, govSigner, "DVTModule");
  await registerOrUpdateModule(
    router,
    govSigner,
    moduleId,
    dvtModule.target as string,
    mintCapWei,
    "DVTModule",
  );

  const withdrawalQueueAddress = await address(WithdrawalQueueV2__factory);
  if (!withdrawalQueueAddress) throw new Error("WithdrawalQueueV2 not deployed");
  await wireWithdrawalCredentials(dvtModule, govSigner, withdrawalQueueAddress);
};

export default func;
func.tags = ["modular-staking", "dvt-module"];
func.dependencies = ["staking-router", "withdrawalQueue"];
