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
import { mapGetters } from "vuex";
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
  data() {
    return {
      gasPrices: {},
      loading: false,
    };
  },

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),
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
      await this.wrapTx(args.abiCall, args.argsArr, args.senderObj, args.cb);
    },

    async wrapTx(
      abiCall = () => { },
      argsArr = [],
      senderObj = {},
      cb = () => { }
    ) {
      // console.log(senderObj);
      this.loading = true;
      const chosenGas = this.gasPrice;

      try {
        // Validate that abiCall is a proper Web3 contract method
        if (!abiCall || typeof abiCall !== 'function') {
          throw new Error("Invalid contract method provided");
        }

        const contractMethod = abiCall(...argsArr);
        if (!contractMethod || typeof contractMethod.send !== 'function') {
          throw new Error("Contract method does not have a send function. Make sure the contract is properly initialized.");
        }

        await contractMethod
          .send({
            // Transactions now handled in accordance EIP-1559
            from: this.userConnectedWalletAddress,
            maxFeePerGas: BN(chosenGas.maxFeePerGas)
              .multipliedBy(1000000000)
              .toString(),
            maxPriorityFeePerGas: BN(chosenGas.maxPriorityFeePerGas)
              .multipliedBy(1000000000)
              .toString(),
            ...senderObj,
          })

        .on("transactionHash", function (hash) {
          notifyHandler(hash);
        })
        .once("confirmation", async () => {
          this.error = false;
          notifyNotification("Tx successful", "success");
          await cb();
        })
        .on("error", (error) => {
          console.error("Transaction error:", error);
          this.error = true;
          notifyNotification("Transaction failed", "error");
        })
        .catch((error) => {
          console.error("Transaction catch error:", error);
          this.error = true;
          notifyNotification("Transaction failed", "error");
        })
        .finally(() => {
          this.loading = false;
        });
      } catch (error) {
        console.error("Contract method error:", error);
        this.error = true;
        this.loading = false;
        notifyNotification("Contract method error: " + error.message, "error");
      }
    },
  },
};
</script>
