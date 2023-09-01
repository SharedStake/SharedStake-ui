<template>
  <div class="flex_column stake">
    <div class="staker">
      <Chooser
        :routes="[
          { text: 'Stake', cb: chooseCb },
          { text: 'Unstake', cb: chooseCb },
        ]"
        :currentActive="0"
      />

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
              <div class="ant-col">
                {{ isDeposit ? " ETH" : get_wsgETH ? "wsgETH" : "sgETH" }}
              </div>
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
                  isDeposit
                    ? get_wsgETH
                      ? ethTowsgETH
                      : (Damount / 32) * 32
                    : get_wsgETH
                    ? willGet
                    : (Damount / 32) * (32 + adminFee)
                "
                readonly
              />
              <div class="ant-col">
                {{ isDeposit ? (get_wsgETH ? "wsgETH" : "sgETH") : "ETH" }}
              </div>
            </div>
            <div class="balance" id="balance" @click="onMAX">
              wallet: {{ otherBalance }}
            </div>
            <div :class="isDeposit ? 'background3' : 'background2'" />
          </div>
        </div>

        <div id="gas">
          <span id="gas">Gas</span>
          <!-- Updated Chooser to gas and tip in accordance to EIP-1559 -->
          <Chooser
            :routes="[
              {
                text: (
                  gas.low.maxFeePerGas + gas.low.maxPriorityFeePerGas
                ).toFixed(1),
                cb: updateGasCb,
              },
              {
                text: (
                  gas.medium.maxFeePerGas + gas.medium.maxPriorityFeePerGas
                ).toFixed(1),
                cb: updateGasCb,
              },
              {
                text: (
                  gas.high.maxFeePerGas + gas.high.maxPriorityFeePerGas
                ).toFixed(1),
                cb: updateGasCb,
              },
            ]"
            :currentActive="1" 
          />
          <!-- Default to medium gas -->
        </div>
        <div class="navbar s-toggle">
          <span id="gas">
            <input
              id="get-wsgETH"
              type="checkbox"
              name="get-wsgETH"
              v-model="get_wsgETH"
            />
            <label for="get-wsgETH"
              >{{ isDeposit ? "Get" : "Use" }} Wrapped SgETH (interest
              bearing)</label
            >
          </span>
        </div>

        <ApprovalButton
          v-if="
            !isDeposit &&
              get_wsgETH &&
              this.enoughFundsInExitPool &&
              !this.enoughApproved
          "
          :ABI_token="wsgETH"
          :ABI_spender="validator"
          :amount="this.Damount"
          :cb="this.getUserApprovedwsgEth"
          class="StakeButton"
        />
        <dapp-tx-btn
          v-else
          class="StakeButton"
          :class="{
            switch_active: buttonText == 'Unstake',
          }"
          :click="genSubmit"
        >
          <span>
            {{ buttonText }}
          </span>
        </dapp-tx-btn>

        <!-- <div class="notification" v-if="isDeposit">
          <a
            v-if="!enoughFundsInExitPool"
            href="https://curve.fi/factory/49"
            target="_blank"
            rel="noopener noreferrer"
            class="notification"
          >
            Buy on Curve Pool ↗
          </a>
        </div>
        <div class="notification" v-else>
          <a
            v-if="!enoughFundsInExitPool"
            href="https://curve.fi/factory/49"
            target="_blank"
            rel="noopener noreferrer"
            class="notification"
          >
            Check out Curve if exit pool is low ↗
          </a>
        </div> -->
        <!-- <div class="notification" v-if="!isDeposit">
          *Protocol fee refund is <span class="underline">currently</span>
          <a
            href="https://snapshot.page/#/sharedstake.eth/proposal/QmdGJMwRHtTSFVsxufj7TKPK8G1zqwBbk8YuHfrqbWEsGd"
            target="_blank"
            rel="noopener noreferrer"
          >
            disabled↗</a
          >
        </div> -->
      </div>
    </div>
    <StakeGauge class="gauge" />
  </div>
</template>

<script>
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });
import { mapGetters } from "vuex";

import { validator, sgETH, wsgETH } from "@/contracts";

import ImageVue from "../Handlers/ImageVue";
import StakeGauge from "./StakeGauge";
import ApprovalButton from "../Common/ApproveButton.vue";
import Chooser from "../Common/Chooser.vue";
import DappTxBtn from "../Common/DappTxBtn.vue";
import { toChecksumAddress } from "../../utils/common";
import { getCurrentGasPrices } from "@/utils/common.js";

export default {
  components: { ImageVue, StakeGauge, ApprovalButton, Chooser, DappTxBtn },
  data: () => ({
    buttonText: "Currently disabled",
    BNamount: BN(0),
    Damount: "",
    isDeposit: true,
    get_wsgETH: true, // should be true; default state is users get yield bearing staked eth and dont need to worry about staking sgETH
    EthBal: BN(0),
    vEth2Bal: BN(0),
    userApprovedVEth2: BN(0),
    userApprovedwsgETH: BN(0),
    balance: 0,
    otherBalance: 0,
    // Update gas object structure for EIP-1559
    gas: {
      low: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
      medium: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
      high: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
    },
    chosenGas: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
    gasLevels: ["low", "medium", "high"], // Required to index Chooser update
    validInput: true,
    txs: [],
    maxValShares: 0,
    remaining: BN(0),
    remainingByFee: BN(0),
    loading: true,
    adminFee: 0,
    contractBal: 0,
    vEth2Price: BN(0),
    sgETH: sgETH,
    validator: validator,
    wsgETH: wsgETH,
    userWSGETHBal: BN(0),
    wsgETHRedemptionPrice: BN(0),
  }),
  mounted: async function() {
    // Polling blocknative gas API
    this.gas = await getCurrentGasPrices();
    this.chosenGas = this.gas.medium;
    this.loading = false;
    // console.log("chosenGas", this.chosenGas);
    await this.mounted();
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
    enoughFundsInExitPool() {
      return this.BNamount.lte(this.contractBal);
    },
    enoughApproved() {
      return this.userApprovedwsgETH.gte(this.BNamount);
    },
    willGet() {
      if (this.BNamount.eq(0)) return 0;
      let c = this.BNamount.multipliedBy(
        this.wsgETHRedemptionPrice.dividedBy(1e18)
      )
        .dividedBy(1e18)
        .toFixed(6);
      return c;
    },
    ethTowsgETH() {
      if (this.BNamount.eq(0)) return 0;
      let c = this.BNamount.multipliedBy(1e18)
        .dividedBy(this.wsgETHRedemptionPrice)
        .dividedBy(1e18)
        .toFixed(6);
      return c;
    },
  },
  methods: {
    async chooseCb(index) {
      this.isDeposit = index > 0 ? false : true;
      await this.mounted();
    },
    updateGasCb(index) {
      // Handle Chooser with EIP-1559 update
      this.updateGas(this.gasLevels[index]);
    },
    updateGas(gas) {
      this.chosenGas = this.gas[gas]; // Updated EIP-1559 gas object structure
      this.amountCheck(true);
    },
    async onMAX() {
      if (this.isDeposit) {
        let gas = this.chosenGas;
        let BNamount = this.EthBal.minus(
          BN(
            // sum both fees together for EIP-1559
            (gas.maxPriorityFeePerGas + gas.maxFeePerGas) * 200000 * 1000000000
          )
        );
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
        if (this.BNamount.gt(this.remainingByFee)) {
          this.BNamount = this.remainingByFee;
        }
        if (this.BNamount.gt(this.contractBal)) {
          this.BNamount = this.contractBal;
        }
        this.Damount = this.BNamount.dividedBy(1e18);
      }
    },
    toggleMode() {
      this.isDeposit = !this.isDeposit;
    },
    genSubmit() {
      console.log("Disabled due to vulnerabilities")
      if (this.isDeposit || this.buttonText == "Stake") return;
      if (!(this.buttonText == "Stake" || this.buttonText == "Unstake"))
        return {};

      let fn = validator.methods;
      // Transactions now handled in accordance EIP-1559
      let senderObj = {
        maxFeePerGas: BN(this.chosenGas.maxFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
        maxPriorityFeePerGas: BN(this.chosenGas.maxPriorityFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
      };
      // Debug senderObj sent to BappTxBtn.vue
      // console.log(senderObj);

      let args = [];

      if (!this.isDeposit) {
        if (this.get_wsgETH) {
          fn = fn.unstakeAndWithdraw;
          args = [this.BNamount.toString(), this.userAddress];
        } else {
          fn = fn.withdraw;
          args = [this.BNamount.toString()];
        }
      } else {
        senderObj.value = this.BNamount.toString();
        senderObj.gas = 200000;
        if (this.get_wsgETH) {
          fn = fn.depositAndStake;
        } else {
          fn = fn.deposit;
        }
      }
      return {
        abiCall: fn,
        argsArr: args,
        senderObj: senderObj,
        cb: async () => {
          this.loading = false;
          await this.mounted();
        },
      };
    },

    async mounted() {
      //balances
      try {
        let walletAddress = this.userAddress;
        let amount = await window.ethereum.request({
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        });

        this.EthBal = BN(amount);
        let veth2 = await sgETH.methods.balanceOf(walletAddress).call();
        let wsgeth = await this.getUserWsgETHBalance();
        this.vEth2Bal = BN(veth2);
        let _parse = (n) =>
          BN(n)
            .dividedBy(1e18)
            .toFixed(6);

        if (this.isDeposit) {
          this.balance = _parse(amount);
          this.otherBalance = this.get_wsgETH ? _parse(wsgeth) : _parse(veth2);
        } else {
          this.balance = this.get_wsgETH ? _parse(wsgeth) : _parse(veth2);
          this.otherBalance = BN(amount)
            .dividedBy(1e18)
            .toFixed(6);
        }
        let remaining = await validator.methods.remainingSpaceInEpoch().call();
        this.remaining = BN(remaining);
        let remainingByFee = await validator.methods.adminFeeTotal().call();
        this.remainingByFee = BN(remainingByFee).multipliedBy(320);

        let contractBal = await window.ethereum.request({
          method: "eth_getBalance",
          params: [toChecksumAddress(validator._address), "latest"],
        });

        this.contractBal = BN(contractBal);
        await this.getUserApprovedwsgEth();
        await this.getWsgETHRedemption();
        // this.vEth2Price = await vEth2Price();
        this.loading = false;
        this.amountCheck(true);
      } catch (err) {
        this.buttonText = "Connect to wallet ↗";
        console.log("Error mounting", err);
      }
    },
    amountCheck(init) {
      if (init && this.Damount == 0) return;
      if (this.userAddress == null) {
        this.validInput = false;
        this.buttonText = "Connect to wallet ↗";
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
        ? this.EthBal.minus(
            // Accounting for EIP-1559 gas and priority fees
            BN(
              // Adjusted for EIP-1559
              (this.chosenGas.maxPriorityFeePerGas +
                this.chosenGas.maxFeePerGas) *
                200000 *
                1000000000
            )
          ).gte(this.BNamount)
        : this.get_wsgETH
        ? BN(this.userWSGETHBal).gte(this.BNamount)
        : this.vEth2Bal.gte(this.BNamount);
      if (!this.validInput) {
        this.buttonText = "Insufficient balance";
        return;
      }
      if (!this.enoughFundsInExitPool && !this.isDeposit) {
        this.validInput = false;
        this.buttonText = "Not enough funds in Exit Pool";
        return;
      }
      if (this.validInput) {
        this.buttonText = this.isDeposit ? "Stake" : "Unstake";
      }
    },
    async getUserWsgETHBalance() {
      let bal = await wsgETH.methods.balanceOf(this.userAddress).call();
      this.userWSGETHBal = bal;
      return bal;
    },
    async getWsgETHRedemption() {
      let vp = await wsgETH.methods.pricePerShare().call();
      this.wsgETHRedemptionPrice = BN(vp);
    },
    async getUserApprovedwsgEth() {
      let userApproved = await wsgETH.methods
        .allowance(this.userAddress, validator.options.address)
        .call();
      this.userApprovedwsgETH = BN(userApproved);
    },
  },
  watch: {
    Damount: function(newValue, oldVal) {
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
    get_wsgETH: async function() {
      await this.mounted();
    },
    isDeposit: function(val) {
      let balance = val ? this.EthBal : this.vEth2Bal;
      this.balance = balance.dividedBy(1e18).toFixed(6);
      let otherBalance = val ? this.vEth2Bal : this.EthBal;
      this.otherBalance = otherBalance.dividedBy(1e18).toFixed(6);
      this.Damount = "";
      // this.buttonText = "Enter an amount";

      this.buttonText = "Currently disabled";
    },
    validInput: function(val) {
      if (!val) {
        if (this.Damount == 0) {
          this.buttonText = "Enter an amount";
        }
        if (this.Damount < 0) {
          this.buttonText = "input is too small";
          return;
        }
      this.buttonText = "Currently disabled";
      }
      if (val) {
        if (this.isDeposit) this.buttonText = "Stake";
        else this.buttonText = "Unstake";
      }
    },
    async userAddress(newVal) {
      if (newVal) {
        this.buttonText = "Enter an amount";
        this.buttonText = "Currently disabled";
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
  padding-top: 120px;
  padding-bottom: 80px;
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
  height: 90%;
  max-height: 716px;
  overflow: visible;
  box-shadow: 0 0 50px rgb(0 0 0 / 10%);
  border-radius: 2px;
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  min-height: 634px;
}
.navbar {
  display: flex;
  border: 1px solid #3c3c3c;
  box-sizing: border-box;
  border-radius: 100px;
}
#gas {
  padding: 0 5px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
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
  font-weight: bold;
}
.switch_active:hover,
.switch:hover {
  transform: scale(0.98);
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
  width: 70%;
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
.notification {
  width: 90%;
  padding: 0 5% 5% 5%;
  text-align: center;
  color: tomato;
  font-size: 16px;
}
.underline {
  text-decoration: underline;
}
.gauge {
  padding-top: 1rem;
}
</style>
