<template>
  <RedemptionBase :ABI="ABI" :title="title" :descr="descr" :getEthAvailableForWithdrawal="getEthAvailableForWithdrawal" />
</template>

<script>
import { rollover as ABI_Rollover } from "@/contracts";
import BN from "bignumber.js";
import { mapGetters } from "vuex";
import RedemptionBase from './RedemptionBase.vue';


export default {
  name: "Rollover",
  components: { RedemptionBase },
  data() {
    return {
      ABI: ABI_Rollover,
      title: "Rollover",
      descr: "Goerlli testnet rollover - Redeem vETH2 for sgETH",
      getEthAvailableForWithdrawal: this.getEthAvailableForRollovers,
      ethAvailableForWithdrawal: BN(0)
    }
  },
  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),
  },
  methods: {
    async getEthAvailableForRollovers() {
      let amt = await ABI_Rollover.methods
        .balanceOf(this.userConnectedWalletAddress)
        .call();
      this.ethAvailableForWithdrawal = BN(amt);
      console.log("ethAvailableForWithdrawal", amt);
    },
  }
}

</script>
