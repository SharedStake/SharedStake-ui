<template>
  <span>
  <dapp-tx-btn 
    v-if="autoHide ? !enoughApproved : true"
    :click="genProps"
    :cb="wrappedCb"
  >
    <span>Approve</span>
  </dapp-tx-btn>
</span>
</template>

<script>

import { mapGetters } from "vuex";
import DappTxBtn from "../Common/DappTxBtn.vue";

import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "ApprovalButton",
  props: ["ABI_spender", "ABI_token", "amount", "cb", "autoHide"],
  components: { DappTxBtn },
  data() {
  return {
      userApproved: BN(0)
    }
  },

  mounted: async function () {
    await this.getApproved();
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler() {
        await this.getApproved();
      }
    }
  },

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),

    enoughApproved() {
      return this.userApproved.gte(this.amount)
    },

    ethAmt() {
      return window.web3.utils.toWei(this.amount?.toString(), "ether");
    },
  },
  methods: {
    genProps() {
      return {
        abiCall: this.ABI_token.methods.approve,
        argsArr: [this.ABI_spender.options.address, this.ethAmt],
        cb: this.wrappedCb
      }
    },
    async wrappedCb() {
      await this.getApproved();
      await this.cb();
    },

    async getApproved() {
      let userApproved = await this.ABI_token.methods
        .allowance(
          this.userConnectedWalletAddress,
          this.ABI_spender.options.address
        )
        .call();
      this.userApproved = BN(userApproved);
    },
  }
}
</script>
