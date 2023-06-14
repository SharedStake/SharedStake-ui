<template>
  <SharedButton @click="handleApproveVEth2">
    <span>Approve</span>
  </SharedButton>
</template>

<script>

import { mapGetters } from "vuex";
import SharedButton from "../Common/SharedButton.vue";

import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "ApprovalButton",
  props: ["ABI", "ABI_token", "amount", "userApprovedVEth2", "getUserApprovedVEth2", "wrapTx"],
  components: {SharedButton},

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),

    ethAmt() {
      return window.web3.utils.toWei(this.amount?.toString(), "ether");
    },
  },
  methods: {
    async handleApproveVEth2() {
      // Wrap tx is inherited from parent component in props and is used to update parent properties e,g, for loading spinners 
      await this.wrapTx(
        this.ABI_token.methods.approve,
        [this.ABI.options.address, this.ethAmt],
        this.getUserApprovedVEth2 // update state to trigger next step
      )
    },
  }
}
</script>
