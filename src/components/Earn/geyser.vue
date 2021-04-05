<template>
  <div class="geyserwrapper" :id="chosen ? 'pinkShadow' : 'noShadow'">
    <div class="geyserChooser" @click="$emit('toggle')">
      <ImageVue
        :src="pool.pic"
        :size="innerWidth > 700 ? '40px' : '8vw'"
        class="headerPart poolIcon"
      />
      <div class="headerPart poolName">
        <a
          :href="pool.link"
          class="headerPart"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ pool.name }}
          <span class="minitext" style="font-weight: 700"> ↗</span>
          <div class="minitext">{{ pool.explanation }}</div>
        </a>
      </div>
      <div class="headerPart poolGrowth">
        <div class="minitext">Yearly Growth:</div>
        <div class="yearlyGrowth">
          {{
            apy == 0 || isNaN(apy)
              ? pool.external
                ? "+150%"
                : "Connect"
              : apy.toFixed(2) + "%"
          }}
        </div>
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
        <div class="minitext">available to stake</div>
      </div>
      <span class="headerPart label" :id="chosen ? 'headDown' : 'headUp'"
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
    <div class="geyserExp" v-if="chosen && pool.external">
      <div class="statsPart" id="whiteBorder">
        <a :href="pool.link" target="_blank" rel="noopener noreferrer">
          <div class="minitext blue">
            {{ pool.status }}
            <span class="minitext" style="font-weight: 700"> ↗</span>
          </div>
        </a>
      </div>
    </div>
    <div class="geyserStats" v-show="chosen && !pool.external">
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
        <div class="minitext blue">Remaining Rewards:</div>
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
        <div class="minitext blue">emission period.</div>
      </div>
    </div>
    <div class="geyserUser" v-show="chosen && !pool.external">
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
    <div class="geyserMain" v-show="chosen && !pool.external">
      <div class="mainPart" id="rightBorder">
        <div :class="'stakePage'">
          <input
            class="token-amount-input"
            inputmode="decimal"
            title="Token Amount"
            autocomplete="off"
            autocorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.0"
            minlength="1"
            maxlength="39"
            spellcheck="false"
            value=""
            v-model="DAmount"
          />
          <div
            class="toMax"
            @click="
              () => {
                DAmount = balance ? balance.div(10 ** decimals).toString() : 0;
              }
            "
            title="Get max token"
          >
            MAX
          </div>
        </div>
        <button class="mainButton" @click="Deposit" :disabled="disableDeposit">
          stake
        </button>
        <div class="s-toggle">
          <input
            id="inf-approval"
            type="checkbox"
            name="inf-approval"
            v-model="inf_approval"
          />
          <label for="inf-approval">Infinite Approval</label>
        </div>
      </div>
      <div class="mainPart">
        <div :class="'stakePage'">
          <input
            class="token-amount-input"
            inputmode="decimal"
            title="Token Amount"
            autocomplete="off"
            autocorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.0"
            minlength="1"
            maxlength="39"
            spellcheck="false"
            value=""
            v-model="WAmount"
          />
          <div
            class="toMax"
            @click="
              () => {
                WAmount = staked ? staked.div(10 ** decimals).toString() : 0;
              }
            "
            title="Get max token"
          >
            MAX
          </div>
        </div>
        <div>
          <button
            class="mainButton half"
            @click="Withdraw"
            :disabled="disableWithdraw"
          >
            unstake
          </button>
          <button
            class="mainButton half pink"
            @click="Harvest"
            :disabled="disableHarvest"
          >
            claim rewards
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";
import { mapGetters } from "vuex";
import { notifyHandler } from "@/utils/common";
import BN from "bignumber.js";
import { signERC2612Permit } from 'eth-permit';
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });
import { timeout } from "@/utils/helpers";
export default {
  components: { ImageVue },
  props: ["pool", "chosen"],
  data: () => ({
    innerWidth: 0,
    balance: 0,
    staked: 0,
    earned: 0,
    locked: 0,
    totalStaked: 0,
    stakedSchedule: 0,
    decimals: 1,
    //functional
    txs: [],
    DAmount: 0,
    bigDAmount: BN(0),
    WAmount: 0,
    bigWAmount: BN(0),
    inf_approval: false,
  }),
  created: function () {
    this.innerWidth = window.innerWidth;
    window.addEventListener("resize", this.onResize);
    var self = this;
    if (window.ethereum)
      window.ethereum.on("accountsChanged", async function () {
        if (self.pool.active) {
          await self.mounted();
        }
      });
  },
  mounted: async function () {
    if (this.pool.active) {
      await this.mounted();
    }
  },
  destroyed() {
    window.removeEventListener("resize", this.onResize);
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
    disableDeposit: function () {
      let disable = false;
      if (!this.pool.active) disable = true;
      else if (this.DAmount[this.DAmount.length - 1] === ".") disable = true;
      else if (isNaN(this.bigDAmount)) disable = true;
      else if (BN(this.bigDAmount).lte(0)) disable = true;
      else if (BN(this.balance).lt(this.bigDAmount)) disable = true;
      return disable;
    },
    disableWithdraw: function () {
      let disable = false;
      if (!this.pool.active) disable = true;
      else if (this.WAmount[this.WAmount.length - 1] === ".") disable = true;
      else if (isNaN(this.bigWAmount)) disable = true;
      else if (BN(this.bigWAmount).lte(0)) disable = true;
      else if (BN(this.staked).lt(this.bigWAmount)) disable = true;
      return disable;
    },
    disableHarvest: function () {
      let disable = false;
      if (this.earned == 0) disable = true;
      else if (this.earned.lte(0)) disable = true;
      return disable;
    },
    apy: function () {
      // apy = 100* ( sgtprice* locked amount / (token price * staked amount))=
      // 100* (sgtprice/tokenprice)*locked/staked
      // tokenPerSgt=sgtprice/tokenprice
      // then go yearly
      return (
        100 *
        this.pool.tokenPerSgt *
        ((this.locked * 1e18) / this.totalStaked) *
        (360 / this.stakedSchedule)
      );
    },
  },
  watch: {
    DAmount(newValue, oldVal) {
      console.log(newValue, oldVal);
      if (newValue.length > 40) {
        this.Damount = oldVal;
        // this.amountCheck();
        return;
      }
      if (newValue[newValue.length - 1] == 0) {
        this.Damount = newValue;
        this.bigDAmount = BN(this.Damount).multipliedBy(1e18);
        // this.amountCheck();
        return;
      }
      if (
        newValue[newValue.length - 1] === "." &&
        newValue[newValue.length - 2] !== "."
      ) {
        this.Damount = newValue;
        // this.amountCheck();
        return;
      }
      if (isNaN(newValue)) {
        this.Damount = this.bigDAmount.dividedBy(1e18).toString();
        return;
      }
      if (!newValue) {
        this.Damount = 0;
      } else {
        this.Damount = newValue;
      }
      this.bigDAmount = BN(this.Damount).multipliedBy(1e18);
      this.Damount = this.bigDAmount.dividedBy(1e18).toString();
      // this.amountCheck();
    },
    WAmount(newValue, oldVal) {
      if (newValue.length > 40) {
        this.WAmount = oldVal;
        // this.amountCheck();
        return;
      }
      if (newValue[newValue.length - 1] == 0) {
        this.WAmount = newValue;
        this.bigWAmount = BN(this.WAmount).multipliedBy(1e18);
        // this.amountCheck();
        return;
      }
      if (
        newValue[newValue.length - 1] === "." &&
        newValue[newValue.length - 2] !== "."
      ) {
        this.WAmount = newValue;
        // this.amountCheck();
        return;
      }
      if (isNaN(newValue)) {
        this.WAmount = this.bigWAmount.dividedBy(1e18).toString();
        return;
      }
      if (!newValue) {
        this.WAmount = 0;
      } else {
        this.WAmount = newValue;
      }
      this.bigWAmount = BN(this.WAmount).multipliedBy(1e18);
      this.WAmount = this.bigWAmount.dividedBy(1e18).toString();
    },
    async userAddress(newVal) {
      console.log(newVal);
      if (newVal) await this.mounted();
    },
  },
  methods: {
    onResize() {
      this.innerWidth = window.innerWidth;
    },
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
    },
    async Deposit() {
      let myAmount = this.bigDAmount.toString();
      let geyserAddress = this.pool.geyser._address;
      let tokenAddress = this.pool.token._address;
      let allowance = await this.pool.token.methods
        .allowance(this.userAddress, geyserAddress)
        .call();
      let approval = true;
      
      // Sign message using injected provider (ie Metamask).
      // You can replace window.ethereum with any other web3 provider.
      const result = await signERC2612Permit(window.ethereum, tokenAddress, this.userAddress, geyserAddress, myAmount);

      if (BN(allowance).lt(this.bigDAmount)) {
        if (this.inf_approval)
          myAmount = BN(2).pow(BN(256)).minus(BN(1)).toString();
        await this.pool.token.methods
          .permit(this.UserAddress, geyserAddress, myAmount, result.deadline, result.v, result.r, result.s)
          .send({ from: this.userAddress })
          .on("transactionHash", function (hash) {
            notifyHandler(hash);
          })
          .once("confirmation", () => {
            this.loading = false;
            self.mounted();
          })
          .on("error", () => {
            // if (error.message.includes("User denied transaction signature"))
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            console.log(err);
          });
        await timeout(4000);
      }
      if (approval) {
        await this.pool.geyser.methods
          .stake(myAmount)
          .send({ from: this.userAddress })
          .on("transactionHash", function (hash) {
            notifyHandler(hash);
          })
          .once("confirmation", () => {
            this.loading = false;
            self.mounted();
          })
          .on("error", () => {
            // if (error.message.includes("User denied transaction signature"))
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            console.log(err);
          });
      }
    },
    async Withdraw() {
      // to add tx watcher
      if (this.bigWAmount.eq(this.staked)) {
        await this.pool.geyser.methods
          .exit()
          .send({ from: this.userAddress })
          .on("transactionHash", function (hash) {
            notifyHandler(hash);
          })
          .once("confirmation", () => {
            this.loading = false;
            self.mounted();
          })
          .on("error", () => {
            // if (error.message.includes("User denied transaction signature"))
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            console.log(err);
          });
      } else {
        let myAmount = this.bigWAmount.toString();
        await this.pool.geyser.methods
          .withdraw(myAmount)
          .send({ from: this.userAddress })
          .on("transactionHash", function (hash) {
            notifyHandler(hash);
          })
          .once("confirmation", () => {
            this.loading = false;
            self.mounted();
          })
          .on("error", () => {
            // if (error.message.includes("User denied transaction signature"))
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            console.log(err);
          });
      }
    },
    async Harvest() {
      await this.pool.geyser.methods
        .getReward()
        .send({ from: this.userAddress })
        .on("transactionHash", function (hash) {
          notifyHandler(hash);
        })
        .once("confirmation", () => {
          this.loading = false;
          self.mounted();
        })
        .on("error", () => {
          // if (error.message.includes("User denied transaction signature"))
          this.loading = false;
        })
        .catch((err) => {
          this.loading = false;
          console.log(err);
        });
    },
  },
};
</script>

<style scoped>
.geyserwrapper {
  position: relative;
  transition: transform 0.2s ease-in-out;
  margin: 4vh 1vw 2vh 1vw;
  width: 60vw;
  border: 1px rgb(250, 82, 160) solid;
  border-radius: 49px;
  background-color: #181818;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: 0.42s ease-in-out;
  -webkit-box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.517);
  -moz-box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.619);
  box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.469);
}

.geyserChooser {
  cursor: pointer;
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1vh 2vw 1vh 2vw;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolname growth growth growth balance balance label";
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
  color: #fff;
  background-color: rgb(250, 82, 160);
}
.geyserMain,
.geyserUser {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
}
.geyserMain {
  border-top: 1px rgb(250, 82, 160) solid;
}
.s-toggle {
  font-size: 16px;
  color: #fff;
}
.headerPart,
.statsPart,
.userPart {
  text-align: left;
  font-weight: 500;
  width: 90%;
  word-break: break-all;
  line-height: 1.2;
  color: #fff;
}

.mainPart,
.statsPart,
.userPart {
  padding: 0.5vh 1.5vw 0.5vh 1.5vw;
}

.mainPart,
.userPart {
  margin: 2vh 0 2vh 0;
  font-size: 32px;
}
.userPart {
  text-shadow: 1px 1px rgb(250, 82, 160);
}
#rightBorder {
  border-right: 1px rgb(250, 82, 160) solid;
}
#whiteBorder {
  border-right: 1px #fff solid;
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
  color: rgba(250, 82, 160, 0.803);
}

/* stake input part */
.stakePage {
  display: flex;
  max-width: 23vw;
  /* min-width: 185px; */
  align-items: center;
  justify-content: space-between;
  min-height: 20%;
  border-radius: 30px;
  border: 1px solid #afb2b6;
  align-items: center;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
  text-align: center;
}
.token-amount-input {
  color: #fff;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: 17px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;
}
.toMax {
  padding: 0.3rem 0.3rem 0 0.2rem;
  min-height: 1.4rem;
  background-color: #181818;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: rgb(255, 0, 122);
  text-align: center;
  cursor: pointer;
  border: 1px solid #007bff00;
}
.toMax:hover {
  border: 1px solid #007bff;
}
.mainButton {
  width: 100%;
  min-height: 15%;
  border-radius: 15px;
  border: none;
  align-items: center;
  margin: 15px 0 15px 0;
  padding: 0.5rem 0.75rem 0.5rem 0.75rem;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  border-bottom: 1px solid #afb2b6;
  transition: all 0.2s linear, transform 0.1s ease-in-out;
  cursor: pointer;
  color: #0b8f92;
}
.mainButton:hover {
  background-color: #0b8f92;
  color: #fff;
}

.half {
  width: 50%;
}
.blue {
  color: #fff;
}
.pink {
  color: rgb(250, 82, 160);
}
.pink:hover {
  background-color: rgb(250, 82, 160);
  color: #fff;
}
.mainButton:disabled {
  cursor: default;
  background-color: rgba(239, 239, 239, 0.3);
  color: #0b8f92;
}
.geyserExp {
  max-width: 70%;
}
#inf-approval {
  font-size: 22px;
}

@media only screen and (max-width: 700px) {
  .geyserwrapper {
    position: relative;
    transition: transform 0.2s ease-in-out;
    font-family: "Work Sans";
    margin: 4vh 1vw 2vh 1vw;
    width: 90vw;
    border: 1px rgb(250, 82, 160) solid;
    border-radius: 49px;
    background-color: #181818;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: 0.42s ease-in-out;
    -webkit-box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.517);
    -moz-box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.619);
    box-shadow: 0px 0px 150px -39px rgba(255, 0, 123, 0.469);
  }
  .geyserChooser {
    padding: 0;
  }
  .statsPart,
  .userPart,
  .mainPart,
  .headerPart {
    font-size: 20px;
  }
  .toMax,
  .mainButton,
  .minitext {
    font-size: 10px;
    font-size: 10px;
  }
  .stakePage {
    max-width: 31vw;
  }
}
</style>