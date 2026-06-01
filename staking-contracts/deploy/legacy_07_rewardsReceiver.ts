import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  PaymentSplitter,
  PaymentSplitter__factory,
  RewardsReceiver__factory,
  SgETH,
  SgETH__factory,
  SharedDepositMinterV2,
  SharedDepositMinterV2__factory,
  WSGETH,
  WSGETH__factory,
  WithdrawalQueue,
  WithdrawalQueue__factory,
} from "../types";

function makeWithdrawalCred(addr: string): string {
  const withdrawalCredsPrefix = "0x010000000000000000000000";
  return `${withdrawalCredsPrefix}${addr.replace(/^0x/i, "").toLowerCase()}`;
}

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect} = ship;

  const sgEth = (await connect(SgETH__factory)) as SgETH;
  const wsgEth = (await connect(WSGETH__factory)) as WSGETH;
  const paymentSplitter = (await connect(PaymentSplitter__factory)) as PaymentSplitter;
  const minter = (await connect(SharedDepositMinterV2__factory)) as SharedDepositMinterV2;
  const withdrawalQueue = (await connect(WithdrawalQueue__factory)) as WithdrawalQueue;

  const owner = (ship.accounts.multiSig ?? ship.accounts.deployer).address;
  await deploy(RewardsReceiver__factory, {
    args: [withdrawalQueue.target, [sgEth.target, wsgEth.target, paymentSplitter.target, minter.target], owner],
  });

  const rr = await connect(RewardsReceiver__factory);
  // setWithdrawalCredential requires NOR role; NOR is granted to govSigner in minter constructor.
  const govSigner = ship.accounts.multiSig ?? ship.accounts.deployer;
  await minter.connect(govSigner).setWithdrawalCredential(makeWithdrawalCred(rr.target as string));
};

export default func;
func.tags = ["rewardsReceiver"];
func.dependencies = ["sgEth", "wsgEth", "paymentSplitter", "minter", "withdrawalQueue"];
