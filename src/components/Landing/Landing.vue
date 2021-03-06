<template>
  <div class="Landing">
    <div class="Container first" v-show="scrolled >= 0">
      <div class="LogoContainer">
        <ImageVue
          :src="'logo-red.svg'"
          :size="windowWidth > 900 ? '180px' : '20vw'"
          class="Logo"
        />
      </div>
      <div class="Explanation">
        <div class="mainTitle">Claim Your Stake</div>
        <div class="exp">
          SharedStake is a decentralized Ethereum 2 staking solution that allows
          users to stake any amount of Ether and earn additional yield on top of
          their ETH2 rewards.
        </div>
        <router-link
          class="LearnButton"
          v-show="windowWidth <= 500"
          to="/stake"
        >
          Stake!
          <!-- <ImageVue :src="'link.svg'" :size="'15px'" class="glow" /> -->
        </router-link>
        <div class="social">
          <router-link
            class="LearnButton"
            v-show="windowWidth > 500"
            to="/stake"
          >
            Stake!
            <!-- <ImageVue :src="'link.svg'" :size="'15px'" class="glow" /> -->
          </router-link>
          <a
            href="https://twitter.com/SharedStake"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue :src="'twitter.svg'" :size="'30px'" class="socialLogo" />
          </a>
          <a
            href="https://discord.com/invite/VezkjY9udC"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue :src="'discord.svg'" :size="'30px'" class="socialLogo" />
          </a>
          <a
            href="https://www.reddit.com/r/SharedStake/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue :src="'reddit.svg'" :size="'30px'" class="socialLogo" />
          </a>
          <a
            href="https://github.com/SharedStake"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue :src="'github.svg'" :size="'30px'" class="socialLogo" />
          </a>
        </div>
      </div>
    </div>
    <div class="downSign glow" v-show="scrolled >= 0">
      <ImageVue :src="'down.svg'" :size="'30px'" />
    </div>
    <div class="flex_column Stats" v-show="scrolled >= 350">
      <div class="StatsHeader">Capital efficient staking</div>
      <div class="StatsExp">Financial optimization at its finest.</div>
      <div class="StatsExp">
        Better rewards, improved user experience, and more DeFi compatibility
        than any other Staking-as-a-Service model on the market.
      </div>
      <div class="StatsContent">
        <div class="Stat">
          <div class="Num">5440</div>
          <div class="NumExp">Ether Staked with SharedStake</div>
          <div class="NumDetail">Liquid & Incentivised</div>
        </div>
        <div class="Stat">
          <div class="Num">139%</div>
          <div class="NumExp">Current APY</div>
          <div class="NumDetail">Most Profitable Eth2 Staking Solution</div>
        </div>
        <div class="Stat">
          <div class="Num">99.9%</div>
          <div class="NumExp">Uptime</div>
          <div class="NumDetail">Industry leading cloud infrastructure</div>
        </div>
      </div>
    </div>
    <div class="Container" v-show="scrolled >= 1000">
      <div class="exp background2" />
      <div class="second">
        <div class="X Eth">
          <ImageVue :src="'eth.png'" :size="'90px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next1"
        />
        <div class="X vEth2">
          <ImageVue :src="'vEth2.png'" :size="'163px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next2"
        />
        <div class="X reward">
          <ImageVue :src="'Reward.png'" :size="'127px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next3"
        />
        <div class="X harvest">
          <ImageVue :src="'Harvest.png'" :size="'92px'" />
        </div>
        <div class="Exp EthExp">Stake any amount of Eth</div>
        <div class="Exp vEth2Exp">Receive your vEth2 token</div>
        <div class="Exp rewardExp">
          Simply holding vEth2 entitles you to staking rewards
        </div>
        <div class="Exp harvestExp">
          Harvest more yield with your vEth2 in supported DeFi protocols!
        </div>
        <div class="exp Information" v-show="scrolled >= 1500">
          <div class="InfoHeader centertext" v-show="scrolled >= 1500">
            Staking with SharedStake
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            SharedStake users earn staking rewards every block, whether you hodl
            your stake or decide to invest your vEth2 in supported Ethereum
            dapps like Uniswap, SushiSwap, Curve, Maker, Compound, Aave, and
            many more...
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            vEth2 is designed for DeFi compatibility. It is a yield bearing
            token with a 1:1 price ratio with Ether. vEth2 staking is also
            incentivized further with SGT, the SharedStake Governance Token.
          </div>
          <div class="LearnButton">
            <a
              href="https://docs.sharedstake.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </a>
            <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
          </div>
        </div>
      </div>
    </div>
    <div
      class="Container flex_column"
      v-show="scrolled >= 2000"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="flex_row vEth2PanelHeader">
        <ImageVue :src="'vEth2.png'" :size="'123px'" class="exp" />
        <div class="StatsHeader">vEth2</div>
      </div>
      <div class="exp InfoHeader DropShadow centertext">
        Yield Bearing Wrapped Ether
      </div>
      <div class="exp background3" />
      <div class="third">
        <div class="Bubble">
          <div class="exp InfoHeader">Financially Optimized</div>
          <div class="exp Info mb30">
            SharedStake optimizes Eth2 staking profits by creating an off-chain
            yield bearing stable token (vEth2 has a 1:1 price ratio with Ether).
            Ethereum2 profit distribution will start with the Eth2 launch so
            until then, track your Eth2 profits in the SharedStake Dashboard.
          </div>
          <ImageVue
            :src="'discount.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">DeFi Compatible</div>
          <div class="exp Info mb30">
            By using vEth2 instead of other wrapped Ether tokens, DeFi users
            gain an extra 8-9% yearly growth with off-chain profit distribution.
            <br />
            Since vEth2 doesn't contain any 'imaginary' staking rewards, its
            stability is derived from its peg to Ether's value, practically
            eliminating concerns with Impermanent Loss.
          </div>
          <ImageVue
            :src="'diamond.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivized Staking</div>
          <div class="exp Info mb30">
            On top of Ethereum2 staking profits, holding vEth2 and leveraging it
            on other Decentralized Finance applications is further incentivized
            with SGT, used as a Proof of Participation token within the
            SharedStake Protocol.
          </div>
          <ImageVue
            :src="'dowload.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Built-in Exit Pool</div>
          <div class="exp Info mb30">
            10% of all staked Ether remains in the staking contract, creating a
            liquidity bridge between all users, old and new. <br />
            SharedStakers can un-stake their Ether at anytime by burning their
            vEth2 through the staking contract, subject to the pooled amount.
          </div>
          <ImageVue
            :src="'balance.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
      </div>
      <div class="LearnButton">
        <a
          href="https://sips.sharedstake.org/SIPS/sip-3.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More</a
        >
        <ImageVue :src="'link.svg'" :size="'15px'" class="glow" />
      </div>
    </div>
    <div class="exp roadMap" v-show="scrolled > 2700">
      <div class="mainBox">
        <div class="exp titleBox"><div class="X">Roadmap</div></div>
        <div class="main">
          <div class="mainCon">
            <div class="list">
              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">Protocol Launch &amp; SGT Airdrop</div>
              </div>

              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">Smart Contract Security Audit by Certik</div>
              </div>

              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">1000 Validators Created</div>
              </div>

              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">Leveraged Eth2 Staking with Aave</div>
              </div>

              <div class="item">
                <div class="date">2021 Q4</div>
                <div class="text">Decentralized Validators Backed by SGT</div>
              </div>

              <div class="item">
                <div class="date">2022</div>
                <div class="text">
                  vEth2-backed AMM Provides Eth2 Staking Profits to LPs
                </div>
              </div>
              <div class="item">
                <div class="date">2023</div>
                <div class="text">
                  SGT-based Decentralized Automated Staking Mechanism on Mainnet
                </div>
              </div>
            </div>
            <div class="curve"></div>
            <div class="list next">
              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">DAO Launched</div>
              </div>
              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">
                  First Incentivized Pools for vEth2 on Curve & Shell
                </div>
              </div>
              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">DeFi Support with Barbecue.js</div>
              </div>
              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">
                  More Integrations with DeFi Protocols through Sauce.js...
                </div>
              </div>
              <div class="item">
                <div class="date">2022</div>
                <div class="text">
                  Staked Ether in Use on Multiple Blockchains
                </div>
              </div>
              <div class="item">
                <div class="date">2023</div>
                <div class="text">Ethereum2 Deployed</div>
              </div>
              <div class="item">
                <div class="date">Eth2 &amp; Beyond</div>
                <div class="text">
                  Ethereum2 is just the beginning for SharedStake...
                </div>
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
  props: ["scrolled", "windowWidth"],
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
.Explanation {
  padding: 0 75px 200px 0;
  animation: TextEnter 0.4s ease-out backwards;
}

.Exp,
.Explanation,
.Logo {
  align-self: center;
  justify-self: center;
}

.mainTitle {
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
  /* text-align: justify; */
  text-justify: inter-word;
  animation: TextEnter 0.6s ease-out backwards 0.2s;
  z-index: 1;
}
.social {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  animation: TextEnter 0.8s ease-out backwards;
  margin-top: 30px;
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
  max-height: 25px;
  transition: transform 0.5s ease-out;
  cursor: pointer;
  z-index: 3;
  grid-area: Button;
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
  grid-area: Header;
  align-self: center;
}
.Info {
  margin-bottom: 10px;
  font-size: 16px;
  grid-area: Info;
}
.ICON {
  grid-area: Icon;
  align-self: center;
  justify-self: end;
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
  /* text-align: justify; */
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
  margin: 30px;
  font-weight: 300;
  animation: TextEnter 0.4s ease-out backwards;
  text-align: center;
}
.StatsExp {
  max-width: 660px;
  text-align: center;
  margin: 0px auto 30px;
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
  padding: 0 30px 0 0;
}
.Num {
  font-size: 97px;
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
  padding: 0% 5% 1% 5%;
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
  height: calc(100% - 100px);
  min-height: calc(77%);
  font-size: 1.2rem;
  background-color: rgba(17, 26, 25, 1);
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  align-self: stretch;
  justify-self: stretch;
  padding: 45px 45px 35px 45px;
  display: grid;
  grid-template-columns: 1fr 0.3fr;
  grid-template-rows: 0.4fr 1fr;
  gap: 0px 0px;
  grid-template-areas:
    "Header Icon"
    "Info Info ";
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
}
.curve {
  width: 100%;
  background-image: url(curve.png);
  background-size: 100% auto;
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
  width: 260px; /**HERE */
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
  width: 60%;
  padding-bottom: 20px;
}
.mainCon .list.next {
  padding-left: 5rem;
}

/* body .roadMap .mainBox .main::-webkit-scrollbar-thumb {
  height: 5px;
  background: #555;
}
body .roadMap .mainBox .main::-webkit-scrollbar {
  background: #888;
  height: 4px;
} */
.centertext {
  text-align: center;
}
.glow {
  filter: brightness(300%);
}
.reverse {
  filter: invert(1);
}
.DropShadow {
  filter: drop-shadow(0px 0px 4px rgba(256, 256, 256, 1)) brightness(500%);
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
    filter: drop-shadow(0px 0px 4px rgba(256, 256, 256, 1)) brightness(200%);
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

@media only screen and (max-width: 900px) {
  .first {
    padding-top: 125px;
    display: grid;
    gap: 0px 0px;
    grid-template-areas: ".";
    background-image: url(bg-1.png);
    background-repeat: no-repeat;
    background-position: center;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 0.1fr 2fr;
    justify-content: center;
    align-items: center;
  }
  .Logo {
    padding: 0;
    max-width: 145px;
    min-width: 100px;
  }
  .LogoContainer {
    background: transparent;
    background-repeat: no-repeat;
    background-position: center;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    justify-content: center;
    align-items: center;
  }
  .mainTitle {
    margin: 0 auto;
  }
  .Explanation {
    padding: 0 23px 100px 23px;
    animation: TextEnter 0.4s ease-out backwards;
  }
  .StatsContent {
    flex-direction: column;
    align-items: center;
    padding: 0px;
  }
  .StatsHeader {
    font-size: 42px;
  }
  .Stat {
    margin: 30px 0 50px 0;
  }
  .Num {
    font-size: 92px;
  }

  .InfoHeader {
    padding: 15px 15px 15px 0;
    font-size: 25px;
  }
  .third {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    gap: 30px 30px;
    grid-template-areas:
      "."
      ".";
  }
}
@media only screen and (max-width: 770px) {
  .second {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 2fr 1fr 0.2fr 0.2fr 1fr 0.2fr 0.2fr 1fr 0.2fr 0.2fr 1fr 0.2fr;
    grid-template-areas:
      "Information"
      "Information"
      "Eth"
      "EthExp"
      "next1"
      "vEth2"
      "vEth2Exp"
      "next2"
      "reward"
      "rewardExp"
      "next3"
      "harvest"
      "harvestExp";
    padding-bottom: 15vh;
  }
}
@media only screen and (max-width: 375px) {
  .mainTitle {
    font-size: 50px;
  }
  .Num {
    font-size: 75px;
  }
}
</style>
