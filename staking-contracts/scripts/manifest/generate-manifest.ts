/**
 * Deployment manifest generator (Gate 6).
 *
 * Reads the existing hardhat-deploy artifacts in `deployments/<network>/`
 * and emits a compact, human-readable manifest at
 * `deployments/<network>/manifest.json`.
 *
 * Run with:
 *   npx hardhat run scripts/manifest/generate-manifest.ts --network <network>
 *
 * The output manifest schema:
 *   {
 *     network:     string,
 *     chainId:     number,
 *     gitCommit:   string,
 *     generatedAt: string (ISO-8601),
 *     compiler: {
 *       version:  string,                    // e.g. "0.8.20+commit.a1b79de6"
 *       settings: { optimizer: { enabled, runs } }
 *     },
 *     contracts: [
 *       {
 *         name:            string,
 *         address:         string,
 *         deployer:        string,
 *         constructorArgs: unknown[],
 *         txHash:          string
 *       },
 *       ...
 *     ]
 *   }
 *
 * NOTE: hardhat-deploy artifacts store constructor args under `args`,
 * the deployment tx under `transactionHash`, the deployer EOA under
 * `receipt.from`, and the JSON-stringified solc metadata blob under
 * `metadata`. We unpack `metadata` to recover compiler.version and
 * settings.optimizer.
 */

import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {network} from "hardhat";

interface HardhatDeployArtifact {
  address: string;
  args?: unknown[];
  transactionHash?: string;
  receipt?: {
    from?: string;
    contractAddress?: string;
    transactionHash?: string;
  };
  metadata?: string;
}

interface ManifestContract {
  name: string;
  address: string;
  deployer: string;
  constructorArgs: unknown[];
  txHash: string;
}

interface CompilerInfo {
  version: string;
  settings: {
    optimizer: {
      enabled: boolean;
      runs: number;
    };
  };
}

interface DeploymentManifest {
  network: string;
  chainId: number;
  gitCommit: string;
  generatedAt: string;
  compiler: CompilerInfo;
  contracts: ManifestContract[];
}

const DEFAULT_COMPILER: CompilerInfo = {
  version: "unknown",
  settings: {optimizer: {enabled: true, runs: 200}},
};

const getGitCommit = (): string => {
  try {
    return execSync("git rev-parse HEAD", {encoding: "utf8"}).trim();
  } catch (err) {
    console.warn(`  warn: could not read git commit (${(err as Error).message})`);
    return "unknown";
  }
};

const parseCompilerFromMetadata = (metadata: string | undefined): CompilerInfo | undefined => {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata) as {
      compiler?: {version?: string};
      settings?: {optimizer?: {enabled?: boolean; runs?: number}};
    };
    const version = parsed.compiler?.version;
    const optimizer = parsed.settings?.optimizer;
    if (!version || !optimizer) return undefined;
    return {
      version,
      settings: {
        optimizer: {
          enabled: optimizer.enabled === true,
          runs: typeof optimizer.runs === "number" ? optimizer.runs : 200,
        },
      },
    };
  } catch (err) {
    console.warn(`  warn: failed to parse artifact metadata (${(err as Error).message})`);
    return undefined;
  }
};

const readArtifact = (filePath: string): HardhatDeployArtifact | undefined => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as HardhatDeployArtifact;
  } catch (err) {
    console.warn(`  warn: skipping ${filePath} (${(err as Error).message})`);
    return undefined;
  }
};

const collectArtifacts = (networkDir: string): {name: string; artifact: HardhatDeployArtifact}[] => {
  if (!fs.existsSync(networkDir)) {
    throw new Error(`Deployments directory not found: ${networkDir}`);
  }

  const entries = fs
    .readdirSync(networkDir, {withFileTypes: true})
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    // hardhat-deploy uses `.migrations.json` as bookkeeping — skip it.
    .filter(e => e.name !== ".migrations.json")
    .map(e => e.name)
    .sort();

  const out: {name: string; artifact: HardhatDeployArtifact}[] = [];
  for (const file of entries) {
    const full = path.join(networkDir, file);
    const artifact = readArtifact(full);
    if (!artifact || typeof artifact.address !== "string") continue;
    out.push({name: path.basename(file, ".json"), artifact});
  }
  return out;
};

async function main(): Promise<void> {
  const networkName = network.name;
  const chainId = Number(network.config.chainId ?? 0);

  const repoRoot = path.resolve(__dirname, "..", "..");
  const networkDir = path.join(repoRoot, "deployments", networkName);
  const outFile = path.join(networkDir, "manifest.json");

  console.log(`\nGenerating deployment manifest for network "${networkName}" (chainId ${chainId})`);
  console.log(`  reading artifacts from: ${networkDir}`);

  const artifacts = collectArtifacts(networkDir);
  if (artifacts.length === 0) {
    throw new Error(`No deployment artifacts found in ${networkDir}`);
  }

  // Pull compiler info from the first artifact that has parseable metadata.
  let compiler: CompilerInfo = DEFAULT_COMPILER;
  for (const {artifact} of artifacts) {
    const parsed = parseCompilerFromMetadata(artifact.metadata);
    if (parsed) {
      compiler = parsed;
      break;
    }
  }

  const contracts: ManifestContract[] = artifacts.map(({name, artifact}) => {
    const deployer = artifact.receipt?.from ?? "0x0000000000000000000000000000000000000000";
    const txHash = artifact.transactionHash ?? artifact.receipt?.transactionHash ?? "0x";
    const args = Array.isArray(artifact.args) ? artifact.args : [];
    return {
      name,
      address: artifact.address,
      deployer,
      constructorArgs: args,
      txHash,
    };
  });

  const manifest: DeploymentManifest = {
    network: networkName,
    chainId,
    gitCommit: getGitCommit(),
    generatedAt: new Date().toISOString(),
    compiler,
    contracts,
  };

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`\nManifest written: ${outFile}`);
  console.log(`  compiler:    ${manifest.compiler.version}`);
  console.log(`  optimizer:   enabled=${manifest.compiler.settings.optimizer.enabled} runs=${manifest.compiler.settings.optimizer.runs}`);
  console.log(`  gitCommit:   ${manifest.gitCommit}`);
  console.log(`  generatedAt: ${manifest.generatedAt}`);
  console.log(`\nContracts (${manifest.contracts.length}):`);
  for (const c of manifest.contracts) {
    console.log(`  - ${c.name.padEnd(28)} ${c.address}`);
  }
  console.log("");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
