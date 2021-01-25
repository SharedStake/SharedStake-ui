<template>
  <div class="geyserwrapper">
    <div class="geyserChooser">
      <ImageVue
        :src="'tokens/' + pool.name + '.png'"
        :size="'40px'"
        class="headerPart poolIcon"
      />
      <div class="headerPart poolName">
        {{ pool.name }}
        <div class="minitext">{{ pool.explanation }}</div>
      </div>
      <div class="headerPart poolGrowth">
        <div class="minitext">Yearly Growth:</div>
        <div class="yearlyGrowth">69%</div>
      </div>
      <div class="headerPart poolBalance">
        {{
          balance == 0
            ? 0
            : balance
                .div(10 ** decimals)
                .toFixed(3)
                .toString()
        }}
        <div class="minitext">{{ pool.name }} available to deposit</div>
      </div>
      <span class="headerPart label" :id="active ? 'headDown' : 'headUp'"
        ><svg
          class="MuiSvgIcon-root"
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
          <path fill="none" d="M0 0h24v24H0z"></path></svg
      ></span>
    </div>
    <div class="geyserChooser" v-show="active"></div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/image.vue";
import { mapGetters } from "vuex";
import BN from "bignumber.js";
export default {
  components: { ImageVue },
  props: ["pool", "active"],
  data: () => ({ balance: 0, decimals: 1 }),
  mounted: function () {
    this.mounted();
  },
  methods: {
    async mounted() {
      let balance = await this.pool.token.methods
        .balanceOf(this.userAddress)
        .call();
      let decimals = await this.pool.token.methods.decimals().call();
      this.balance = BN(balance);
      this.decimals = decimals;
    },
  },
  computed: {
    ...mapGetters({
      userAddress: "userAddress",
      authenticated: "isAuth",
      getNetwork: "getNetwork",
    }),
  },
};
</script>

<style scoped>
.geyserwrapper {
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease-in-out;
  font-family: "Work Sans";
  margin: 7vh 1vw 2vh 1vw;
  min-width: 500px;
  width: 60vw;
  padding: 1vh 2vw 1vh 2vw;
  border: 1px #ff007a solid;
  border-radius: 49px;
  background-color: #ffffff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.geyserChooser {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolname growth growth growth balance balance  label";
  justify-items: start;
  align-items: center;
  padding: 15px 0 15px 0;
}

.headerPart {
  text-align: left;
  font-weight: 500;
  line-height: 1.2;
}
.poolIcon {
  grid-area: icon;
  transition: all 0.2s ease-in-out;
}
#headDown {
  transition: all 0.2s ease-in-out;
  transform: rotate(180deg);
}
#headUp {
  transition: all 0.2s ease-in-out;
  transform: rotate(0);
}
.poolName {
  grid-area: poolname;
}
.poolGrowth {
  grid-area: growth;
}
.poolBalance {
  grid-area: balance;
}
.label {
  grid-area: label;
  justify-self: right;
  fill: currentColor;
  width: 1em;
  height: 1em;
  display: inline-block;
  font-size: 1.5rem;
  transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  flex-shrink: 0;
  user-select: none;
}
.minitext {
  font-weight: 700;
  font-size: 14px;
  color: #ff007b9c;
}
</style>