<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section
      class="relative gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl"
    >
      <span
        class="absolute p-1 px-3 text-sm font-bold text-gray-200 transform -translate-x-1/2 rounded-full opacity-95 left-1/2 -top-3 bg-brand-primary"
        >Beta</span
      >
      <div class="flex flex-col items-center justify-center">
        <header class="pb-3 my-4 text-center">
          <h1 class="text-3xl font-semibold">
            {{ this.title }}
          </h1>
          <p class="text-sm text-gray-300">
            {{ this.descr }}
          </p>
        </header>

        <!-- Progress - show completed steps status -->
        <div
          class="pb-3 mb-6 border-b border-gray-700"
          v-if="userWalletIsConnected"
        >
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
            <Step title="Redeem" :completed="false" step="3" />
          </aside>
        </div>

        <label v-if="stage == 'depositStage' || stage == 'approvalStage'">
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            How much would you like to withdraw?
          </p>
          <div
            class="relative flex items-center gap-1 p-2 text-xl border border-gray-200 rounded-xl"
          >
            <input
              :value="amount"
              class="max-w-xs ml-2 text-white bg-transparent border-none outline-none"
              :placeholder="
                this.userVEth2Balance
                  .div(10 ** 18)
                  .decimalPlaces(6)
                  .toString()
              "
              @input="
                amount = isNaN(parseFloat($event.target.value))
                  ? 0
                  : $event.target.value
              "
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
            <span>
              <span class="text-3xl font-semibold">{{
                userDepositedVEth2
                  .div(10 ** 18)
                  .decimalPlaces(6)
                  .toString()
              }}</span>
              <span class="inline-block ml-1 text-sm transform bottom-3 right-1"
                >vETH2</span
              >
            </span>
          </p>
        </div>

        <div class="my-6">
          <p v-if="loading">
            <ImageVue :src="'loading.svg'" :size="'45px'" />
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

            <ApprovalButton
              v-else-if="stage == 'approvalStage'"
              :ABI_token="this.ABI_vEth2"
              :ABI="ABI"
              :amount="this.amount"
              :userApprovedVEth2="this.userApprovedVEth2"
              :getUserApprovedVEth2="getUserApprovedVEth2"
              :wrapTx="wrapTx"
            />

            <SharedButton
              v-else-if="stage == 'depositStage'"
              @click="handleDepositVEth2"
            >
              <span>Request withdrawal</span>
            </SharedButton>

            <div class="text-center" v-else-if="stage == 'withdrawStage'">
              <p
                v-if="!contractHasEthAvailable"
                class="mb-2 text-sm font-medium text-gray-300"
              >
                The contract is replenishing its balance. <br />
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

      <WithdrawalsFAQ
        :ethAvailableForWithdrawal="ethAvailableForWithdrawal"
        :veth2Bal="contractVeth2Bal"
      />
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { vEth2 as ABI_vEth2 } from "@/contracts";
import { mapGetters } from "vuex";
import Step from "@/components/Withdraw/Step.vue";
import ConnectButton from "../Common/ConnectButton.vue";
import SharedButton from "../Common/SharedButton.vue";
import ApprovalButton from "../Common/ApproveButton.vue";
import { notifyHandler } from "@/utils/common";
import { notifyNotification } from "../../utils/common";
import WithdrawalsFAQ from "./WithdrawalsFAQ.vue";
import ImageVue from "../Handlers/ImageVue.vue";

// Max unit is the maximum value that can be represented in Solidity
// const MAX_UNIT = 2 ** 256 - 1;

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "RedemptionBase",
  components: {
    ImageVue,
    ConnectButton,
    SharedButton,
    Step,
    WithdrawalsFAQ,
    ApprovalButton,
  },
  props: [
    "ABI",
    "title",
    "descr",
    "getEthAvailableForWithdrawal",
    "ethAvailableForWithdrawal",
  ],

  data() {
    return {
      amount: 0,
      userVEth2Balance: BN(0),
      userApprovedVEth2: BN(0),
      userDepositedVEth2: BN(0),
      contractVeth2Bal: BN(0),
      loading: false,
      error: false,
      dev: false, // change to true for log
      ABI_vEth2: ABI_vEth2,
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
          if (this.dev)
            console.log(
              "ethAvailableForWithdrawal: ",
              this.ethAvailableForWithdrawal
            );
          await this.getUserDepositedVEth2();
          await this.getContractVeth2Queue();
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
      return (
        this.userApprovedVEth2.gt(0) &&
        this.userApprovedVEth2.gte(
          window.web3.utils.toWei(this.amount?.toString(), "ether")
        )
      );
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
      return this.userDepositedVEth2.gt(0);
    },

    contractHasEthAvailable() {
      return (
        this.ethAvailableForWithdrawal.gt(0) &&
        this.ethAvailableForWithdrawal.gte(this.userDepositedVEth2)
      );
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

    stage() {
      if (!this.userWalletIsConnected) return false;
      let state = {
        approvalStage: this.approvalStage,
        depositStage: this.depositStage,
        withdrawStage: this.withdrawStage,
      };
      if (this.dev) console.log("State :", state);
      if (state.withdrawStage) return "withdrawStage";
      if (state.depositStage && !state.approvalStage) return "depositStage";
      return "approvalStage";
    },
  },

  methods: {
    async wrapTx(abiCall, argsArr, cb = () => {}) {
      this.loading = true;

      await abiCall(...argsArr)
        .send({ from: this.userConnectedWalletAddress })
        .on("transactionHash", function(hash) {
          notifyHandler(hash);
        })
        .once("confirmation", async () => {
          this.error = false;
          notifyNotification("Tx successful", "success");
          // await this.getUserApprovedVEth2(); // update state to trigger next step
          // await this.getUserDepositedVEth2();
          await cb();
          if (this.dev) console.log("tx confirmed: state: ", this.stage);
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
    async handleDepositVEth2() {
      await this.wrapTx(
        this.ABI.methods.deposit,
        [window.web3.utils.toWei(this.amount, "ether")],
        this.getUserDepositedVEth2
      );
    },
    async handleWithdrawEth() {
      await this.wrapTx(this.ABI.methods.redeem, [], async () => {
        await this.getUserApprovedVEth2(); // update state to trigger next step
        await this.getUserDepositedVEth2();
      });
    },

    async getUserApprovedVEth2() {
      // return this.userApprovedVEth2;
      let userApprovedVEth2 = await ABI_vEth2.methods
        .allowance(this.userConnectedWalletAddress, this.ABI.options.address)
        .call();
      this.userApprovedVEth2 = BN(userApprovedVEth2);
      if (this.dev) console.log("userApprovedVEth2", userApprovedVEth2);
    },

    async getUserTokenBalance() {
      let userVeth2Balance = await ABI_vEth2.methods
        .balanceOf(this.userConnectedWalletAddress)
        .call();
      this.userVEth2Balance = BN(userVeth2Balance);
      if (this.dev) console.log("userVeth2Balance", userVeth2Balance);
      return userVeth2Balance;
    },

    async getUserDepositedVEth2() {
      let userDepositedVEth2 = await this.ABI.methods
        .userEntries(this.userConnectedWalletAddress)
        .call();
      this.userDepositedVEth2 = BN(userDepositedVEth2);
      if (this.dev) console.log("userDepositedVEth2", userDepositedVEth2);
      return this.userDepositedVEth2;
    },

    async getContractVeth2Queue() {
      let bal = await ABI_vEth2.methods
        .balanceOf(this.ABI.options.address)
        .call();
      this.contractVeth2Bal = BN(bal);
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
