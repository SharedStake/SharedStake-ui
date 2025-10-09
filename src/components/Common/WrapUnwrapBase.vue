<template>
  <div class="w-5/6 max-w-2xl pt-40 mx-auto">
    <section class="relative gap-4 p-6 my-10 text-white bg-gray-800 shadow-md rounded-xl">
      <span
        class="absolute p-1 px-3 text-sm font-bold text-gray-200 transform -translate-x-1/2 rounded-full opacity-95 left-1/2 -top-3 bg-brand-primary"
      >Beta</span>

      <Chooser
        :routes="routes"
        :current-active="title == 'Wrap' ? 0 : 1"
      />

      <div class="flex flex-col items-center justify-center">
        <header class="pb-3 my-4 text-center">
          <h1 class="text-3xl font-semibold">
            {{ title }}
          </h1>
          <p class="text-sm text-gray-300">
            {{ descr }}
          </p>
        </header>

        <!-- Progress - show completed steps status -->
        <ProgressSteps
          :show-progress="userWalletIsConnected"
          :steps="progressSteps"
        />

        <label v-if="depositStage || approvalStage">
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            How much {{ inputTokenName }} would you like to stake for {{ outputTokenName }}?
          </p>
          <TokenInput
            v-model="amount"
            :token-name="inputTokenName"
            :placeholder="formatBalance(userTokenBalance)"
            @max="handleFillMaxAmount"
          />
          <p class="text-sm font-semibold text-gray-300 mb-0.5">
            Current {{ outputTokenName }} Balance: {{ parseBN(userOutputTokenBalance) }} 
          </p>
        </label>

        <!-- Action buttons -->
        <div
          v-if="!completed"
          class="my-6"
        >
          <LoadingSpinner v-if="loading" />

          <ConnectButton v-else-if="!userConnectedWalletAddress" />

          <template v-else>
            <p
              v-if="!userHasTokenBalance"
              class="mt-2 text-sm font-semibold text-gray-200"
            >
              You need to have {{ inputTokenName }} tokens in your wallet in order to continue
              {{ outputTokenName }}.
            </p>

            <ApprovalButton
              v-else-if="stage == 'approvalStage'"
              :ABI_token="sgETH"
              :ABI_spender="wsgETH"
              :amount="amount"
              :cb="getUserApproved"
            />

            <dapp-tx-btn
              v-else-if="stage == 'depositStage'"
              :click="handleDeposit"
            >
              <span> {{ title }}</span>
            </dapp-tx-btn>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { wsgETH, sgETH } from "@/contracts";
import { useWallet } from "@/composables/useWallet";
import { useTokenBalance } from "@/composables/useTokenBalance";
import ConnectButton from "../Common/ConnectButton.vue";
import ApprovalButton from "../Common/ApproveButton.vue";
import Chooser from "../Common/Chooser.vue";
import DappTxBtn from "../Common/DappTxBtn.vue";
import LoadingSpinner from "../Common/LoadingSpinner.vue";
import TokenInput from "../Common/TokenInput.vue";
import ProgressSteps from "../Common/ProgressSteps.vue";

export default {
  name: "Wrap",
  components: {
    ConnectButton,
    ApprovalButton,
    Chooser,
    DappTxBtn,
    LoadingSpinner,
    TokenInput,
    ProgressSteps
  },
  setup() {
    const { userAddress } = useWallet();
    const { formatBalance, parseBalance, getTokenBalance, getTokenAllowance, BN } = useTokenBalance();
    return {
      userAddress,
      formatBalance,
      parseBalance,
      getTokenBalance,
      getTokenAllowance,
      BN
    };
  },
  data() {
    return {
      amount: null,
      userTokenBalance: this.BN(0),
      userOutputTokenBalance: this.BN(0),
      userApproved: this.BN(0),
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

  computed: {
    userConnectedWalletAddress() {
      return this.userAddress;
    },

    userHasTokenBalance() {
      return this.userTokenBalance.gt(0);
    },

    userHasApprovedToken() {
      return (
        this.userApproved.gt(0) &&
        this.userApproved.gte(this.parseBalance(this.amount || 0))
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

    progressSteps() {
      return [
        {
          title: `Approve ${this.inputTokenName}`,
          completed: this.depositStage
        },
        {
          title: `Wrap ${this.inputTokenName}`,
          completed: this.completed
        }
      ];
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

  methods: {
    routeClickCb(index, routes) {
      const targetRoute = `/${routes[index].text.toLowerCase()}`;
      if (this.$route.path !== targetRoute) {
        this.$router.push(targetRoute);
      }
    },

    handleDeposit() {
      return {
        abiCall: async (...args) => {
          const contract = this.wsgETH(true); // Use signer for write operations
          if (!contract) {
            throw new Error("wsgETH contract not available");
          }
          return await contract.deposit(...args);
        },
        argsArr: [ethers.parseEther(this.amount.toString()), this.userConnectedWalletAddress],
        cb: async () => {
          await this.refreshBalances();
        }
      }
    },

    parseBN(n) {
       return this.formatBalance(n);
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
      try {
        const sgETHContract = sgETH();
        const wsgETHContract = wsgETH();
        if (!sgETHContract || !wsgETHContract) {
          console.error("Contracts not available");
          return;
        }
        const wsgETHAddress = await wsgETHContract.getAddress();
        this.userApproved = await this.getTokenAllowance(sgETHContract, wsgETHAddress);
      } catch (error) {
        console.error("Error getting user approved:", error);
        this.userApproved = this.BN(0);
      }
    },

    async getUserTokenBalance() {
      try {
        const sgETHContract = sgETH();
        this.userTokenBalance = await this.getTokenBalance(sgETHContract);
      } catch (error) {
        console.error("Error getting user token balance:", error);
        this.userTokenBalance = this.BN(0);
      }
      return this.userTokenBalance;
    },

    async getUserOutputTokenBalance() {
      try {
        const wsgETHContract = wsgETH();
        this.userOutputTokenBalance = await this.getTokenBalance(wsgETHContract);
      } catch (error) {
        console.error("Error getting user output token balance:", error);
        this.userOutputTokenBalance = this.BN(0);
      }
      return this.userOutputTokenBalance;
    },

    handleFillMaxAmount() {
      this.amount = this.formatBalance(this.userTokenBalance);
    },
  },
};
</script>
