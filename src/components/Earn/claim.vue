<template>
  <div class="geyserwrapper">
    <div class="geyserChooser">
      <ImageVue
        :src="'tokens/SGT.png'"
        :size="'40px'"
        class="headerPart poolIcon"
      />
      <div class="headerPart poolName">
        Airdrop
        <div class="minitext">Claim SGT</div>
      </div>
      <div class="headerPart poolAddress">
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
      </div>
      <div class="headerPart poolClaim">
        <span v-if="!eligible">
          <div class="minitext">Status:</div>
          Not Eligible
        </span>
        <span v-else-if="isClaimed">
          <div class="minitext">Status:</div>
          Claimed
        </span>
        <span v-else>
          <div class="minitext">Available:</div>
          {{ available }}
        </span>
      </div>
      <div v-show="eligible && !isClaimed" class="headerPart poolButton">
        <button class="mainButton" @click="Claim">Claim</button>
      </div>
    </div>
    <transition-group name="list" tag="span">
      <div
        v-show="txs.length > 0"
        class="exp"
        v-for="(tx, index) in txs"
        v-bind:key="index * Math.random()"
      >
        <Notifier
          :id="tx.id"
          :index="index"
          :success="tx.success"
          :msg="tx.msg"
          @click.native="closeTx(index)"
        />
      </div>
    </transition-group>
  </div>
</template>

<script>
import ImageVue from "../Handlers/image.vue";
import { timeout } from "@/utils/helpers";
import { airdrop } from "@/contracts";
import web3 from "web3";
import { merkle } from "./airdrop.js";
import { mapGetters } from "vuex";
import Notifier from "../Handlers/notifier.vue";
export default {
  components: { ImageVue, Notifier },
  data: () => ({
    address: "",
    isClaimed: false,
    txs: [],
    available: 0,
    eligible: true,
    claim: {},
  }),
  watch: {
    async address() {
      await this.isEligible();
    },
  },
  created: function () {
    var self = this;
    window.ethereum.on("accountsChanged", async function () {
      await self.mounted();
    });
  },
  mounted: async function () {
    await this.mounted();
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },
  methods: {
    async mounted() {
      await this.isEligible();
    },
    async isEligible() {
      const claims = merkle.claims;
      let claim = null;
      for (let key in claims) {
        if (key == this.address) {
          claim = claims[key];
        }
      }
      if (claim) {
        this.eligible = true;
        let isClaimed = await airdrop.methods
          .isClaimed(web3.utils.numberToHex(claim.index))
          .call();
        if (isClaimed) this.isClaimed = true;
        else {
          this.isClaimed = false;
          this.available = (parseInt(claim.amount, 16) / 1e18).toFixed(2);
          this.claim = claim;
        }
      } else this.eligible = false;
    },
    async addTx(tx = { id: "", success: false, msg: "Error." }) {
      this.txs.push(tx);
    },
    closeTx(index) {
      let myTx = JSON.parse(JSON.stringify(this.txs));
      let newTx = myTx.filter((tx, i) => index != i);
      this.txs = newTx;
    },
    async automatedCloseTx(id) {
      await timeout(10000);
      let myTx = JSON.parse(JSON.stringify(this.txs));
      let newTx = myTx.filter((tx) => id != tx.id);
      this.txs = newTx;
    },
    async Claim() {
      // to add tx watcher
      const addTx = this.addTx;
      const automatedCloseTx = this.automatedCloseTx;
      let TXhash = null;
      let self = this;

      await airdrop.methods
        .claim(
          web3.utils.numberToHex(this.claim.index),
          this.address,
          this.claim.amount,
          this.claim.proof
        )
        .send({ from: this.userAddress })
        .on("transactionHash", function (hash) {
          TXhash = hash;
          let tx = {
            id: hash,
            success: true,
            msg: "Your transaction is sent.",
          };
          addTx(tx);
          automatedCloseTx(tx.id);
        })
        .once("confirmation", () => {
          let tx = {
            id: TXhash,
            success: true,
            msg: "Transaction is approved.",
          };
          addTx(tx);
          automatedCloseTx(tx.id);
          self.mounted();
        })
        .on("error", (error) => {
          let tx = {
            id: Math.floor(Math.random() * 100000),
            success: false,
            msg: "Transaction is failed.",
          };
          if (error.message.includes("User denied transaction signature"))
            tx.msg = "Transaction is rejected.";
          addTx(tx);
          automatedCloseTx(tx.id);
        })
        .catch((err) => {
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
  font-family: "Work Sans";
  margin: 7vh 1vw 2vh 1vw;
  min-width: 500px;
  width: 60vw;
  border-radius: 49px;
  border: 1px #00ff84 solid;
  background-color: #fafafa;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: 0.42s ease-in-out;
  -webkit-box-shadow: 0px 0px 150px -29px rgb(0, 255, 132);
  -moz-box-shadow: 0px 0px 150px -29px rgb(0, 255, 132);
  box-shadow: 0px 0px 150px -29px rgb(0, 255, 132);
}

.geyserChooser {
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1vh 2vw 1vh 2vw;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolAddress poolAddress poolAddress poolAddress  status status button ";
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
  grid-area: status;
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
  color: #ff007b9c;
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
  color: #000000;
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
</style>