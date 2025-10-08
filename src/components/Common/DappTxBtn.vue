<template>
  <span>
    <ConnectButton v-if="!userConnectedWalletAddress" />
    <SharedButton v-else-if="!loading" @click="execTx" :disabled="disabled">
      <slot />
    </SharedButton>
    <p v-else-if="loading">
      <ImageVue :src="'loading.svg'" :size="'45px'" />
    </p>
  </span>
</template>

<script>
import { useWalletStore } from "@/stores/wallet";
import SharedButton from "./SharedButton.vue";
import {
  notifyHandler,
  notifyNotification,
  getCurrentGasPrices,
} from "@/utils/common";
import ImageVue from "../Handlers/ImageVue.vue";
import ConnectButton from "./ConnectButton.vue";

import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "DappTxBtn",
  props: ["click", "cb", "chosenGas", "defaultGas", "disabled"],
  components: { SharedButton, ImageVue, ConnectButton },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore
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
      return this.walletStore.userAddress;
    },
    gasPrice() {
      return this.chosenGas
        ? this.chosenGas
        : this.gasPrices[this.defaultGas ? this.defaultGas : "medium"];
    },
  },

  mounted: async function () {
    this.gasPrices = await getCurrentGasPrices();
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler() {
        this.gasPrices = await getCurrentGasPrices();
      },
    },
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

      if (!abiCall || typeof abiCall !== 'function') {
        console.error("abiCall is not a valid function");
        this.loading = false;
        return;
      }

      // ethers.js transaction syntax
      const txOptions = {
        // Transactions now handled in accordance EIP-1559
        maxFeePerGas: BN(chosenGas.maxFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
        maxPriorityFeePerGas: BN(chosenGas.maxPriorityFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
        ...senderObj,
      };

      // Remove 'from' field as ethers.js uses the signer's address automatically
      delete txOptions.from;

      try {
        const tx = await abiCall(...argsArr, txOptions);
        
        // Validate transaction object
        if (!tx || !tx.hash) {
          throw new Error("Invalid transaction object returned from contract call");
        }
        
        // Handle transaction hash notification
        notifyHandler(tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          this.error = false;
          notifyNotification("Tx successful", "success");
          await cb();
        } else {
          this.error = true;
          notifyNotification("Tx failed", "error");
        }
      } catch (error) {
        console.error("Transaction error:", error);
        this.error = true;
        notifyNotification("Transaction failed", "error");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
