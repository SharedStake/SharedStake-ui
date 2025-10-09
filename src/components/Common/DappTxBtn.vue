<template>
  <span>
    <ConnectButton v-if="!userConnectedWalletAddress" />
    <SharedButton
      v-else-if="!loading"
      :disabled="disabled"
      @click="execTx"
    >
      <slot />
    </SharedButton>
    <LoadingSpinner v-else-if="loading" />
  </span>
</template>

<script>
import { useWallet } from "@/composables/useWallet";
import { useTokenBalance } from "@/composables/useTokenBalance";
import { useTransaction } from "@/composables/useTransaction";
import SharedButton from "./SharedButton.vue";
import { getCurrentGasPrices } from "@/utils/common";
import ConnectButton from "./ConnectButton.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  name: "DappTxBtn",
  components: { SharedButton, ConnectButton, LoadingSpinner },
  props: ["click", "cb", "chosenGas", "defaultGas", "disabled"],
  setup() {
    const { userAddress } = useWallet();
    const { BN } = useTokenBalance();
    const { executeTransaction } = useTransaction();
    return {
      userAddress,
      BN,
      executeTransaction
    };
  },
  data() {
    return {
      gasPrices: {},
      loading: false,
    };
  },

  computed: {
    userConnectedWalletAddress() {
      return this.userAddress;
    },
    gasPrice() {
      return this.chosenGas
        ? this.chosenGas
        : this.gasPrices[this.defaultGas ? this.defaultGas : "medium"];
    },
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler() {
        this.gasPrices = await getCurrentGasPrices();
      },
    },
  },

  mounted: async function () {
    this.gasPrices = await getCurrentGasPrices();
  },

  methods: {
    async execTx() {
      this.loading = true;
      let args = this.click();
      // Debug logging removed for production
      await this.wrapTx(args.abiCall, args.argsArr, args.senderObj, args.cb);
    },

    async wrapTx(
      abiCall = () => { },
      argsArr = [],
      senderObj = {},
      cb = () => { }
    ) {
      this.loading = true;
      const chosenGas = this.gasPrice;

      const txOptions = {
        maxFeePerGas: chosenGas.maxFeePerGas,
        maxPriorityFeePerGas: chosenGas.maxPriorityFeePerGas,
        ...senderObj,
      };

      try {
        const success = await this.executeTransaction(abiCall, argsArr, txOptions, cb);
        this.error = !success;
      } catch (error) {
        console.error("Transaction error:", error);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
