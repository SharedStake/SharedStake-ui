<template>
  <div class="EarnWrapper">
    <div class="Earn">
      <geyser
        class="geyser"
        v-for="pool in pools"
        :pool="pool"
        v-bind:key="pool.name"
        :active="active === pool.name"
        @toggle="active = active == pool.name ? null : pool.name"
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
    active: null,
    pools: {
      pool1: {
        name: "SGT",
        explanation: "SharedStake Governance",
        token: SGT,
        geyser: geyser_SGT,
        locked: BN(20000),
      },
      pool2: {
        name: "vEth2",
        explanation: "validator ETH2",
        token: vEth2,
        geyser: geyser_vEth2,
        locked: BN(40000),
      },
      pool3: {
        name: "SGT LP",
        explanation: "on uniswap",
        token: SGT_uniswap,
        geyser: geyser_SGT_uniswap,
        locked: BN(20000),
      },
      pool4: {
        name: "vEth2 LP",
        explanation: "on snowswap",
        token: null,
        geyser: null,
        locked: BN(2000),
      },
    },
  }),
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
  /*  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 0px 0px;
  grid-template-areas:
    "."
    "."
    "."
    ".";
  grid-gap: 3px;
  justify-items: center;
  align-items: center;*/
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