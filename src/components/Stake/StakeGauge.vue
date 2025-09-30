<template>
  <div class="gauge" v-show="showGauge">
    <div class="explanation">
      <div class="title">SharedStaked SGEth</div>
      <div class="content">
        Total of {{ ethDeposited }}ETH has been staked to SharedStake so far.
        <br />
        {{ contractEtherLimit }}ETH is required (for
        {{ numOfValidators }} validators).<br />
        When ETH is deposited into the SharedDeposit contract, a
        Validator-Share-ETH2 / SharedStake Governed Ether token (SGEth) is
        minted. SGEth is then optionally wrapped into wsgETH to earn interest
        from validators. Redeemable for the deposited ETH.
      </div>
    </div>
    <vep
      :loading="loading"
      :progress="contractDepositRatio"
      :legend-value="ethDeposited"
      :legendFormatter="
        ({ currentValue }) =>
          new Intl.NumberFormat('en-US').format(currentValue)
      "
      :size="220"
      :thickness="5"
      :empty-thickness="3"
      color="rgb(37, 167, 219)"
      color-fill="#181818"
      empty-color="#181818"
      empty-color-fill="#181818"
      lineMode="in"
      animation="reverse 700 400"
      fontSize="2rem"
      font-color="white"
 
    >
      <div slot="legend-value" class=" text-sm">
        / {{ maxEthDepositOnContract.toLocaleString("en-US") }}
      </div>

      <div slot="legend-caption" class="flex flex-row gap-2">
        <ImageVue :src="'tokens/eth-logo.png'" :size="'20px'" />
        <div class="blue">ETH Staked</div>
      </div>
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
    showGauge: true,
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

      const validatorContract = validator();
      if (!validatorContract) {
        console.error("Validator contract not available");
        return;
      }
      let maxValidatorShares = await validatorContract.maxValidatorShares();
      let currentValidatorShares = await validatorContract.curValidatorShares();
      let validatorPrice = await validatorContract.costPerValidator();
      this.numOfValidators = Number(await validatorContract.numValidators());

      maxValidatorShares = BN(maxValidatorShares.toString())
        .dividedBy(1e18)
        .toFixed(2);
      currentValidatorShares = BN(currentValidatorShares.toString())
        .dividedBy(1e18)
        .toFixed(2);
      validatorPrice = BN(validatorPrice.toString())
        .dividedBy(1e18)
        .toFixed(2);

      this.ethDeposited = this.calculateEthDepositted(
        currentValidatorShares,
        validatorPrice
      );
      this.maxEthDepositOnContract = this.calculateMaxEth(
        maxValidatorShares,
        validatorPrice
      );
      this.contractEtherLimit = Number(this.numOfValidators) * Number(validatorPrice);
      this.loading = false;
    },
    calculateMaxEth(maxValidatorShares, validatorPrice) {
      // One validator currently costs 32.1ETH.
      // We can calculate the max amount of ETH that can be depositted to contract
      // as maxShares * validatorPrice / validatorStake.
      const stakePerValidator = 32;
      const maxEthOnContract =
        (maxValidatorShares * validatorPrice) / stakePerValidator;

      return maxEthOnContract;
    },
    calculateEthDepositted(currentValidatorShares, validatorPrice) {
      // One validator currently costs 32.1ETH.
      // We can calculate the amount of ETH depositted to contract
      // as sharesMinted * validatorPrice / validatorStake.
      const stakePerValidator = 32;
      let ethDepositedToContract =
        (currentValidatorShares * validatorPrice) / stakePerValidator;

      const v1 = stakePerValidator * 500;
      ethDepositedToContract += v1;
      // To 2 decimal accuracy and cast it to number
      return +ethDepositedToContract.toFixed(2);
    },
  },
};
</script>

<style scoped>
.gauge {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
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
