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
BN.config({ DECIMAL_PLACES: 5 })
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
const enableStaking = true;

export default {
  components: { ImageVue, StakeGauge, ApprovalButton, Chooser, DappTxBtn },
  data: () => ({
    buttonText: enableStaking ? "Enter an amount" : "Currently disabled",
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
    await this.initializeData();
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
      await this.initializeData();
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
        let remaining = await validator().remainingSpaceInEpoch();
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
        let remainingByFee = await validator().adminFeeTotal();
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
        if (this.BNamount.multipliedBy(100).lt(BN(this.balance).multipliedBy(100))) {
          this.Damount = BN(this.balance);
        }
      }
    },
    toggleMode() {
      this.isDeposit = !this.isDeposit;
    },
    genSubmit() {
      if (!(this.buttonText == "Stake" || this.buttonText == "Unstake"))
        return {};

      const validatorContract = validator(true); // Use signer for write operations
      if (!validatorContract) {
        console.error("Validator contract not initialized");
        return {};
      }

      // Transactions now handled in accordance EIP-1559
      let senderObj = {
        maxFeePerGas: BN(this.chosenGas.maxFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
        maxPriorityFeePerGas: BN(this.chosenGas.maxPriorityFeePerGas)
          .multipliedBy(1000000000)
          .toString(),
      };

      let args = [];
      let fn;

      if (!this.isDeposit) {
        if (this.get_wsgETH) {
          fn = validatorContract.unstakeAndWithdraw;
          args = [this.BNamount.toString(), this.userAddress];
        } else {
          fn = validatorContract.withdraw;
          args = [this.BNamount.toString()];
        }
      } else {
        senderObj.value = this.BNamount.toString();
        senderObj.gas = 200000;
        if (this.get_wsgETH) {
          fn = validatorContract.depositAndStake;
        } else {
          fn = validatorContract.deposit;
        }
      }
      const result = {
        abiCall: fn,
        argsArr: args,
        senderObj: senderObj,
        cb: async () => {
          this.loading = false;
          await this.initializeData();
        },
      };
      
      
      return result;
    },

    async initializeData() {
      //balances
      try {
        let walletAddress = this.userAddress;
        let amount = await window.ethereum.request({
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        });

        this.EthBal = BN(amount);
        
        const sgETHContract = sgETH();
        if (!sgETHContract) {
          console.error("sgETH contract not initialized");
          return;
        }
        
        let veth2 = await sgETHContract.balanceOf(walletAddress);
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
        const validatorContract = validator();
        if (!validatorContract) {
          console.error("Validator contract not initialized");
          return;
        }
        
        let remaining = await validatorContract.remainingSpaceInEpoch();
        this.remaining = BN(remaining);
        let remainingByFee = await validatorContract.adminFeeTotal();
        this.remainingByFee = BN(remainingByFee).multipliedBy(320);

        let contractBal = await window.ethereum.request({
          method: "eth_getBalance",
          params: [toChecksumAddress(validatorContract.target), "latest"],
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
      const wsgETHContract = wsgETH();
      if (!wsgETHContract) {
        console.error("wsgETH contract not initialized");
        return "0";
      }
      let bal = await wsgETHContract.balanceOf(this.userAddress);
      this.userWSGETHBal = bal;
      return bal;
    },
    async getWsgETHRedemption() {
      const wsgETHContract = wsgETH();
      if (!wsgETHContract) {
        console.error("wsgETH contract not initialized");
        return;
      }
      let vp = await wsgETHContract.pricePerShare();
      this.wsgETHRedemptionPrice = BN(vp);
    },
    async getUserApprovedwsgEth() {
      const wsgETHContract = wsgETH();
      const validatorContract = validator();
      if (!wsgETHContract || !validatorContract) {
        console.error("Contracts not initialized");
        return;
      }
      let userApproved = await wsgETHContract.allowance(this.userAddress, validatorContract.target);
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
      await this.initializeData();
    },
    isDeposit: function(val) {
      let balance = val ? this.EthBal : this.vEth2Bal;
      this.balance = balance.dividedBy(1e18).toFixed(6);
      let otherBalance = val ? this.vEth2Bal : this.EthBal;
      this.otherBalance = otherBalance.dividedBy(1e18).toFixed(6);
      this.Damount = "";
      
      this.buttonText = enableStaking ? "Enter an amount" : "Currently disabled";
      // this.buttonText = "Enter an amount";

      // this.buttonText = "Currently disabled";
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
      // this.buttonText = "Currently disabled";
      }
      if (val) {
        if (this.isDeposit) this.buttonText = "Stake";
        else this.buttonText = "Unstake";
      }
    },
    async userAddress(newVal) {
      if (newVal) {
        this.buttonText = "Enter an amount";
        // this.buttonText = "Currently disabled";
        await this.initializeData();
      } else {
        this.buttonText = "Connect to wallet ↗";
      }
    },
  },
};
</script>

<style scoped>
.stake {
  @apply pt-[120px] pb-20 bg-[url('bg-1.png')] bg-no-repeat bg-center min-h-[800px];
}

.staker {
  @apply antialiased max-w-[375px] w-full bg-dark-footer h-[90%] max-h-[716px] overflow-visible shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-sm relative select-none min-h-[634px];
}
.navbar {
  @apply flex border border-gray-600 box-border rounded-[100px];
}
#gas {
  @apply px-1.5 text-base flex items-center justify-center text-white;
}
.stakePage {
  @apply w-[calc(100%-20px)] p-2.5 h-[calc(80%-20px)] grid grid-cols-1 grid-rows-[1fr_0.2fr_1fr_0.5fr] gap-0 justify-center items-center;
  grid-template-areas:
    "."
    "."
    ".";
}
.sPElement {
  @apply self-center justify-self-center text-white;
}
.input {
  @apply rounded w-full h-[180px] max-w-[362px] overflow-hidden flex items-center justify-center bg-dark-bg border-0 font-medium;
}
.inputBody {
  @apply relative h-full p-0 w-full flex flex-col justify-around items-center;
}
.StakeButton {
  @apply w-full flex justify-center items-center border border-gray-600 box-border bg-dark-bg text-white px-5 text-base rounded-[100px] leading-6 shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all duration-300;
}
.switch_active {
  @apply border-2 border-brand-secondary rounded-[100px] text-white cursor-pointer font-bold;
}
.switch_active:hover,
.switch:hover {
  @apply scale-[0.98];
}
.balance {
  @apply mt-2 text-xs leading-5 text-center tracking-[0.3px] flex justify-center items-center underline z-10 cursor-pointer font-bold;
}
.token-amount-input {
  @apply box-border z-10 m-0 p-0 relative inline-block w-[70%] px-3 py-1 text-white bg-transparent outline-0 text-[34px] leading-10 text-right h-10 pb-0 rounded border-0;
  font-variant: tabular-nums;
  list-style: none;
  font-feature-settings: "tnum";
  text-overflow: ellipsis;
  touch-action: manipulation;
}
.ant-col {
  @apply box-border block w-1/2;
}
.background3,
.background2 {
  @apply bg-[url('Eth.png')] absolute z-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-contain bg-no-repeat bg-center opacity-[0.05] transition-all duration-300;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.4) 60%
  );
}
.background3 {
  @apply bg-[url('vEth2.png')];
}
.notification {
  @apply w-[90%] px-[5%] pb-[5%] text-center text-red-500 text-base;
}
.underline {
  @apply underline;
}
.gauge {
  @apply pt-4;
}
</style>
