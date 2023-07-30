<template>
  <RedemptionBase
    :ABI="ABI"
    :title="title"
    :descr="descr"
    :getEthAvailableForWithdrawal="getEthAvailableForWithdrawal"
    :ethAvailableForWithdrawal="ethAvailableForWithdrawal"
    :outputTokenName="outputTokenName"
    :totalRedeemed="totalRedeemed"
    :getTotalRedeemed="getTotalRedeemed"
  />
</template>

<script>
import { rollovers as ABI_Rollover, sgETH as ABI_sgETH } from "@/contracts";
import BN from "bignumber.js";
import { mapGetters } from "vuex";
import RedemptionBase from "./RedemptionBase.vue";

export default {
  name: "Rollover",
  components: { RedemptionBase },
  data() {
    return {
      ABI: ABI_Rollover,
      title: "Rollover",
      descr: "Redeem vETH2 for sgETH",
      ethAvailableForWithdrawal: BN(0),
      totalRedeemed: BN(0),
      outputTokenName: "sgETH"
    };
  },
  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),
  },
  methods: {
    async getEthAvailableForWithdrawal() {
      let amt = await ABI_sgETH.methods
        .balanceOf(ABI_Rollover.options.address)
        .call();
      this.ethAvailableForWithdrawal = BN(amt);
    },
    async getTotalRedeemed() {
      let amt = await ABI_Rollover.methods.totalOut().call();
      this.totalRedeemed = BN(amt);
    }
  },
};
</script>
