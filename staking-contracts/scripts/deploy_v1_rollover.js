let {DeployHelper} = require("./deploy_utils.js");
let secrets = require("../secrets.js");

async function main() {
  deployer = new ethers.Wallet(secrets.GOERLIPK, ethers.provider);
  let address = deployer.address;
  let dh = new DeployHelper(network.name, address);
  await dh.init(address);

  let params = {
    vETH2Addr: "",
    virtualPrice: 1100029257982616200,
    sgEthAddr: "",
  };

  await dh.deployContract("Withdrawals", "Withdrawals", [params.vETH2Addr, params.virtualPrice]);

  await dh.deployContract("Rollover", "Rollover", [params.vETH2Addr, params.sgEthAddr, params.virtualPrice]);
  await dh.postRun();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// Goerli test at: https://goerli.etherscan.io/address/0x1d6A21dF197Ae3fdABd310DEC04198e580CEbd4D#code
