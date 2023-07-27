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

      await abiCall(...argsArr)
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
  },
};
</script>
