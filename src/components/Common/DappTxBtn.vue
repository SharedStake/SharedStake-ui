<template>
  <span>
    <ConnectButton v-if="!isConnected" />
    <SharedButton
      v-else-if="!loading"
      :disabled="disabled"
      @click="execTx"
    >
      <slot />
    </SharedButton>
    <LoadingSpinner
      v-else-if="loading"
      text="Processing..."
    />
  </span>
</template>

<script>
import { useWallet } from "@/composables/useWallet";
import { useGas } from "@/composables/useGas";
import { useTransaction } from "@/composables/useTransaction";
import SharedButton from "./SharedButton.vue";
import ConnectButton from "./ConnectButton.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  name: "DappTxBtn",
  components: { SharedButton, ConnectButton, LoadingSpinner },
  props: ["click", "cb", "chosenGas", "defaultGas", "disabled"],
  setup() {
    const { isConnected } = useWallet();
    const { getGasPrices, convertGasToWei } = useGas();
    const { executeTransaction } = useTransaction();

    return {
      isConnected,
      getGasPrices,
      convertGasToWei,
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
    gasPrice() {
      return this.chosenGas
        ? this.chosenGas
        : this.gasPrices[this.defaultGas ? this.defaultGas : "medium"];
    },
  },

  watch: {
    isConnected: {
      immediate: true,
      async handler() {
        this.gasPrices = await this.getGasPrices();
      },
    },
  },

  mounted: async function () {
    this.gasPrices = await this.getGasPrices();
  },

  methods: {
    async execTx() {
      this.loading = true;
      try {
        const args = this.click();
        
        if (!args || !this.executeTransaction.validateTransaction(args)) {
          console.error("Invalid transaction parameters");
          this.loading = false;
          return;
        }

        const { abiCall, argsArr, senderObj, cb } = args;
        
        // Convert gas prices to wei
        const txOptions = {
          ...senderObj,
          ...(this.gasPrice ? convertGasToWei(this.gasPrice) : {})
        };

        const result = await this.executeTransaction(
          abiCall,
          argsArr,
          txOptions,
          cb || this.cb
        );

        if (!result.success) {
          console.error("Transaction failed:", result.error);
        }
      } catch (error) {
        console.error("Transaction execution error:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
