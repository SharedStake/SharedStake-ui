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
            Withdraw your vETH2 from deprecated contracts to use in the new withdrawal contract
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
            After withdrawal, you can deposit these tokens into the new withdrawal contract (coming soon) to redeem them for ETH once it's launched.
          </p>
        </div>

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
            Found {{ deprecatedContracts.length }} deprecated contract(s) with your deposits
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
                <div v-if="contract.userDeposited.gt(0)">
                  <p class="text-sm text-gray-300">
                    Your Deposited vETH2:
                    <span class="font-semibold text-white text-lg">
                      {{ parseBN(contract.userDeposited) }} vETH2
                    </span>
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    You can withdraw this vETH2 now. Once the new withdrawal contract is launched, you can deposit it there to redeem for ETH.
                  </p>
                </div>
              </div>

              <!-- Withdrawal button -->
              <div
                v-if="contract.userDeposited.gt(0)"
                class="flex flex-col gap-2 mt-3"
              >
                <dapp-tx-btn
                  :click="() => handleWithdrawVeth(contract)"
                >
                  <span>Withdraw {{ parseBN(contract.userDeposited) }} vETH2</span>
                </dapp-tx-btn>
                <p class="text-xs text-gray-400 text-center mt-1">
                  After withdrawal, you can deposit this vETH2 into the new withdrawal contract once it's launched
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
          <p>No vETH2 deposits found in deprecated contracts for your address.</p>
          <p class="text-sm mt-2">
            If you had deposits in old contracts, they may have already been withdrawn.
          </p>
        </div>

        <!-- Error state -->
        <div
          v-if="error"
          class="p-4 mt-4 text-center bg-red-900 border border-red-700 rounded-lg"
        >
          <p class="text-sm text-red-200">{{ error }}</p>
        </div>

        <!-- FAQ Section -->
        <DeprecatedWithdrawalsFAQ
          :user-total-deposited="userTotalDeposited"
          :total-veth2-staked="totalVeth2Staked"
          :total-eth-redeemed="totalEthRedeemed"
          :deprecated-contract-addresses="deprecatedContractAddresses"
        />
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
import DeprecatedWithdrawalsFAQ from "./DeprecatedWithdrawalsFAQ.vue";
import { parseBN } from "@/utils/bignumber";
import {
  getDeprecatedWithdrawalsAddresses,
  createDeprecatedWithdrawalsContract,
  vEth2,
} from "@/contracts";

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

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
    };
  },
  computed: {
    userConnectedWalletAddress() {
      return this.walletStore.userAddress;
    },
    userTotalDeposited() {
      return this.deprecatedContracts.reduce((total, contract) => {
        return total.plus(contract.userDeposited);
      }, BN(0));
    },
    deprecatedContractAddresses() {
      return getDeprecatedWithdrawalsAddresses();
    },
  },
  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        if (address) {
          await this.scanDeprecatedContracts();
          // Recalculate totals when wallet connects (provider should be ready now)
          await this.calculateTotals();
        } else {
          this.deprecatedContracts = [];
        }
      },
    },
  },
  mounted: async function() {
    // Calculate totals on mount (works even if user isn't connected)
    // Wait a bit for provider to initialize, then retry if needed
    await this.waitForProviderAndCalculateTotals();
  },
  methods: {
    parseBN,

    async waitForProviderAndCalculateTotals(retries = 5, delay = 500) {
      for (let i = 0; i < retries; i++) {
        try {
          const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
          if (deprecatedAddresses && deprecatedAddresses.length > 0) {
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
      await this.calculateTotals();
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
              };
            }
            return null;
          } catch (error) {
            console.error(`Error scanning contract ${address}:`, error);
            return null;
          }
        });

        const results = await Promise.all(contractPromises);
        this.deprecatedContracts = results.filter((r) => r !== null);
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
          this.calculatingTotals = false;
          return;
        }

        const deprecatedAddresses = getDeprecatedWithdrawalsAddresses();
        if (!deprecatedAddresses || deprecatedAddresses.length === 0) {
          console.warn("No deprecated contract addresses found");
          this.calculatingTotals = false;
          return;
        }

        console.log(`Calculating totals for ${deprecatedAddresses.length} deprecated contracts:`, deprecatedAddresses);

        let totalVeth2 = BN(0);
        let totalRedeemed = BN(0);

        // Calculate totals for ALL deprecated contracts (not just user deposits)
        const totalPromises = deprecatedAddresses.map(async (address) => {
          try {
            // Get vETH2 balance of the contract
            let veth2BN = BN(0);
            try {
              const veth2Bal = await vEth2Contract.balanceOf(address);
              veth2BN = BN(veth2Bal.toString());
              console.log(`Contract ${address} has ${veth2BN.toString()} vETH2`);
            } catch (err) {
              console.warn(`Error getting vETH2 balance for ${address}:`, err);
            }
            
            // Get totalOut (total ETH redeemed) from the contract
            let totalOutBN = BN(0);
            const contract = createDeprecatedWithdrawalsContract(address, false);
            if (contract) {
              try {
                const totalOut = await contract.totalOut();
                totalOutBN = BN(totalOut.toString());
                console.log(`Contract ${address} has redeemed ${totalOutBN.toString()} ETH`);
              } catch (err) {
                // Contract might not have totalOut method - this is OK for old contracts
                if (err.code !== "BAD_DATA" && err.code !== "CALL_EXCEPTION" && err.code !== "UNPREDICTABLE_GAS_LIMIT") {
                  console.warn(`Error getting totalOut for ${address}:`, err);
                }
              }
            } else {
              console.warn(`Could not create contract instance for ${address}`);
            }
            
            return { veth2: veth2BN, redeemed: totalOutBN };
          } catch (error) {
            console.error(`Error calculating totals for ${address}:`, error);
            return { veth2: BN(0), redeemed: BN(0) };
          }
        });

        const totals = await Promise.all(totalPromises);
        totalVeth2 = totals.reduce((sum, t) => sum.plus(t.veth2), BN(0));
        totalRedeemed = totals.reduce((sum, t) => sum.plus(t.redeemed), BN(0));

        console.log(`Total vETH2 staked: ${totalVeth2.toString()}, Total ETH redeemed: ${totalRedeemed.toString()}`);

        this.totalVeth2Staked = totalVeth2;
        this.totalEthRedeemed = totalRedeemed;
      } catch (error) {
        console.error("Error calculating totals:", error);
        // Set to zero on error so UI shows 0 instead of undefined
        this.totalVeth2Staked = BN(0);
        this.totalEthRedeemed = BN(0);
      } finally {
        this.calculatingTotals = false;
      }
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
          
          // Deprecated contracts may have different methods
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
