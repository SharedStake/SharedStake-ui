<template>
  <div class="gauge" v-show="showGauge">
    <div class="explanation">
      <div class="title">SharedStaked vEth2</div>
      <div class="content">
        Total of {{ ethDeposited }}ETH has been staked to SharedStake so far.
        <br />
        {{ contractEtherLimit }}ETH is required (for {{ numOfValidators }} validators).<br />
        When ETH is deposited into the SharedDeposit contract, a
        Validator-Share-ETH2 token (vETH2) is minted. Redeemable for the
        deposited ETH.
      </div>
    </div>
    <vep
      :loading="loading"
      :progress="contractDepositRatio"
      :legend-value="ethDeposited"
      :size="180"
      :thickness="5"
      :empty-thickness="3"
      color="#7579ff"
      color-fill="#181818"
      empty-color="#181818"
      empty-color-fill="#181818"
      lineMode="in"
      animation="loop 700 1000"
      fontSize="1.5rem"
      font-color="white"
    >
      <span slot="legend-value">
        / {{ maxEthDepositOnContract }}
        <ImageVue :src="'tokens/eth-logo.png'" :size="'20px'" />
      </span>
          
      <span slot="legend-caption">
        <span class="blue">ETH staked</span>
      </span>
    </vep>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";
import { validator } from "@/contracts";
import BN from "bignumber.js";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  components: { ImageVue },
  data: () => ({
    loading: true,
    ethDeposited: 0,
    maxEthDepositOnContract: 0,
    contractEtherLimit: 0,
    numOfValidators: 0,
    showGauge: true
  }),
  computed: {
    contractDepositRatio() {
      if (this.loading || this.maxEthDepositOnContract == 0) return 0;
      return (this.ethDeposited * 100) / this.maxEthDepositOnContract;
    },
  },
  async mounted() {
    await this.setupGauge();
  },
  methods: {
    async setupGauge() {
      if (!window.ethereum) {
        this.showGauge = false;
        return;
      }

      let maxValidatorShares = await validator.methods.maxValidatorShares().call();
      let currentValidatorShares = await validator.methods.curValidatorShares().call();
      let validatorPrice = await validator.methods.costPerValidator().call();
      this.numOfValidators = await validator.methods.numValidators().call();

      maxValidatorShares = BN(maxValidatorShares).dividedBy(1e18).toFixed(2);
      currentValidatorShares = BN(currentValidatorShares).dividedBy(1e18).toFixed(2);
      validatorPrice = BN(validatorPrice).dividedBy(1e18).toFixed(2);

      this.ethDeposited = this.calculateEthDepositted(currentValidatorShares, validatorPrice);
      this.maxEthDepositOnContract = this.calculateMaxEth(maxValidatorShares, validatorPrice);
      this.contractEtherLimit = this.numOfValidators * validatorPrice;
      this.loading = false;
    },
    calculateMaxEth(maxValidatorShares, validatorPrice) {
      // One validator currently costs 32.1ETH.
      // We can calculate the max amount of ETH that can be depositted to contract
      // as maxShares * validatorPrice / validatorStake.
      const stakePerValidator = 32;
      const maxEthOnContract = maxValidatorShares * validatorPrice / stakePerValidator;

      return maxEthOnContract;
    },
    calculateEthDepositted(currentValidatorShares, validatorPrice) {
      // One validator currently costs 32.1ETH.
      // We can calculate the amount of ETH depositted to contract
      // as sharesMinted * validatorPrice / validatorStake.
      const stakePerValidator = 32;
      const ethDepositedToContract = currentValidatorShares * validatorPrice / stakePerValidator;

      return ethDepositedToContract.toFixed(2);
    }
  }
};
</script>


<style scoped>
.gauge {
  display: flex; 
  flex-direction: row; 
  align-items: center; 
  justify-content: center
}
.blue {
  color: rgb(37, 167, 219);
  font-size: 0.8em;
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
.explanation {
  max-width: 40%;
  padding: 0 3rem;
  text-align: left;
}
.title {
  color: rgb(37, 167, 219);
  font-size: 40px;
}
.content {
  font-size: 15px;
  color: #b3b3b3;
}
@media only screen and (max-width: 700px) {
  .gauge {
    flex-direction: column;
  }
  .explanation {
    max-width: 90%;
    margin-bottom: 1rem;
  }
}
</style>