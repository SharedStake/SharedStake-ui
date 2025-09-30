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
        <strong>Step 1:</strong> Approve vETH2 (Please enter how much vETH2 you'd like to redeem)
        <br />
        <strong>Step 2:</strong> Deposit vETH2
        <br />
        <strong>Step 3:</strong> Redeem (when there is ETH available)
        <br />
        <strong>Note: You must deposit vETH2 first. ETH or tokens will then be buffered into the contract based on
          demand. </strong>
          <br />
        <strong>Note: You can at any point after deposit, choose to withdraw your vETH2 and use OTC or uniswap to sell for ETH. If you require a quicker flow. </strong>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much is vETH2 worth? (Redemption rate)
      </template>
      <template #answer>
        The rate is 1.08
        i.e. 1 vETH2 = 1.08 ETH.
        <p v-if="userBal > 0">
          OR
          {{ userBal.div(BN(10).pow(18)).decimalPlaces(6).toString() }} vETH2 = {{ userBal.div(1 / 1.08).div(BN(10).pow(18)).decimalPlaces(6).toString() }} ETH/sgETH
        </p>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much vETH2 is staked in this contract?
      </template>
      <template #answer>
        There is {{
          veth2Bal.div(BN(10).pow(18))
            .decimalPlaces(6)
            .toString() }} vETH2 deposited here. 
        Redeemable for {{
          veth2Bal.div(1/1.08).div(BN(10).pow(18))
            .decimalPlaces(6)
            .toString()  }} tokens.
        <br />
        From which {{
          totalRedeemed.div(BN(10).pow(18))
            .decimalPlaces(6).toString()
        }} tokens have already been redeemed.
        <br />
        A total of {{
          (veth2Bal.multipliedBy(11).div(10)
            .minus(totalRedeemed)
            .minus(ethAvailableForWithdrawal)
          ).div(11)
            .multipliedBy(10)
            .div(BN(10).pow(18))
            .decimalPlaces(6)
            .toString()
        }} vETH2 is queued. (if the number is negative that means there's excess in the buffer)
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much can be withdrawn right now?
      </template>
      <template #answer>
        You can withdraw upto {{
          ethAvailableForWithdrawal.div(BN(10).pow(18))
            .decimalPlaces(6)
            .toString() }} ETH buffered in the contract. Right now! 
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How long does it take to withdraw my ETH?
      </template>
      <template #answer>
        It takes at least 7-14 days to withdraw your ETH. This wait time may be longer if demand is high. As ETH is buffered in phases your personal wait time may be affected by other users redeeming before you.
        This is because the ETH you
        staked is locked in the Ethereum 2.0 deposit contract and validators need to have their withdrawal addresses
        changed, then exited wherein they enter the exit queue.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        I don't see the veth2 I previously deposited
      </template>
      <template #answer>
        If you had deposited in the old withdrawals/rollover contract, you will have to use etherscan to manually retrieve/withdraw 
        your vETH2 and redo the process. <br />
        You can find a howto in the <a class="link" href="https://docs.sharedstake.finance/withdrawals/withdraw-veth2-via-etherscan">docs under Withdrawals at docs.sharedstake.finance</a>
      </template>
    </QuestionAnswer>
  </div>
</template>

<script>
import QuestionAnswer from "@/components/Withdraw/QuestionAnswer.vue";

export default {
  name: 'WithdrawalsFAQ',
  components: { QuestionAnswer },
  props: [
    'ethAvailableForWithdrawal',
    'totalRedeemed',
    'veth2Bal',
    'userBal'
  ],
}
</script>


<style scoped>
.links {
  color: blue !important;
}
</style>