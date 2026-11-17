let {DeployHelper} = require("./deploy_utils.js");
let secrets = require("../secrets.js");

async function main() {
  deployer = new ethers.Wallet(secrets.MAINNET_PRIVATE_KEY, ethers.provider);
  let address = deployer.address;
  let dh = new DeployHelper(network.name, address);
  await dh.init(address);

  // Args:
  /** 
  string memory _name,
  string memory _symbol,
  uint256 _price, // Price of each NFT in ETH, 1 ETH = 1e18 or 1 followed by 18 0s
  uint256 _maxSupply, // max supply of the nfts
  uint256 _maxPerMint, // max no. of nfts a user can mint in a single tx. also max they can mint into 1 wallet
  address _artist // artist address
  **/
  await dh.deployContract("MintableNFTSale", "MintableNFTSale", [
    "SharedSteak",
    "STEAK",
    "20000000000000000",
    200,
    20,
    "0x713f723aD1d3EeA7174f0733b50265a41A40aa29",
  ]);
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
