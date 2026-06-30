/**
 * Template: Upgrading ValidatorModule to V2
 *
 * Copy this file, rename appropriately, and fill in the V2 contract.
 * Run: npx hardhat deploy --tags upgrade-validator-v2 --network <network>
 *
 * Requirements:
 * - New ValidatorModuleV2 contract compiled and available in types/
 * - Governance signer (GOV role) available
 * - Existing proxy address tracked in deployments/
 */
import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {ValidatorModule__factory} from "../../types";
import {getGovernanceSigner, assertGovernanceSigner} from "../../helpers/moduleDeployment";
import {resolveGovernanceAddress} from "../../helpers/governance";

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {accounts, address} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = getGovernanceSigner(ship);
  assertGovernanceSigner(ship, gov);

  const proxyAddress = await address(ValidatorModule__factory);
  if (!proxyAddress) throw new Error("ValidatorModule proxy not deployed — run 008_validatorModule first");

  // Replace "ValidatorModule" with the actual V2 contract name after copying this template.
  const ValidatorModuleV2Factory = await hre.ethers.getContractFactory(
    "ValidatorModule", // TODO: replace with "ValidatorModuleV2"
    govSigner,
  );

  console.log("  Upgrading ValidatorModule proxy at:", proxyAddress);
  const upgraded = await hre.upgrades.upgradeProxy(proxyAddress, ValidatorModuleV2Factory, {
    kind: "uups",
  });
  await upgraded.waitForDeployment();

  console.log("  ValidatorModule upgraded successfully at proxy:", proxyAddress);

  // Update the deployment artifact with the new implementation ABI if changed.
  const newArtifact = await hre.artifacts.readArtifact("ValidatorModule"); // TODO: use V2 name
  await hre.deployments.save("ValidatorModule", {
    address: proxyAddress,
    abi: newArtifact.abi,
  });
};

export default func;
func.tags = ["upgrade-validator-v2"];
// NO dependencies — this is a standalone upgrade script, not part of initial deploy.
