<template>
  <div class="mt-10 text-white">
    <h2 class="mb-4 text-2xl font-medium text-center">
      Frequently Asked Questions
    </h2>

    <QuestionAnswer>
      <template #question>
        What are deprecated contracts?
      </template>
      <template #answer>
        Deprecated contracts are older versions of the withdrawal system that are no longer actively maintained or used. 
        If you deposited vETH2 into these contracts before they were deprecated, your tokens may still be locked there. 
        This page helps you withdraw your vETH2 from those old contracts so you can use them in the new system.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        What happens when I click "Withdraw vETH2"?
      </template>
      <template #answer>
        When you click "Withdraw vETH2", the contract will execute a withdrawal transaction that returns your deposited vETH2 tokens to your wallet. 
        This is a one-way operation - your vETH2 will be sent back to your connected wallet address. 
        After the withdrawal is complete, you can then deposit these vETH2 tokens into the new withdrawal contract (coming soon) to redeem them for ETH once it's launched.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        Why do I need to withdraw from deprecated contracts?
      </template>
      <template #answer>
        The deprecated contracts are no longer actively processing withdrawals or accepting new deposits. 
        To use your vETH2 tokens in the new system, you need to withdraw them from the old contracts first. 
        Once withdrawn, you can hold them in your wallet until the new withdrawal contract launches, then deposit them there to redeem for ETH.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        What should I do after withdrawing my vETH2?
      </template>
      <template #answer>
        After successfully withdrawing your vETH2 from a deprecated contract:
        <br>
        <strong>Step 1:</strong> Your vETH2 will be returned to your wallet
        <br>
        <strong>Step 2:</strong> Wait for the new withdrawal contract to launch (coming soon)
        <br>
        <strong>Step 3:</strong> Once launched, approve and deposit your vETH2 into the new withdrawal contract
        <br>
        <strong>Step 4:</strong> Wait for ETH to become available, then redeem your vETH2 for ETH
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        Do I have vETH2 deposited in deprecated contracts?
      </template>
      <template #answer>
        <template v-if="userTotalDeposited && userTotalDeposited.gt(0)">
          Yes! You have a total of {{
            parseBN(userTotalDeposited)
          }} vETH2 deposited across deprecated contracts and/or the rollover contract. 
          You can withdraw these using the buttons above.
        </template>
        <template v-else>
          No deposits found in deprecated contracts or rollover contract for your address. 
          <br>
          <br>
          If you believe you should have deposits but don't see them, it could mean:
          <br>
          • You never deposited vETH2 into the old contracts
          <br>
          • You already withdrew your vETH2 from the deprecated contracts or rollover contract
          <br>
          • Your deposits were in a different contract that isn't tracked here
          <br>
          <br>
          You can check your transaction history on Etherscan to verify which contracts you interacted with.
        </template>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much vETH2 is staked in deprecated contracts?
      </template>
      <template #answer>
        Across deprecated withdrawal contracts and the rollover contract, there is a total of {{
          parseBN(totalVeth2Staked || BN(0))
        }} vETH2 deposited.
        <br>
        <br>
        From these contracts, a total of {{
          parseBN(totalEthRedeemed || BN(0))
        }} ETH has already been redeemed.
        <br>
        <br>
        <!-- Mobile Card Layout -->
        <div class="block md:hidden mt-4 space-y-4">
          <template v-if="contractDetails && contractDetails.length > 0">
            <div
              v-for="(contract, index) in contractDetails"
              :key="contract.address"
              class="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <h4 class="text-sm font-semibold text-gray-300 mb-3">{{ contract.name }}</h4>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-400">Address:</span>
                  <a
                    :href="`https://etherscan.io/address/${contract.address}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-300 underline hover:text-blue-200 font-mono break-all text-right max-w-[60%]"
                  >
                    {{ contract.address }}
                  </a>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">vETH2 Deposited:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(contract.veth2 || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">ETH Redeemed:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(contract.redeemed || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">ETH Balance:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(contract.ethBalance || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Redeemable:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(contract.redeemable || BN(0)) }}</span>
                </div>
                <div v-if="hasSgEthBalance && contract.sgEthBalance" class="flex justify-between">
                  <span class="text-gray-400">sgETH Balance:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(contract.sgEthBalance) }}</span>
                </div>
              </div>
            </div>
            <!-- Totals Card -->
            <div class="bg-gray-900 border-2 border-gray-600 rounded-lg p-4 font-semibold">
              <h4 class="text-sm font-semibold text-gray-300 mb-3">Total</h4>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-400">vETH2 Deposited:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(totalVeth2Staked || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">ETH Redeemed:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(totalEthRedeemed || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">ETH Balance:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(totalEthBalance || BN(0)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Redeemable:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(totalRedeemable || BN(0)) }}</span>
                </div>
                <div v-if="hasSgEthBalance" class="flex justify-between">
                  <span class="text-gray-400">sgETH Balance:</span>
                  <span class="text-gray-200 font-mono">{{ parseBN(totalSgEthBalance || BN(0)) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
            Loading contract data...
          </div>
        </div>

        <!-- Desktop Table Layout -->
        <div class="hidden md:block mt-4 -mx-2">
          <div class="overflow-x-auto px-2">
            <div class="inline-block min-w-full align-middle">
              <div class="overflow-hidden border border-gray-700 rounded-lg">
                <table class="min-w-full divide-y divide-gray-700 text-sm">
                  <thead class="bg-gray-900">
                    <tr>
                      <th class="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Contract</th>
                      <th class="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Address</th>
                      <th class="px-3 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">vETH2 Deposited</th>
                      <th class="px-3 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">ETH Redeemed</th>
                      <th class="px-3 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">ETH Balance</th>
                      <th class="px-3 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Redeemable</th>
                      <th v-if="hasSgEthBalance" class="px-3 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">sgETH Balance</th>
                    </tr>
                  </thead>
                  <tbody class="bg-gray-800 divide-y divide-gray-700">
                    <template v-if="contractDetails && contractDetails.length > 0">
                      <tr
                        v-for="(contract, index) in contractDetails"
                        :key="contract.address"
                        :class="index % 2 === 0 ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-900 hover:bg-gray-800'"
                        class="transition-colors"
                      >
                        <td class="px-3 py-3 whitespace-nowrap text-gray-200 font-medium">
                          {{ contract.name }}
                        </td>
                        <td class="px-3 py-3">
                          <a
                            :href="`https://etherscan.io/address/${contract.address}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-300 underline hover:text-blue-200 font-mono text-xs break-all transition-colors"
                          >
                            {{ contract.address }}
                          </a>
                        </td>
                        <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                          {{ parseBN(contract.veth2 || BN(0)) }}
                        </td>
                        <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                          {{ parseBN(contract.redeemed || BN(0)) }}
                        </td>
                        <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                          {{ parseBN(contract.ethBalance || BN(0)) }}
                        </td>
                        <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                          {{ parseBN(contract.redeemable || BN(0)) }}
                        </td>
                        <td 
                          v-if="hasSgEthBalance"
                          class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono"
                        >
                          {{ contract.sgEthBalance ? parseBN(contract.sgEthBalance) : 'N/A' }}
                        </td>
                      </tr>
                    </template>
                    <tr v-else class="bg-gray-800">
                      <td :colspan="hasSgEthBalance ? 7 : 6" class="px-3 py-4 text-center text-gray-400">
                        Loading contract data...
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="contractDetails && contractDetails.length > 0" class="bg-gray-900">
                    <tr class="font-semibold border-t-2 border-gray-600">
                      <td class="px-3 py-3 text-gray-200" colspan="2">Total</td>
                      <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                        {{ parseBN(totalVeth2Staked || BN(0)) }}
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                        {{ parseBN(totalEthRedeemed || BN(0)) }}
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                        {{ parseBN(totalEthBalance || BN(0)) }}
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono">
                        {{ parseBN(totalRedeemable || BN(0)) }}
                      </td>
                      <td 
                        v-if="hasSgEthBalance"
                        class="px-3 py-3 whitespace-nowrap text-right text-gray-200 font-mono"
                      >
                        {{ parseBN(totalSgEthBalance || BN(0)) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        I don't see any deprecated contracts with deposits
      </template>
      <template #answer>
        If no deprecated contracts are found with your deposits, it could mean:
        <br>
        • You never deposited vETH2 into the old contracts
        <br>
        • You already withdrew your vETH2 from the deprecated contracts
        <br>
        • Your deposits were in a different contract that isn't tracked here
        <br>
        <br>
        If you believe you should have deposits but don't see them, you can check your transaction history on Etherscan 
        to verify which contracts you interacted with.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        Will I lose my vETH2 if I don't withdraw?
      </template>
      <template #answer>
        Your vETH2 tokens are safe in the deprecated contracts - they won't disappear. However, these contracts are no longer 
        actively processing redemptions, so you won't be able to redeem them for ETH until you withdraw and move them to the new contract (coming soon). 
        We recommend withdrawing your vETH2 from deprecated contracts now so you're ready when the new contract launches.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much does it cost to withdraw?
      </template>
      <template #answer>
        You'll need to pay Ethereum gas fees for the withdrawal transaction. The cost depends on current network conditions. 
        The withdrawal itself doesn't charge any additional fees - you're simply retrieving your own vETH2 tokens.
      </template>
    </QuestionAnswer>
  </div>
</template>

<script>
import QuestionAnswer from "@/components/Withdraw/QuestionAnswer.vue";
import BN from "bignumber.js";
import { parseBN } from "@/utils/bignumber";

export default {
  name: 'DeprecatedWithdrawalsFAQ',
  components: { QuestionAnswer },
  props: [
    'userTotalDeposited',
    'totalVeth2Staked',
    'totalEthRedeemed',
    'deprecatedContractAddresses',
    'rolloverContractAddress',
    'rolloverVeth2Input',
    'rolloverEthRedeemed',
    'contractDetails'
  ],
  computed: {
    hasSgEthBalance() {
      return this.contractDetails && this.contractDetails.some(c => 
        c.sgEthBalance && BN.isBigNumber(c.sgEthBalance) && c.sgEthBalance.gt(0)
      );
    },
    totalEthBalance() {
      if (!this.contractDetails || this.contractDetails.length === 0) return BN(0);
      return this.contractDetails.reduce((sum, c) => {
        const balance = (c.ethBalance && BN.isBigNumber(c.ethBalance)) ? c.ethBalance : BN(0);
        return sum.plus(balance);
      }, BN(0));
    },
    totalRedeemable() {
      if (!this.contractDetails || this.contractDetails.length === 0) return BN(0);
      return this.contractDetails.reduce((sum, c) => {
        const redeemable = (c.redeemable && BN.isBigNumber(c.redeemable)) ? c.redeemable : BN(0);
        return sum.plus(redeemable);
      }, BN(0));
    },
    totalSgEthBalance() {
      if (!this.contractDetails || this.contractDetails.length === 0) return BN(0);
      return this.contractDetails.reduce((sum, c) => {
        const balance = (c.sgEthBalance && BN.isBigNumber(c.sgEthBalance)) ? c.sgEthBalance : BN(0);
        return sum.plus(balance);
      }, BN(0));
    },
  },
  methods: {
    parseBN,
  },
}
</script>

<style scoped>
/* FAQ styles */
</style>
