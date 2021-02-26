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
      <Claim />
    </div>
  </div>
</template>

<script>
import BN from "bignumber.js";
import geyser from "./geyser.vue";
import {
  SGT,
  vEth2,
  SGT_uniswap,
  geyser_vEth2,
  geyser_SGT,
  geyser_SGT_uniswap,
} from "@/contracts";
import Claim from "./claim.vue";
export default {
  components: { geyser, Claim },
  data: () => ({
    chosen: null,
    pools: [
      {
        name: "SGT",
        pic: "logo-red.svg",
        explanation: "SharedStake Governance",
        token: SGT,
        geyser: geyser_SGT,
        locked: BN(50000),
        external: false,
        active: true,
        tokenPerSgt: 1,
        link:
          "https://info.uniswap.org/token/0x84810bcf08744d5862b8181f12d17bfd57d3b078", //for inactive pools => change this to uniswap
      },
      {
        name: "SGT LP",
        explanation: "on uniswap",
        pic: "tokens/SGT LP.png",
        token: SGT_uniswap,
        geyser: geyser_SGT_uniswap,
        locked: BN(75000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link:
          "https://info.uniswap.org/pair/0x3d07f6e1627da96b8836190de64c1aed70e3fc55", //for inactive pools => change this to uniswap
      },
      {
        name: "vEth2",
        explanation: "validator ETH2",
        pic: "vEth2.png",
        token: vEth2,
        geyser: geyser_vEth2,
        locked: BN(75000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link: "https://www.sharedstake.org/stake", //for inactive pools
      },
      {
        name: "vEth2 LP",
        explanation: "on snowswap",
        token: null,
        pic: "tokens/vEth2 LP.png",
        geyser: null,
        locked: BN(1),
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
    if (this.pools[1].active) {
      //not if its goerli => testing ju1st sgt
      let tokenPerSgt = 0;
      // pool1
      let token = this.pools[1].token;
      let reserves = await token.methods.getReserves().call();
      let Eth = reserves[1];
      let Sgt = reserves[0];
      tokenPerSgt = Eth / Sgt; //ok
      this.pools[2].tokenPerSgt = tokenPerSgt;
      console.log(tokenPerSgt);
      // pool 2
      let totalSupply = await token.methods.totalSupply().call();
      tokenPerSgt = totalSupply / (Sgt * 2);
      this.pools[1].tokenPerSgt = tokenPerSgt;
    }
    // no need for 3. pool
  },
};
</script>

<style scoped>
.EarnWrapper {
  font-family: "Work Sans";
  padding-top: 15vh;
  padding-bottom: 5vh;
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
  color: rgb(250, 82, 160);
  font-size: 22px;
}
</style>