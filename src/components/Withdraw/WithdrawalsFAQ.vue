<template>
  
  <div class="mt-10 text-white">
        <h2 class="mb-4 text-2xl font-medium text-center">
          Frequently Asked Questions
        </h2>

        <QuestionAnswer>
          <template #question>
            How do I withdraw my staked ETH?
          </template>
          <template #answer>
            You can withdraw your staked ETH by following the steps:
            <br />
            <strong>Step 1:</strong> Approve vETH2
            <br />
            <strong>Step 2:</strong> Deposit vETH2
            <br />
            <strong>Step 3:</strong> Withdraw
            <br />
            <strong>Note: You must deposit vETH2 first. ETH or tokens will then be buffered into the contract based on demand</strong>
          </template>
        </QuestionAnswer>

        <QuestionAnswer>
          <template #question>
            How much can be withdrawn right now?
          </template>
          <template #answer>
            You can withdraw upto {{
            ethAvailableForWithdrawal.div(10 ** 18)
            .decimalPlaces(6)
            .toString()}} ETH buffered in the contract right now.
          </template>
        </QuestionAnswer>

        <QuestionAnswer>
          <template #question>
            How long does it take to withdraw my ETH?
          </template>
          <template #answer>
            It takes 7-14 days to withdraw your ETH. This is because the ETH you
            staked is locked in the Ethereum 2.0 deposit contract and validators need to have their withdrawal addresses changed, then exited wherein they enter the exit queue. 
          </template>
        </QuestionAnswer>
      </div>
</template>

<script>
import QuestionAnswer from "@/components/Withdraw/QuestionAnswer.vue";

export default {
  name: 'WithdrawalsFAQ',
  components: {QuestionAnswer},
  props: ['ethAvailableForWithdrawal'],
}
</script>