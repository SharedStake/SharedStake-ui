<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section
      class="relative gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl"
    >
      <span
        class="absolute p-1 px-3 text-sm font-bold text-gray-200 transform -translate-x-1/2 rounded-full opacity-95 left-1/2 -top-3 bg-brand-primary"
      >Deprecated Contracts</span>

      <div class="flex flex-col items-center justify-center">
        <header class="pb-3 my-4 text-center">
          <h1 class="text-3xl font-semibold">
            Withdraw from Deprecated Contracts
          </h1>
          <p class="text-sm text-gray-300 mt-2">
            Withdraw old deposits, then redeem returned vETH2 through the governed FIFO queue
          </p>
        </header>

        <!-- Explanation Box -->
        <div class="w-full p-4 mb-6 bg-blue-900 border border-blue-700 rounded-lg">
          <h3 class="mb-2 text-lg font-semibold text-blue-200">
            What does this page do?
          </h3>
          <p class="text-sm text-gray-200">
            This page helps you withdraw vETH2 tokens that you previously deposited into <strong>old, deprecated withdrawal contracts</strong>. 
            These contracts are no longer actively used, but your vETH2 may still be locked in them.
          </p>
          <p class="mt-2 text-sm text-gray-200">
            <strong>When you click "Withdraw vETH2":</strong> The contract will return your deposited vETH2 tokens to your wallet. 
            After withdrawal, request a redemption in the old-vETH2 FIFO queue below once governance has configured the queue address for this network.
          </p>
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          class="my-6"
        >
          <ImageVue
            :src="'loading.svg'"
            :size="'45px'"
          />
          <p class="mt-2 text-sm text-gray-300">
            Scanning deprecated contracts...
          </p>
        </div>

        <!-- Connect wallet prompt -->
        <ConnectButton v-if="!userConnectedWalletAddress" />

        <!-- Contract list -->
        <div
          v-else-if="!loading && deprecatedContracts.length > 0"
          class="w-full"
        >
          <p class="mb-4 text-sm font-semibold text-gray-300 text-center">
            Found {{ deprecatedContracts.length }} contract(s) with your deposits
          </p>

          <div
            v-for="(contract, index) in deprecatedContracts"
            :key="contract.address"
            class="p-4 mb-4 border border-gray-700 rounded-lg bg-gray-900"
          >
            <div class="flex flex-col gap-3">
              <div>
                <p class="text-sm font-semibold text-gray-400">
                  {{ contract.contractType === 'rollover' ? 'Rollover Contract' : `Deprecated Contract ${contract.deprecatedIndex || index + 1}` }}
                </p>
                <p class="text-xs text-gray-500 font-mono break-all">
                  {{ contract.address }}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <div v-if="hasDeposits(contract)">
                  <p class="text-sm text-gray-300">
                    Your Deposited vETH2:
                    <span class="font-semibold text-white text-lg">
                      {{ parseBN(contract.userDeposited) }} vETH2
                    </span>
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    You can withdraw this vETH2 now. Once it is in your wallet, use the queue below to request a governed FIFO redemption.
                  </p>
                </div>
              </div>

              <!-- Withdrawal button -->
              <div
                v-if="hasDeposits(contract)"
                class="flex flex-col gap-2 mt-3"
              >
                <dapp-tx-btn
                  :click="() => handleWithdrawVeth(contract)"
                >
                  <span>Withdraw {{ parseBN(contract.userDeposited) }} vETH2</span>
                </dapp-tx-btn>
                <p class="text-xs text-gray-400 text-center mt-1">
                  After withdrawal, request redemption in the old-vETH2 FIFO queue below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- No contracts found -->
        <div
          v-else-if="!loading && deprecatedContracts.length === 0"
          class="p-4 text-center text-gray-400"
        >
          <p>No vETH2 deposits found in deprecated contracts or rollover contract for your address.</p>
          <p class="text-sm mt-2">
            If you had deposits in old contracts, they may have already been withdrawn.
          </p>
        </div>

        <!-- Error state -->
        <div
          v-if="error"
          class="p-4 mt-4 text-center bg-red-900 border border-red-700 rounded-lg"
        >
          <p class="text-sm text-red-200">
            {{ error }}
          </p>
        </div>

        <!-- Old vETH2 FIFO queue -->
        <section class="w-full p-4 mt-6 border border-gray-700 rounded-lg bg-gray-900">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-100">
                Old vETH2 FIFO Redemption Queue
              </h2>
              <p class="mt-1 text-sm text-gray-400">
                Escrow returned vETH2, wait for guardian FIFO finalization, then claim ETH to your wallet.
              </p>
            </div>
            <div
              class="self-start rounded-full px-3 py-1 text-xs font-semibold"
              :class="oldQueue.deployed ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'"
            >
              {{ oldQueue.deployed ? 'Configured' : 'Awaiting governance config' }}
            </div>
          </div>

          <div
            v-if="oldQueue.loading"
            class="mt-4 text-sm text-gray-400"
          >
            Loading queue state...
          </div>

          <div
            v-else-if="!oldQueue.deployed"
            class="mt-4 rounded-lg border border-yellow-800 bg-yellow-950/40 p-3 text-sm text-yellow-100"
          >
            The old-vETH2 queue contract is included in this release. Mainnet requests become available here after governance deploys it, sets the redemption rate, funds finalization, and publishes the configured address.
          </div>

          <div
            v-else
            class="mt-4 flex flex-col gap-4"
          >
            <div class="grid gap-3 md:grid-cols-3">
              <div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
                <div class="text-xs uppercase text-gray-500">
                  Your vETH2
                </div>
                <div class="mt-1 font-mono text-sm text-gray-100">
                  {{ formatWei(oldQueue.veth2Balance) }}
                </div>
              </div>
              <div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
                <div class="text-xs uppercase text-gray-500">
                  Redemption rate
                </div>
                <div class="mt-1 font-mono text-sm text-gray-100">
                  {{ formatWei(oldQueue.redemptionRate) }} ETH / vETH2
                </div>
              </div>
              <div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
                <div class="text-xs uppercase text-gray-500">
                  Queue
                </div>
                <div class="mt-1 font-mono text-sm text-gray-100">
                  Next #{{ oldQueue.nextRequestId }} · Finalized #{{ oldQueue.lastFinalizedRequestId }}
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
              <label
                for="old-veth2-amount"
                class="mb-2 block text-sm font-semibold text-gray-200"
              >
                Request redemption
              </label>
              <div class="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  id="old-veth2-amount"
                  v-model="oldQueue.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.0"
                  class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none focus:border-pink-500"
                  @input="refreshOldVeth2Quote"
                >
                <button
                  type="button"
                  class="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:border-gray-400"
                  @click="setMaxOldVeth2"
                >
                  Max
                </button>
                <dapp-tx-btn
                  :click="handleRequestOldVeth2"
                  :disabled="!canRequestOldVeth2"
                >
                  <span>Request Redemption</span>
                </dapp-tx-btn>
              </div>
              <p class="mt-2 text-xs text-gray-400">
                Estimated ETH after finalization: {{ formatWei(oldQueue.quoteEth) }}
              </p>
              <p
                v-if="oldQueue.amountError"
                class="mt-2 text-xs text-red-300"
              >
                {{ oldQueue.amountError }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-200">
                  My queue requests
                </h3>
                <button
                  type="button"
                  class="text-xs text-blue-300 underline hover:text-blue-200"
                  @click="refreshOldVeth2Queue"
                >
                  Refresh
                </button>
              </div>

              <div
                v-if="oldQueue.requests.length === 0"
                class="text-sm text-gray-400"
              >
                No old-vETH2 queue requests found for this wallet.
              </div>

              <div
                v-for="req in oldQueue.requests"
                :key="req.id"
                class="mb-3 rounded-lg border border-gray-700 bg-gray-900 p-3 last:mb-0"
              >
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div class="text-sm font-semibold text-gray-100">
                      Request #{{ req.id }}
                    </div>
                    <div class="mt-1 text-xs text-gray-400">
                      {{ formatWei(req.vEth2Amount) }} vETH2 → {{ formatWei(req.ethAmount) }} ETH
                    </div>
                  </div>
                  <div
                    class="text-xs font-semibold"
                    :class="requestStatusClass(req)"
                  >
                    {{ requestStatus(req) }}
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <dapp-tx-btn
                    v-if="!req.finalized && !req.claimed && !req.canceled"
                    :click="() => handleCancelOldVeth2(req.id)"
                  >
                    <span>Cancel</span>
                  </dapp-tx-btn>
                  <dapp-tx-btn
                    v-if="req.finalized && !req.claimed && !req.canceled"
                    :click="() => handleClaimOldVeth2(req.id)"
                  >
                    <span>Claim ETH</span>
                  </dapp-tx-btn>
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="oldQueue.error"
            class="mt-3 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {{ oldQueue.error }}
          </p>
        </section>

        <!-- FAQ Section -->
        <DeprecatedWithdrawalsFAQ
          :user-total-deposited="userTotalDeposited"
          :total-veth2-staked="totalVeth2Staked"
          :total-eth-redeemed="totalEthRedeemed"
          :deprecated-contract-addresses="deprecatedContractAddresses"
          :rollover-contract-address="rolloverContractAddress"
          :rollover-veth2-input="rolloverVeth2Input"
          :rollover-eth-redeemed="rolloverEthRedeemed"
          :contract-details="contractDetails"
        />
      </div>
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { ethers } from "ethers";
import { useWalletStore } from "@/stores/wallet";
import ConnectButton from "@/components/Common/ConnectButton.vue";
import DappTxBtn from "@/components/Common/DappTxBtn.vue";
import ImageVue from "@/components/Handlers/ImageVue.vue";
import DeprecatedWithdrawalsFAQ from "./DeprecatedWithdrawalsFAQ.vue";
import { parseBN } from "@/utils/bignumber";
import {
  getDeprecatedWithdrawalsAddresses,
  createDeprecatedWithdrawalsContract,
  oldVeth2WithdrawalQueue,
  vEth2,
  rollovers,
  sgETH,
  addresses,
  ABIs,
} from "@/contracts";

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

// Virtual price constant for redemption calculations
const VIRTUAL_PRICE = BN('1.08');

export default {
  name: "WithdrawFromDeprecated",
  components: {
    ConnectButton,
    DappTxBtn,
    ImageVue,
    DeprecatedWithdrawalsFAQ,
  },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore,
    };
  },
  data() {
    return {
      loading: false,
      error: null,
      deprecatedContracts: [],
      totalVeth2Staked: BN(0),
      totalEthRedeemed: BN(0),
      calculatingTotals: false,
      deprecatedContractAddresses: [],
      rolloverContractAddress: null,
      rolloverVeth2Input: BN(0),
      rolloverEthRedeemed: BN(0),
      contractDetails: [],
      oldQueue: {
        loading: false,
        deployed: false,
        error: null,
        address: null,
        amount: "",
        amountError: null,
        quoteEth: "0",
        veth2Balance: "0",
        minWithdrawal: "0",
        maxWithdrawal: "0",
        redemptionRate: "0",
        nextRequestId: "1",
        lastFinalizedRequestId: "0",
        requests: [],
      },
    };
  },
  computed: {
    userConnectedWalletAddress() {
      return this.walletStore.userAddress;
    },
    userTotalDeposited() {
      if (!this.deprecatedContracts || this.deprecatedContracts.length === 0) {
        return BN(0);
      }
      return this.deprecatedContracts.reduce((total, contract) => {
        const deposited = contract?.userDeposited && BN.isBigNumber(contract.userDeposited) 
          ? contract.userDeposited 
          : BN(0);
        return total.plus(deposited);
      }, BN(0));
    },
    canRequestOldVeth2() {
      try {
        if (!this.userConnectedWalletAddress || !this.oldQueue.deployed || this.oldQueue.loading) return false;
        const amount = this.parseOldQueueAmount();
        if (amount <= 0n) return false;
        const min = BigInt(this.oldQueue.minWithdrawal || "0");
        const max = BigInt(this.oldQueue.maxWithdrawal || "0");
        const balance = BigInt(this.oldQueue.veth2Balance || "0");
        return amount >= min && amount <= max && amount <= balance && !this.oldQueue.amountError;
      } catch {
        return false;
      }
    },
  },
  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        if (address) {
          // Update addresses when wallet connects (provider should be ready)
          const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
          if (deprecatedAddresses && deprecatedAddresses.length > 0) {
            this.deprecatedContractAddresses = deprecatedAddresses;
          }
          await this.scanDeprecatedContracts();
          // Recalculate totals when wallet connects (provider should be ready now)
          await this.calculateTotals();
          await this.refreshOldVeth2Queue();
        } else {
          this.deprecatedContracts = [];
          this.oldQueue.requests = [];
          this.oldQueue.veth2Balance = "0";
        }
      },
    },
  },
  mounted: async function() {
    // Calculate totals on mount (works even if user isn't connected)
    // Wait a bit for provider to initialize, then retry if needed
    await this.waitForProviderAndCalculateTotals();
    await this.refreshOldVeth2Queue();
  },
  methods: {
    parseBN,
    formatWei(value, decimals = 6) {
      try {
        return BN(ethers.formatEther(BigInt(value || "0"))).decimalPlaces(decimals).toString();
      } catch {
        return "0";
      }
    },
    parseOldQueueAmount() {
      const raw = String(this.oldQueue.amount || "").trim();
      if (!raw) return 0n;
      return ethers.parseEther(raw);
    },
    requestStatus(req) {
      if (req.claimed) return "Claimed";
      if (req.canceled) return "Canceled";
      if (req.finalized) return "Ready to claim";
      return "Pending finalization";
    },
    requestStatusClass(req) {
      if (req.claimed) return "text-gray-400";
      if (req.canceled) return "text-red-300";
      if (req.finalized) return "text-green-300";
      return "text-yellow-300";
    },
    hasDeposits(contract) {
      return contract?.userDeposited && BN.isBigNumber(contract.userDeposited) && contract.userDeposited.gt(0);
    },
    setMaxOldVeth2() {
      this.oldQueue.amount = ethers.formatEther(BigInt(this.oldQueue.veth2Balance || "0"));
      this.refreshOldVeth2Quote();
    },

    async refreshOldVeth2Quote() {
      this.oldQueue.amountError = null;
      this.oldQueue.quoteEth = "0";

      let amount;
      try {
        amount = this.parseOldQueueAmount();
      } catch {
        this.oldQueue.amountError = "Enter a valid vETH2 amount.";
        return;
      }

      if (amount === 0n) return;

      try {
        const min = BigInt(this.oldQueue.minWithdrawal || "0");
        const max = BigInt(this.oldQueue.maxWithdrawal || "0");
        const balance = BigInt(this.oldQueue.veth2Balance || "0");
        if (min > 0n && amount < min) this.oldQueue.amountError = `Minimum request is ${this.formatWei(min)} vETH2.`;
        else if (max > 0n && amount > max) this.oldQueue.amountError = `Maximum request is ${this.formatWei(max)} vETH2.`;
        else if (amount > balance) this.oldQueue.amountError = "Amount exceeds your vETH2 balance.";

        const queue = oldVeth2WithdrawalQueue(false);
        if (queue) {
          this.oldQueue.quoteEth = (await queue.quoteEth(amount)).toString();
        }
      } catch (error) {
        console.warn("Old vETH2 quote failed:", error);
        this.oldQueue.amountError = "Unable to quote this request on the connected network.";
      }
    },

    async refreshOldVeth2Queue() {
      this.oldQueue.loading = true;
      this.oldQueue.error = null;

      try {
        const queue = oldVeth2WithdrawalQueue(false);
        const token = vEth2(false);
        if (!queue) {
          this.oldQueue.deployed = false;
          this.oldQueue.address = null;
          this.oldQueue.requests = [];
          return;
        }

        this.oldQueue.deployed = true;
        this.oldQueue.address = await queue.getAddress();

        const [
          minWithdrawal,
          maxWithdrawal,
          redemptionRate,
          nextRequestId,
          lastFinalizedRequestId,
        ] = await Promise.all([
          queue.minWithdrawal().catch(() => 0n),
          queue.maxWithdrawal().catch(() => 0n),
          queue.redemptionRate().catch(() => 0n),
          queue.nextRequestId().catch(() => 1n),
          queue.lastFinalizedRequestId().catch(() => 0n),
        ]);

        this.oldQueue.minWithdrawal = minWithdrawal.toString();
        this.oldQueue.maxWithdrawal = maxWithdrawal.toString();
        this.oldQueue.redemptionRate = redemptionRate.toString();
        this.oldQueue.nextRequestId = nextRequestId.toString();
        this.oldQueue.lastFinalizedRequestId = lastFinalizedRequestId.toString();

        if (token && this.userConnectedWalletAddress) {
          this.oldQueue.veth2Balance = (await token.balanceOf(this.userConnectedWalletAddress)).toString();
          this.oldQueue.requests = await this.fetchOldVeth2Requests(queue, this.userConnectedWalletAddress);
        } else {
          this.oldQueue.veth2Balance = "0";
          this.oldQueue.requests = [];
        }

        await this.refreshOldVeth2Quote();
      } catch (error) {
        console.error("Old vETH2 queue refresh failed:", error);
        this.oldQueue.error = "Failed to load the old-vETH2 queue on this network.";
      } finally {
        this.oldQueue.loading = false;
      }
    },

    async fetchOldVeth2Requests(queue, owner) {
      const ids = new Set();

      try {
        const filter = queue.filters.WithdrawalRequested(null, owner);
        const latestBlock = await queue.runner?.provider?.getBlockNumber?.();
        const fromBlock =
          typeof latestBlock === "number" ? Math.max(0, latestBlock - 50_000) : undefined;
        const events = await queue.queryFilter(filter, fromBlock, latestBlock);
        for (const event of events) {
          const id = event.args?.requestId ?? event.args?.[2];
          if (id != null) ids.add(Number(id));
        }
      } catch (error) {
        console.warn("Old vETH2 event lookup failed; falling back to bounded request scan:", error);
      }

      const next = Number(this.oldQueue.nextRequestId || "1");
      const from = Math.max(1, next - 500);
      for (let id = from; id < next; id++) ids.add(id);

      const requests = [];
      const ownerLower = owner.toLowerCase();
      for (const id of Array.from(ids).sort((a, b) => a - b)) {
        try {
          const req = await queue.getRequest(id);
          if (req.owner && req.owner.toLowerCase() === ownerLower) {
            requests.push({
              id,
              owner: req.owner,
              vEth2Amount: req.vEth2Amount.toString(),
              ethAmount: req.ethAmount.toString(),
              requestedAt: req.requestedAt.toString(),
              finalized: req.finalized,
              claimed: req.claimed,
              canceled: req.canceled,
            });
          }
        } catch {
          /* ignore missing/reverted request reads */
        }
      }
      return requests;
    },

    handleRequestOldVeth2() {
      return {
        abiCall: async (txOptions = {}) => {
          const queue = oldVeth2WithdrawalQueue(true);
          const token = vEth2(true);
          if (!queue || !token) throw new Error("Old vETH2 queue or vETH2 token is not available");

          const amount = this.parseOldQueueAmount();
          const queueAddress = await queue.getAddress();
          const allowance = await token.allowance(this.userConnectedWalletAddress, queueAddress);
          if (allowance < amount) {
            const approveTx = await token.approve(queueAddress, amount, txOptions);
            await approveTx.wait();
          }

          return queue.requestWithdrawal(amount, txOptions);
        },
        argsArr: [],
        cb: async () => {
          this.oldQueue.amount = "";
          await this.refreshOldVeth2Queue();
          await this.calculateTotals();
        },
      };
    },

    handleCancelOldVeth2(requestId) {
      return {
        abiCall: async (txOptions = {}) => {
          const queue = oldVeth2WithdrawalQueue(true);
          if (!queue) throw new Error("Old vETH2 queue is not available");
          return queue.cancelWithdrawal(requestId, txOptions);
        },
        argsArr: [],
        cb: async () => {
          await this.refreshOldVeth2Queue();
        },
      };
    },

    handleClaimOldVeth2(requestId) {
      return {
        abiCall: async (txOptions = {}) => {
          const queue = oldVeth2WithdrawalQueue(true);
          if (!queue) throw new Error("Old vETH2 queue is not available");
          return queue.claimWithdrawal(requestId, txOptions);
        },
        argsArr: [],
        cb: async () => {
          await this.refreshOldVeth2Queue();
        },
      };
    },

    async waitForProviderAndCalculateTotals(retries = 5, delay = 500) {
      for (let i = 0; i < retries; i++) {
        try {
          const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
          if (deprecatedAddresses && deprecatedAddresses.length > 0) {
            // Update component data with addresses for reactivity
            this.deprecatedContractAddresses = deprecatedAddresses;
            const vEth2Contract = vEth2();
            if (vEth2Contract) {
              // Provider seems ready, calculate totals
              await this.calculateTotals();
              return;
            }
          }
        } catch (error) {
          console.warn(`Attempt ${i + 1} to calculate totals failed:`, error);
        }
        
        // Wait before retrying
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // If all retries failed, try one more time (might work now)
      // Also update addresses one more time
      const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
      if (deprecatedAddresses && deprecatedAddresses.length > 0) {
        this.deprecatedContractAddresses = deprecatedAddresses;
      }
      await this.calculateTotals();
    },

    async scanDeprecatedContracts() {
      this.loading = true;
      this.error = null;
      this.deprecatedContracts = [];

      try {
        const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
        let deprecatedResults = [];

        // Check deprecated contracts if they exist
        if (deprecatedAddresses && deprecatedAddresses.length > 0) {
          const contractPromises = deprecatedAddresses.map(async (address, index) => {
            try {
              const contract = createDeprecatedWithdrawalsContract(address, false);
              if (!contract) {
                return null;
              }

              // Check user deposits
              let userDeposited = BN(0);
              try {
                const userEntries = await contract.userEntries(
                  this.userConnectedWalletAddress
                );
                userDeposited = userEntries?.[0]
                  ? BN(userEntries[0].toString())
                  : BN(0);
              } catch (err) {
                // Contract might not have userEntries method or user has no deposits
                if (err.code !== "BAD_DATA") {
                  console.warn(
                    `Error checking user deposits for ${address}:`,
                    err
                  );
                }
              }

              // Only include contracts where user has deposits
              if (userDeposited.gt(0)) {
                return {
                  address,
                  contract,
                  userDeposited,
                  contractType: 'deprecated',
                  deprecatedIndex: index + 1, // Track deprecated contract number separately
                };
              }
              return null;
            } catch (error) {
              console.error(`Error scanning contract ${address}:`, error);
              return null;
            }
          });

          const results = await Promise.all(contractPromises);
          deprecatedResults = results.filter((r) => r !== null);
        }

        // Always check rollover contract for user deposits (even if no deprecated contracts)
        let rolloverResult = null;
        try {
          let rolloverContract = rollovers(false);
          let rolloverAddress = null;
          
          // If rollovers() returns null, try to get address directly and create contract manually
          if (!rolloverContract) {
            console.warn("Rollover contract factory returned null, attempting to get address directly");
            if (addresses && addresses.rollovers) {
              rolloverAddress = addresses.rollovers;
              console.log("Found rollover address in addresses:", rolloverAddress);
              // Try to create contract instance manually using rollovers ABI
              try {
                const { ethers } = await import('ethers');
                if (window.ethereum && ABIs && ABIs.rollovers) {
                  const provider = new ethers.BrowserProvider(window.ethereum);
                  rolloverContract = new ethers.Contract(rolloverAddress, ABIs.rollovers, provider);
                  console.log("Manually created rollover contract instance");
                }
              } catch (manualCreateError) {
                console.warn("Failed to manually create rollover contract:", manualCreateError);
              }
            } else {
              console.warn("Rollover contract address not found in addresses object");
            }
          } else {
            // Get address from contract instance
            try {
              rolloverAddress = await rolloverContract.getAddress();
            } catch (addressError) {
              console.warn("Error getting rollover contract address:", addressError);
            }
          }
          
          if (rolloverContract && rolloverAddress) {
            console.log("Checking rollover contract for user deposits:", rolloverAddress);
            
            let userDeposited = BN(0);
            try {
              const userEntries = await rolloverContract.userEntries(
                this.userConnectedWalletAddress
              );
              userDeposited = userEntries?.[0]
                ? BN(userEntries[0].toString())
                : BN(0);
              console.log("Rollover contract user deposits:", parseBN(userDeposited));
            } catch (err) {
              // Contract might not have userEntries method or user has no deposits
              if (err.code !== "BAD_DATA") {
                console.warn(
                  `Error checking user deposits for rollover contract:`,
                  err
                );
              }
            }

            // Include rollover contract if user has deposits
            if (userDeposited.gt(0)) {
              rolloverResult = {
                address: rolloverAddress,
                contract: rolloverContract,
                userDeposited,
                contractType: 'rollover',
              };
              console.log("Rollover contract added to results with deposits:", parseBN(userDeposited));
            } else {
              console.log("Rollover contract has no user deposits");
            }
          } else {
            console.warn("Rollover contract not available - cannot check for user deposits");
          }
        } catch (error) {
          console.warn("Error scanning rollover contract:", error);
        }

        // Combine deprecated and rollover contracts
        this.deprecatedContracts = [...deprecatedResults];
        if (rolloverResult) {
          this.deprecatedContracts.push(rolloverResult);
        }

        // Set error only if no contracts found at all
        if (this.deprecatedContracts.length === 0) {
          if (!deprecatedAddresses || deprecatedAddresses.length === 0) {
            // No deprecated contracts configured and no rollover deposits found
            this.error = "No deprecated contracts configured and no deposits found in rollover contract.";
          }
          // If deprecated contracts exist but none have deposits, error is already handled by UI
        }
      } catch (error) {
        console.error("Error scanning deprecated contracts:", error);
        this.error = "Failed to scan deprecated contracts. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    async calculateTotals() {
      // Prevent concurrent calls
      if (this.calculatingTotals) {
        return;
      }
      
      this.calculatingTotals = true;
      try {
        const vEth2Contract = vEth2();
        if (!vEth2Contract) {
          console.warn("vETH2 contract not available for totals calculation - provider may not be initialized");
          return;
        }

        const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
        if (!deprecatedAddresses || deprecatedAddresses.length === 0) {
          console.warn("No deprecated contract addresses found");
          return;
        }
        
        // Update component data with addresses for reactivity
        this.deprecatedContractAddresses = deprecatedAddresses;

        let totalVeth2 = BN(0);
        let totalRedeemed = BN(0);

        // Calculate totals for ALL deprecated contracts (not just user deposits)
        const totalPromises = deprecatedAddresses.map(async (address, index) => {
          try {
            // Get vETH2 balance of the contract
            let veth2BN = BN(0);
            try {
              const veth2Bal = await vEth2Contract.balanceOf(address);
              veth2BN = BN(veth2Bal.toString());
            } catch (err) {
              console.warn(`Error getting vETH2 balance for ${address}:`, err);
            }
            
            // Get totalOut (total ETH redeemed) from the contract
            let totalOutBN = BN(0);
            let ethBalanceBN = BN(0);
            const contract = createDeprecatedWithdrawalsContract(address, false);
            if (contract) {
              try {
                const totalOut = await contract.totalOut();
                totalOutBN = BN(totalOut.toString());
              } catch (err) {
                // Contract might not have totalOut method - this is OK for old contracts
                if (err.code !== "BAD_DATA" && err.code !== "CALL_EXCEPTION" && err.code !== "UNPREDICTABLE_GAS_LIMIT") {
                  console.warn(`Error getting totalOut for ${address}:`, err);
                }
              }
            } else {
              console.warn(`Could not create contract instance for ${address}`);
            }

            // Get ETH balance of the contract
            try {
              if (window.ethereum) {
                const ethBal = await window.ethereum.request({
                  method: "eth_getBalance",
                  params: [address, "latest"],
                });
                ethBalanceBN = BN(ethBal);
              }
            } catch (err) {
              console.warn(`Error getting ETH balance for ${address}:`, err);
            }

            // Calculate redeemable amount (vETH2 * 1.08 - redeemed)
            const redeemableBN = veth2BN.multipliedBy(VIRTUAL_PRICE).minus(totalOutBN);
            
            return { 
              address,
              name: `Deprecated Contract ${index + 1}`,
              veth2: veth2BN, 
              redeemed: totalOutBN,
              ethBalance: ethBalanceBN,
              redeemable: redeemableBN.gt(0) ? redeemableBN : BN(0),
            };
          } catch (error) {
            console.error(`Error calculating totals for ${address}:`, error);
            return { 
              address,
              name: `Deprecated Contract ${index + 1}`,
              veth2: BN(0), 
              redeemed: BN(0),
              ethBalance: BN(0),
              redeemable: BN(0),
            };
          }
        });

        const totals = await Promise.all(totalPromises);
        totalVeth2 = totals.reduce((sum, t) => sum.plus(t.veth2), BN(0));
        totalRedeemed = totals.reduce((sum, t) => sum.plus(t.redeemed), BN(0));

        // Store contract details for table display
        const contractDetailsList = [...totals];

        // Calculate rollover contract totals
        let rolloverAddress = null;
        let rolloverVeth2InputBN = BN(0);
        let rolloverEthRedeemedBN = BN(0);
        let rolloverEthBalanceBN = BN(0);
        let rolloverSgEthBalanceBN = BN(0);
        try {
          const rolloverContract = rollovers(false);
          if (rolloverContract) {
            try {
              // Get rollover contract address
              rolloverAddress = await rolloverContract.getAddress();
              this.rolloverContractAddress = rolloverAddress;

              // Get vETH2 balance (total input) of rollover contract
              try {
                const rolloverVeth2Bal = await vEth2Contract.balanceOf(rolloverAddress);
                rolloverVeth2InputBN = BN(rolloverVeth2Bal.toString());
                this.rolloverVeth2Input = rolloverVeth2InputBN;
                // Add rollover contract vETH2 to total vETH2 staked
                totalVeth2 = totalVeth2.plus(rolloverVeth2InputBN);
              } catch (err) {
                console.warn("Error getting rollover contract vETH2 balance:", err);
                this.rolloverVeth2Input = BN(0);
              }

              // Add rollover contract totalOut to total ETH redeemed
              try {
                const rolloverTotalOut = await rolloverContract.totalOut();
                rolloverEthRedeemedBN = BN(rolloverTotalOut.toString());
                totalRedeemed = totalRedeemed.plus(rolloverEthRedeemedBN);
                this.rolloverEthRedeemed = rolloverEthRedeemedBN;
              } catch (err) {
                // Rollover contract might not have totalOut method or might fail - this is OK
                if (err.code !== "BAD_DATA" && err.code !== "CALL_EXCEPTION" && err.code !== "UNPREDICTABLE_GAS_LIMIT") {
                  console.warn("Error getting rollover contract totalOut:", err);
                }
                this.rolloverEthRedeemed = BN(0);
              }

              // Get ETH balance of rollover contract
              try {
                if (window.ethereum) {
                  const ethBal = await window.ethereum.request({
                    method: "eth_getBalance",
                    params: [rolloverAddress, "latest"],
                  });
                  rolloverEthBalanceBN = BN(ethBal);
                }
              } catch (err) {
                console.warn("Error getting rollover contract ETH balance:", err);
              }

              // Get sgETH balance (for rollover contract, output token is sgETH)
              try {
                const sgETHContract = sgETH();
                if (sgETHContract) {
                  const sgEthBal = await sgETHContract.balanceOf(rolloverAddress);
                  rolloverSgEthBalanceBN = BN(sgEthBal.toString());
                }
              } catch (err) {
                console.warn("Error getting rollover contract sgETH balance:", err);
              }

              // Calculate redeemable amount for rollover (vETH2 * 1.08 - redeemed)
              const rolloverRedeemableBN = rolloverVeth2InputBN.multipliedBy(VIRTUAL_PRICE).minus(rolloverEthRedeemedBN);

              // Add rollover contract to contract details
              if (rolloverAddress) {
                contractDetailsList.push({
                  address: rolloverAddress,
                  name: "Rollover Contract",
                  veth2: rolloverVeth2InputBN,
                  redeemed: rolloverEthRedeemedBN,
                  ethBalance: rolloverEthBalanceBN,
                  sgEthBalance: rolloverSgEthBalanceBN,
                  redeemable: rolloverRedeemableBN.gt(0) ? rolloverRedeemableBN : BN(0),
                });
              }
            } catch (err) {
              console.warn("Error getting rollover contract address:", err);
              this.rolloverContractAddress = null;
              this.rolloverVeth2Input = BN(0);
              this.rolloverEthRedeemed = BN(0);
            }
          } else {
            this.rolloverContractAddress = null;
            this.rolloverVeth2Input = BN(0);
            this.rolloverEthRedeemed = BN(0);
          }
        } catch (error) {
          console.warn("Error accessing rollover contract:", error);
          this.rolloverContractAddress = null;
          this.rolloverVeth2Input = BN(0);
          this.rolloverEthRedeemed = BN(0);
        }

        this.contractDetails = contractDetailsList;
        this.totalVeth2Staked = totalVeth2;
        this.totalEthRedeemed = totalRedeemed;
      } catch (error) {
        console.error("Error calculating totals:", error);
        // Set to zero on error so UI shows 0 instead of undefined
        this.totalVeth2Staked = BN(0);
        this.totalEthRedeemed = BN(0);
        this.rolloverContractAddress = null;
        this.rolloverVeth2Input = BN(0);
        this.rolloverEthRedeemed = BN(0);
        this.contractDetails = [];
      } finally {
        this.calculatingTotals = false;
      }
    },

    handleWithdrawVeth(contractData) {
      return {
        abiCall: async (...args) => {
          let contract;
          
          // Use appropriate contract instance based on contract type
          if (contractData.contractType === 'rollover') {
            contract = rollovers(true);
          } else {
            contract = createDeprecatedWithdrawalsContract(
              contractData.address,
              true
            );
          }
          
          if (!contract) {
            throw new Error("Contract not available");
          }
          
          // Deprecated contracts and rollover contracts may have different methods
          // Try common withdrawal methods in order
          const methods = ['withdraw', 'requestRedeem'];
          
          for (const methodName of methods) {
            try {
              if (contract[methodName]) {
                return await contract[methodName](...args);
              }
            } catch (error) {
              // If method doesn't exist or call fails, try next method
              if (error.code === "CALL_EXCEPTION" || error.code === "BAD_DATA") {
                continue;
              }
              // For other errors, throw immediately
              throw error;
            }
          }
          
          throw new Error("Contract does not support withdrawal. Please check contract methods on Etherscan.");
        },
        argsArr: [],
        cb: async () => {
          await this.scanDeprecatedContracts();
          await this.calculateTotals();
        },
      };
    },
  },
};
</script>

<style scoped>
/* Component styles */
</style>
