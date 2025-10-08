<template>
  <RedemptionBase
    :ABI="ABI"
    :title="title"
    :descr="descr"
    :get-eth-available-for-withdrawal="getEthAvailableForWithdrawal"
    :eth-available-for-withdrawal="ethAvailableForWithdrawal"
    :output-token-name="outputTokenName"
    :total-redeemed="totalRedeemed"
    :get-total-redeemed="getTotalRedeemed"
  />
</template>

<script>
import { rollovers as ABI_Rollover, sgETH as ABI_sgETH } from "@/contracts";
import BN from "bignumber.js";
import { useWalletStore } from "@/stores/wallet";
import RedemptionBase from "./RedemptionBase.vue";

export default {
  name: "Rollover",
  components: { RedemptionBase },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore
    };
  },
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
    userConnectedWalletAddress() {
      return this.walletStore.userAddress;
    },
  },
  methods: {
    async getEthAvailableForWithdrawal() {
      try {
        const sgETHContract = ABI_sgETH();
        const rolloverContract = this.ABI();
        if (!sgETHContract || !rolloverContract) return;
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
        const rolloverContract = this.ABI();
        if (!rolloverContract) return;
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
