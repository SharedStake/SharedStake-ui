import {HardhatUserConfig, subtask, task, types} from "hardhat/config";
// import {node_url, accounts, verifyKey} from "./utils/network";
import {removeConsoleLog} from "hardhat-preprocessor";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-watcher";
import "hardhat-storage-layout";
import "dotenv/config";
import "hardhat-contract-sizer";
import * as fs from "fs";

import "./tasks/verify";

// Environment sourced variables
const GOERLIPK = process.env.GOERLIPK
  ? process.env.GOERLIPK
  : "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // default pk 0 from anvil

// const ALCHEMY_GOERLI_KEY = process.env.ALCHEMY_GOERLI_KEY
//   ? process.env.ALCHEMY_GOERLI_KEY
//   : console.log("Please export a ALCHEMY_GOERLI_KEY for alchemy api access");
// const GOERLI_RPC_URL = `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_GOERLI_KEY}`;

const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
  || (ALCHEMY_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined);

// Guard: refuse to use the public Anvil test key for mainnet deployments.
const _isMainnetRun = process.argv.some(a => a === "mainnet") || process.env.HARDHAT_NETWORK === "mainnet";
if (_isMainnetRun && !process.env.MAINNET_PRIVATE_KEY) {
  throw new Error(
    "MAINNET_PRIVATE_KEY is not set. Refusing to deploy to mainnet with the public Anvil test key.\n" +
    "Export MAINNET_PRIVATE_KEY=<your deployer private key> before running.",
  );
}
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY ?? GOERLIPK;
// Your API key for Etherscan
// Obtain one at https://etherscan.io/
const ETHERSCAN_API = process.env.ETHERSCAN_API ? process.env.ETHERSCAN_API : false;

const ALCHEMY_SEPOLIA_KEY = process.env.ALCHEMY_SEPOLIA_KEY ? process.env.ALCHEMY_SEPOLIA_KEY : "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
  ? process.env.SEPOLIA_RPC_URL
  : `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_SEPOLIA_KEY}`;

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY ? process.env.SEPOLIA_PRIVATE_KEY : GOERLIPK;

// For test/local: GOERLIPK (public Anvil key). For any real network: the env-var-derived key.
const ACTIVE_DEPLOYER_PK = _isMainnetRun ? MAINNET_PRIVATE_KEY : GOERLIPK;

// END required user input

const path = require("path");

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  sepolia: 11155111, // hex: 0xaa36a7
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
let maxRunsOnEtherscan = 1000000;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// final exported hardhat config
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      tags: ["hardhat"],
      ...(MAINNET_RPC_URL ? { forking: { url: MAINNET_RPC_URL } } : {}),
    },
    localhost: {
      accounts: [`0x${GOERLIPK}`],
    },
    ...(MAINNET_RPC_URL ? {
      mainnet: {
        url: MAINNET_RPC_URL,
        accounts: [`0x${MAINNET_PRIVATE_KEY}`],
        chainId: chainIds.mainnet,
      },
    } : {}),
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${SEPOLIA_PRIVATE_KEY}`],
      chainId: chainIds.sepolia,
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 50,
    enabled: true,
    src: "./contracts",
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  namedAccounts: {
    deployer: `privatekey://0x${ACTIVE_DEPLOYER_PK}`,
    multiSig: 1,
    alice: 3,
    bob: 4,
  },
  preprocess: {
    eachLine: removeConsoleLog(hre => hre.network.name !== "hardhat" && hre.network.name !== "localhost"),
  },
};

if (ETHERSCAN_API) {
  config["etherscan"] = {
    apiKey: {
      ethereum: ETHERSCAN_API,
      mainnet: ETHERSCAN_API,
      sepolia: ETHERSCAN_API,
    },
    customChains: [
      {
        network: "sepolia",
        chainId: chainIds.sepolia,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
    ],
  };
} else {
  console.log("No Etherscan API key found. Skipping Etherscan verification.");
}

function getSortedFiles(dependenciesGraph: any) {
  const tsort = require("tsort");
  const graph = tsort();

  const filesMap: Record<string, any> = {};
  const resolvedFiles = dependenciesGraph.getResolvedFiles();
  resolvedFiles.forEach((f: any) => (filesMap[f.sourceName] = f));

  for (const [from, deps] of dependenciesGraph.entries()) {
    for (const to of deps) {
      graph.add(to.sourceName, from.sourceName);
    }
  }

  const topologicalSortedNames = graph.sort();

  // If an entry has no dependency it won't be included in the graph, so we
  // add them and then dedup the array
  const withEntries: string[] = topologicalSortedNames.concat(resolvedFiles.map((f: any) => f.sourceName as string));

  const sortedNames = [...new Set(withEntries)];
  return sortedNames.map((n: string) => filesMap[n]);
}

function getFileWithoutImports(resolvedFile: any) {
  const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm;

  return resolvedFile.content.rawContent.replace(IMPORT_SOLIDITY_REGEX, "").trim();
}

subtask("flat:get-flattened-sources", "Returns all contracts and their dependencies flattened")
  .addOptionalParam("files", undefined, undefined, types.any)
  .addOptionalParam("output", undefined, undefined, types.string)
  .setAction(async ({files, output}, {run}) => {
    const dependencyGraph = await run("flat:get-dependency-graph", {files});
    console.log(dependencyGraph);

    let flattened = "";

    if (dependencyGraph.getResolvedFiles().length === 0) {
      return flattened;
    }

    const sortedFiles = getSortedFiles(dependencyGraph);

    let isFirst = true;
    for (const file of sortedFiles) {
      if (!isFirst) {
        flattened += "\n";
      }
      flattened += `// File ${file.getVersionedName()}\n`;
      flattened += `${getFileWithoutImports(file)}\n`;

      isFirst = false;
    }

    // Remove every line started with "// SPDX-License-Identifier:"
    flattened = flattened.replace(/SPDX-License-Identifier:/gm, "License-Identifier:");

    flattened = `// SPDX-License-Identifier: MIXED\n\n${flattened}`;

    // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
    flattened = flattened.replace(/pragma experimental ABIEncoderV2;\n/gm, (i => (m: string) => (!i++ ? m : ""))(0));

    flattened = flattened.trim();
    if (output) {
      console.log("Writing to", output);
      fs.writeFileSync(output, flattened);
      return "";
    }
    return flattened;
  });

subtask("flat:get-dependency-graph")
  .addOptionalParam("files", undefined, undefined, types.any)
  .setAction(async ({files}, {run}) => {
    const sourcePaths =
      files === undefined
        ? await run("compile:solidity:get-source-paths")
        : files.map((f: string) => fs.realpathSync(f));

    const sourceNames = await run("compile:solidity:get-source-names", {
      sourcePaths,
    });

    const dependencyGraph = await run("compile:solidity:get-dependency-graph", {sourceNames});

    return dependencyGraph;
  });

task("flat", "Flattens and prints contracts and their dependencies")
  .addOptionalVariadicPositionalParam("files", "The files to flatten", undefined, types.inputFile)
  .addOptionalParam("output", "Specify the output file", undefined, types.string)
  .setAction(async ({files, output}, {run}) => {
    console.log(files, output);
    console.log(
      await run("flat:get-flattened-sources", {
        files,
        output,
      }),
    );
  });

task("flattenAll", "Flatten all files we care about").setAction(async ({}, {run}) => {
  let srcpath = "contracts";
  let files = fs.readdirSync(srcpath).map(file => `${srcpath}/${file}`);
  srcpath = `${srcpath}/governance`;
  files = files.concat(fs.readdirSync(srcpath).map(file => `${srcpath}/${file}`));

  try {
    fs.mkdirSync("flats/contracts/governance", {recursive: true});
  } catch (e) {}

  await Promise.all(
    files.map(async file => {
      if (path.extname(file) == ".sol") {
        await run("flat:get-flattened-sources", {
          files: [file],
          output: `./flats/${file}`,
        });
      }
    }),
  );
});

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = config;
