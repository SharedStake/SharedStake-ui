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
      try {
        const contract = this.ABI();
        if (!contract) return;
        const contractAddress = await contract.getAddress();
        const amt = await window.ethereum.request({
          method: "eth_getBalance",
          params: [contractAddress, "latest"],
        });

        this.ethAvailableForWithdrawal = BN(amt);
      } catch (error) {
        console.error("Error getting ETH available for withdrawal:", error);
        this.ethAvailableForWithdrawal = BN(0);
      }
    },

    async getTotalRedeemed() {
      try {
        const contract = this.ABI();
        if (!contract) return;
        let amt = await contract.totalOut();
        this.totalRedeemed = BN(amt.toString());
      } catch (error) {
        console.error("Error getting total redeemed:", error);
        this.totalRedeemed = BN(0);
      }
    }
  },
};
</script>
