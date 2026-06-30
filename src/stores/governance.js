/**
 * Pinia store for SharedStake V2 Governance
 * (VoteEscrowV2 + SharedStakeGovernor + GovernanceTimelock)
 */
import { defineStore } from "pinia";
import { ethers } from "ethers";
import { useWalletStore } from "./wallet";

import voteEscrowV2ABI from "@/contracts/abis/voteEscrowV2.json";
import sharedStakeGovernorABI from "@/contracts/abis/sharedStakeGovernor.json";
import sgtABI from "@/contracts/abis/erc20.json";

import mainnetAddresses from "@/contracts/addresses/mainnet.json";
import sepoliaAddresses from "@/contracts/addresses/sepolia.json";
import localAddresses from "@/contracts/addresses/local.json";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
];

const ADDRESS_BOOK = {
  "0x1": mainnetAddresses,
  "0xaa36a7": sepoliaAddresses,
  "0x7a69": localAddresses,
  "0x539": localAddresses,
};

function normalizeChainId(id) {
  if (!id && id !== 0) return "";
  if (typeof id === "bigint") return "0x" + id.toString(16);
  if (typeof id === "number") return "0x" + id.toString(16);
  if (typeof id === "string" && !id.toLowerCase().startsWith("0x"))
    return "0x" + parseInt(id, 10).toString(16);
  return id.toLowerCase();
}

function getAddresses(chainId) {
  const cid = normalizeChainId(chainId);
  const source = ADDRESS_BOOK[cid];
  if (!source) return null;
  return {
    voteEscrowV2: source.voteEscrowV2 || source.veSGT || ZERO_ADDR,
    sharedStakeGovernor: source.sharedStakeGovernor || ZERO_ADDR,
    governanceTimelock: source.governanceTimelock || ZERO_ADDR,
    sgtV2: source.sgtV2 || source.SGT || ZERO_ADDR,
  };
}

export const useGovernanceStore = defineStore("governance", {
  state: () => ({
    chainId: null,
    connected: false,
    loading: false,
    error: null,

    // VoteEscrowV2
    veSGTBalance: "0",
    projectedVeSGTBalance: "0",
    lockedAmount: "0",
    lockedStart: "0",
    lockedEnd: "0",
    lockRemaining: "0",
    lockDuration: "0",
    checkpointedLockPower: "0",
    maxLockPower: "0",
    minLockedAmount: "0",
    minLockDays: "0",
    maxLockDays: "0",
    earlyWithdrawPenaltyRate: "0",

    // VoteEscrowV2 aggregate stats
    totalLockedAmount: "0",
    openLockCount: "0",
    totalLocksCreated: "0",
    totalActiveLockCommitment: "0",
    averageLockDuration: "0",
    checkpointedVotingSupply: "0",
    maxVotingSupply: "0",

    // Governor
    quorum: "0",
    votingDelay: "0",
    votingPeriod: "0",
    proposalThreshold: "0",

    // SGT
    sgtBalance: "0",
    sgtAllowance: "0",

    proposals: [],

    contractsDeployed: false,
  }),

  getters: {
    formattedVeSGT: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.veSGTBalance)).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
    formattedProjectedVeSGT: (state) => {
      try {
        return parseFloat(
          ethers.formatEther(state.projectedVeSGTBalance),
        ).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
    formattedLocked: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.lockedAmount)).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
    formattedSGT: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.sgtBalance)).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
    formattedTotalLocked: (state) => {
      try {
        return parseFloat(
          ethers.formatEther(state.totalLockedAmount),
        ).toLocaleString(undefined, { maximumFractionDigits: 2 });
      } catch {
        return "0";
      }
    },
    formattedCheckpointedVotingSupply: (state) => {
      try {
        return parseFloat(
          ethers.formatEther(state.checkpointedVotingSupply),
        ).toLocaleString(undefined, { maximumFractionDigits: 2 });
      } catch {
        return "0";
      }
    },
    lockExpired: (state) => {
      try {
        return Date.now() / 1000 > Number(state.lockedEnd);
      } catch {
        return false;
      }
    },
    lockTimeRemaining: (state) => {
      try {
        const remaining =
          Number(state.lockedEnd) - Math.floor(Date.now() / 1000);
        return remaining > 0 ? remaining : 0;
      } catch {
        return 0;
      }
    },
  },

  actions: {
    _getContracts() {
      const walletStore = useWalletStore();
      let provider = walletStore.ethersProvider;
      if (!provider && typeof window !== "undefined" && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        walletStore.setEthersProvider(provider);
      }
      if (!provider) return null;

      const chainId = this.chainId || walletStore.network;
      const addresses = getAddresses(chainId);
      if (!addresses) return null;

      const allDeployed = Object.values(addresses).every(
        (a) => a !== ZERO_ADDR,
      );
      this.contractsDeployed = allDeployed;
      if (!allDeployed) return null;

      const make = (abi, addr) => new ethers.Contract(addr, abi, provider);
      const makeSigned = async (abi, addr) => {
        try {
          const signer = await provider.getSigner();
          return new ethers.Contract(addr, abi, signer);
        } catch {
          throw new Error("Wallet not connected");
        }
      };

      return { addresses, make, makeSigned };
    },

    async _withTx(fn) {
      this.loading = true;
      this.error = null;
      try {
        const result = await fn();
        const walletStore = useWalletStore();
        await this.init(this.chainId, walletStore.address);
        return result;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async init(chainId, userAddress) {
      this.chainId = chainId;
      this.connected = !!userAddress;

      const ctx = this._getContracts();
      if (!ctx) return;

      const { addresses, make } = ctx;
      try {
        const ve = make(voteEscrowV2ABI, addresses.voteEscrowV2);
        const gov = make(sharedStakeGovernorABI, addresses.sharedStakeGovernor);
        const sgt = make(sgtABI, addresses.sgtV2);

        if (ve) {
          this.minLockedAmount = (await ve.minLockedAmount()).toString();
          this.minLockDays = (await ve.MINDAYS()).toString();
          this.maxLockDays = (await ve.MAXDAYS()).toString();
          this.earlyWithdrawPenaltyRate = (
            await ve.earlyWithdrawPenaltyRate()
          ).toString();

          try {
            const globalStats = await ve.globalLockStats();
            this.totalLockedAmount = globalStats.lockedAmount.toString();
            this.openLockCount = globalStats.openLocks.toString();
            this.totalLocksCreated = globalStats.locksCreated.toString();
            this.totalActiveLockCommitment =
              globalStats.activeLockCommitment.toString();
            this.averageLockDuration = globalStats.averageDuration.toString();
            this.checkpointedVotingSupply =
              globalStats.checkpointedVotingSupply.toString();
            this.maxVotingSupply = globalStats.maxVotingSupply.toString();
          } catch (err) {
            console.warn(
              "GovernanceStore: failed to read global lock stats",
              err,
            );
          }

          if (userAddress) {
            const stats = await ve.getLockStats(userAddress);
            this.lockedAmount = stats.amount.toString();
            this.lockedStart = stats.start.toString();
            this.lockedEnd = stats.end.toString();
            this.lockRemaining = stats.remaining.toString();
            this.lockDuration = stats.lockDuration.toString();
            this.projectedVeSGTBalance = stats.currentVotingPower.toString();
            this.checkpointedLockPower =
              stats.checkpointedVotingPower.toString();
            this.maxLockPower = stats.maxVotingPower.toString();
            this.veSGTBalance = (await ve.balanceOf(userAddress)).toString();
          } else {
            this.lockedAmount = "0";
            this.lockedStart = "0";
            this.lockedEnd = "0";
            this.lockRemaining = "0";
            this.lockDuration = "0";
            this.projectedVeSGTBalance = "0";
            this.checkpointedLockPower = "0";
            this.maxLockPower = "0";
            this.veSGTBalance = "0";
          }
        }

        if (gov) {
          this.votingDelay = (await gov.votingDelay()).toString();
          this.votingPeriod = (await gov.votingPeriod()).toString();
          this.proposalThreshold = (await gov.proposalThreshold()).toString();
          // quorum takes blockNumber param
          try {
            const walletStore2 = useWalletStore();
            const providerRef = walletStore2.ethersProvider;
            const block = await providerRef.getBlockNumber();
            this.quorum = (await gov.quorum(block)).toString();
          } catch (err) {
            console.warn("GovernanceStore: failed to read quorum", err);
          }
          await this.loadProposals();
        }

        if (sgt && userAddress) {
          this.sgtBalance = (await sgt.balanceOf(userAddress)).toString();
          this.sgtAllowance = (
            await sgt.allowance(userAddress, addresses.voteEscrowV2)
          ).toString();
        }
      } catch (e) {
        console.error("GovernanceStore.init error:", e);
        this.error = e.message;
      }
    },

    async loadProposals() {
      const ctx = this._getContracts();
      if (!ctx) return [];

      const { addresses, make } = ctx;
      const walletStore = useWalletStore();
      const provider = walletStore.ethersProvider;
      if (!provider) return [];

      try {
        const gov = make(sharedStakeGovernorABI, addresses.sharedStakeGovernor);
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(latestBlock - 10000, 0);
        const events = await gov.queryFilter(
          gov.filters.ProposalCreated(),
          fromBlock,
          latestBlock,
        );

        const proposals = await Promise.all(
          events.map(async (event) => {
            const args = event.args;
            const proposalId = args.proposalId.toString();
            let stateValue = null;
            let stateLabel = "Unknown";
            try {
              stateValue = Number(await gov.state(args.proposalId));
              stateLabel = PROPOSAL_STATES[stateValue] || "Unknown";
            } catch (err) {
              console.warn(
                "GovernanceStore: failed to read proposal state",
                proposalId,
                err,
              );
            }

            return {
              proposalId,
              proposer: args.proposer,
              targets: Array.from(args.targets || []),
              values: Array.from(args.values || []).map((v) => v.toString()),
              calldatas: Array.from(args.calldatas || []),
              voteStart: args.voteStart?.toString?.() || "0",
              voteEnd: args.voteEnd?.toString?.() || "0",
              description: args.description || "",
              state: stateValue,
              stateLabel,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            };
          }),
        );

        this.proposals = proposals.sort(
          (a, b) => b.blockNumber - a.blockNumber,
        );
        return this.proposals;
      } catch (e) {
        console.error("GovernanceStore.loadProposals error:", e);
        this.error = e.message;
        return [];
      }
    },

    async createProposal(description, targets, values, calldatas) {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const gov = await makeSigned(
          sharedStakeGovernorABI,
          addresses.sharedStakeGovernor,
        );

        const cleanDescription = String(description || "").trim();
        if (!cleanDescription)
          throw new Error("Proposal description is required");
        if (
          !Array.isArray(targets) ||
          !Array.isArray(values) ||
          !Array.isArray(calldatas)
        ) {
          throw new Error("Proposal actions must be arrays");
        }
        if (
          targets.length === 0 ||
          targets.length !== values.length ||
          targets.length !== calldatas.length
        ) {
          throw new Error(
            "Proposal action arrays must be non-empty and the same length",
          );
        }

        const normalizedTargets = targets.map((target) => {
          if (!ethers.isAddress(target))
            throw new Error(`Invalid target address: ${target}`);
          return target;
        });
        const normalizedValues = values.map((value) => {
          const parsed = BigInt(String(value || "0"));
          if (parsed < 0n) throw new Error(`Invalid proposal value: ${value}`);
          return parsed;
        });
        const normalizedCalldatas = calldatas.map((data) => {
          const value = String(data || "0x").trim();
          if (!ethers.isHexString(value))
            throw new Error(`Invalid calldata: ${value}`);
          return value;
        });

        const tx = await gov.propose(
          normalizedTargets,
          normalizedValues,
          normalizedCalldatas,
          cleanDescription,
        );
        await tx.wait();
        await this.loadProposals();
        return tx;
      });
    },

    async castVote(proposalId, support) {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const gov = await makeSigned(
          sharedStakeGovernorABI,
          addresses.sharedStakeGovernor,
        );
        const vote = Number(support);
        if (![0, 1, 2].includes(vote)) throw new Error("Invalid vote option");

        const tx = await gov.castVote(BigInt(proposalId), vote);
        await tx.wait();
        await this.loadProposals();
        return tx;
      });
    },
    async lockSGT(amountStr, days) {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);
        const sgt = await makeSigned(sgtABI, addresses.sgtV2);

        const amount = ethers.parseEther(amountStr);

        // Approve if needed
        const allowance = await sgt.allowance(
          await sgt.runner.getAddress(),
          addresses.voteEscrowV2,
        );
        if (allowance < amount) {
          const approveTx = await sgt.approve(addresses.voteEscrowV2, amount);
          await approveTx.wait();
        }

        const tx = await ve.create_lock(amount, days);
        await tx.wait();
        return tx;
      });
    },

    async increaseLockAmount(amountStr) {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);
        const sgt = await makeSigned(sgtABI, addresses.sgtV2);
        const amount = ethers.parseEther(amountStr);
        const signerAddress = await sgt.runner.getAddress();

        const allowance = await sgt.allowance(
          signerAddress,
          addresses.voteEscrowV2,
        );
        if (allowance < amount) {
          const approveTx = await sgt.approve(addresses.voteEscrowV2, amount);
          await approveTx.wait();
        }

        const tx = await ve.increase_amount(amount);
        await tx.wait();
        return tx;
      });
    },

    async extendLockDays(days) {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);
        const tx = await ve.increase_unlock_time(days);
        await tx.wait();
        return tx;
      });
    },

    async checkpointVeSGT() {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);
        const signerAddress = await ve.runner.getAddress();
        const tx = await ve.checkpoint(signerAddress);
        await tx.wait();
        return tx;
      });
    },

    async withdrawVeSGT() {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);

        const tx = await ve.withdraw();
        await tx.wait();
        return tx;
      });
    },

    async emergencyWithdrawVeSGT() {
      return this._withTx(async () => {
        const ctx = this._getContracts();
        if (!ctx) throw new Error("Governance contracts not available");

        const { addresses, makeSigned } = ctx;
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2);

        const tx = await ve.emergencyWithdraw();
        await tx.wait();
        return tx;
      });
    },
  },
});
