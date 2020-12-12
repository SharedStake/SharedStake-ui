<template>
  <div class="flex_row Graph">
    <vep
      class="timer"
      :progress="tasksDonePercent"
      color="#7579ff"
      empty-color="#324c7e"
      :size="180"
      :thickness="5"
      :empty-thickness="3"
      lineMode="in 10"
      :legend-value="validators"
      animation="loop 700 1000"
      fontSize="1.5rem"
      font-color="#555"
      dash="5"
      :loading="loading"
    >
      <span slot="legend-value">
        / {{ maxValidators }}
        <ImageVue :src="'eth-logo.png'" :size="'20px'" />
      </span>
      <span slot="legend-caption" class="legend-caption"
        ><span class="blue"> SharedStake</span> Validators <br />Created
      </span>
    </vep>
    <div class="explanation" v-show="explanation">
      <div class="title">First contract to stake to Eth2!</div>
      <div class="content">
        This shows the validators created so far.
        <br />
        <span class="blue">SharedStake</span> aims to be the first contract that
        has ever staked for the Beacon chain on mainnet!
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../../Handlers/image";
import { validator } from "../../../contracts/contracts";
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "Validators",
  components: { ImageVue },
  props: { explanation: Boolean, updater: Boolean },
  data: () => ({
    loading: false,
    maxValidators: 0,
    validators: 0,
  }),
  computed: {
    tasksDonePercent() {
      if (this.maxValidators == 0) return 0;
      return (this.validators * 100) / this.maxValidators;
    },
  },
  watch: {
    updater() {
      this.mounted();
    },
  },
  methods: {
    async mounted() {
      //balances
      let validators = await validator.methods.validatorsCreated().call();
      let maxValidators = await validator.methods.numValidators().call();
      this.validators = validators;
      this.maxValidators = maxValidators;
    },
  },
  mounted: function () {
    this.mounted();
  },
};
</script>


<style scoped>
.blue {
  color: #007bff;
}
.timer {
  font-size: 1.4rem;
  padding: 0.4rem;
  margin: 0.6rem;
  background: #fafafa;
  min-width: 10rem;
}
.Graph {
  align-items: center;
  justify-content: left;
}
.explanation {
  max-width: 60%;
  padding: 0 0 0 3rem;
  text-align: left;
}
.title {
  color: #1d3c7a;
  font-size: 40px;
}
.content {
  font-size: 15px;
}
@media only screen and (max-width: 600px) {
  .Graph {
    flex-direction: column;
  }
  .explanation {
    max-width: 90%;
  }
}
</style>