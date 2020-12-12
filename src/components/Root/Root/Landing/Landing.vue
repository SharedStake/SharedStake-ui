<template>
  <div class="landingPage">
    <div class="title">SharedStake</div>
    <div class="content" id="mainContent">
      <span id="Red">
        Shared staking for Eth 2.0! Stake while still being able to trade</span
      >
    </div>
    <div class="content">
      Earn ETH2 validator profit and more with the Shared Stake program and vETH2
    </div>
    <div class="content">
      <span id="Green">SharedStake Governance token</span> will be distributed with an
      <span id="Red">airdrop and staking geysers</span>!
    </div>
    <div class="content">
      Read more details
      <span id="Green">
        <a href='https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05#ad81c52153ae4972839332255a2dcd39'>
          on Notion
        </a>
      </span>
    </div>
    <div class="content">
      There are already
      <span class="value" id="Green">{{ value }} </span>Eth<ImageVue
        :src="'eth-logo.png'"
        :size="'25px'"
      />
      staked with <span id="Green">SharedStake!</span>
    </div>
  </div>
</template>

<script>
import { timeout } from "../../../../utils/helpers";
import ImageVue from "../../../Handlers/image.vue";
export default {
  components: { ImageVue },
  data: () => ({ value: 32.632 }),
  methods: {
    async increaseValue() {
      let value = 0;
      let initValue = this.value * 1000;
      let increment = initValue / 500;
      while (value < initValue) {
        value += increment;
        this.value = (value / 1000).toFixed(3);
        await timeout(0);
      }
      this.value = initValue / 1000;
    },
    mounted() {
      this.increaseValue();
    },
  },
  mounted: function () {
    this.mounted();
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Abel&display=swap");

.landingPage {
  font-family: "Abel", sans-serif;
}
.title {
  color: #00d395;
  font-size: 80px;
  font-weight: 300;
}
.content {
  font-family: "Open Sans Condensed", sans-serif;
  padding: 1rem 0 0 0;
  text-align: left;
  font-weight: 300;
}
a:link {
  text-decoration: none;
  font-weight: 300;
  color: #00d395;
}
#mainContent {
  font-size: 37px;
}
#Green {
  color: #00d395;
}
#Red {
  color: #e56b73;
}
.value {
  min-width: 7ch;
  display: inline-block;
  text-align: right;
  padding-right: 0.5ch;
}

@media only screen and (max-width: 700px) {
  .landingPage {
    color: #000;
    text-align: center;
  }
  .title {
    color: #00d395;
    text-align: center;
    font-size: 60px;
  }
  #mainContent {
    text-align: center;
    font-size: 27px;
  }
  .content {
    font-size: 21px;
    text-align: center;
  }
}
</style>