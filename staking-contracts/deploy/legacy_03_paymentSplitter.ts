import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {PaymentSplitter__factory, WSGETH, WSGETH__factory} from "../types";

const func: DeployFunction = async hre => {
  const {deploy, connect, accounts} = await Ship.init(hre);

  const wsgEth = (await connect(WSGETH__factory)) as WSGETH;
  const multiSig = hre.network.tags.hardhat ? accounts.multiSig.address : "0x610c92c70eb55dfeafe8970513d13771da79f2e0";

  await deploy(PaymentSplitter__factory, {
    args: [
      [accounts.deployer.address, multiSig, wsgEth.target],
      [60, 30, 910],
    ],
  });
};

export default func;
func.tags = ["paymentSplitter"];
func.dependencies = ["wsgEth"];
