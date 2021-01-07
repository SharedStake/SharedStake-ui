<template>
  <div class="landingPage">
    <div class="title">SharedStake</div>
    <div class="content" id="mainContent">
      <span id="Red">
        Easy to use Ethereum 2 shared staking solution <br />
        Stake & trade</span
      >
    </div>
    <!-- 
    <div class="content">
      There are already
      <span class="value" id="Green">{{ value }} </span>Eth<ImageVue
        :src="'eth-logo.png'"
        :size="'25px'"
      />
      staked with <span id="Green">SharedStake!</span> -->
    <!-- </div> -->
  </div>
</template>

<script>
import { timeout } from "../../../../utils/helpers";
// import ImageVue from "../../../Handlers/image.vue";
import axios from "axios";
export default {
  // components: { ImageVue },
  data: () => ({ value: 0 }),
  methods: {
    async increaseValue() {
      let value = 0;
      let initValue = this.value * 1000;
      let increment = initValue / 500;
      while (value < initValue) {
        value += increment;
        this.value = (value / 1000).toFixed(2);
        await timeout(0);
      }
      this.value = initValue / 1000;
    },
    async mounted() {
      let totalBeth = await axios.get(
        "https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x898bad2774eb97cf6b94605677f43b41871410b1&apikey=GKKIY3WXXG1EICPRKACRR75MA4UE7ANFY8"
      );
      this.value = (totalBeth.data.result / 1e18).toFixed(2);
      await this.increaseValue();
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
  font-family: "Open Sans Condensed", sans-serif;
  font-size: 37px;
  font-weight: 300;
}
#mainContent {
  font-size: 37px;
  font-weight: 500;
}
#Green {
  color: #00d395;
}
/* #Red {
  font-weight: 300;
} */
.value {
  min-width: 5ch;
  display: inline-block;
  text-align: right;
  padding-right: 0.5ch;
}

@media only screen and (max-width: 700px) {
  .landingPage {
    color: #000;
  }
  .title {
    color: #00d395;
    font-size: 2em;
  }
  #mainContent {
    font-size: 0.9em;
  }
  .content {
    font-size: 0.7em;
  }
}
</style>