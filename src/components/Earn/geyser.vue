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
    <div class="geyserStats" v-show="active">
      <div class="statsPart" id="whiteBorder">
        <div class="minitext blue">Total Staked:</div>
        {{
          totalStaked == 0
            ? 0
            : totalStaked.eq(0)
            ? totalStaked
            : totalStaked
                .div(10 ** decimals)
                .toFixed(1)
                .toString()
        }}
        {{ pool.name }}
      </div>
      <div class="statsPart" id="whiteBorder">
        <div class="minitext blue">Total Locked:</div>
        {{ locked == 0 ? 0 : locked.eq(0) ? 0 : locked.toFixed(1).toString() }}
        SGT
      </div>
      <div class="statsPart">
        {{
          stakedSchedule == 0
            ? 0
            : stakedSchedule.eq(0)
            ? 0
            : stakedSchedule.toFixed(0).toString()
        }}
        Days
        <div class="minitext blue">until the end.</div>
      </div>
    </div>
    <div class="geyserUser" v-show="active">
      <div class="userPart" id="rightBorder">
        <div class="minitext blue">Staked:</div>
        {{
          staked == 0
            ? 0
            : staked.eq(0)
            ? 0
            : staked
                .div(10 ** decimals)
                .toFixed(3)
                .toString()
        }}
        {{ pool.name }}
      </div>
      <div class="userPart">
        <div class="minitext blue">Earned:</div>
        {{
          earned == 0
            ? 0
            : earned.eq(0)
            ? 0
            : earned
                .div(10 ** 18)
                .toFixed(3)
                .toString()
        }}
        SGT
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/image.vue";
import { mapGetters } from "vuex";
import BN from "bignumber.js";
export default {
  components: { ImageVue },
  props: ["pool", "active"],
  data: () => ({
    balance: 0,
    staked: 0,
    earned: 0,
    locked: 0,
    totalStaked: 0,
    stakedSchedule: 0,
    decimals: 1,
  }),
  mounted: function () {
    this.mounted();
  },
  methods: {
    async mounted() {
      let user = this.userAddress;
      let decimals = await this.pool.token.methods.decimals().call();
      this.decimals = decimals;

      let balance = await this.pool.token.methods.balanceOf(user).call();
      this.balance = BN(balance);
      let staked = await this.pool.geyser.methods.balanceOf(user).call();
      this.staked = BN(staked);
      let earned = await this.pool.geyser.methods.earned(user).call();
      this.earned = BN(earned);
      let totalStaked = await this.pool.geyser.methods.totalSupply().call();
      this.totalStaked = BN(totalStaked);

      let now = Math.floor(Date.now() / 1000);
      let until = await this.pool.geyser.methods.periodFinish().call();
      let remDays = BN((until - now) / 60 / 60 / 24); //get remaining days
      this.stakedSchedule = remDays;
      let duration = await this.pool.geyser.methods.rewardsDuration().call(); //in second
      let remRewards = BN(remDays).times(
        BN(this.pool.locked).div(BN(duration).div(60).div(60).div(24))
      );
      this.locked = BN(remRewards);
      console.log(
        remDays.toString(),
        this.pool.locked.toString(),
        duration.toString(),
        this.locked.toString()
      );
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
  border: 1px #ff007a solid;
  border-radius: 49px;
  background-color: #ffffff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.geyserChooser {
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1vh 2vw 1vh 2vw;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolname growth growth growth balance balance  label";
  justify-items: start;
  align-items: center;
  margin: 15px 0 15px 0;
}

.geyserStats {
  width: 100%;
  padding: 15px 0 15px 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
  color: #fafafa;
  background-color: #ff007a;
}

.geyserUser {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
  border-top: 1px #ff007a solid;
}
.headerPart,
.statsPart,
.userPart {
  text-align: left;
  font-weight: 500;
  line-height: 1.2;
}
.statsPart,
.userPart {
  padding: 1vh 2vw 1vh 2vw;
}

.userPart {
  margin: 2vh 0 2vh 0;
  text-shadow: 1px 1px #ff007a;
  font-size: 32px;
}
#rightBorder {
  border-right: 1px #ff007a solid;
}
#whiteBorder {
  border-right: 1px #fafafa solid;
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
.blue {
  color: #1d3c7a;
}
</style>