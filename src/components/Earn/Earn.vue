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
import { mapGetters } from "vuex";
import geyser from "./geyser.vue";
import {
  SGT,
  vEth2,
  SGT_uniswap,
  geyser_vEth2,
  geyser_SGT,
  geyser_SGT_uniswap,
  vEth2_saddle,
  geyser_vEth2_saddle,
  SGT_vEth2_uniswap,
  geyser_SGT_vEth2_uniswap,
  oldPools,
} from "@/contracts";
import Claim from "./claim.vue";
export default {
  components: { geyser, Claim },
  data: () => ({
    chosen: null,
    pools: [
      {
        name: "SGT",
        pic: "tokens/logo-red.svg",
        explanation: "SharedStake Governance",
        token: SGT,
        geyser: geyser_SGT,
        locked: BN(39000),
        external: false,
        active: true,
        tokenPerSgt: 1,
        oldPool: oldPools["geyser_SGT"],
        link:
          "https://info.uniswap.org/token/0x84810bcf08744d5862b8181f12d17bfd57d3b078", //for inactive pools => change this to uniswap
      },
      {
        name: "SGT - Eth",
        explanation: "on uniswap",
        pic: "tokens/SGT LP.png",
        token: SGT_uniswap,
        geyser: geyser_SGT_uniswap,
        locked: BN(90000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        oldPool: oldPools["geyser_SGT_uniswap"],
        link:
          "https://info.uniswap.org/pair/0x3d07f6e1627da96b8836190de64c1aed70e3fc55", //for inactive pools => change this to uniswap
      },
      {
        name: "SGT - vEth2",
        explanation: "on uniswap",
        pic: "tokens/SGT LP.png",
        token: SGT_vEth2_uniswap,
        geyser: geyser_SGT_vEth2_uniswap,
        locked: BN(87500),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link:
          "https://info.uniswap.org/pair/0xc794746df95c4b7043e8d6b521cfecab1b14c6ce", //for inactive pools => change this to uniswap
      },
      {
        name: "vEth2 - wEth",
        explanation: "on saddle",
        pic: "tokens/saddle.svg",
        token: vEth2_saddle,
        geyser: geyser_vEth2_saddle,
        locked: BN(24000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link: "https://saddle.exchange/#/deposit/veth2", //for inactive pools => change this to uniswap
      },
      {
        name: "vEth2",
        explanation: "validator ETH2",
        pic: "vEth2.png",
        token: vEth2,
        geyser: geyser_vEth2,
        locked: BN(39000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        oldPool: oldPools["geyser_vEth2"],

        link: "https://www.sharedstake.org/stake", //for inactive pools
      },
    ],
  }),
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },
  mounted: async function () {
    await this.mounted();
  },
  watch: {
    async userAddress(newVal) {
      if (newVal) await this.mounted;
      console.log(newVal);
    },
  },
  methods: {
    async mounted() {
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
        this.pools[4].tokenPerSgt = tokenPerSgt; // vEth2 is assumed to be 1 eth => possible improvement = use saddle pool
        this.pools[3].tokenPerSgt = tokenPerSgt; //saddle pool's LP token is simply 1 eth => possible improvement = get more accurate approach
        // pool 2
        let totalSupply = await token.methods.totalSupply().call();
        tokenPerSgt = totalSupply / (Sgt * 2);
        this.pools[1].tokenPerSgt = tokenPerSgt;
      }
      if (this.pools[2].active) {
        //not if its goerli => testing ju1st sgt
        let tokenPerSgt = 0;
        let token = this.pools[2].token;
        let reserves = await token.methods.getReserves().call();
        let vEth2 = reserves[1];
        let Sgt = reserves[0];
        tokenPerSgt = vEth2 / Sgt; //ok
        // pool 2
        let totalSupply = await token.methods.totalSupply().call();
        tokenPerSgt = totalSupply / (Sgt * 2);
        this.pools[2].tokenPerSgt = tokenPerSgt;
      }
    },
  },
};
</script>

<style scoped>
.EarnWrapper {
  font-family: "Work Sans";
  padding-top: 100px;
  padding-bottom: 5vh;
}
.Earn {
  scroll-behavior: smooth;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
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