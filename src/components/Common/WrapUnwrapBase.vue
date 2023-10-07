<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section class="relative gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl">
      <span
        class="absolute p-1 px-3 text-sm font-bold text-gray-200 transform -translate-x-1/2 rounded-full opacity-95 left-1/2 -top-3 bg-brand-primary">Beta</span>

      <Chooser :routes="this.routes" :currentActive="this.title == 'Wrap' ? 0 : 1" />

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
        <div class="pb-3 mb-6 border-b border-gray-700" v-if="userWalletIsConnected">
          <aside class="flex flex-wrap justify-center gap-3 md:gap-6">
            <Step :title="`Approve ${inputTokenName}`" :completed="this.depositStage" step="1" />
            <Step :title="`Wrap ${inputTokenName}`" :completed="this.completed" step="2" />
          </aside>
        </div>

        <label v-if="this.depositStage || this.approvalStage">
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            How much {{inputTokenName}} would you like to stake for {{ outputTokenName }}?
          </p>
          <div class="relative flex items-center gap-1 p-2 text-xl border border-gray-200 rounded-xl">
            <input :value="amount" class="max-w-xs ml-2 text-white bg-transparent border-none outline-none" 
              :placeholder="
                this.userTokenBalance
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
              {{inputTokenName}}
            </span>
            <button @click="handleFillMaxAmount" v-if="true"
              class=" px-1 py-0.5 text-xs font-semibold bg-white rounded text-brand-primary">
              max
            </button>
          </div>
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            Current {{outputTokenName}} Balance: {{ parseBN(userOutputTokenBalance) }} 
          </p>
        </label>

        <!-- Action buttons -->
        <div class="my-6" v-if="!completed">
          <p v-if="loading">
            <ImageVue :src="'loading.svg'" :size="'45px'" />
          </p>

          <ConnectButton v-else-if="!userConnectedWalletAddress" />

          <template v-else>
            <p v-if="!userHasTokenBalance" class="mt-2 text-sm font-semibold text-gray-200">
              You need to have {{inputTokenName}} tokens in your wallet in order to continue
              {{ outputTokenName }}.
            </p>

            <ApprovalButton v-else-if="stage == 'approvalStage'" :ABI_token="sgETH" :ABI_spender="wsgETH"
              :amount="this.amount" :cb="getUserApproved" />

            <dapp-tx-btn v-else-if="stage == 'depositStage'" :click="handleDeposit">
              <span> {{ this.title }}</span>
            </dapp-tx-btn>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { wsgETH, sgETH } from "@/contracts";
import { mapGetters } from "vuex";
import Step from "@/components/Withdraw/Step.vue";
import ConnectButton from "../Common/ConnectButton.vue";
import ApprovalButton from "../Common/ApproveButton.vue";
import Chooser from "../Common/Chooser.vue";
import DappTxBtn from "../Common/DappTxBtn.vue";

import ImageVue from "../Handlers/ImageVue.vue";

// Max unit is the maximum value that can be represented in Solidity
// const MAX_UNIT = 2 ** 256 - 1;

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "Wrap",
  components: {
    ImageVue,
    ConnectButton,
    Step,
    ApprovalButton,
    Chooser,
    DappTxBtn
  },
  data() {
    return {
      amount: null,
      userTokenBalance: BN(0),
      userOutputTokenBalance: BN(0),
      userApproved: BN(0),
      loading: false,
      error: false,
      dev: true, // change to true for log
      completed: false, // Full process completed (in one session)
      routes: [{ text: 'Wrap', cb: this.routeClickCb }, { text: 'Unwrap', cb: this.routeClickCb }],
      wsgETH: wsgETH,
      sgETH: sgETH,
      ABI: sgETH,
      title: "Wrap",
      descr: "Wrap sgETH to interest bearing wsgETH",
      outputTokenName: "wsgETH",
      inputTokenName: "sgETH"
    };
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler(address) {
        // log the amount of veth2 the user has deposited for withdrawal
        if (address) {
          this.loading = true;
          await this.refreshBalances();
          this.loading = false;
        }
      },
    },
  },

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),

    userHasTokenBalance() {
      return this.userTokenBalance.gt(0);
    },

    userHasApprovedToken() {
      return (
        this.userApproved.gt(0) &&
        this.userApproved.gte(
          window.web3.utils.toWei(this.amount?.toString() || '0', "ether")
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

    amountFieldLowerThanMax() {
      return (
        this.amount &&
        this.amount <
        this.userTokenBalance
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
        this.userCanRequestWithdrawal
      );
    },

    completedStepsCount() {
      return this.approvalStage + this.depositStage + 1;
    },

    stage() { // need to improve this. 
      if (!this.userWalletIsConnected) return false;
      let state = {
        approvalStage: this.approvalStage,
        depositStage: this.depositStage,
      };
      if (this.dev) console.log("State :", state);
      if (state.depositStage && !state.approvalStage) return "depositStage";
      return "approvalStage";
    },
  },

  methods: {
    routeClickCb(index, routes) {
      this.$router.push(`/${routes[index].text.toLowerCase()}`);
    },

    handleDeposit() {
      return {
        abiCall: this.wsgETH.methods.deposit,
        argsArr: [window.web3.utils.toWei(this.amount, "ether"), this.userConnectedWalletAddress],
        cb: async () => {
          await this.refreshBalances();
        }
      }
    },

    parseBN(n) {
       return n.div(10 ** 18)
                  .decimalPlaces(6)
                  .toString()
    },

    async refreshBalances() {
      // called on mount / as cb
      this.loading = true;
      await this.getUserTokenBalance();
      await this.getUserApproved();
      await this.getUserOutputTokenBalance();
      this.loading = false;
    },

    async getUserApproved() {
      let userApproved = await sgETH.methods
        .allowance(this.userConnectedWalletAddress, wsgETH.options.address)
        .call();
      this.userApproved = BN(userApproved);
      if (this.dev) console.log("userApproved", userApproved);
    },

    async getUserTokenBalance() {
      let userTokenBalance = await sgETH.methods
        .balanceOf(this.userConnectedWalletAddress)
        .call();
      this.userTokenBalance = BN(userTokenBalance);
      if (this.dev) console.log("userTokenBalance", userTokenBalance);
      return userTokenBalance;
    },

    async getUserOutputTokenBalance() {
      let userOutputTokenBalance = await wsgETH.methods
        .balanceOf(this.userConnectedWalletAddress)
        .call();
      this.userOutputTokenBalance = BN(userOutputTokenBalance);
      if (this.dev) console.log("userOutputTokenBalance", userOutputTokenBalance);
      return userOutputTokenBalance;
    },

    handleFillMaxAmount() {
      this.amount = this.userTokenBalance
        .div(10 ** 18)
        .decimalPlaces(6)
        .toString();
    },
  },
};
</script>
