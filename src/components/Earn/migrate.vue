<template>
  <div class="geyserwrapper">
    <div class="geyserChooser">
      <ImageVue
        :src="'tokens/SGT.png'"
        :size="innerWidth > 700 ? '40px' : '8vw'"
        class="headerPart poolIcon"
      />
      <div class="headerPart poolName">
        Migrate to V2!
        <div class="minitext">Claim SGTv2</div>
      </div>
      <!-- <div class="headerPart poolAddress">
        <div class="minitext">Address:</div>
        <div :class="'stakePage'">
          <input
            class="token-amount-input"
            title="address"
            autocomplete="off"
            autocorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0x0"
            minlength="1"
            spellcheck="false"
            v-model="address"
          />
        </div>
      </div> -->
      <div class="headerPart poolAddress">
        <span>
          <div class="minitext">Available:</div>
          {{ available }}
        </span>
      </div>
      <div class="headerPart poolClaim">
        <span v-if="!userAddress">
          <div class="minitext">Status:</div>
          Connect!
        </span>
      </div>
      <div v-if="userAddress" class="headerPart poolButton">
        <span v-if="available == 0">
          <div class="minitext">Status:</div>
          No balance
        </span>
        <button v-else-if="approval" disabled class="mainButton disabled">
          Waiting...
        </button>
        <button
          v-else-if="available <= approved"
          class="mainButton"
          @click="Claim"
        >
          Migrate!
        </button>
        <button v-else class="mainButton" @click="Approve">Approve</button>
      </div>
    </div>
    <div class="outline" />
    <div class="geyserChooser">
      <div class="headerPart poolName">
        Migrated Funds:
        <div class="minitext">Claimable SGTv2</div>
      </div>
      <div class="headerPart poolAddress">
        <span>
          <div class="minitext">Pending:</div>
          {{ sentAmount }}
        </span>
      </div>
      <div v-if="userAddress" class="headerPart poolButton">
        <span v-if="sentAmount == 0">
          <div class="minitext">Status:</div>
          No funds migrated yet.
        </span>
        <button
          v-else-if="remaining_time <= 0 && sentAmount > 0"
          class="mainButton"
          @click="Release"
        >
          Release!
        </button>
        <span v-else>
          <div class="minitext">Waiting for:</div>
          {{ remaining_time }}
          <div class="minitext">seconds.</div>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { migrator, SGT } from "@/contracts";
import { mapGetters } from "vuex";
import ImageVue from "../Handlers/ImageVue";
// import { timeout } from "@/utils/helpers";
// import web3 from "web3";
import { notifyHandler } from "@/utils/common";
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });
export default {
  components: { ImageVue },
  data: () => ({
    innerWidth: 0,
    txs: [],
    approval: false, // are we approving atm?
    releasing: false,
    available: 0,
    approved: 0,
    balance: 0,
    sentAmount: 0,
    startTime: 0,
  }),
  watch: {
    async userAddress() {
      await this.isEligible();
    },
    async address() {
      await this.isEligible();
    },
  },
  created: function () {
    this.innerWidth = window.innerWidth;
    window.addEventListener("resize", this.onResize);
    var self = this;
    if (window.ethereum)
      window.ethereum.on("accountsChanged", async function () {
        await self.mounted();
      });
  },
  mounted: async function () {
    await this.mounted();
  },
  destroyed() {
    window.removeEventListener("resize", this.onResize);
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
    remaining_time() {
      console.log(this.startTime, Date.now());
      return (
        (this.startTime * 1000 + 5 * 24 * 3600 - Date.now()) /
        1000
      ).toFixed(0);
    },
  },
  methods: {
    async mounted() {
      await this.isEligible();
    },
    onResize() {
      this.innerWidth = window.innerWidth;
    },
    async isEligible() {
      let _approved = await SGT.methods
        .allowance(this.userAddress, migrator.options.address)
        .call();
      this.approved = _approved;
      let balance = await SGT.methods.balanceOf(this.userAddress).call();
      if (balance == 0) {
        this.available = 0;
      } else this.available = BN(balance).dividedBy(1e18).toFixed(3).toString();
      this.balance = BN(balance);

      let userInfo = await migrator.methods
        .lockedSwaps(this.userAddress)
        .call();
      let amount = userInfo[0];
      if (amount == 0) {
        this.sentAmount = 0;
      } else this.sentAmount = BN(amount).dividedBy(1e18).toFixed(3).toString();

      let startTime = userInfo[1];
      this.startTime = startTime;
    },
    async Approve() {
      let that = this;
      await SGT.methods
        .approve(migrator.options.address, this.balance.toString())
        .send({ from: this.userAddress, gas: 100000 })
        .on("transactionHash", function (hash) {
          notifyHandler(hash);
          that.approval = true;
        })
        .once("confirmation", () => {
          that.approval = false;
          console.log("approved");
        })
        .on("error", (err) => {
          // if (error.message.includes("User denied transaction signature"))
          that.approval = false;
          console.log(err);
        })
        .catch((err) => {
          that.approval = false;
          console.log(err);
        });
      this.isEligible();
    },
    async Claim() {
      let that = this;
      await migrator.methods
        .migrate(this.balance.toString())
        .send({ from: this.userAddress, gas: 200000 })
        .on("transactionHash", function (hash) {
          notifyHandler(hash);
          that.approval = true;
        })
        .once("confirmation", () => {
          that.approval = false;
          console.log("approved");
        })
        .on("error", (err) => {
          // if (error.message.includes("User denied transaction signature"))
          that.approval = false;
          console.log(err);
        })
        .catch((err) => {
          that.approval = false;
          console.log(err);
        });
      this.isEligible();
    },
    async Release() {
      let that = this;
      await migrator.methods
        .releaseTokens()
        .send({ from: this.userAddress, gas: 200000 })
        .on("transactionHash", function (hash) {
          notifyHandler(hash);
          that.releasing = true;
        })
        .once("confirmation", () => {
          that.approval = false;
          console.log("approved");
        })
        .on("error", (err) => {
          // if (error.message.includes("User denied transaction signature"))
          that.releasing = false;
          console.log(err);
        })
        .catch((err) => {
          that.releasing = false;
          console.log(err);
        });
      this.isEligible();
    },
  },
};
</script>

<style scoped>
.outline {
  width: 100%;
  border: 1px rgb(250, 82, 160) solid;
}
.geyserwrapper {
  position: relative;
  transition: transform 0.2s ease-in-out;
  margin: 3vh 1vw 2vh 1vw;
  width: 60vw;
  border-radius: 49px;
  border: 1px rgb(37, 167, 219) solid;
  background-color: #181818;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: 0.42s ease-in-out;
}

.geyserChooser {
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1vh 2vw 1vh 2vw;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolAddress poolAddress poolAddress poolAddress button button button  ";
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
  background-color: #00ff84;
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
  border-top: 1px #00ff84 solid;
}
.headerPart,
.statsPart,
.userPart {
  text-align: left;
  font-weight: 500;
  line-height: 1.2;
  width: 97%;
  color: #fff;
  word-break: break-all;
}

.mainPart,
.statsPart,
.userPart {
  padding: 1vh 2vw 1vh 2vw;
}

.mainPart,
.userPart {
  margin: 2vh 0 2vh 0;
  font-size: 32px;
}
.userPart {
  text-shadow: 1px 1px #00ff84;
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
.poolAddress {
  grid-area: poolAddress;
}
.poolName {
  grid-area: poolname;
}
.poolClaim {
  grid-area: button;
}
.poolButton {
  grid-area: button;
  justify-self: right;
  display: inline-block;
  font-size: 1.5rem;
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
  color: #00ff849c;
}

/* stake input part */
.stakePage {
  display: flex;
  align-items: center;
  max-width: 18vw;
  justify-content: space-between;
  min-height: 20%;
  border: 1px solid #afb2b6;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
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
  cursor: pointer;
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
  color: #fafafa;
}
@media only screen and (max-width: 700px) {
  .geyserwrapper {
    position: relative;
    transition: transform 0.2s ease-in-out;
    margin: 4vh 1vw 2vh 1vw;
    width: 90vw;
    border: 1px #00ff84 solid;
    border-radius: 49px;
    background-color: #181818;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: 0.42s ease-in-out;
  }
  .geyserChooser {
    padding: 0;
  }
  .headerPart {
    font-size: 20px;
    width: 90%;
    word-break: break-all;
  }
  .minitext {
    font-size: 10px;
  }
  .mainButton {
    font-size: 10px;
  }
}
</style>