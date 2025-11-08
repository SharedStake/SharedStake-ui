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
            userTotalDeposited.div(eighteenPower)
              .decimalPlaces(6)
              .toString()
          }} vETH2 deposited across deprecated contracts. 
          You can withdraw these using the buttons above.
        </template>
        <template v-else>
          No deposits found in deprecated contracts for your address. 
          <br>
          <br>
          If you believe you should have deposits but don't see them, it could mean:
          <br>
          • You never deposited vETH2 into the old contracts
          <br>
          • You already withdrew your vETH2 from the deprecated contracts
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
        Across both deprecated withdrawal contracts, there is a total of {{
          (totalVeth2Staked || BN(0)).div(eighteenPower)
            .decimalPlaces(6)
            .toString()
        }} vETH2 still deposited.
        <br>
        <br>
        From these contracts, a total of {{
          (totalEthRedeemed || BN(0)).div(eighteenPower)
            .decimalPlaces(6)
            .toString()
        }} ETH has already been redeemed via the totalOut function.
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

export default {
  name: 'DeprecatedWithdrawalsFAQ',
  components: { QuestionAnswer },
  props: [
    'userTotalDeposited',
    'totalVeth2Staked',
    'totalEthRedeemed'
  ],
  computed: {
    eighteenPower: function() {
      return BN(10).pow(18);
    },
  },
}
</script>

<style scoped>
/* FAQ styles */
</style>
