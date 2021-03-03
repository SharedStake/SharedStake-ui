<template>
  <div class="dashboard">
    <div class="flex_column Stats">
      <div class="StatsHeader">Watch your Steak!</div>
      <div class="StatsExp">
        <span id="colored">SharedStake</span> users gain staking rewards
        <span id="colored">every block</span>, while just holding or investing
        vEth2 in supported Ethereum Applications such as Uniswap, Sushiswap,
        Curve, Maker, Compound, Aave and
        <span id="colored">many more...</span>
      </div>
      <div class="StatsExp">
        Dashboard allows users to see their
        <span id="colored">Eth2 staking profits </span>
        with important parameters. Users can also keep track of the overall
        statistics of the Protocol.
      </div>
      <div class="StatsExp">
        Dashboard works with an off-chain calculator:<span id="colored">
          Barbecue.js</span
        >
        that calculates the profit of any address and a Defi Adapter:<span
          id="colored"
        >
          Sauce.js</span
        >
        which adds a support to the on-chain contract interactions.
      </div>
      <div class="StatsExp">
        Currently Dashboard is under construction and planned to be active on
        April 2021.
      </div>
      <div class="StatsExp">Hold onto your Steak and come back!</div>
      <div class="LearnButton">
        Learn More
        <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
      </div>
    </div>
    <div class="background" />
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.dashboard {
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  padding-top: 70px;
  padding-bottom: 5vh;
  position: relative;
}
.background {
  background-image: url(dashboard.jpg);
  position: absolute;
  z-index: 0;
  width: 100%;
  height: 100%;
  top: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.9) 10%,
    rgba(0, 0, 0, 0.2) 75%
  );
}
.Stats {
  width: calc(100% - 60px);
  min-height: auto;
  max-width: 1500px;
  margin: 0px auto;
  z-index: 1;
  padding: 120px 0px;
  position: relative;
  overflow: hidden;
  color: #fff;
  justify-content: space-between;
}
.StatsHeader {
  color: rgb(255, 255, 255);
  -webkit-box-align: center;
  align-items: center;
  font-size: 50px;
  line-height: 1.16em;
  z-index: 1;
  margin-bottom: 30px;
  font-weight: 300;
  animation: TextEnter 0.4s ease-out backwards;
  text-align: center;
}
.StatsExp {
  max-width: 660px;
  text-align: center;
  margin: 0px auto 10px;
  z-index: 1;
  font-size: 22px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.9);
  animation: TextEnter 0.4s ease-out backwards 0.2s;
  text-align: left;
}
.StatsContent {
  display: flex;
  width: calc(100% - 60px);
  z-index: 1;
  -webkit-box-pack: justify;
  justify-content: space-between;
  max-width: 1500px;
  margin: 0px auto;
  animation: TextEnter 0.4s ease-out backwards 0.4s;
}
.LearnButton {
  margin-top: 20px;
  font-size: 21px;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #fff;
  border-radius: 10px;
  z-index: 1;
  text-align: center;
  animation: TextEnter 0.4s ease-out backwards 0.4s;
  width: 142px;
  transition: transform 0.5s ease-out;
  cursor: pointer;
}
.LearnButton:hover {
  transform: scale(0.98);
}
@keyframes TextEnter {
  from {
    transform: translate3d(0, 2rem, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}
#colored {
  color: #e6007a;
}
.StatsHeader::after {
  transform: translate(-30px, 30px);
  position: absolute;
  z-index: 1;
  content: "";
  width: 1.9rem;
  height: 1.9rem;
  border: 2px solid #e6007a;
  border-radius: 50%;
}
</style>