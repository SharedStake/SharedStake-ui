<template>
  <div class="flex_column Earn">
    <geyser v-for="pool in pools" :pool="pool" v-bind:key="pool.name" />
  </div>
</template>

<script>
import geyser from "./geyser.vue";
import {
  SGT,
  vEth2,
  SGT_uniswap,
  geyser_vEth2,
  geyser_SGT,
  geyser_SGT_uniswap,
} from "@/contracts";
export default {
  components: { geyser },
  data: () => ({
    pools: {
      pool1: { name: "SGT", geyser: geyser_SGT, token: SGT },
      pool3: { name: "SGT LP", geyser: geyser_SGT_uniswap, token: SGT_uniswap },
      pool2: { name: "vEth2", geyser: geyser_vEth2, token: vEth2 },
      pool4: { name: "vEth2 LP", geyser: null, token: null },
    },
  }),
};
</script>

<style scoped>
.Earn {
  overflow-y: scroll;
  scroll-behavior: smooth;
  align-items: center;
  justify-content: flex-start;
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