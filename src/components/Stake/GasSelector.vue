<template>
  <div class="navbar">
    <span id="gas">Gas</span>
    <button
      class="switch"
      :class="{ switch_active: chosenGas == gas.low }"
      @click="updateGas(gas.low)">
      <span>{{ gas.low.toFixed(0) }}</span>
    </button>
    <button
      class="switch"
      :class="{ switch_active: chosenGas == gas.medium }"
      @click="updateGas(gas.medium)">
      <span>{{ gas.medium.toFixed(0) }}</span>
    </button>
    <button
      class="switch"
      :class="{ switch_active: chosenGas == gas.high }"
      @click="updateGas(gas.high)">
      <span>{{ gas.high.toFixed(0) }}</span>
    </button>
  </div>
</template>

<script>
import { getCurrentGasPrices } from "@/utils/common";

export default {
  data: () => ({
    chosenGas: 130,
    gas: { low: 90, medium: 130, high: 180 },
  }),
  async mounted() {
    this.gas = await getCurrentGasPrices();
    this.chosenGas = this.gas.medium;
    this.updateGas(this.chosenGas)
  },
  methods: {
    updateGas(gas) {
      this.chosenGas = gas;
      this.$emit('gasUpdate', this.chosenGas);
    },
  }
}
</script>

<style scoped>
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
</style>