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
          <p class="text-sm text-gray-300">
            Check and withdraw ETH from deprecated withdrawals contracts
          </p>
        </header>

        <!-- Loading state -->
        <div v-if="loading" class="my-6">
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
        <div v-else-if="!loading && deprecatedContracts.length > 0" class="w-full">
          <p class="mb-4 text-sm font-semibold text-gray-300 text-center">
            Found {{ deprecatedContracts.length }} deprecated contract(s)
          </p>

          <div
            v-for="(contract, index) in deprecatedContracts"
            :key="contract.address"
            class="p-4 mb-4 border border-gray-700 rounded-lg bg-gray-900"
          >
            <div class="flex flex-col gap-3">
              <div>
                <p class="text-sm font-semibold text-gray-400">
                  Contract {{ index + 1 }}
                </p>
                <p class="text-xs text-gray-500 font-mono break-all">
                  {{ contract.address }}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <div>
                  <p class="text-sm text-gray-300">
                    ETH Balance:
                    <span class="font-semibold text-white">
                      {{ parseBN(contract.ethBalance) }} ETH
                    </span>
                  </p>
                </div>

                <div v-if="contract.userDeposited.gt(0)">
                  <p class="text-sm text-gray-300">
                    Your Deposited vETH2:
                    <span class="font-semibold text-white">
                      {{ parseBN(contract.userDeposited) }} vETH2
                    </span>
                  </p>
                </div>

                <div v-if="contract.userDeposited.gt(0) && contract.ethBalance.gt(0)">
                  <p class="text-sm text-green-400 font-semibold">
                    ? Funds available for withdrawal
                  </p>
                </div>

                <div v-else-if="contract.userDeposited.gt(0) && contract.ethBalance.eq(0)">
                  <p class="text-sm text-yellow-400 font-semibold">
                    ? You have deposits but contract has no ETH available
                  </p>
                </div>

                <div v-else-if="contract.userDeposited.eq(0)">
                  <p class="text-sm text-gray-400">
                    No deposits found for your address
                  </p>
                </div>
              </div>

              <!-- Withdrawal buttons -->
              <div
                v-if="contract.userDeposited.gt(0)"
                class="flex flex-col gap-2 mt-2"
              >
                <dapp-tx-btn
                  v-if="contract.ethBalance.gt(0)"
                  :disabled="!contract.canRedeem"
                  :click="() => handleRedeemEth(contract)"
                >
                  <span>Redeem ETH</span>
                </dapp-tx-btn>

                <dapp-tx-btn
                  :click="() => handleWithdrawVeth(contract)"
                >
                  <span>Withdraw vETH2</span>
                </dapp-tx-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- No contracts found -->
        <div
          v-else-if="!loading && deprecatedContracts.length === 0"
          class="p-4 text-center text-gray-400"
        >
          <p>No deprecated contracts found or no funds available.</p>
        </div>

        <!-- Error state -->
        <div
          v-if="error"
          class="p-4 mt-4 text-center bg-red-900 border border-red-700 rounded-lg"
        >
          <p class="text-sm text-red-200">{{ error }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { useWalletStore } from "@/stores/wallet";
import ConnectButton from "@/components/Common/ConnectButton.vue";
import DappTxBtn from "@/components/Common/DappTxBtn.vue";
import ImageVue from "@/components/Handlers/ImageVue.vue";
import {
  getDeprecatedWithdrawalsAddresses,
  createDeprecatedWithdrawalsContract,
} from "@/contracts";

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "WithdrawFromDeprecated",
  components: {
    ConnectButton,
    DappTxBtn,
    ImageVue,
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
    };
  },
  computed: {
    userConnectedWalletAddress() {
      return this.walletStore.userAddress;
    },
  },
  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        if (address) {
          await this.scanDeprecatedContracts();
        } else {
          this.deprecatedContracts = [];
        }
      },
    },
  },
  methods: {
    parseBN(n) {
      return n
        .div(10 ** 18)
        .decimalPlaces(6)
        .toString();
    },

    async scanDeprecatedContracts() {
      this.loading = true;
      this.error = null;
      this.deprecatedContracts = [];

      try {
        const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();

        if (!deprecatedAddresses || deprecatedAddresses.length === 0) {
          this.error = "No deprecated contracts configured.";
          this.loading = false;
          return;
        }

        const contractPromises = deprecatedAddresses.map(async (address) => {
          try {
            const contract = createDeprecatedWithdrawalsContract(address, false);
            if (!contract) {
              return null;
            }

            // Check ETH balance of contract
            const ethBalance = await window.ethereum.request({
              method: "eth_getBalance",
              params: [address, "latest"],
            });

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

            const ethBalanceBN = BN(ethBalance);

            return {
              address,
              contract,
              ethBalance: ethBalanceBN,
              userDeposited,
              canRedeem:
                userDeposited.gt(0) && ethBalanceBN.gt(0),
            };
          } catch (error) {
            console.error(`Error scanning contract ${address}:`, error);
            return null;
          }
        });

        const results = await Promise.all(contractPromises);
        this.deprecatedContracts = results.filter((r) => r !== null);

        // Filter to only show contracts with user deposits or ETH balance
        this.deprecatedContracts = this.deprecatedContracts.filter(
          (c) => c.userDeposited.gt(0) || c.ethBalance.gt(0)
        );
      } catch (error) {
        console.error("Error scanning deprecated contracts:", error);
        this.error = "Failed to scan deprecated contracts. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    handleRedeemEth(contractData) {
      return {
        abiCall: async (...args) => {
          const contract = createDeprecatedWithdrawalsContract(
            contractData.address,
            true
          );
          if (!contract) {
            throw new Error("Contract not available");
          }
          return await contract.redeem(...args);
        },
        argsArr: [],
        cb: async () => {
          await this.scanDeprecatedContracts();
        },
      };
    },

    handleWithdrawVeth(contractData) {
      return {
        abiCall: async (...args) => {
          const contract = createDeprecatedWithdrawalsContract(
            contractData.address,
            true
          );
          if (!contract) {
            throw new Error("Contract not available");
          }
          // Try withdraw method first, fallback to requestRedeem if needed
          try {
            return await contract.withdraw(...args);
          } catch (error) {
            // If withdraw fails, try requestRedeem as alternative
            if (error.code === "CALL_EXCEPTION" || error.message.includes("withdraw")) {
              try {
                return await contract.requestRedeem(...args);
              } catch (retryError) {
                console.error("Error with both withdraw and requestRedeem:", retryError);
                throw new Error("Contract does not support withdrawal. Please check contract methods.");
              }
            }
            throw error;
          }
        },
        argsArr: [],
        cb: async () => {
          await this.scanDeprecatedContracts();
        },
      };
    },
  },
};
</script>

<style scoped>
/* Component styles */
</style>
