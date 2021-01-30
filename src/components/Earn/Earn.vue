<template>
  <div class="EarnWrapper">
    <div class="Earn">
      <geyser
        class="geyser"
        v-for="pool in pools"
        :pool="pool"
        v-bind:key="pool.name"
        :chosen="chosen === pool.name"
        @toggle="chosen = chosen == pool.name ? null : pool.name"
      />
    </div>
    <Arrow :direction="'down'" :size="28" class="arrow" />
  </div>
</template>

<script>
import BN from "bignumber.js";
import geyser from "./geyser.vue";
import Arrow from "../../assets/svg/arrow.vue";
import {
  SGT,
  vEth2,
  SGT_uniswap,
  geyser_vEth2,
  geyser_SGT,
  geyser_SGT_uniswap,
} from "@/contracts";
export default {
  components: { geyser, Arrow },
  data: () => ({
    chosen: null,
    pools: [
      {
        name: "SGT",
        explanation: "SharedStake Governance",
        token: SGT,
        geyser: geyser_SGT,
        locked: BN(1000),
        external: false,
        active: false,
        tokenPerSgt: 1,
        link:
          "https://etherscan.io/address/0x0a2395cA473c3c756738905574F71A20A19e8dB2", //for inactive pools => change this to uniswap
      },
      {
        name: "vEth2",
        explanation: "validator ETH2",
        token: vEth2,
        geyser: geyser_vEth2,
        locked: BN(40000),
        external: false,
        active: false,
        tokenPerSgt: 0,
        link: "https://www.sharedstake.org/stake", //for inactive pools
      },
      {
        name: "SGT LP",
        explanation: "on uniswap",
        token: SGT_uniswap,
        geyser: geyser_SGT_uniswap,
        locked: BN(20000),
        external: false,
        active: false,
        tokenPerSgt: 0,
        link:
          "https://etherscan.io/address/0x0a2395cA473c3c756738905574F71A20A19e8dB2", //for inactive pools => change this to uniswap
      },
      {
        name: "vEth2 LP",
        explanation: "on snowswap",
        token: null,
        geyser: null,
        locked: BN(2000),
        external: true,
        active: false,
        status:
          "Check out snowswap to stake your eth2snow tokens with extra SGT rewards!", //for inactive pools
        link: "https://snowswap.org/ethsnow/deposit", //for inactive pools
      },
    ],
  }),
  mounted: async function () {
    // apy = 100* ( sgtprice* locked amount / (token price * staked amount))=
    // 100* (sgtprice/tokenprice)*locked/staked
    // tokenPerSgt=sgtprice/tokenprice
    if (this.pools[2].active) {
      //not if its goerli => testing ju1st sgt
      console.log("asas");
      let tokenPerSgt = 0;
      // pool1
      let token = this.pools[2].token;
      let reserves = await token.methods.getReserves().call();
      let Eth = reserves[0];
      let Sgt = reserves[1];
      tokenPerSgt = Eth / Sgt; //revise
      this.pools[1].tokenPerSgt = tokenPerSgt;

      // pool 2
      let totalSupply = await token.methods.totalSupply().call();
      tokenPerSgt = (Eth + Sgt) / totalSupply / Eth; //or maybe divide to sgt?
      this.pools[2].tokenPerSgt = tokenPerSgt;
    }
    // no need for 3. pool
  },
};
</script>

<style scoped>
.EarnWrapper {
  overflow-y: scroll;
}
.Earn {
  scroll-behavior: smooth;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.arrow {
  position: fixed;
  bottom: 5vh;
  right: 5vw;
}
span {
  text-align: left;
  font-size: 18px;
}
.logo {
  font-family: "Big Shoulders Stencil Display", cursive;
  color: #ff007a;
  font-size: 22px;
}
</style>