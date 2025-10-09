<template>
  <div class="EarnWrapper">
    <div class="Earn">
      <div style="margin-top: 10px">
        <div class="notification">
          Checkout
          <a
            href="https://bunni.pro/stake"
            target="_blank"
            rel="noopener noreferrer"
          >
            bunni.pro</a>
          for new farming pools!
        </div>
        <div class="notification">
          Please withdraw remaining funds from the following old pools
        </div>
      </div>
      <newGeyser
        v-for="pool in newPools"
        :key="pool.name"
        class="geyser"
        :pool="pool"
        :chosen="chosen === pool.name"
        @toggle="chosen = chosen == pool.name ? null : pool.name"
      />
      <div class="notification">
        Old farms - please withdraw ASAP
      </div>
      <geyser
        v-for="pool in pools"
        :key="pool.name"
        class="geyser geyser-old"
        :pool="pool"
        :chosen="chosen === pool.name"
        @toggle="chosen = chosen == pool.name ? null : pool.name"
      />
      <Claim />
    </div>
  </div>
</template>

<script>
import BN from "bignumber.js";
import { useWalletStore } from "@/stores/wallet";
import geyser from "./geyser.vue";
import newGeyser from "./geyserV2.vue";
import {
  SGT,
  vEth2,
  SGT_uniswap,
  geyser_vEth2,
  geyser_SGT,
  geyser_SGT_uniswap,
  SGT_vEth2_uniswap,
  geyser_SGT_vEth2_uniswap,
  SGT_sushiswap,
  masterchef,
  veSGT,
  vETH2_CRV,
  oldPools,
} from "@/contracts";
const Claim = () => import("./claim.vue");
import { vEth2Price } from "@/utils/veth2.js";

export default {
  components: { geyser, Claim, newGeyser },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore
    };
  },
  data: () => ({
    chosen: null,
    pools: [
      // Note that order of these pools affects functionality in mounted-lifetime method.
      // Pool configuration order is important for proper display
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
          "https://v2.info.uniswap.org/token/0x84810bcf08744d5862b8181f12d17bfd57d3b078",
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
          "https://v2.info.uniswap.org/pair/0x3d07f6e1627da96b8836190de64c1aed70e3fc55",
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
          "https://v2.info.uniswap.org/pair/0xc794746df95c4b7043e8d6b521cfecab1b14c6ce",
      },
      {
        name: "vEth2",
        explanation: "validator ETH2",
        pic: "vEth2_1.png",
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
    newPools: [
      {
        name: "SGT - Eth",
        explanation: "on Sushiswap",
        pic: "tokens/sushi.png",
        token: SGT_sushiswap,
        geyser: masterchef,
        locked: BN(90000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link:
          "https://app.sushi.com/add/ETH/0x24C19F7101c1731b85F1127EaA0407732E36EcDD",
      },
      {
        name: "veSGT",
        explanation: "Vote Escrowed SGT",
        pic: "tokens/logo-red.svg",
        token: veSGT,
        geyser: masterchef,
        locked: BN(90000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link: "https://sharedtools.org",
      },

      {
        name: "vETH2-ETH",
        explanation: "on Curve",
        pic: "tokens/crv.png",
        token: vETH2_CRV,
        geyser: masterchef,
        locked: BN(90000),
        external: false,
        active: true,
        tokenPerSgt: 0,
        link: "https://curve.fi/factory/49",
      },
    ],
  }),
  computed: {
    userAddress() {
      return this.walletStore.userAddress;
    },
  },
  watch: {
    async userAddress(newVal) {
      if (newVal) await this.mounted;
    },
  },
  mounted: async function() {
    await this.mounted();
  },
  methods: {
    async mounted() {
      if (this.pools[1].active) {
        try {
          let token = SGT_uniswap();
          if (!token) {
            console.warn("SGT_uniswap contract not available");
            return;
          }
          let uniswapEthSgtReserves = await token.getReserves();
          let sgtOnUniswapLP = uniswapEthSgtReserves[0];
          let ethOnUniswapLP = uniswapEthSgtReserves[1];

        const ethPerSgtFromUniswap = Number(ethOnUniswapLP) / Number(sgtOnUniswapLP);
        //get vEth2 price from saddle pool
        let vEth2Pr = await vEth2Price();
        vEth2Pr = vEth2Pr
          .dividedBy(1e18)
          .toFixed(2)
          .toString();

        this.pools[3].tokenPerSgt = ethPerSgtFromUniswap * vEth2Pr;
        this.newPools[0].tokenPerSgt = ethPerSgtFromUniswap; //saddle pool's LP token is simply 1 eth => possible improvement = get more accurate approach

          let totalSupply = await token.totalSupply();

          const uniswapEthSgtLpTokenPerSgt = BN(totalSupply.toString()).div(BN(sgtOnUniswapLP.toString()).multipliedBy(2)).toNumber(); // Approximation
          this.pools[1].tokenPerSgt = uniswapEthSgtLpTokenPerSgt;
        } catch (error) {
          console.error("Error loading SGT-ETH pool data:", error);
        }
      }
      if (this.pools[2].active) {
        try {
          let token = SGT_vEth2_uniswap();
          if (!token) {
            console.warn("SGT_vEth2_uniswap contract not available");
            return;
          }
          let reserves = await token.getReserves();
          let sgtOnUniswapLP = reserves[0];

          // pool 2
          let totalSupply = await token.totalSupply();
          const unsiwapvEth2SgtLPTokenPerSgt = BN(totalSupply.toString()).div(BN(sgtOnUniswapLP.toString()).multipliedBy(2)).toNumber();
          this.pools[2].tokenPerSgt = unsiwapvEth2SgtLPTokenPerSgt;
        } catch (error) {
          console.error("Error loading SGT-vETH2 pool data:", error);
        }
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

.notification {
  width: 90%;
  margin-top: 50px;
  padding: 0;
  text-align: center;
  color: tomato;
  font-size: 24px;
}
</style>
