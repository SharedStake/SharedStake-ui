import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {MockERC20__factory, OldVeth2WithdrawalQueue__factory} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";

const LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);
const ONE_ETH = "1000000000000000000";

function resolveRedemptionRate(networkName: string): string {
  const rate = process.env.V2_OLD_VETH2_REDEMPTION_RATE ?? process.env.OLD_VETH2_REDEMPTION_RATE;
  if (rate) return rate;
  if (LOCAL_NETWORKS.has(networkName)) return ONE_ETH;
  throw new Error("Missing V2_OLD_VETH2_REDEMPTION_RATE for old vEth2 withdrawal queue deployment");
}

/**
 * Deploys the standalone FIFO queue for legacy vEth2 redemptions.
 *
 * Non-local deployments require:
 *   - V2_OLD_VETH2_ADDRESS
 *   - V2_OLD_VETH2_REDEMPTION_RATE, scaled by 1e18
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {accounts, deploy} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);
  const redemptionRate = resolveRedemptionRate(hre.network.name);
  if (BigInt(redemptionRate) <= 0n) {
    throw new Error("V2_OLD_VETH2_REDEMPTION_RATE must be greater than zero");
  }

  let vEth2Address = process.env.V2_OLD_VETH2_ADDRESS ?? process.env.OLD_VETH2_ADDRESS ?? process.env.VETH2_ADDRESS;

  if (!vEth2Address && LOCAL_NETWORKS.has(hre.network.name)) {
    const {address: mockVeth2Address} = await deploy(MockERC20__factory, {
      from: accounts.deployer,
      args: ["Mock old vEth2", "mvETH2"],
      aliasName: "OldVeth2Mock",
      log: true,
    });
    vEth2Address = mockVeth2Address;
  }

  if (!vEth2Address) {
    throw new Error("Missing V2_OLD_VETH2_ADDRESS for old vEth2 withdrawal queue deployment");
  }

  await deploy(OldVeth2WithdrawalQueue__factory, {
    from: accounts.deployer,
    args: [vEth2Address, redemptionRate, gov],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "oldVeth2WithdrawalQueue"];
