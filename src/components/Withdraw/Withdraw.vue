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
import { withdrawals as ABI_withdrawals } from "@/contracts";
import BN from "bignumber.js";
import { mapGetters } from "vuex";
import RedemptionBase from "./RedemptionBase.vue";

export default {
  name: "Withdraw",
  components: { RedemptionBase },
  data() {
    return {
      ABI: ABI_withdrawals,
      title: "Withdraw",
      descr: "Withdrawals - Redeem vETH2 for ETH",
      ethAvailableForWithdrawal: BN(0),
      totalRedeemed: BN(0),
      outputTokenName: "ETH",
    };
  },
  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),
  },
  methods: {
    async getEthAvailableForWithdrawal() {
      const amt = await window.ethereum.request({
        method: "eth_getBalance",
        params: [ABI_withdrawals.options.address, "latest"],
      });

      this.ethAvailableForWithdrawal = BN(amt);
    },

    async getTotalRedeemed() {
      let amt = await ABI_withdrawals.methods.totalOut().call();
      console.log(BN(amt), 'asfaf')
      this.totalRedeemed = BN(amt);
    }
  },
};
</script>
