<template>
  <div class="flex_column stake">
    <div class="staker">
      <div class="chooser">
        <div class="navbar">
          <button
            class="switch"
            :class="{ switch_active: isDeposit }"
            @click="isDeposit = true"
          >
            <span>Stake</span>
          </button>
          <button
            class="switch"
            :class="{ switch_active: !isDeposit }"
            @click="isDeposit = false"
          >
            <span>Unstake</span>
          </button>
        </div>
      </div>
      <div class="stakePage">
        <div class="sPElement input">
          <div class="inputBody">
            <div class="flex_row">
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
              <div class="ant-col">{{ isDeposit ? " ETH" : "vETH2" }}</div>
            </div>
            <div class="balance" id="balance" @click="onMAX">
              wallet: {{ balance }}
            </div>
            <div :class="isDeposit ? 'background2' : 'background3'" />
          </div>
        </div>
        <ImageVue class="sPElement" :src="'down.png'" :size="'30px'" />
        <div class="sPElement input">
          <div class="inputBody">
            <div class="flex_row">
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
                :value="
                  isDeposit ? (Damount / 32.1) * 32 : (Damount / 32) * 32.1
                "
                readonly
              />
              <div class="ant-col">
                {{ isDeposit ? " vETH2" : " ETH" }}
              </div>
            </div>
            <div class="balance" id="balance" @click="onMAX">
              wallet: {{ otherBalance }}
            </div>
            <div :class="isDeposit ? 'background3' : 'background2'" />
          </div>
        </div>
        <button
          class="StakeButton"
          :class="{
            switch_active: buttonText == 'Stake' || buttonText == 'Unstake',
          }"
          @click="onSubmit"
        >
          <span v-if="loading">
            <ImageVue :src="'loading.svg'" :size="'45px'" />
          </span>
          <span v-else>
            {{ buttonText }}
          </span>
        </button>
      </div>
      <div class="navbar">
        <span id="gas">Gas</span>
        <button
          class="switch"
          :class="{ switch_active: chosenGas == gas.low }"
          @click="updateGas(gas.low)"
        >
          <span>{{ gas.low.toFixed(0) }}</span>
        </button>
        <button
          class="switch"
          :class="{ switch_active: chosenGas == gas.medium }"
          @click="updateGas(gas.medium)"
        >
          <span>{{ gas.medium.toFixed(0) }}</span>
        </button>
        <button
          class="switch"
          :class="{ switch_active: chosenGas == gas.high }"
          @click="updateGas(gas.high)"
        >
          <span>{{ gas.high.toFixed(0) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });
import { getCurrentGasPrices } from "@/utils/common";

import { mapGetters } from "vuex";
import { validator, vEth2 } from "@/contracts";
import { timeout } from "@/utils/helpers";
import ImageVue from "../Handlers/ImageVue";
export default {
  components: { ImageVue },
  data: () => ({
    buttonText: "Enter an amount",
    BNamount: BN(0),
    Damount: "",
    isDeposit: true,
    EthBal: BN(0),
    vEth2Bal: BN(0),
    balance: 0,
    otherBalance: 0,
    gas: { low: 90, medium: 130, high: 180 },
    validInput: true,
    txs: [],
    maxValShares: 0,
    remaining: BN(0),
    remainingByFee: BN(0),
    chosenGas: 130,
    loading: true,
  }),
  created: function () {
    var self = this;
    window.ethereum.on("accountsChanged", function () {
      self.mounted();
    });
  },
  mounted: async function () {
    this.gas = await getCurrentGasPrices();
    this.chosenGas = this.gas.medium;
    this.loading = false;
    try {
      await this.mounted();
    } catch {
      console.log("ss1");
      this.buttonText = "Connect to wallet ↗";
    }
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },
  methods: {
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
    updateGas(gas) {
      this.chosenGas = gas;
      this.amountCheck(true);
    },
    async onMAX() {
      if (this.isDeposit) {
        let gas = this.chosenGas;
        console.log(this.EthBal.toString());
        let BNamount = this.EthBal.minus(BN(gas * 200000 * 1000000000));
        let remaining = await validator.methods.remainingSpaceInEpoch().call();
        this.remaining = BN(remaining);
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
        let remainingByFee = await validator.methods.adminFeeTotal().call();
        if (remainingByFee > 10)
          this.remainingByFee = BN(remainingByFee).multipliedBy(320);
        else {
          this.remainingByFee = BN(0);
        }
        this.BNamount = this.vEth2Bal;
        if (this.vEth2Bal.gt(this.remainingByFee)) {
          this.BNamount = this.remainingByFee;
        }
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
        this.loading = true;
        let myamount = this.BNamount.toString();
        await validator.methods
          .deposit()
          .send({
            from: walletAddress,
            value: myamount,
            gas: 200000,
            gasPrice: BN(this.chosenGas).multipliedBy(1000000000).toString(),
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
            let tx = {
              id: TXhash,
              success: true,
              msg: "Transaction is approved.",
            };
            addTx(tx);
            automatedCloseTx(tx.id);
            this.loading = false;
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
            this.loading = false;
            automatedCloseTx(tx.id);
          })
          .catch((err) => {
            this.loading = false;
            console.log(err);
          });
      } else {
        //unstake
        let myamount = this.BNamount.toString();
        this.loading = true;
        await validator.methods
          .withdraw(myamount)
          .send({
            from: walletAddress,
            gas: 200000,
            gasPrice: BN(this.chosenGas).multipliedBy(1000000000).toString(),
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
            this.loading = false;
          })
          .catch((err) => {
            console.log(err);
            this.loading = false;
          });
      }
    },
    async mounted() {
      //balances
      let walletAddress = this.userAddress;
      let amount = await window.web3.eth.getBalance(walletAddress);
      this.EthBal = BN(amount);
      let veth2 = await vEth2.methods.balanceOf(walletAddress).call();
      this.vEth2Bal = BN(veth2);
      if (this.isDeposit) {
        this.balance = BN(amount).dividedBy(1e18).toFixed(6);
        this.otherBalance = BN(veth2).dividedBy(1e18).toFixed(6);
      } else {
        this.balance = BN(veth2).dividedBy(1e18).toFixed(6);
        this.otherBalance = BN(amount).dividedBy(1e18).toFixed(6);
      }
      let remaining = await validator.methods.remainingSpaceInEpoch().call();
      this.remaining = BN(remaining);
      let remainingByFee = await validator.methods.adminFeeTotal().call();
      this.remainingByFee = BN(remainingByFee).multipliedBy(320);
      this.amountCheck(true);
      this.loading = false;
    },
    amountCheck(init) {
      if (init && this.Damount == 0) return;
      if (this.userAddress == null) {
        this.validInput = false;
        this.buttonText = "Connect to wallet ↗";
        console.log("ss");
        return;
      }
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
      if (this.BNamount.gt(this.remainingByFee) && !this.isDeposit) {
        this.validInput = false;
        this.buttonText = "Not enough funds in Exit Pool";
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
        ? this.EthBal.minus(BN(this.chosenGas * 200000 * 1000000000)).gte(
            this.BNamount
          )
        : this.vEth2Bal.gte(this.BNamount);
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
        this.amountCheck();
        return;
      }
      if (
        newValue[newValue.length - 1] === "." &&
        newValue[newValue.length - 2] !== "."
      ) {
        this.Damount = newValue;
        // this.BNamount =    BN(0);
        this.amountCheck();
        return;
      }
      if (isNaN(newValue)) {
        this.Damount = this.BNamount.dividedBy(1e18).toString();
        return;
      }
      if (!newValue) {
        this.Damount = 0;
      } else {
        this.Damount = newValue;
      }
      this.BNamount = BN(this.Damount).multipliedBy(1e18);
      this.Damount = this.BNamount.dividedBy(1e18).toString();
      this.amountCheck();
    },
    isDeposit: function (val) {
      let balance = val ? this.EthBal : this.vEth2Bal;
      this.balance = balance.dividedBy(1e18).toFixed(6);
      let otherBalance = val ? this.vEth2Bal : this.EthBal;
      this.otherBalance = otherBalance.dividedBy(1e18).toFixed(6);
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
    async userAddress(newVal) {
      if (newVal) {
        this.buttonText = "Enter an amount";
        await this.mounted();
      } else {
        this.buttonText = "Connect to wallet ↗";
      }
    },
  },
};
</script>

<style scoped>
.stake {
  padding-top: 65px;
  height: 95vh;
  background-image: url(bg-1.png);
  background-repeat: no-repeat;
  background-position: center;
  min-height: 800px;
}
.staker {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  max-width: 375px;
  width: 100%;
  background-color: #181818;
  max-height: 80vh;
  height: 100%;
  overflow: auto;
  box-shadow: 0 0 50px rgb(0 0 0 / 10%);
  border-radius: 2px;
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  min-height: 634px;
}
.chooser {
  background-color: rgb(15, 16, 19);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}
.navbar {
  display: flex;
  border: 1px solid #3c3c3c;
  box-sizing: border-box;
  border-radius: 100px;
  width: 100%;
}
#gas {
  padding: 0 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: #fff;
}
.switch {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-color: transparent;
  color: #fff;
  border-radius: 100px;
  line-height: 24px;
  box-sizing: border-box;
  white-space: nowrap;
  text-align: center;
  border: 1px solid transparent;
  box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  user-select: none;
  touch-action: manipulation;
  background: transparent;
}

.stakePage {
  width: calc(100% - 20px);
  padding: 10px;
  height: calc(80% - 20px);
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 0.2fr 1fr 0.5fr;
  gap: 0px 0px;
  grid-template-areas:
    "."
    "."
    ".";
  justify-content: center;
  align-items: center;
}
.sPElement {
  align-self: center;
  justify-self: center;
  color: #fff;
}
.input {
  border-radius: 4px;
  width: 100%;
  height: 180px;
  max-width: 362px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(15, 16, 19);
  border: none;
  font-weight: 500;
}
.inputBody {
  position: relative;
  height: 100%;
  padding: 0 0 0 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.StakeButton {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #3c3c3c;
  box-sizing: border-box;
  background-color: rgb(15, 16, 19);
  color: #fff;
  height: 50px;
  padding: 0 20px;
  font-size: 16px;
  border-radius: 100px;
  line-height: 24px;
  box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-radius: 100px;
}
.switch_active {
  border: 2px solid rgb(37, 167, 219);
  border-radius: 100px;
  color: #fff;
  cursor: pointer;
}
.switch_active:hover,
.switch:hover {
  background-color: rgba(37, 167, 219, 0.1);
}
.balance {
  margin-top: 8px;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  letter-spacing: 0.3px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: underline;
  z-index: 10;
  cursor: pointer;
  font-weight: bolder;
}
.token-amount-input {
  box-sizing: border-box;
  z-index: 10;
  margin: 0;
  padding: 0;
  font-variant: tabular-nums;
  list-style: none;
  font-feature-settings: "tnum";
  position: relative;
  display: inline-block;
  width: 100%;
  padding: 4px 11px;
  color: #fff;
  background-color: transparent;
  outline-width: 0;
  font-size: 34px;
  line-height: 40px;
  text-align: right;
  height: 40px;
  padding-bottom: 0;
  text-overflow: ellipsis;
  border-radius: 2px;
  border: none;
  touch-action: manipulation;
}
.ant-col {
  box-sizing: border-box;
  display: block;
  box-sizing: border-box;
  width: 50%;
}
.background3,
.background2 {
  background-image: url(Eth.png);
  position: absolute;
  z-index: 0;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.4) 60%
  );
  opacity: 0.05;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.background3 {
  background-image: url(vEth2.png);
}
</style>
