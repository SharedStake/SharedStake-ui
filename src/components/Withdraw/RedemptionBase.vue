<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section
      class="relative gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl"
    >
      <span
        class="absolute p-1 px-3 text-sm font-bold text-gray-200 transform -translate-x-1/2 rounded-full opacity-95 left-1/2 -top-3 bg-brand-primary"
        >Beta</span
      >

      <Chooser
        :routes="this.routes"
        :currentActive="this.title == 'Rollover' ? 0 : 1"
      />

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
              :completed="this.withdrawStage || completed"
              step="2"
            />
            <Step
              :title="`Redeem ${outputTokenName}`"
              :completed="completed"
              step="3"
            />
          </aside>
        </div>

        <div
          v-if="completed"
          class="p-4 px-6 text-center bg-gray-700 border border-green-400 rounded-lg shadow-md"
        >
          <h2 class="mb-2 text-xl font-semibold">
            You've successfully converted vETH2 into {{ outputTokenName }}.
          </h2>
          <p
            class="inline-block mx-auto mb-4 text-sm font-semibold text-gray-300 border-b border-gray-600"
          >
            Next steps
          </p>
          <div class="flex justify-center gap-6">
            <SharedLink to="/stake">
              Stake ETH
            </SharedLink>
            <SharedLink to="/wrap">
              Wrap sgETH
            </SharedLink>
            <SharedLink to="/rollover">
              <span @click="completed = false">
                Rollover/Withdraw more vETH2
              </span>
            </SharedLink>
          </div>
        </div>
        <label v-else-if="stage == 'depositStage' || stage == 'approvalStage'">
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            How much vETH2 would you like to redeem for {{ outputTokenName }}?
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
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            Current vETH2 Balance: {{ parseBN(userVEth2Balance) }}
          </p>
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            Current {{ outputTokenName }} Balance:
            {{ parseBN(outputTokenBalance) }}
          </p>
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
          <!-- Show amount user will get -->
          <p class="text-sm font-semibold text-gray-300">
            You will receive
          </p>
          <p class="relative text-center">
            <span>
              <span class="text-3xl font-semibold">{{
                userDepositedVEth2
                  .div(1 / 1.1)
                  .div(10 ** 18)
                  .decimalPlaces(6)
                  .toString()
              }}</span>
              <span
                class="inline-block ml-1 text-sm transform bottom-3 right-1"
                >{{ outputTokenName }}</span
              >
            </span>
          </p>
        </div>

        <!-- Action buttons -->
        <div class="my-6" v-if="!completed">
          <p v-if="loading">
            <ImageVue :src="'loading.svg'" :size="'45px'" />
          </p>

          <ConnectButton v-else-if="!userConnectedWalletAddress" />

          <template v-else>
            <p
              v-if="!userHasTokenBalance && stage == 'approvalStage'"
              class="mt-2 text-sm font-semibold text-gray-200"
            >
              You need to have vETH2 tokens in your wallet in order to withdraw
              {{ outputTokenName }}.
            </p>

            <ApprovalButton
              v-else-if="stage == 'approvalStage'"
              :ABI_token="this.ABI_vEth2"
              :ABI_spender="ABI"
              :amount="this.amount"
              :cb="getUserApprovedVEth2"
            />

            <!-- Disable the button to deposit till new contract is up -->
            <!-- <dapp-tx-btn
              v-else-if="stage == 'depositStage'"
              :click="handleDepositVEth2"
            >
              <span>Request {{ this.title.toLowerCase() }}</span>
            </dapp-tx-btn> -->

            <div class="text-center" v-else-if="stage == 'withdrawStage'">
              <p
                v-if="!contractHasEthAvailable"
                class="mb-2 text-sm font-medium text-gray-300"
              >
                The contract is replenishing its balance. <br />
                It can take up to 2 weeks to exit a validator and buffer
                balances. <br />
                Please check in again soon.
              </p>
              <dapp-tx-btn
                :disabled="!contractHasEthAvailable"
                :click="handleWithdrawEth"
              >
                <span>Redeem for {{ outputTokenName }}</span>
              </dapp-tx-btn>
              <dapp-tx-btn
                :click="handleWithdrawVeth"
              >
                <span>Withdraw your vETH2</span>
              </dapp-tx-btn>
            </div>
          </template>
        </div>
      </div>

      <WithdrawalsFAQ
        :ethAvailableForWithdrawal="ethAvailableForWithdrawal"
        :veth2Bal="contractVeth2Bal"
        :userBal="userVEth2Balance"
        :totalRedeemed="totalRedeemed"
      />
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { vEth2 as ABI_vEth2, sgETH } from "@/contracts";
import { mapGetters } from "vuex";
import Step from "@/components/Withdraw/Step.vue";
import SharedLink from "../Common/SharedLink.vue";
import ConnectButton from "../Common/ConnectButton.vue";
import ApprovalButton from "../Common/ApproveButton.vue";
import Chooser from "../Common/Chooser.vue";
import DappTxBtn from "../Common/DappTxBtn.vue";

import WithdrawalsFAQ from "./WithdrawalsFAQ.vue";
import ImageVue from "../Handlers/ImageVue.vue";
import { toWei } from "../../utils/common";

// Max unit is the maximum value that can be represented in Solidity
// const MAX_UNIT = 2 ** 256 - 1;

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "RedemptionBase",
  components: {
    ImageVue,
    SharedLink,
    ConnectButton,
    Step,
    WithdrawalsFAQ,
    ApprovalButton,
    Chooser,
    DappTxBtn,
  },
  props: [
    "ABI",
    "title",
    "descr",
    "getEthAvailableForWithdrawal",
    "ethAvailableForWithdrawal",
    'getTotalRedeemed',
    'totalRedeemed',
    "outputTokenName",
  ],

  data() {
    return {
      amount: null, // start off as null to render placeholder in input field as a user balance hint
      userVEth2Balance: BN(0),
      userApprovedVEth2: BN(0),
      userDepositedVEth2: BN(0),
      contractVeth2Bal: BN(0),
      outputTokenBalance: BN(0),
      virtualPrice: BN('1.1'),
      loading: false,
      error: false,
      dev: false, // change to true for log
      ABI_vEth2: ABI_vEth2,
      completed: false, // Full process completed (in one session)
      routes: [
        { text: "Rollover", cb: this.routeClickCb },
        { text: "Withdraw", cb: this.routeClickCb },
      ],
    };
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        // log the amount of veth2 the user has deposited for withdrawal
        if (address) {
          await this.refreshBalances();
          if (this.dev)
            console.log(
              "ethAvailableForWithdrawal: ",
              this.ethAvailableForWithdrawal
            );
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
        this.userApprovedVEth2.gte(toWei(this.amount?.toString() || "0"))
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

    contractCanFulfillOrder() {
      return this.userCanRedeemEth && this.contractHasEthAvailable;
    },

    userCanRedeemEth() {
      return this.userDepositedVEth2.gt(0);
    },

    contractHasEthAvailable() {
      return (
        this.ethAvailableForWithdrawal.gt(0) &&
        this.ethAvailableForWithdrawal.gte(this.userDepositedVEth2.multipliedBy(this.virtualPrice))
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
    routeClickCb(index, routes) {
      this.$router.push(`/${routes[index].text.toLowerCase()}`);
    },

    handleDepositVEth2() {
      return {
        abiCall: this.ABI.methods.deposit,
        argsArr: [toWei(this.amount)],
        cb: this.refreshBalances,
      };
    },

    handleWithdrawEth() {
      return {
        abiCall: this.ABI.methods.redeem,
        argsArr: [],
        cb: async () => {
          this.completed = true; // Mark as completed in the UI - will reset on navigation.
          await this.refreshBalances(); // update state to trigger next step
        },
      };
    },
    handleWithdrawVeth() {
      return {
        abiCall: this.ABI.methods.withdraw,
        argsArr: [],
        cb: async () => {
          this.completed = true; // Mark as completed in the UI - will reset on navigation.
          await this.refreshBalances(); // update state to trigger next step
        },
      };
    },

    async getUserApprovedVEth2() {
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
      this.loading = true;
      let userDepositedVEth2 = await this.ABI.methods
        .userEntries(this.userConnectedWalletAddress)
        .call();
      this.userDepositedVEth2 = BN(userDepositedVEth2);
      if (this.dev) console.log("userDepositedVEth2", userDepositedVEth2);
      this.loading = false;
      return this.userDepositedVEth2;
    },

    async getContractVeth2Queue() {
      let bal = await ABI_vEth2.methods
        .balanceOf(this.ABI.options.address)
        .call();
      this.contractVeth2Bal = BN(bal);
    },

    async getOutputTokenBalance() {
      let bal = 0;
      if (this.outputTokenName.toLowerCase() == "sgeth") {
        bal = await sgETH.methods
          .balanceOf(this.userConnectedWalletAddress)
          .call();
      } else {
        bal = await window.ethereum.request({
          method: "eth_getBalance",
          params: [this.userConnectedWalletAddress, "latest"],
        });
      }
      this.outputTokenBalance = BN(bal);
    },

    parseBN(n) {
      return n
        .div(10 ** 18)
        .decimalPlaces(6)
        .toString();
    },

    async refreshBalances() {
      await this.getOutputTokenBalance();
      await this.getUserApprovedVEth2();
      await this.getUserTokenBalance();

      await this.getUserDepositedVEth2();
      await this.getContractVeth2Queue();
      await this.getEthAvailableForWithdrawal();
      await this.getTotalRedeemed();
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
