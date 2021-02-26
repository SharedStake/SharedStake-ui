<template>
  <div class="Landing">
    <div class="Container first" v-show="scrolled >= 0">
      <div class="LogoContainer">
        <ImageVue :src="'logo-red.svg'" :size="'180px'" class="Logo" />
      </div>
      <div class="Explanation">
        <div class="main">Staking For Everyone</div>
        <div class="exp">
          SharedStake is an easy to use Decentralized Open Source Protocol that
          allows users to stake any amount of Ether to Ethereum 2 while keeping
          their staked amount valuable and liquid
        </div>
        <div class="social">
          <div class="LearnButton">
            Learn More
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
          <ImageVue :src="'twitter.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'discord.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'reddit.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'github.svg'" :size="'30px'" class="socialLogo" />
        </div>
      </div>
    </div>
    <div class="downSign glow" v-show="scrolled >= 0">
      <ImageVue :src="'down.svg'" :size="'30px'" />
    </div>
    <div class="flex_column Stats" v-show="scrolled >= 350">
      <div class="StatsHeader">Best in class performance</div>
      <div class="StatsExp">
        Better prices, faster response times, and lower revert rates than any
        other aggregator on the market.
      </div>
      <div class="StatsContent">
        <div class="Stat">
          <div class="Num">5470</div>
          <div class="NumExp">Ether Staked with SharedStake</div>
          <div class="NumDetail">Liquid & Incentivised</div>
        </div>
        <div class="Stat">
          <div class="Num">105%</div>
          <div class="NumExp">Current APY</div>
          <div class="NumDetail">Most Profitable Eth2 Staking Protocol</div>
        </div>
        <div class="Stat">
          <div class="Num">5470</div>
          <div class="NumExp">Ether Staked with SharedStake</div>
          <div class="NumDetail">Liquid & Incentivised</div>
        </div>
      </div>
    </div>
    <div class="Container" v-show="scrolled >= 1000">
      <div class="exp background2" />
      <div class="second">
        <div class="X Eth">
          <ImageVue :src="'Eth.png'" :size="'90px'" />
        </div>
        <ImageVue :src="'next.svg'" :size="'15px'" class="X next1" />
        <div class="X vEth2">
          <ImageVue :src="'vEth2.png'" :size="'163px'" />
        </div>
        <ImageVue :src="'next.svg'" :size="'15px'" class="X next2" />
        <div class="X reward">
          <ImageVue :src="'Reward.png'" :size="'127px'" />
        </div>
        <ImageVue :src="'next.svg'" :size="'15px'" class="X next3" />
        <div class="X harvest">
          <ImageVue :src="'Harvest.png'" :size="'92px'" />
        </div>
        <div class="Exp EthExp">Stake Any Amount of Eth</div>
        <div class="Exp vEth2Exp">Receive vETH2 token in return.</div>
        <div class="Exp rewardExp">
          Get your staking rewards by just holding vEth2.
        </div>
        <div class="Exp harvestExp">
          Harvest more with your vETH2 token in other defi protocols!
        </div>
        <div class="exp Information" v-show="scrolled >= 1500">
          <div class="InfoHeader" v-show="scrolled >= 1500">
            Incentivised Staking
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            Other StaaS protocols have yet to announce how they will distribute
            the profits of Eth2 staking. SharedStake was built with profit
            sharing in mind.
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            Holding vEth2 allows for easy profit distribution and gives stakers
            the option to use vEth2 to earn even more through additional
            harvesting and/or staking in the DeFi world. Why choose one yield
            producer when you can have so many?
          </div>
        </div>
      </div>
    </div>
    <div class="Container flex_column" v-show="scrolled >= 2000">
      <div class="flex_row vEth2PanelHeader">
        <ImageVue :src="'vEth2.png'" :size="'123px'" class="exp" />
        <div class="StatsHeader">vEth2</div>
      </div>
      <div class="exp background3" />
      <div class="third">
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivised Staking</div>
          <div class="exp Info mb30">
            Other StaaS protocols have yet to announce how they will distribute
            the profits of Eth2 staking. SharedStake was built with profit
            sharing in mind.
          </div>
          <div class="LearnButton">
            Learn More
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivised Staking</div>
          <div class="exp Info mb30">
            Other StaaS protocols have yet to announce how they will distribute
            the profits of Eth2 staking. SharedStake was built with profit
            sharing in mind.
          </div>
          <div class="LearnButton">
            Learn More
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivised Staking</div>
          <div class="exp Info mb30">
            Other StaaS protocols have yet to announce how they will distribute
            the profits of Eth2 staking. SharedStake was built with profit
            sharing in mind.
          </div>
          <div class="LearnButton">
            Learn More
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivised Staking</div>
          <div class="exp Info mb30">
            Other StaaS protocols have yet to announce how they will distribute
            the profits of Eth2 staking. SharedStake was built with profit
            sharing in mind.
          </div>
          <div class="LearnButton">
            Learn More
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
        </div>
      </div>
    </div>
    <div class="roadMap" v-show="scrolled > 2700">
      <div class="mainBox">
        <div class="titleBox"><div class="X">Roadmap</div></div>
        <div class="main">
          <div class="mainCon">
            <div class="list">
              <div class="item">
                <div class="date">2020 Q2</div>
                <div class="text">
                  Proof of Concept Core Protocol Prototype Establishment
                </div>
              </div>

              <div class="item">
                <div class="date">2020 Q3</div>
                <div class="text">Development &amp; Marketing Launch</div>
              </div>

              <div class="item">
                <div class="date">2020 Q4</div>
                <div class="text">Smart Contract Security Audit</div>
              </div>

              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">Announce Bug Bounty Program</div>
              </div>

              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">
                  Implementing Bridges to Multiple Blockchains
                </div>
              </div>

              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">
                  Integrating Testnet DApps and Partners to Mainnet
                </div>
              </div>
            </div>
            <div class="curve"></div>
            <div class="list next">
              <div class="item">
                <div class="date">2020 Q3</div>
                <div class="text">Draft and Improvement of the Whitepaper</div>
              </div>
              <div class="item">
                <div class="date">2020 Q3</div>
                <div class="text">Official Whitepaper Publish</div>
              </div>
              <div class="item">
                <div class="date">2020 Q4</div>
                <div class="text">Private Testnet Release Internally</div>
              </div>
              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">Mainnet Test Version Online</div>
              </div>
              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">Mainnet Version 1.0 Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="Container" v-show="scrolled <= 2700"></div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";
export default {
  components: { ImageVue },
  props: ["scrolled"],
};
</script>

<style scoped>
/*this is ok until 900px */
.downSign {
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 10px;
  position: sticky;
}
.glow {
  filter: brightness(300%);
}
.Container {
  position: relative;
  min-height: 100vh;
  color: #fff;
  z-index: 1;
}
.LogoContainer {
  background-image: url(bg-1.png);
  background-repeat: no-repeat;
  background-position: center;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  justify-content: center;
  align-items: center;
}

.first {
  padding-top: 5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: ". .";
}
.Logo {
  padding: 0 145px 100px 0;
}
.Exp,
.Explanation,
.Logo {
  align-self: center;
  justify-self: center;
}
.Explanation {
  padding: 0 120px 200px 0;
  animation: TextEnter 0.4s ease-out backwards;
}

.main {
  margin: 4rem 0px 3rem;
  overflow-wrap: normal;
  max-width: 900px;
  font-size: 64px;
  font-weight: 300;
  line-height: 1.2;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 30px;
}
.exp {
  font-size: 21px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.75);
  text-align: justify;
  text-justify: inter-word;
  animation: TextEnter 0.6s ease-out backwards 0.2s;
}
.social {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  animation: TextEnter 0.8s ease-out backwards;
}
.socialLogo {
  filter: brightness(300%);
  transition: filter 0.5s ease-out;
  cursor: pointer;
}
.socialLogo:hover {
  filter: brightness(500%);
}
.LearnButton {
  font-size: 21px;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #fff;
  border-radius: 10px;
  text-align: center;
  width: 142px;
  transition: transform 0.5s ease-out;
  cursor: pointer;
}
.LearnButton:hover {
  transform: scale(0.98);
}
.background2 {
  background-image: url(bg-2.png);
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
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.4) 60%
  );
}
.second {
  width: 90%;
  height: 90%;
  padding: 10% 5% 0 5%;
  display: grid;
  grid-template-columns: 1fr 0.2fr 1fr 0.2fr 1fr 0.2fr 1fr;
  grid-template-rows: 0.6fr 0.4fr 1fr;
  gap: 0px 0px;
  grid-template-areas:
    "Eth next1 vEth2 next2 reward next3 harvest"
    "EthExp . vEth2Exp . rewardExp . harvestExp"
    "Information Information Information Information Information Information Information";
  justify-content: center;
  align-items: center;
}
.Information {
  margin-top: 2.5vh;
  padding: 5vh;
  width: 70%;
  grid-area: Information;
  font-size: 1.2rem;
  max-width: 1500px;
  background-color: rgba(17, 26, 25, 0.85);
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  -webkit-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.517);
  -moz-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.619);
  box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.469);
}
.InfoHeader {
  font-size: 34px;
  font-weight: 300;
  line-height: 42px;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.95);
}
.Info {
  margin-bottom: 10px;
  font-size: 16px;
}
.Information,
.X {
  justify-self: center;
  align-self: center;
  z-index: 10;
}
.Exp {
  max-width: 200px;
  font-size: 16px;
  padding: 0 10px 0 10px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.9);
  z-index: 2;
  align-self: start;
  text-align: justify;
  text-justify: inter-word;
}
.EthExp,
.Eth {
  grid-area: Eth;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.4s forwards;
}
.EthExp {
  grid-area: EthExp;
}
.vEth2Exp,
.vEth2 {
  grid-area: vEth2;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.6s forwards;
  filter: brightness(200%);
}
.vEth2Exp {
  grid-area: vEth2Exp;
}
.rewardExp,
.reward {
  grid-area: reward;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.8s forwards;
}
.rewardExp {
  grid-area: rewardExp;
}
.harvestExp,
.harvest {
  grid-area: harvest;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 1s forwards;
}
.harvestExp {
  grid-area: harvestExp;
}
.next1 {
  grid-area: next1;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.5s forwards;
}
.next2 {
  grid-area: next2;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.7s forwards;
}
.next3 {
  grid-area: next3;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.9s forwards;
}

.Stats {
  width: calc(100% - 60px);
  min-height: auto;
  max-width: 1500px;
  margin: 0px auto;
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
  margin-bottom: 30px;
  font-weight: 300;
  animation: TextEnter 0.4s ease-out backwards;
}
.StatsExp {
  max-width: 660px;
  text-align: center;
  margin: 0px auto 60px;
  font-size: 22px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.75);
  animation: TextEnter 0.4s ease-out backwards 0.2s;
}
.StatsContent {
  display: flex;
  width: calc(100% - 60px);
  -webkit-box-pack: justify;
  justify-content: space-between;
  max-width: 1500px;
  margin: 0px auto;
  padding: 120px 0px;
  animation: TextEnter 0.4s ease-out backwards 0.4s;
}
.Stat {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
}
.Num {
  font-size: 100px;
  line-height: 100px;
  font-weight: 400;
}
.NumExp {
  font-weight: 300;
  font-size: 17px;
  line-height: 23px;
  margin-bottom: 6px;
}
.NumDetail {
  font-weight: 300;
  font-size: 14px;
  line-height: 19px;
  color: rgb(143, 143, 143);
}
.background3 {
  background-image: url(bg-3.png);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.vEth2PanelHeader {
  padding-top: 5vw;
  z-index: 5;
  animation: Glow 1s linear alternate infinite;
}

.third {
  width: 90%;
  height: 90%;
  padding: 0% 5% 10% 5%;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 30px 30px;
  grid-template-areas:
    ". ."
    ". .";
  max-width: 1500px;
  justify-content: center;
  align-items: center;
}
.Bubble {
  height: calc(100%-100px);
  font-size: 1.2rem;
  background-color: rgba(17, 26, 25, 1);
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  align-self: center;
  justify-self: center;
  padding: 65px 45px 35px 45px;
}
.mb30 {
  margin-bottom: 30px;
}
.roadMap {
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mainBox {
  padding-bottom: 1.13rem;
  width: 80%;
}

.titleBox {
  color: #ffffff;
  font-size: 50px;
  position: relative;
  left: 0;
  top: 0;
  z-index: 10;
}
.titleBox::before {
  left: -1%;
  position: absolute;
  top: -7%;
  z-index: 1;
  content: "";
  width: 2.6rem;
  height: 2.6rem;
  border: 2px solid #e6007a;
  border-radius: 50%;
}
.main {
  width: 100%;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.mainCon {
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
  width: 100%;
}
.curve {
  width: 100%;
  background-image: url(curve.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  height: 90px;
  margin: 0.6rem 0;
  position: relative;
  left: 0;
  top: 0;
  overflow: hidden;
}
.mainCon .curve canvas {
  position: absolute;
  left: 0;
  top: 0;
}
.mainCon .list {
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  position: relative;
  left: 0;
  top: 0;
  padding-left: 0.1rem;
}
.mainCon .list .item {
  width: 20%; /**HERE */
  -moz-box-sizing: content-box;
  box-sizing: content-box;
  -webkit-flex: none;
  -moz-box-flex: 0;
  -ms-flex: none;
  flex: none;
}
.mainCon .list .item .date {
  font-size: 17px;
  color: #e6007a;
  line-height: 1.43em;
  padding-bottom: 0.3rem;
}
.mainCon .list .item .text {
  font-size: 12px;
  color: #ffffff;
  line-height: 1.47em;
  width: 50%;
  padding-bottom: 20px;
}
.mainCon .list.next {
  padding-left: 5rem;
}
/*Scrollbar for the roadmap*/
body .roadMap .mainBox .main::-webkit-scrollbar-button {
  display: none;
  background: transparent;
  background-color: transparent;
}
body .roadMap .mainBox .main::-webkit-scrollbar-thumb {
  height: 4px;
  border-radius: 4px;
  background: #555;
}
body .roadMap .mainBox .main::-webkit-scrollbar {
  height: 4px;
  background: transparent;
}
@keyframes LogoEnter {
  from {
    transform: translate3d(-2rem, 0, 0);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

@keyframes Glow {
  from {
    filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.01)) brightness(120%);
  }

  to {
    filter: drop-shadow(0px 0px 4px rgba(256, 256, 256, 1)) brightness(500%);
  }
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
</style>