<template>
  <div class="dashboard">
    <div class="Stats grid-container">
      <obj
        v-for="object in objects"
        v-bind:key="object.class"
        :class="object.class"
        :head="object.head"
        :stat="object.stat"
        :input="object.input"
        :type="object.type"
      />
      <Header class="header" />
      <PoP class="PoP" />
      <vETH2 class="vEth2" />
    </div>
  </div>
</template>

<script>
import Header from "./header.vue";
import obj from "./obj.vue";
import PoP from "./PoP.vue";
import vETH2 from "./vETH2.vue";
export default {
  components: { obj, Header, PoP, vETH2 },
  data: () => ({
    objects: [
      {
        class: "totalStaked",
        head: "Total Staked Ether",
        type: "graph",
        stat: "16000",
        input: [16000, 16000, 16000, 16000, 16000, 16000, 16000],
      },
      {
        class: "exitPool",
        head: "Exit Pool Liquidity",
        stat: "0",
        type: "graph",
        input: [0, 0, 0, 0, 0, 0, 0],
      },
      {
        class: "stakers",
        head: "Stakers",
        type: "growth",
        stat: "5703",
        input: 300,
      },
      {
        class: "SGT",
        head: "SGT price",
        stat: 50,
        type: "growth",
        input: -36.84,
      },
      {
        class: "pools",
        head: "vEth2 Price",
        type: "growth",
        stat: 2500,
        input: -36.84,
      },
      {
        class: "protocols",
        head: "Supported Protocols",
        stat: 6,
        type: "explanation",
        input: [
          "Saddle",
          "Curve",
          "Uniswap",
          "SushiSwap",
          "SharedStake",
          "Ruler",
        ],
      },
      {
        class: "invested",
        head: "Pools you invested",
        type: "explanation",
        stat: 3,
        input: ["Saddle-wETH", "SharedStake", "Uniswap-SGT"],
      },
    ],
  }),
};
</script>

<style scoped>
.dashboard {
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  padding-top: 70px;
  padding-bottom: 5vh;
  position: relative;
}
.Stats {
  width: calc(100% - 60px);
  height: calc(100% - 30px);
  max-width: 1500px;
  margin: 0px auto;
  padding: 60px 0px;
  position: relative;
  justify-content: space-between;
  color: #fff;
  display: grid;
  z-index: 1;
}
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 3fr 3fr 3fr;
  gap: 10px 10px;
  grid-template-areas:
    "header header header header"
    "totalStaked exitPool stakers PoP"
    "vEth2 vEth2 pools SGT"
    "vEth2 vEth2 protocols invested ";
}
.header {
  grid-area: header;
}
.vEth2 {
  grid-area: vEth2;
}
.pools {
  grid-area: pools;
}
.SGT {
  grid-area: SGT;
}
.PoP {
  grid-area: PoP;
}
.protocols {
  grid-area: protocols;
}
.stakers {
  grid-area: stakers;
}
.invested {
  grid-area: invested;
}
.exitPool {
  grid-area: exitPool;
}
.totalStaked {
  grid-area: totalStaked;
}
</style>