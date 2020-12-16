<template>
  <div class="flex_row root">
    <div class="text">GAS</div>
    <div class="flex_row container">
      <div class="line"></div>
      <div
        :class="choice == 0 ? 'choice' : 'choice active'"
        id="first"
        @click="setChoice(0)"
      >
        {{ gas.low.toFixed(0) }}
      </div>
      <div
        :class="choice == 1 ? 'choice' : 'choice active'"
        @click="setChoice(1)"
      >
        {{ gas.medium.toFixed(0) }}
      </div>
      <div
        :class="choice == 2 ? 'choice' : 'choice active'"
        @click="setChoice(2)"
      >
        {{ gas.high.toFixed(0) }}
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentGasPrices } from "../../utils/common";

export default {
  props: ["updateGas"],
  data: () => ({
    gas: {
      low: " 0",
      medium: 20,
      high: 50,
    },
    choice: 0,
  }),
  methods: {
    async getGas() {
      let gas = await getCurrentGasPrices();
      this.gas = gas;
    },
    setChoice(choice) {
      this.choice = choice;
      this.updateGas(Object.values(this.gas)[choice]);
    },
  },
  mounted: async function () {
    await this.getGas();
    await this.setChoice(0);
  },
};
</script>

<style scoped>
.line {
  position: absolute;
  width: 100%;
  height: 2px;
  z-index: 1;
  background-color: #ff007a;
}
.text {
  font-family: "Graduate", cursive;
  -webkit-appearance: textfield;
  font-size: 14px;
  cursor: default;
  text-align: center;
}
.choice {
  cursor: pointer;
  background-color: #fff;
  color: #ff007a;
  border: 1px solid #ff007a;
  border-radius: 50%;
  font-size: 14px;
  padding: 0.22rem;
  width: 19px;
  z-index: 10;
  text-align: center;
}
.root {
  width: 100%;
  margin-top: 0.5rem;
}
.container {
  position: relative;
  justify-content: space-between;
  cursor: default;
  width: 50%;
}
.active {
  background-color: #ff007a;
  color: #fff;
}
</style>