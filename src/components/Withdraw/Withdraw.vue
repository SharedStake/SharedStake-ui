<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section
      class="gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl"
    >
      <div class="flex flex-col items-center justify-center">
        <header class="relative pb-3 mb-3 text-center">
          <h1 class="text-3xl font-semibold">
            Withdrawals
            <span
              class="absolute p-1 px-3 ml-1 text-xs text-gray-200 align-top rounded-full opacity-95 left-full -top-1 bg-brand-primary"
              >Beta</span
            >
          </h1>
          <p class="text-sm text-gray-300">Goerli testnet withdrawals</p>
        </header>

        <!-- Progress - show completed steps status -->
        <div class="pb-3 mb-6 border-b border-gray-700">
          <aside class="flex flex-wrap justify-center gap-3 md:gap-6">
            <Step
              title="Approve vETH2"
              :completed="this.depositStage || this.withdrawStage"
              step="1"
            />
            <Step
              title="Deposit vETH2"
              :completed="this.withdrawStage"
              step="2"
            />
            <Step title="Withdraw ETH" :completed="false" step="3" />
          </aside>
        </div>

        <label v-if="depositStage">
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            How much would you like to withdraw?
          </p>
          <div
            class="relative flex items-center gap-1 p-2 text-xl border border-gray-200 rounded-xl"
          >
            <input
              :value="amount"
              class="max-w-xs ml-2 text-white bg-transparent border-none outline-none"
              :placeholder="this.userVEth2Balance
                .div(10 ** 18)
                .decimalPlaces(6)
                .toString()"
              @input="amount = $event.target.value"
            />
            <span class="text-sm">
              vETH2
            </span>
            <button
              @click="handleFillMaxAmount"
              v-if="true"
              class=" px-1 py-0.5 text-xs font-semibold bg-white rounded text-brand-primary"
            >
              max
            </button>
          </div>
        </label>
        <div v-else-if="withdrawStage" class="text-gray-200">
          <!-- Show amount of user deposited veth2 -->
          <p class="text-sm font-semibold text-gray-300">
            You have deposited
          </p>
          <p class="relative text-center">
            <span class="text-3xl font-semibold">{{
              userDepositedVEth2
                .div(10 ** 18)
                .decimalPlaces(6)
                .toString()
            }}</span>
            <span
              class="absolute inline-block ml-1 text-sm transform bottom-3 right-1"
              >vETH2</span
            >
          </p>
        </div>

        <div class="my-6">
          <p v-if="loading">
            Loading...
          </p>

          <ConnectButton v-else-if="!userConnectedWalletAddress" />

          <template v-else>
            <p
              v-if="!userHasTokenBalance"
              class="mt-2 text-sm font-semibold text-gray-200"
            >
              You need to have vETH2 tokens in your wallet in order to withdraw
              ETH.
            </p>

            <SharedButton v-else-if="approvalStage" @click="handleApproveVEth2">
              <span>Approve vETH2</span>
            </SharedButton>

            <SharedButton v-else-if="depositStage" @click="handleDepositVEth2">
              <span>Request withdrawal</span>
            </SharedButton>

            <div class="text-center" v-else-if="withdrawStage">
              <p
                v-if="!contractHasEthAvailable"
                class="mb-2 text-sm font-medium text-gray-300"
              >
                The contract is replenishing its ETH balance. <br />
                Please check in again soon.
              </p>
              <SharedButton
                :disabled="!contractHasEthAvailable"
                @click="handleWithdrawEth"
              >
                <span>Withdraw your ETH</span>
              </SharedButton>
            </div>
          </template>
        </div>
      </div>

      <div class="mt-10 text-white">
        <h2 class="mb-4 text-2xl font-medium text-center">
          Frequently Asked Questions
        </h2>

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
            How do I withdraw my staked ETH?
          </template>
          <template #answer>
            You can withdraw your staked ETH by following the steps:
            <br />
            <strong>Step 1:</strong> Approve vETH2
            <br />
            <strong>Step 2:</strong> Deposit vETH2
            <br />
            <strong>Step 3:</strong> Withdraw ETH
          </template>
        </QuestionAnswer>

        <QuestionAnswer>
          <template #question>
            How long does it take to withdraw my ETH?
          </template>
          <template #answer>
            It takes 7 days to withdraw your ETH. This is because the ETH you
            staked is locked in the Ethereum 2.0 deposit contract for 7 days
            before it can be withdrawn.
          </template>
        </QuestionAnswer>
      </div>
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import {
  withdrawals as ABI_withdrawals,
  vEth2 as ABI_vEth2,
} from "@/contracts";
import { mapGetters } from "vuex";
import Step from "@/components/Withdraw/Step.vue";
import QuestionAnswer from "@/components/Withdraw/QuestionAnswer.vue";
import ConnectButton from "../Common/ConnectButton.vue";
import SharedButton from "../Common/SharedButton.vue";
import { notifyHandler } from "@/utils/common";
import { notifyNotification } from "../../utils/common";

// Max unit is the maximum value that can be represented in Solidity
// const MAX_UNIT = 2 ** 256 - 1;

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "Withdraw",
  components: { ConnectButton, SharedButton, Step, QuestionAnswer },

  data() {
    return {
      amount: 0,
      userVEth2Balance: BN(0),
      userApprovedVEth2: BN(0),
      userDepositedVEth2: BN(0),
      ethAvailableForWithdrawal: BN(0),
      loading: false,
      error: false,
    };
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        // log the amount of veth2 the user has deposited for withdrawal

        if (address) {
          this.loading = true;
          await this.getUserTokenBalance();
          await this.getUserApprovedVEth2();
          await this.getEthAvailableForWithdrawal();
          await this.getUserDepositedVEth2();
          this.loading = false;
        }
      },
    },
  },

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),

    userHasTokenBalance() {
      return this.userVEth2Balance.gt(0);
    },

    userHasApprovedToken() {
      return this.userApprovedVEth2.gt(this.userVEth2Balance);
    },

    userCanRequestWithdrawal() {
      const hasApprovedToken = this.userHasApprovedToken;
      const hasTokenBalance = this.userHasTokenBalance;
      return hasApprovedToken && hasTokenBalance;
    },

    userWalletIsConnected() {
      return this.userConnectedWalletAddress;
    },

    userCanRedeemEth() {
      // return true;
      // @dev @todo - uncomment when new contract with userEntries is ready.
      return this.userDepositedVEth2.gt(0);
    },

    contractHasEthAvailable() {
      return this.ethAvailableForWithdrawal.gt(0);
    },

    amountFieldLowerThanMax() {
      return (
        this.amount &&
        this.amount <
          this.userVEth2Balance
            .div(10 ** 18)
            .decimalPlaces(6)
            .toString()
      );
    },

    approvalStage() {
      return this.userWalletIsConnected && !this.userHasApprovedToken;
    },
    depositStage() {
      return (
        this.userWalletIsConnected &&
        !this.userCanRedeemEth &&
        this.userCanRequestWithdrawal
      );
    },
    withdrawStage() {
      return this.userWalletIsConnected && this.userCanRedeemEth;
    },

    completedStepsCount() {
      return this.approvalStage + this.depositStage + this.withdrawStage + 1;
    },
  },

  methods: {
    async handleApproveVEth2() {
      this.loading = true;

      await ABI_vEth2.methods
        .approve(ABI_withdrawals.options.address, this.userVEth2Balance)
        .send({ from: this.userConnectedWalletAddress })
        .on("transactionHash", function(hash) {
          notifyHandler(hash);
        })
        .once("confirmation", () => {
          this.error = false;
          notifyNotification("Approval successful", "success");
        })
        .on("error", () => {
          this.error = true;
        })
        .catch(() => {
          this.error = true;
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleDepositVEth2() {
      ABI_withdrawals.methods
        .deposit(window.web3.utils.toWei(this.amount, "ether"))
        .send({ from: this.userConnectedWalletAddress })
        .on("transactionHash", function(hash) {
          notifyHandler(hash);
        })
        .once("confirmation", () => {
          this.error = false;
          notifyNotification("Deposit successful", "success");
        })
        .on("error", () => {
          this.error = true;
        })
        .catch(() => {
          this.error = true;
        });
    },

    handleWithdrawEth() {
      ABI_withdrawals.methods
        .redeem()
        .send({ from: this.userConnectedWalletAddress })
        .on("transactionHash", function(hash) {
          notifyHandler(hash);
        })
        .once("confirmation", () => {
          this.error = false;
          notifyNotification("Withdrawal successful", "success");
        })
        .on("error", () => {
          this.error = true;
        })
        .catch(() => {
          this.error = true;
        });
    },

    async getUserApprovedVEth2() {
      let userApprovedVEth2 = await ABI_vEth2.methods
        .allowance(
          this.userConnectedWalletAddress,
          ABI_withdrawals.options.address
        )
        .call();
      this.userApprovedVEth2 = BN(userApprovedVEth2);
      console.log("userApprovedVEth2", userApprovedVEth2);
    },

    async getUserTokenBalance() {
      let userVeth2Balance = await ABI_vEth2.methods
        .balanceOf(this.userConnectedWalletAddress)
        .call();
      this.userVEth2Balance = BN(userVeth2Balance);
      console.log("userVeth2Balance", userVeth2Balance);
      return userVeth2Balance;
    },

    async getEthAvailableForWithdrawal() {
      // console log withdrawal contract's ETH balance
      const amt = await window.web3.eth.getBalance(
        ABI_withdrawals.options.address
      );

      this.ethAvailableForWithdrawal = BN(amt);
      console.log("ethAvailableForWithdrawal", amt);
    },

    async getUserDepositedVEth2() {
      // @dev @todo - uncomment when new contract with userEntries is ready.
      // let userDepositedVEth2 = await ABI_withdrawals.methods
      //   .userEntries(this.userConnectedWalletAddress)
      //   .call();
      // this.userDepositedVEth2 = BN(userDepositedVEth2);
      // console.log("userDepositedVEth2", userDepositedVEth2);
    },

    handleFillMaxAmount() {
      this.amount = this.userVEth2Balance
        .div(10 ** 18)
        .decimalPlaces(6)
        .toString();
    },
  },
};
</script>
