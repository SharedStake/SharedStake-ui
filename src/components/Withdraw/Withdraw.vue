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
      if (!this.userConnectedWalletAddress) {
        // User not connected, skip contract calls
        return;
      }
      try {
        const contract = this.ABI(); // Use this.ABI() which is the function
        if (!contract) {
          console.error("Withdrawals contract not available - wallet may not be connected");
          return;
        }
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
      if (!this.userConnectedWalletAddress) {
        // User not connected, skip contract calls
        return;
      }
      try {
        const contract = this.ABI(); // Use this.ABI() which is the function
        if (!contract) {
          console.error("Withdrawals contract not available - wallet may not be connected");
          return;
        }
        let amt = await contract.totalAssetsOut();
        this.totalRedeemed = BN(amt.toString());
      } catch (error) {
        console.error("Error getting total redeemed:", error);
        this.totalRedeemed = BN(0);
      }
    }
  },
};
</script>
