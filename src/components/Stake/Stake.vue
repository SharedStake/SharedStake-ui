<template>
  <div class="flex_column stake">
    <!-- <router-link to="/">back</router-link> -->
    <div class="flex_column Staker">
      <a
        class="info-icon"
        :href="'https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05#f9f8c7bca1344d32b0d308d9dad5a35c'"
        target="_blank"
        rel="noopener noreferrer"
        ><ImageVue :src="'info-icon.png'" :size="'16px'"
      /></a>
      <div class="balance" id="balance">balance: {{ balance }}</div>
      <div
        :class="validInput ? 'flex_row stakePage' : 'flex_row stakePage redBG'"
      >
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
          v-model="Damount"
        />
        <ImageVue
          :src="isDeposit ? 'eth-logo.png' : 'logo-2.png'"
          :size="'20px'"
        />
        <div class="ETH">{{ isDeposit ? "ETH" : "vETH2" }}</div>
        <div class="toMax" @click="onMAX" title="Get max token">MAX</div>
      </div>
      <div class="arrow_down"><Arrow :direction="'down'" :size="16" /></div>
      <div v-if="Damount" v-show="Damount > 0" class="balance">
        {{
          isDeposit
            ? (Damount / 33) * 32 + " vETH2"
            : (Damount / 32) * 33 + " ETH"
        }}
      </div>
      <button
        class="flex_row stakeButton"
        @click="onSubmit"
        :id="buttonText == 'Stake' || buttonText == 'Unstake' ? '' : 'disabled'"
      >
        {{ buttonText }}
      </button>
      <gasChooser :updateGas="this.updateGas" />
    </div>
    <div
      :class="{ toggle: true, 'toggle--withdraw': !isDeposit }"
      @click="toggleMode"
    >
      <div class="toggle__label-wrapper">
        <span class="toggle__label">Stake</span>
      </div>

      <div class="toggle__label-wrapper">
        <span class="toggle__label">Unstake</span>
      </div>

      <div class="toggle__switch">
        <span class="toggle__label toggle__label--active" v-show="isDeposit">
          Stake
        </span>
        <span class="toggle__label toggle__label--active" v-show="!isDeposit">
          Unstake
        </span>
      </div>
    </div>
    <transition-group name="list" tag="span">
      <div
        v-show="txs.length > 0"
        class="exp"
        v-for="(tx, index) in txs"
        :key="index"
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
    <!-- <button @click="addTx()">change txs</button> -->
    <TotalStaked class="Graph" :explanation="false" :updater="updateGraph" />
  </div>
</template>

<script>
import TotalStaked from "../Stats/Graphs/TotalStaked";
import ImageVue from "../Handlers/image.vue";
import Arrow from "../../assets/svg/arrow.vue";
import gasChooser from "../Handlers/gasChooser";
import Notifier from "../Handlers/notifier.vue";
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

import { validator, bETH } from "../../contracts/contracts";
import { mapGetters } from "vuex";
import { timeout } from "../../utils/helpers";
export default {
  components: { Arrow, ImageVue, gasChooser, Notifier, TotalStaked },
  data: () => ({
    buttonText: "Enter an amount",
    BNamount: BN(0),
    Damount: "",
    isDeposit: true,
    EthBal: BN(0),
    BethBal: BN(0),
    balance: 0,
    gas: 20,
    validInput: true,
    txs: [],
    maxValShares: 0,
    remaining: BN(0),
    updateGraph: false,
  }),
  created: function () {
    var self = this;
    window.ethereum.on("accountsChanged", function () {
      self.mounted();
    });
  },
  mounted: async function () {
    await this.mounted();
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },
  methods: {
    async addTx(tx = { id: "", success: false, msg: "Error." }) {
      this.txs.push(tx);
    },
    closeTx(index) {
      console.log(index);
      let myTx = JSON.parse(JSON.stringify(this.txs));
      let newTx = myTx.filter((tx, i) => index != i);
      this.txs = newTx;
    },
    async automatedCloseTx(id) {
      await timeout(10000);
      console.log(id);
      let myTx = JSON.parse(JSON.stringify(this.txs));
      let newTx = myTx.filter((tx) => id != tx.id);
      this.txs = newTx;
    },
    updateGas(gas) {
      this.gas = gas;
      this.amountCheck(true);
    },
    async onMAX() {
      if (this.isDeposit) {
        let gas = this.gas;
        let BNamount = this.EthBal.minus(BN(gas * 200000 * 1000000000));
        let remaining = await validator.methods.remainingSpaceInEpoch().call();
        this.remaining = BN(remaining);
        console.log(remaining);
        if (this.remaining.eq(0)) {
          this.amountCheck();
          return;
        }
        if (this.remaining.gte(BNamount) || !this.isDeposit) {
          this.BNamount = BN(BNamount);
        } else {
          this.BNamount = BN(this.remaining);
        }
        this.Damount = this.BNamount.dividedBy(1e18);
      } else {
        this.BNamount = this.BethBal;
        this.Damount = this.BNamount.dividedBy(1e18);
      }
    },
    toggleMode() {
      this.isDeposit = !this.isDeposit;
    },
    async onSubmit() {
      if (!(this.buttonText == "Stake" || this.buttonText == "Unstake")) return;
      let walletAddress = this.userAddress;
      const addTx = this.addTx;
      const automatedCloseTx = this.automatedCloseTx;
      let TXhash = null;
      let self = this;
      if (this.isDeposit) {
        let myamount = this.BNamount.toString();
        await validator.methods
          .deposit()
          .send({
            from: walletAddress,
            value: myamount,
            gas: 200000,
            gasPrice: BN(this.gas).multipliedBy(1000000000).toString(),
          })
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
            console.log(TXhash);
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
      } else {
        //unstake
        let myamount = this.BNamount.toString();
        await validator.methods
          .withdraw(myamount)
          .send({
            from: walletAddress,
            gas: 200000,
            gasPrice: BN(this.gas).multipliedBy(1000000000).toString(),
          })
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
          .once("confirmation", (block) => {
            console.log(block);
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
      }
    },
    async mounted() {
      //balances
      let walletAddress = this.userAddress;
      let amount = await window.web3.eth.getBalance(walletAddress);
      this.EthBal = BN(amount);
      let beth = await bETH.methods.balanceOf(walletAddress).call();
      this.BethBal = BN(beth);
      if (this.isDeposit) this.balance = BN(amount).dividedBy(1e18).toFixed(6);
      else this.balance = BN(beth).dividedBy(1e18).toFixed(6);
      let remaining = await validator.methods.remainingSpaceInEpoch().call();
      this.remaining = BN(remaining);
      this.amountCheck(true);
      this.updateGraph = !this.updateGraph;
    },
    amountCheck(init) {
      if (init && this.Damount == 0) return;
      if (this.remaining.eq(0) && this.isDeposit) {
        this.validInput = false;
        this.buttonText = "Contract is Full";
        return;
      }
      if (this.BNamount.gt(this.remaining) && this.isDeposit) {
        this.validInput = false;
        this.buttonText = "Amount is too big";
        return;
      }
      if (this.Damount[this.Damount.length - 1] === ".") {
        this.validInput = false;
        this.buttonText = "waiting...";
        return;
      }
      if (this.Damount <= 0) {
        this.validInput = false;
        return;
      }
      this.validInput = this.isDeposit
        ? this.EthBal.minus(BN(this.gas * 200000 * 1000000000)).gte(
            this.BNamount
          )
        : this.BethBal.gte(this.BNamount);
      if (!this.validInput) {
        this.buttonText = "Insufficient balance";
      }
      if (this.validInput) {
        this.buttonText = this.isDeposit ? "Stake" : "Unstake";
      }
    },
  },
  watch: {
    Damount: function (newValue, oldVal) {
      if (newValue.length > 40) {
        this.Damount = oldVal;
        this.amountCheck();
        return;
      }
      if (newValue[newValue.length - 1] == 0) {
        this.Damount = newValue;
        this.BNamount = BN(this.Damount).multipliedBy(1e18);
        console.log(newValue, "mm");
        this.amountCheck();
        return;
      }
      if (
        newValue[newValue.length - 1] === "." &&
        newValue[newValue.length - 2] !== "."
      ) {
        this.Damount = newValue;
        console.log(newValue, "mm");
        // this.BNamount =    BN(0);
        this.amountCheck();
        return;
      }
      if (isNaN(newValue)) {
        this.Damount = this.BNamount.dividedBy(1e18).toString();
        console.log(newValue, "m");
        return;
      }
      if (!newValue) {
        console.log(newValue);
        this.Damount = 0;
      } else {
        this.Damount = newValue;
      }
      this.BNamount = BN(this.Damount).multipliedBy(1e18);
      this.Damount = this.BNamount.dividedBy(1e18).toString();
      this.amountCheck();
    },
    isDeposit: function (val) {
      let balance = val ? this.EthBal : this.BethBal;
      this.balance = balance.dividedBy(1e18).toFixed(6);
      this.Damount = "";
      this.buttonText = "Enter an amount";
    },
    validInput: function (val) {
      if (!val) {
        if (this.Damount == 0) {
          this.buttonText = "Enter an amount";
        }
        if (this.Damount < 0) {
          this.buttonText = "input is too small";
          return;
        }
      }
      if (val) {
        if (this.isDeposit) this.buttonText = "Stake";
        else this.buttonText = "Unstake";
      }
    },
  },
};
</script>

<style scoped>
.redBG {
  background-color: #ff007b0a;
}
.stake {
  justify-content: center;
  position: relative;
}
.Staker {
  position: relative;
  padding: 1rem;
  padding-top: 3rem;
  min-width: 500px;
  width: 40%;
  min-height: 15rem;
  height: 30%;
  background-color: #ffffff;
  border: 1px solid transparent;
  border-radius: 30px;
  margin: 0 1rem 0 1rem;
  -webkit-box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01),
    0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01),
    10px 10px 130px -50px rgba(244, 180, 0, 1);
  -moz-box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01),
    0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01),
    10px 10px 130px -50px rgba(244, 180, 0, 1);
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.01),
    1px 1px 300px 30px rgba(143, 153, 242, 0.4);
}
.balance {
  padding-bottom: 0.5rem;
  text-align: right;
  font-family: "Roboto";
  font-size: 14px;
  font-weight: 500;
}
#balance {
  position: absolute;
  top: 1.5rem;
  right: 3rem;
}
.stakePage {
  width: 90%;
  min-height: 20%;
  border-radius: 30px;
  border: 1px solid #f7f8fa;
  align-items: center;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
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
  font-size: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  font-family: "Graduate", cursive;
  -webkit-appearance: textfield;
}
.stakeButton {
  /* background-color: #ff007a; */
  background-color: #007bff;
  min-width: 80%;
  min-height: 15%;
  border-radius: 15px;
  border: 1px solid #f7f8fa;
  align-items: center;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  color: #f7f8fa;
  transition: all 0.2s linear, transform 0.1s ease-in-out;
  cursor: pointer;
}
.stakeButton:hover {
  transition: transform 0.1s ease-in-out;
  transform: scale(0.95);
}
#disabled {
  color: rgb(136, 141, 155);
  transition: all 0.2s linear;
  background-color: rgb(237, 238, 242);
}
.disabled:hover {
  transition: transform 0.1s ease-in-out;
}
.toMax {
  padding: 0.3rem 0.3rem 0 0.2rem;
  height: 1.7rem;
  background-color: rgb(253, 234, 241);
  border: 1px solid rgb(253, 234, 241);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: rgb(255, 0, 122);
  text-align: center;
  cursor: pointer;
}
.toMax:hover {
  border: 1px solid #007bff;
}
.ETH {
  padding: 0.5rem;
  cursor: default;
}

.toggle {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  min-width: 500px;
  width: 40%;
  height: 58px;
  margin-top: 12px;
  padding: 8px;
  background: #f5f8fa;
  border-radius: 14px;
  cursor: pointer;
}
.toggle--withdraw .toggle__switch {
  left: 50%;
}
.toggle__label-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(50% - 8px);
}
.toggle__label {
  font-weight: 700;
  font-size: 16px;
  line-height: 12px;
  text-align: center;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  color: #414a5b;
}
.toggle__label--active {
  color: #007bff;
}
.toggle__switch {
  position: absolute;
  left: 8px;
  top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(50% - 8px);
  height: calc(100% - 16px);
  box-shadow: 0 8px 20px rgba(225, 230, 236, 0.8);
  border-radius: 16px;
  background: #ffffff;
  transition: left, 0.3s;
}
.list-enter-active,
.list-leave-active {
  transition: all 0s;
}
.Graph {
  position: absolute;
  top: 1rem;
  right: 1rem;
  transform: scale(0.7);
}
.green {
  color: #007bff;
}
.info-icon {
  position: absolute;
  top: 1.3rem;
  opacity: 0.6;
  left: 3rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.info-icon:hover {
  transform: rotate(30deg) scale(0.9);
  transition: all 0.2s ease-in-out;
}
@media only screen and (max-width: 700px) {
  .Graph {
    position: fixed;
    top: calc(75%);
    left: 1rem;
    transform: scale(0.5);
    z-index: 1000;
  }
  .toggle {
    min-width: 0;
    max-width: 100vw;
    width: calc(100vw - 66px);
  }
  .Staker {
    min-width: 0;
    max-width: 100vw;
    width: calc(100vw - 66px);
  }
}
</style>