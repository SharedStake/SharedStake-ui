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
      <span slot="legend-caption" class="legend-caption">
        <span class="blue">Eth staked</span>
      </span>
    </vep>
    <div class="explanation" v-show="explanation">
      <div class="title">SharedStaked vEth2</div>
      <div class="content">
        This shows the total Eth amount that is staked to SharedStake so far.
        <br />
        320 is required (10 validators) for the first deposit to Eth2 event
        which locks it up. <br />
        We will increase this limit to 3200, then 32000 (1000 validators) for
        subsequent deposit events. <br />
        When Eth is deposited into the SharedDeposit contract, a
        Validator-Share-Eth2 token (vEth2) is minted. Redeemable for the
        deposited Eth.
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
  name: "TotalStaked",
  props: { explanation: Boolean, updater: Boolean },
  components: { ImageVue },
  data: () => ({
    loading: false,
    validators: 0,
    maxValidators: 0,
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
      let amount = await validator.methods.curValidatorShares().call();
      this.validators = BN(amount).dividedBy(1e18).toFixed(1);
      let maxValidators = await validator.methods.maxValidatorShares().call();
      this.maxValidators = (maxValidators / 1e18).toFixed(0);
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
  border: solid 0 transparent;
  border-radius: 50%;
  overflow: hidden;
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

@media only screen and (max-width: 700px) {
  .Graph {
    flex-direction: column;
  }
  .explanation {
    max-width: 90%;
  }
}
</style>