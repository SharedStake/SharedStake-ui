<template>
  <div class="stake flex flex-col items-center justify-evenly">
    <div class="staker">
      <Chooser
        :routes="[
          { text: 'Stake', cb: chooseCb },
          { text: 'Unstake', cb: chooseCb },
        ]"
        :current-active="0"
      />

      <div class="stakePage">
        <div class="sPElement input">
          <div class="inputBody">
            <TokenInput
              v-model="Damount"
              :token-symbol="isDeposit ? 'ETH' : (get_wsgETH ? 'wsgETH' : 'sgETH')"
              :balance="isDeposit ? EthBal : (get_wsgETH ? userWSGETHBal : vEth2Bal)"
              @max-click="onMAX"
            />
            <div :class="isDeposit ? 'background2' : 'background3'" />
          </div>
        </div>
        <ImageVue
          class="sPElement"
          :src="'down.png'"
          :size="'30px'"
        />
        <div class="sPElement input">
          <div class="inputBody">
            <TokenInput
              :model-value="
                isDeposit
                  ? get_wsgETH
                    ? ethTowsgETH
                    : (Damount / 32) * 32
                  : get_wsgETH
                    ? willGet
                    : (Damount / 32) * (32 + adminFee)
              "
              :token-symbol="isDeposit ? (get_wsgETH ? 'wsgETH' : 'sgETH') : 'ETH'"
              :balance="isDeposit ? (get_wsgETH ? userWSGETHBal : vEth2Bal) : EthBal"
              :disabled="true"
              :show-max-button="false"
            />
            <div :class="isDeposit ? 'background3' : 'background2'" />
          </div>
        </div>

        <GasSelector
          :gas-prices="gas"
          v-model="chosenGas"
        />
        <div class="navbar s-toggle">
          <span id="gas">
            <input
              id="get-wsgETH"
              v-model="get_wsgETH"
              type="checkbox"
              name="get-wsgETH"
            >
            <label for="get-wsgETH">{{ isDeposit ? "Get" : "Use" }} Wrapped SgETH (interest
              bearing)</label>
          </span>
        </div>

        <LoadingSpinner
          v-if="loading"
          text="Loading..."
        />
        <ApprovalButton
          v-else-if="
            !isDeposit &&
              get_wsgETH &&
              enoughFundsInExitPool &&
              !enoughApproved
          "
          :ABI_token="wsgETH"
          :ABI_spender="validator"
          :amount="Damount"
          :cb="getUserApprovedwsgEth"
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
import { useBigNumber } from "@/composables/useBigNumber";
import { useWallet } from "@/composables/useWallet";
import { useTokenBalance } from "@/composables/useTokenBalance";
import { useGas } from "@/composables/useGas";
import { useFormValidation } from "@/composables/useFormValidation";
import { useTransaction } from "@/composables/useTransaction";

import { validator, sgETH, wsgETH } from "@/contracts";

import ImageVue from "../Handlers/ImageVue.vue";
import StakeGauge from "./StakeGauge.vue";
import ApprovalButton from "../Common/ApproveButton.vue";
import Chooser from "../Common/Chooser.vue";
import DappTxBtn from "../Common/DappTxBtn.vue";
import TokenInput from "../Common/TokenInput.vue";
import GasSelector from "../Common/GasSelector.vue";
import LoadingSpinner from "../Common/LoadingSpinner.vue";
import { toChecksumAddress } from "../../utils/common";
const enableStaking = true;

export default {
  components: { 
    ImageVue, 
    StakeGauge, 
    ApprovalButton, 
    Chooser, 
    DappTxBtn, 
    TokenInput, 
    GasSelector, 
    LoadingSpinner 
  },
  setup() {
    const { parseBN, formatBN, toWei, getMaxAmountAfterGas } = useBigNumber();
    const { userAddress, isConnected } = useWallet();
    const { getTokenBalance, getETHBalance, getTokenAllowance, hasSufficientBalance, hasSufficientAllowance } = useTokenBalance();
    const { getGasPrices, getGasLevels } = useGas();
    const { validateAmount, validateApproval, getButtonText, validateContractState } = useFormValidation();
    const { createTransaction } = useTransaction();

    return {
      parseBN,
      formatBN,
      toWei,
      getMaxAmountAfterGas,
      userAddress,
      isConnected,
      getTokenBalance,
      getETHBalance,
      getTokenAllowance,
      hasSufficientBalance,
      hasSufficientAllowance,
      getGasPrices,
      getGasLevels,
      validateAmount,
      validateApproval,
      getButtonText,
      validateContractState,
      createTransaction
    };
  },
  data: () => ({
    buttonText: enableStaking ? "Enter an amount" : "Currently disabled",
    BNamount: null,
    Damount: "",
    isDeposit: true,
    get_wsgETH: true, // should be true; default state is users get yield bearing staked eth and dont need to worry about staking sgETH
    EthBal: null,
    vEth2Bal: null,
    userApprovedwsgETH: null,
    balance: 0,
    otherBalance: 0,
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
    remaining: null,
    remainingByFee: null,
    loading: true,
    adminFee: 0,
    contractBal: 0,
    vEth2Price: null,
    sgETH: sgETH,
    validator: validator,
    wsgETH: wsgETH,
    userWSGETHBal: null,
    wsgETHRedemptionPrice: null,
  }),
  computed: {
    enoughFundsInExitPool() {
      return this.BNamount && this.contractBal ? this.BNamount.lte(this.contractBal) : false;
    },
    enoughApproved() {
      return this.userApprovedwsgETH && this.BNamount ? this.userApprovedwsgETH.gte(this.BNamount) : false;
    },
    willGet() {
      if (!this.BNamount || this.BNamount.eq(0) || !this.wsgETHRedemptionPrice) return 0;
      let c = this.BNamount.multipliedBy(
        this.wsgETHRedemptionPrice.dividedBy(1e18)
      )
        .dividedBy(1e18)
        .toFixed(6);
      return c;
    },
    ethTowsgETH() {
      if (!this.BNamount || this.BNamount.eq(0) || !this.wsgETHRedemptionPrice) return 0;
      let c = this.BNamount.multipliedBy(1e18)
        .dividedBy(this.wsgETHRedemptionPrice)
        .dividedBy(1e18)
        .toFixed(6);
      return c;
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
        this.BNamount = this.parseBN(this.Damount).multipliedBy(1e18);
        this.amountCheck();
        return;
      }
      if (
        newValue[newValue.length - 1] === "." &&
        newValue[newValue.length - 2] !== "."
      ) {
        this.Damount = newValue;
        this.amountCheck();
        return;
      }
      if (isNaN(newValue)) {
        this.Damount = this.BNamount ? this.BNamount.dividedBy(1e18).toString() : "0";
        return;
      }
      if (!newValue) {
        this.Damount = "0";
      } else {
        this.Damount = newValue;
      }
      this.BNamount = this.parseBN(this.Damount).multipliedBy(1e18);
      this.Damount = this.BNamount.dividedBy(1e18).toString();
      this.amountCheck();
    },
    get_wsgETH: async function() {
      await this.initializeData();
    },
    isDeposit: function(val) {
      let balance = val ? this.EthBal : this.vEth2Bal;
      this.balance = balance ? this.formatBN(balance) : "0";
      let otherBalance = val ? this.vEth2Bal : this.EthBal;
      this.otherBalance = otherBalance ? this.formatBN(otherBalance) : "0";
      this.Damount = "";
      
      this.buttonText = enableStaking ? "Enter an amount" : "Currently disabled";
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
        await this.initializeData();
      } else {
        this.buttonText = "Connect to wallet ↗";
      }
    },
  },
  mounted: async function() {
    // Get gas prices
    this.gas = await this.getGasPrices();
    this.chosenGas = this.gas.medium;
    this.loading = false;
    await this.initializeData();
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
        const gas = this.chosenGas;
        const gasCost = this.getMaxAmountAfterGas(this.EthBal, gas);
        
        const remaining = await validator().remainingSpaceInEpoch();
        this.remaining = this.parseBN(remaining);
        
        if (this.remaining.eq(0)) {
          this.amountCheck();
          return;
        }
        
        if (this.remaining.gte(gasCost) || !this.isDeposit) {
          this.BNamount = gasCost;
        } else {
          this.BNamount = this.remaining;
        }
        this.Damount = this.BNamount.dividedBy(1e18);
      } else {
        const remainingByFee = await validator().adminFeeTotal();
        if (remainingByFee > 10) {
          this.remainingByFee = this.parseBN(remainingByFee).multipliedBy(320);
        } else {
          this.remainingByFee = this.parseBN(0);
        }
        
        this.BNamount = this.vEth2Bal;
        if (this.BNamount.gt(this.remainingByFee)) {
          this.BNamount = this.remainingByFee;
        }
        if (this.BNamount.gt(this.contractBal)) {
          this.BNamount = this.contractBal;
        }
        this.Damount = this.BNamount.dividedBy(1e18);
        
        if (this.BNamount.multipliedBy(100).lt(this.parseBN(this.balance).multipliedBy(100))) {
          this.Damount = this.balance;
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
        maxFeePerGas: this.chosenGas.maxFeePerGas,
        maxPriorityFeePerGas: this.chosenGas.maxPriorityFeePerGas,
      };

      let args = [];
      let fn;

      if (!this.isDeposit) {
        if (this.get_wsgETH) {
          fn = validatorContract.unstakeAndWithdraw;
          args = [this.BNamount.toString(), this.userAddress()];
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

      return this.createTransaction(
        fn,
        args,
        senderObj,
        async () => {
          this.loading = false;
          await this.initializeData();
        }
      );
    },

    async initializeData() {
      try {
        const walletAddress = this.userAddress();
        if (!walletAddress) {
          this.buttonText = "Connect to wallet ↗";
          return;
        }

        // Get ETH balance
        this.EthBal = await this.getETHBalance(walletAddress);
        
        // Get sgETH balance
        const sgETHContract = sgETH();
        if (!sgETHContract) {
          console.error("sgETH contract not initialized");
          return;
        }
        
        this.vEth2Bal = await this.getTokenBalance(sgETHContract, walletAddress);
        this.userWSGETHBal = await this.getUserWsgETHBalance();
        
        // Update display balances
        if (this.isDeposit) {
          this.balance = this.formatBN(this.EthBal);
          this.otherBalance = this.get_wsgETH ? this.formatBN(this.userWSGETHBal) : this.formatBN(this.vEth2Bal);
        } else {
          this.balance = this.get_wsgETH ? this.formatBN(this.userWSGETHBal) : this.formatBN(this.vEth2Bal);
          this.otherBalance = this.formatBN(this.EthBal);
        }

        // Get contract data
        const validatorContract = validator();
        if (!validatorContract) {
          console.error("Validator contract not initialized");
          return;
        }
        
        const remaining = await validatorContract.remainingSpaceInEpoch();
        this.remaining = this.parseBN(remaining);
        
        const remainingByFee = await validatorContract.adminFeeTotal();
        this.remainingByFee = this.parseBN(remainingByFee).multipliedBy(320);

        const contractBal = await window.ethereum.request({
          method: "eth_getBalance",
          params: [toChecksumAddress(validatorContract.target), "latest"],
        });

        this.contractBal = this.parseBN(contractBal);
        await this.getUserApprovedwsgEth();
        await this.getWsgETHRedemption();
        
        this.loading = false;
        this.amountCheck(true);
      } catch (err) {
        this.buttonText = "Connect to wallet ↗";
        console.log("Error mounting", err);
      }
    },
    amountCheck(init) {
      if (init && this.Damount == 0) return;
      
      const userAddress = this.userAddress();
      if (!userAddress) {
        this.validInput = false;
        this.buttonText = "Connect to wallet ↗";
        return;
      }

      // Check contract state
      const contractValidation = this.validateContractState({
        isFull: this.remaining && this.remaining.eq(0),
        remainingSpace: this.remaining,
        hasFunds: this.enoughFundsInExitPool
      });

      if (!contractValidation.isValid) {
        this.validInput = false;
        this.buttonText = contractValidation.error;
        return;
      }

      // Check amount validation
      const gasCost = this.chosenGas ? {
        maxFeePerGas: this.chosenGas.maxFeePerGas,
        maxPriorityFeePerGas: this.chosenGas.maxPriorityFeePerGas
      } : null;

      const amountValidation = this.validateAmount(
        this.Damount,
        this.isDeposit ? this.EthBal : (this.get_wsgETH ? this.userWSGETHBal : this.vEth2Bal),
        gasCost
      );

      if (!amountValidation.isValid) {
        this.validInput = false;
        this.buttonText = amountValidation.error;
        return;
      }

      if (this.Damount[this.Damount.length - 1] === ".") {
        this.validInput = false;
        this.buttonText = "waiting...";
        return;
      }

      this.validInput = true;
      this.buttonText = this.getButtonText(amountValidation, this.isDeposit ? "Stake" : "Unstake");
    },
    async getUserWsgETHBalance() {
      const wsgETHContract = wsgETH();
      if (!wsgETHContract) {
        console.error("wsgETH contract not initialized");
        return this.parseBN(0);
      }
      const bal = await this.getTokenBalance(wsgETHContract, this.userAddress());
      this.userWSGETHBal = bal;
      return bal;
    },
    async getWsgETHRedemption() {
      const wsgETHContract = wsgETH();
      if (!wsgETHContract) {
        console.error("wsgETH contract not initialized");
        return;
      }
      const vp = await wsgETHContract.pricePerShare();
      this.wsgETHRedemptionPrice = this.parseBN(vp);
    },
    async getUserApprovedwsgEth() {
      const wsgETHContract = wsgETH();
      const validatorContract = validator();
      if (!wsgETHContract || !validatorContract) {
        console.error("Contracts not initialized");
        return;
      }
      const userApproved = await this.getTokenAllowance(
        wsgETHContract, 
        this.userAddress(), 
        validatorContract.target
      );
      this.userApprovedwsgETH = userApproved;
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
