<template>
  <RedemptionBase :ABI="ABI" :title="title" :descr="descr" :getEthAvailableForWithdrawal="getEthAvailableForWithdrawal"
    :ethAvailableForWithdrawal="ethAvailableForWithdrawal" />
</template>

<script>
import { withdrawals as ABI_withdrawals } from "@/contracts";
import BN from "bignumber.js";
import { mapGetters } from "vuex";
import RedemptionBase from './RedemptionBase.vue';

export default {
  name: "Withdraw",
  components: { RedemptionBase },
  data() {
    return {
      ABI: ABI_withdrawals,
      title: "Withdraw",
      descr: "Goerli testnet withdrawals - Redeem vETH2 for ETH",
      ethAvailableForWithdrawal: BN(0)
    }
  },
  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),
  },
  methods: {
    async getEthAvailableForWithdrawal() {
      // console log withdrawal contract's ETH balance
      const amt = await window.web3.eth.getBalance(
        ABI_withdrawals.options.address
      );

      this.ethAvailableForWithdrawal = BN(amt);
      console.log("ethAvailableForWithdrawal", amt);
    },
  }
}

</script>
