<template>
  <div class="inputs">
    <div class="sPElement input">
      <div class="inputBody">
        <div class="flex_row">
          <StakeInputField v-model="depositAmount" />
          <div class="ant-col">{{ isEthDeposit ? " ETH" : "vETH2" }}</div>
        </div>
        <div class="balance" id="balance" @click="setMaxDepositableAmount()">
          wallet: {{ isEthDeposit ? ethBalance : vEth2Balance  }}
        </div>
        <div :class="isEthDeposit ? 'background2' : 'background3'" />
      </div>
    </div>
    <ImageVue class="sPElement" :src="'down.png'" :size="'30px'" />
    <div class="sPElement input">
      <div class="inputBody">
        <div class="flex_row">
          <StakeInputField v-model="outputAmount" :isReadonly="true" />
          <div class="ant-col">
            {{ isEthDeposit ? " vETH2" : " ETH" }}
          </div>
        </div>
        <div class="balance" id="balance" @click="setMaxDepositableAmount()">
          wallet: {{ isEthDeposit ? vEth2Balance : ethBalance }}
        </div>
        <div :class="isEthDeposit ? 'background3' : 'background2'" />
      </div>
    </div>
  </div>
</template>

<script>
import StakeInputField from "./StakeInputField"
import ImageVue from "../Handlers/ImageVue"

export default {
  components: { StakeInputField, ImageVue },
  props: {
    isEthDeposit: Boolean, 
    adminFee: Number, 
    ethBalance: Number, 
    vEth2Balance: Number,
    maxDepositAvailable: Number,
  },
  data: () => ({
    depositAmount: '',
  }),
  computed: {
    outputAmount() {
      return this.isEthDeposit ? 
        (this.depositAmount / (32 + 0.1)) * 32 :
        (this.depositAmount / 32) * (32 + this.adminFee)
    }
  },
  watch: {
    maxDepositAvailable() {
      this.depositAmount = this.maxDepositAvailable > 0 ? this.maxDepositAvailable : '';
    },
    isEthDeposit() {
      this.depositAmount = '';
      this.setMaxDepositableAmount();
    }
  },
  methods: {
    setMaxDepositableAmount() {
      this.$emit('updateMaxDespositAmount');
    }
  }
}
</script>

<style scoped>
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
.ant-col {
  box-sizing: border-box;
  display: block;
  box-sizing: border-box;
  width: 50%;
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
.sPElement {
  align-self: center;
  justify-self: center;
  color: #fff;
}
.inputs {
  display: grid;
  justify-content: center;
  align-items: center;
}
</style>