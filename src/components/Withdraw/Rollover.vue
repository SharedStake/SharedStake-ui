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
      descr: "BROKEN do not use! | Redeem vETH2 for sgETH",
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
      try {
        const sgETHContract = ABI_sgETH();
        const rolloverContract = ABI_Rollover();
        if (!sgETHContract || !rolloverContract) {
          console.error("Contracts not available");
          return;
        }
        const rolloverAddress = await rolloverContract.getAddress();
        let amt = await sgETHContract.balanceOf(rolloverAddress);
        this.ethAvailableForWithdrawal = BN(amt.toString()).multipliedBy(0);
        // this.ethAvailableForWithdrawal = BN(amt.toString());
      } catch (error) {
        console.error("Error getting sgETH available for withdrawal:", error);
        this.ethAvailableForWithdrawal = BN(0);
      }
    },
    async getTotalRedeemed() {
      try {
        const rolloverContract = ABI_Rollover();
        if (!rolloverContract) {
          console.error("Rollover contract not available");
          return;
        }
        let amt = await rolloverContract.totalOut();
        this.totalRedeemed = BN(amt.toString());
      } catch (error) {
        console.error("Error getting total redeemed:", error);
        this.totalRedeemed = BN(0);
      }
    }
  },
};
</script>
