<template>
  <div class="dashboard">
    <div class="Stats grid-container">
      <Header class="header" />
      <obj
        class="totalStaked"
        :head="'Total Staked Ether'"
        :stat="20340"
        :graph="'mama'"
      />
      <obj
        class="exitPool"
        :head="'Exit Pool Liquidity'"
        :stat="3634"
        :graph="'mama'"
      />
      <obj
        class="invested"
        :head="'Pools you invested'"
        :stat="3"
        :graph="'mama'"
      />
      <obj class="stakers" :head="'Total Stakers'" :stat="5703" :growth="2" />
      <PoP class="PoP" />
      <obj class="SGT" :head="'SGT price'" :stat="50" :growth="36.84" />
      <obj
        class="protocols"
        :head="'Supported Protocols'"
        :stat="6"
        :growth="1"
      />
      <obj class="pools" :head="'vEth2 Pools'" :stat="8" :growth="2" />
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
};
</script>

<style>
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
    "totalStaked exitPool invested stakers"
    "vEth2 vEth2 protocols PoP"
    "vEth2 vEth2 pools SGT";
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