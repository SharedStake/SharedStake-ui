<template>
  <div class="flex_column landingPage">
    <div id="Launcher">
      <imageVue :src="'logo-4.png'" :size="'14vw'" class="myLogo" />
      <div class="flex_row upButtons">
        <router-link class="nonclickable" to="/">Introduction </router-link>
        <router-link class="nonclickable" to="/roadmap">Roadmap </router-link>
        <button
          class="nonclickable Community"
          @click="mouseOverCommunity = !mouseOverCommunity"
        >
          <div>Community</div>
          <socials
            v-if="mouseOverCommunity"
            class="socials"
            :dir="'down'"
            :names="true"
          />
        </button>
        <router-link class="loginButton" to="/app">Launch Dapp </router-link>
      </div>
    </div>
    <div class="lamp">
      <div class="lava">
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
      </div>
    </div>

    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="goo">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
    <div class="wrapper">
      <div id="title">
        <span name="rainbow" id="rainbow"> SHARED </span>
        <span name="rainbow" id="rainbow"> STAKE </span>
      </div>
      <span
        name="exp1"
        id="exp1"
        class="glitch"
        data-text="Decentralized Ethereum Staking Service"
        >Decentralized Ethereum Staking Service</span
      >
      <div class="subtitles">
        <div id="subtitle">Easiest way to stake ETH for Ethereum 2</div>
        <div id="subtitle">
          <imageVue :src="'back-button.png'" :size="'16px'" id="right" /> Stake
          Eth and earn staking rewards
        </div>
        <div id="subtitle">
          <imageVue :src="'back-button.png'" :size="'16px'" id="right" /> Use
          vEth2 on Defi Protocols
        </div>
        <div id="subtitle">
          <imageVue :src="'back-button.png'" :size="'16px'" id="right" />
          Liquidity Mining with Governance Token rewards!
        </div>

        <a
          href="https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div id="notion">
            Learn more
            <span style="font-size: 14px; font-weight: 700"> ↗</span>
          </div>
        </a>
      </div>
      <div class="typewriter">
        <span name="solution" id="solution"
          >Perfect Solution For {{ perfect }}
        </span>
      </div>
      <div class="flex_column header">
        <div class="stats">
          <span class="stat">
            <div class="miniStats">Staked with SharedStake</div>
            <div>{{ staked }} ETH</div>
            <a
              class="loginButton SGT"
              href="https://www.sharedstake.org/stake"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>Stake</div>
            </a>
          </span>
          <span class="stat">
            <div class="miniStats">Current APY</div>
            <div>7% + 725%</div>
            <a
              class="loginButton SGT"
              href="https://www.sharedstake.org/earn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>Earn</div>
            </a>
          </span>
          <span class="stat">
            <div class="miniStats">SGT price</div>
            <div>20.45$</div>
            <a
              class="loginButton SGT"
              href="https://info.uniswap.org/pair/0x3d07f6e1627da96b8836190de64c1aed70e3fc55"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>Buy</div>
            </a>
          </span>
        </div>
        <div class="header" id="Down" @click="() => scrollToNext(W2)">
          <imageVue :src="'back-button.png'" :size="'32px'" id="down" />
        </div>
      </div>
    </div>
    <div class="Below">
      <div class="Below2">
        <div
          class="flex_row Wrapper"
          id="W2"
          :style="
            width < 680
              ? ''
              : {
                  transform: 'translate(0, ' + w2translate + 'px)',
                  opacity: w2opacity,
                }
          "
        >
          <div class="flex_column title secondPage">
            <span name="exp" id="exp">Stake & Harvest</span>
          </div>
          <div :class="width < 680 ? 'flex_column' : 'flex_row'">
            <div
              class="flex_column SHOW"
              @mouseover="hovered = true"
              @mouseleave="hovered = false"
              :style="
                width < 680
                  ? ''
                  : { transform: 'translate(0, ' + w2translate + 'px)' }
              "
            >
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'eth.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue">
                <div id="continue">Stake Any Amount of Eth</div>
              </div>
            </div>
            <div>
              <imageVue
                :src="'back-button.png'"
                :size="'32px'"
                :id="width < 680 ? 'down' : 'right'"
              />
            </div>
            <div
              class="flex_column SHOW"
              @mouseover="hovered = true"
              @mouseleave="hovered = false"
              :style="
                width < 680
                  ? ''
                  : { transform: 'translate(0, ' + w2translate + 'px)' }
              "
            >
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'logo-4.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue">
                <div id="continue">Receive vETH2 token in return.</div>
              </div>
            </div>
            <div>
              <imageVue
                :src="'back-button.png'"
                :size="'32px'"
                :id="width < 680 ? 'down' : 'right'"
              />
            </div>
            <div
              class="flex_column SHOW"
              @mouseover="hovered = true"
              @mouseleave="hovered = false"
              :style="
                width < 680
                  ? ''
                  : { transform: 'translate(0, ' + w2translate + 'px)' }
              "
            >
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'earn.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue">
                <div id="continue">
                  Get your staking rewards <br />
                  with currently 10% APY
                </div>
              </div>
            </div>
            <div>
              <imageVue
                :src="'back-button.png'"
                :size="'32px'"
                :id="width < 680 ? 'down' : 'right'"
              />
            </div>
            <div
              class="flex_column SHOW"
              @mouseover="hovered = true"
              @mouseleave="hovered = false"
              :style="
                width < 680
                  ? ''
                  : { transform: 'translate(0, ' + w2translate + 'px)' }
              "
            >
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'sickle.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue">
                <div id="continue">Harvest more with your vETH2 token!</div>
              </div>
            </div>
          </div>
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
            :style="
              width < 680
                ? ''
                : { transform: 'translate(0, ' + w2translate + 'px)' }
            "
          >
            <div id="continue" @click="() => scrollToNext(W3)">
              <div id="continue">vETH2 & SGT</div>
              <div id="Down">
                <imageVue :src="'back-button.png'" :size="'32px'" id="down" />
              </div>
            </div>
          </div>
        </div>
        <div class="flex_row Wrapper" id="W3">
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
          >
            <imageVue
              :src="'logo-4.png'"
              :size="width < 680 ? '60vw' : '40vh'"
              :height="width < 680 ? false : true"
              :class="hovered ? 'photosHover' : 'photos'"
            />
            <div id="continue" @click="() => scrollToNext(W4)">
              <div id="continue">Make It Snow!</div>
              <div id="Down">
                <imageVue :src="'back-button.png'" :size="'32px'" id="down" />
              </div>
            </div>
          </div>
          <div class="flex_column title secondPage">
            <span name="exp" id="exp">Incentivized Staking</span>
            <div id="subtitle">
              <imageVue :src="'back-button.png'" :size="'16px'" id="right" />
              vETH2<imageVue :src="'logo-4.png'" :size="'28px'" /> is erc-20
              version of staked Eth.
            </div>
            <div id="subtitle">
              <imageVue :src="'back-button.png'" :size="'16px'" id="right" />
              By staking your vETH2 on our staking contracts you can harvest
              Sharedstake governance token (SGT).
            </div>
            <div id="subtitle">
              <imageVue :src="'back-button.png'" :size="'16px'" id="right" />
              SGT is the Governance Token of SharedStake platform. DAO will be
              launched after the first airdrop that issued snowswap stakers!
            </div>
            <div id="subtitle">
              <imageVue :src="'back-button.png'" :size="'16px'" id="right" />
              SharedStake is also incentivising Ethereum staking via
              collabration with defi projects.
            </div>
          </div>
        </div>
        <div class="flex_row Wrapper" id="W4">
          <div class="flex_column title secondPage">
            <span name="hodl2" class="hodl">Make It Snow!</span>
            <div id="subtitle">Our first collabration is with Snowswap!</div>
            <div id="subtitle">
              First airdrop of the SGT will take place for SnowSwap Stakers
              <imageVue :src="'snowswap2.svg'" :size="'28px'" />
            </div>
            <div id="subtitle">
              • To be eligible: Stake at least 0.5 Ether to via SharedStake &
              Hold at least 10 snow token at the snopshot date.
            </div>
            <div id="subtitle">
              • Distribution will be linear with the staked amount of ether.
            </div>
            <div id="subtitle">
              • You can also stake your vETH2 token on snowswap's ethSnow pool
              while earning eth2 profit & getting your SGT from airdrop!
            </div>
            <a
              href="https://medium.com/snowswap/%EF%B8%8Fbuilding-on-2-0-with-eth2snow-and-sharedstake-partnership-%EF%B8%8F-5ca251f8e1a0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div id="notion">
                Learn more
                <span style="font-size: 14px; font-weight: 700"> ↗</span>
              </div>
            </a>
          </div>
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
          >
            <a
              href="https://snowswap.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <imageVue
                :src="'snowswap.svg'"
                :size="width < 680 ? '60vw' : '40vh'"
                :height="width < 680 ? false : true"
                :class="hovered ? 'photosHover' : 'photos'"
            /></a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import imageVue from "../Handlers/image.vue";
import Socials from "../Root/Root/Socials.vue";
import { timeout } from "../../utils/helpers";
import axios from "axios";
import BN from "bignumber.js";
export default {
  components: { imageVue, Socials },
  data: function () {
    return {
      mouseOverCommunity: false,
      perfect: " Defi",
      hovered: false,
      width: 0,
      W2: 0,
      w2translate: 0,
      w2opacity: 1,
      W3: 0,
      W4: 0,
      staked: BN(0),
    };
  },
  created: function () {
    this.width = window.innerWidth;
    this.W2 = this.W3 = this.W4 = 0;
  },
  mounted: async function () {
    this.onResize();
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("resize", this.onResize);
    // stats:
    let link =
      "https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x898bad2774eb97cf6b94605677f43b41871410b1&apikey=GKKIY3WXXG1EICPRKACRR75MA4UE7ANFY8";
    let response = await axios.get(link);
    this.staked = BN(response.data.result).div(1e18).toFixed(0);
    //text effect 3
    let newPerfect = "Ethereum 2";
    for (let i = 0; i < 100; i++) {
      let oldPerfect = this.perfect;
      let len = this.perfect.length;
      for (; len > 0; len--) {
        this.perfect = oldPerfect.substring(0, len);
        await timeout(100);
      }
      await timeout(100);
      len = newPerfect.length;
      for (let j = 0; j <= len; j++) {
        this.perfect = newPerfect.substring(0, j);
        await timeout(100);
      }
      await timeout(5000);
      newPerfect = oldPerfect;
    }
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.onResize);
  },
  methods: {
    getOpacity(scr, top, x = 0) {
      let op =
        (scr / top + x) * (scr / top + x) * (scr / top + x) * (scr / top + x);
      return op > 1 ? 2 - op : op;
    },
    handleScroll() {
      const scr = document.documentElement.scrollTop; // Any code to be executed when the window is scrolled
      this.w2opacity = this.getOpacity(scr, this.W2);
      this.w2translate = (this.W2 - scr).toFixed(0);
    },
    scrollToNext: function (y) {
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    onResize() {
      this.width = window.innerWidth;
      const top = this.$el.getElementsByClassName("wrapper")[0];
      if (top) {
        top.scrollIntoView({ behavior: "smooth", alignTo: false });
      }
      //scrolling effect on cont pages
      var el = document.getElementById("W2");
      this.W2 = el.offsetTop;

      el = document.getElementById("W3");
      this.W3 = el.offsetTop;

      el = document.getElementById("W4");
      this.W4 = el.offsetTop;
    },
  },
};
</script>

<style scoped>
.secondPage {
  text-align: left;
  padding: 20px 20px 50px 20px;
  max-width: 1000px;
  align-items: flex-start;
  font-weight: 300;
}
a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-family: "Roboto";
  font-weight: 300;
}
.landingPage {
  background: transparent;
  justify-content: center;
  font-family: "Roboto";
  width: 100%;
  color: #fafafa;
  overflow-x: hidden;
}
.wrapper {
  width: 100vw;
  font-family: "Roboto";
  font-weight: 300;
  background: transparent;
  min-height: 85vh;
  padding-top: 14vh;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  grid-template-rows: 0.4fr 1fr 0.4fr 0.2fr;
  gap: 0em 0em;
  grid-template-areas:
    "rainbow exp1 exp1"
    "rainbow subtitle subtitle"
    "rainbow typewriter typewriter"
    "socials socials socials";
}
.header {
  padding: 10px 0px 0 0;
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  grid-area: socials;
}

.Community {
  display: block;
  overflow: visible;
}

.socials {
  position: absolute;
  top: 100%;
  width: 80%;
  background: #050505;
  border: 1px transparent solid;
  min-height: 30vh;
  border-radius: 5%;
}
.loginButton {
  margin-right: 20px;
  background: #09fa8b;
  border: 1px #09fa8b solid;
  border-radius: 5px;
  text-decoration: none;
  padding: 0 10px 0 10px;
  font-size: 18px;
  color: #050505;
  text-align: center;
  line-height: 50px; /* same as height! */
  max-height: 50px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}
.SGT {
  background: transparent;
  margin: 0.5vh 0 0.5vh 0;
  backdrop-filter: blur(12px);
  border: 1px #fff solid;
  color: #fff;
  line-height: 38px;
  font-size: 24px;
  width: 40%;
}
.loginButton:hover {
  transform: scale(0.95);
  border: 1px #6296ff solid;
}
.myLogo {
  min-width: 60px;
  max-width: 100px;
}
.content {
  margin-top: 5vh;
  padding: 20px 0 0 1vw;
  max-width: 1000px;
  align-items: flex-start;
}
#title {
  padding-left: 5vw;
  font-size: 12vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  font-family: "Roboto Mono", monospace;
  font-weight: 500;
  grid-area: rainbow;
  line-height: 1.5;
}
@keyframes opac {
  0% {
    opacity: 0;
  }
  7.5% {
    opacity: 1;
  }
  10% {
    opacity: 1;
  }
  15% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}

.hodl {
  font-size: 8vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #f60574;
}

#rainbow {
  font-weight: 500;
  margin-bottom: 6vh;
  color: #09fa8b;
  word-break: break-all;
  letter-spacing: 1vw;
  cursor: pointer;
}
#solution {
  z-index: 100;
  border-right: 0.15em solid orange; /* The typwriter cursor */
  font-size: 3.8vw;
  font-family: hacked, "Consolas";
  /* text-shadow: 2px 2px #f60574;*/
  animation: blink-caret 0.75s step-end infinite;
}
#exp1,
#exp {
  font-size: 6vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #f60574;
}
#exp1 {
  text-align: left;
  grid-area: exp1;
  text-shadow: -1px -1px 0 rgba(256, 256, 256, 0.4),
    1px -1px 0 rgba(256, 256, 256, 0.4), -1px 1px 0 rgba(256, 256, 256, 0.4),
    1px 1px 0 rgba(256, 256, 256, 0.4), 0 -2px 8px, 0 0 2px, 0 0 5px #09fa8b,
    0 0 15px #00fd87, 0 0 2px #09fa8b, 0 2px 3px #000;
}
#subtitle {
  padding: 20px 0 0 0;
  font-size: 3vw;
  text-align: left;
  font-weight: 500;
}

.subtitles {
  grid-area: subtitle;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}
#notion {
  margin: 20px 0 0 0;
  border: 1px rgba(255, 255, 255, 0.5) solid;
  border-radius: 5px;
  font-size: 3vw;
  text-align: left;
  vertical-align: text-top;
  display: flex;
  transition: transform 0.2s ease-in-out;
  flex-direction: row;
  cursor: pointer;
  align-items: flex-start;
  justify-content: space-between;
  padding: 5px;
}

#continue {
  display: flex;
  flex-direction: column;
  margin: 20px 0 0 0;
  vertical-align: text-top;
  border-radius: 5px;
  font-size: 3vw;
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
  padding: 6px;
}
.nonclickable:hover,
#continue:hover,
#notion:hover {
  transform: scale(0.95);
  color: #fafafa;
}
#Down {
  align-items: center;
  justify-content: center;
}
#down {
  cursor: pointer;
  transform: rotate(270deg);
  filter: invert(1);
  transition: all 0.2s ease-in-out;
}
#down1 {
  cursor: pointer;
  transform: rotate(270deg);
  margin-top: 2vh;
  transition: all 0.2s ease-in-out;
}
#right {
  filter: invert(1);
  transform: rotate(180deg);
  transition: all 0.2s ease-in-out;
}

.Wrapper {
  position: relative;
  min-height: 99vh;
  align-items: flex-start;
  overflow: hidden;
}

#W2,
#W3,
#W4 {
  align-items: center;
  justify-content: flex-start;
  overflow: visible;
  width: 99vw;
}

#W2 {
  padding-top: 10vh;
  flex-direction: column;
}
.Below {
  background: rgb(2, 0, 36);
  background: linear-gradient(
    145deg,
    rgba(2, 0, 36, 1) 30%,
    rgba(29, 60, 122, 1) 100%
  );
  overflow-x: hidden;
  width: 100vw;
}
.Below2 {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 298vh;
}
.typewriter {
  margin: 5vh auto 0 auto; /* Gives that scrolling effect as the typing happens */
  letter-spacing: 0.15em; /* Adjust as needed */
  grid-area: typewriter;
  text-align: left;
}
.photos {
  padding: 0;
  cursor: pointer;
  margin: 0;
  transition: all 0.3s ease-in-out;
}
.photosHover {
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  transform: translate(-5px, -5px);
  box-shadow: 5px 5px 0px 0px #fafafa, 12px 12px 10px 10px #000;
}
#Launcher {
  width: 99.9vw;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  position: fixed;
  top: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 100;
  backdrop-filter: blur(8px);
}
.nonclickable {
  position: relative;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  font-size: 3vw;
  text-align: left;
  vertical-align: text-top;
  display: flex;
  transition: 0.2s ease-in-out;
  flex-direction: row;
  cursor: pointer;
  align-items: flex-start;
  justify-content: space-between;
  backdrop-filter: blur(5px);
  padding: 1vw;
  background: transparent;
}
.SHOW {
  margin: 1vh 1vw 1vh 1vw;
}

.stats {
  width: 100%;
  padding: 15px 0 15px 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
  color: #fff;
  text-shadow: 1px 1px #ff007a;
  justify-content: center;
  align-items: center;
}

.miniStats {
  font-weight: normal;
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: rgb(255, 255, 255);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  margin-top: 4px;
  font-weight: 500;
  font-size: 32px;
  line-height: 38px;
  text-align: center;
}

/* The typing effect */
@keyframes typing {
  from {
    width: 0.1%;
  }
  to {
    width: 100%;
  }
}

/* The typewriter cursor effect */
@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: orange;
  }
}
@media only screen and (min-width: 820px) {
  #title,
  .hodl {
    font-size: 107px;
    line-height: 80%;
  }
  .header,
  #exp1,
  #exp,
  .content {
    font-size: 48px;
  }
  #solution {
    font-size: 32px;
  }
  .nonclickable,
  #continue,
  #notion {
    font-size: 20px;
  }
  #subtitle {
    font-size: 28px;
  }
}
@media only screen and (max-width: 540px) {
  #title,
  .hodl {
    justify-content: flex-start;
    overflow: visible;
    font-size: 12vw;
  }
  .header,
  .content,
  #exp1,
  #exp {
    line-height: 100%;
    font-size: 6vw;
  }
  #exp1 {
    margin-left: 5vw;
  }
  .loginButton {
    font-size: 14px;
  }
  .typewriter {
    margin-top: 0;
    margin-left: 5vw;
    width: 95vw;
  }
  #notion {
    margin-left: 5vw;
  }
  #subtitle {
    font-size: 5vw;
    margin-left: 5vw;
    width: 95vw;
  }
  .miniStats {
    font-size: 16px;
  }
  #title {
    flex-direction: row;
  }
  .stat {
    font-size: 20px;
  }
  .wrapper {
    padding-top: 8vh;
    grid-template-rows: 0.3fr 0.3fr 1fr 0.1fr 0.3fr;
    grid-template-areas:
      "rainbow rainbow rainbow"
      "exp1 exp1 exp1"
      "subtitle subtitle subtitle"
      "typewriter typewriter typewriter"
      "socials socials socials";
  }
  #rainbow {
    margin-bottom: 0vh;
  }
}
@media only screen and (max-width: 680px) {
  .Wrapper {
    flex-direction: column;
  }
  #W3 {
    flex-direction: column-reverse;
  }
}
/*lava lamp */
.goo {
  height: 1px;
}
.lamp {
  filter: url("#goo");
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  height: 99vh;
  min-width: 99vw;
  z-index: -1;
}

.lava {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
}

.blob {
  border-radius: 50%;
  background: #09fa8b;
  /* Other sample colors:
  Orange: #e8630a
  Pink: #EA3281
  Fuscia: #E71669
  Purple: #661BAC
  Kermit green: #75AC25
  Yellow: #FDC600
  Light blue: #3283B5
  Dark blue: #0A5D9A
  Gunmetal: #232F37
  BGLight: #1B2735
  BGDark: #090a0f
  Want more colors? check out https://coolors.co/ for inspiration.
  */
  position: absolute;
}

.blob.top {
  border-radius: 50%;
  width: 100%;
  height: 4%;
  top: -3%;
  left: 0;
}
.blob.bottom {
  border-radius: 50%;
  width: 100%;
  height: 4%;
  bottom: -3%;
  left: 0;
}
.blob:nth-child(1) {
  width: 200px;
  height: 200px;
  left: 35%;
  bottom: -15%;

  animation: wobble 4s ease-in-out alternate infinite,
    blob-one ease-in-out 18s infinite;
}
.blob:nth-child(2) {
  width: 330px;
  height: 330px;
  right: 72%;
  bottom: -65%;

  animation: wobble 5s ease-in-out alternate infinite,
    blob-two ease-in-out 22s infinite;
}
.blob:nth-child(3) {
  width: 150px;
  height: 150px;
  bottom: -15%;
  left: 54%;

  animation: wobble 6s ease-in-out alternate infinite,
    blob-three ease-in-out 16s infinite;
}
.blob:nth-child(4) {
  width: 235px;
  height: 235px;
  bottom: -19%;
  left: 70%;

  animation: wobble 7s ease-in-out alternate infinite,
    blob-four ease-in-out 22s infinite;
}
.blob:nth-child(4) {
  width: 235px;
  height: 235px;
  bottom: -19%;
  left: 30%;
  animation: wobble 8s ease-in-out alternate infinite,
    blob-four ease-in-out 20s infinite;
}
.blob:nth-child(5) {
  width: 55px;
  height: 55px;
  bottom: -25%;
  left: 54%;

  animation: wobble 9s ease-in-out alternate infinite,
    blob-five ease-in-out 32s infinite;
}
.blob:nth-child(6) {
  width: 35px;
  height: 35px;
  bottom: -25%;
  right: 22%;

  animation: wobble 10s ease-in-out alternate infinite,
    blob-six ease-in-out 16s infinite;
}
.blob:nth-child(7) {
  width: 435px;
  height: 435px;
  bottom: -85%;
  right: 20%;

  animation: wobble 11s ease-in-out alternate infinite,
    blob-seven ease-in-out 32s infinite;
}
@keyframes blob-one {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-700%);
  }
}

@keyframes blob-two {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-420%);
  }
}

@keyframes blob-three {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-305%);
  }
}
@keyframes blob-four {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-605%);
  }
}
@keyframes blob-five {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-700%);
  }
}
@keyframes blob-six {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-700%);
  }
}
@keyframes blob-seven {
  0%,
  100% {
    transform: translatey(0);
  }
  50% {
    transform: translatey(-300%);
  }
}
@keyframes wobble {
  50% {
    border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
  }
  100% {
    border-radius: 38% 52% 75% 36% / 50% 40% 50% 60%;
  }
}

/*glitch effect  :( */

.glitch {
  color: white;
  font-size: 150px;
  text-transform: upercase;
  position: relative;
  display: inline-block;
}
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.glitch::before {
  left: 2px;
  text-shadow: -2px 0 #49fc00;
  clip: rect(24px, 550px, 90px, 0);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}
.glitch::after {
  left: -2px;
  text-shadow: -2px 0 #b300fc;
  clip: rect(85px, 550px, 140px, 0);
  animation: glitch-anim 2.5s infinite linear alternate-reverse;
}
@-webkit-keyframes glitch-anim {
  0% {
    clip: rect(49px, 9999px, 42px, 0);
  }
  4.166666666666666% {
    clip: rect(131px, 9999px, 23px, 0);
  }
  8.333333333333332% {
    clip: rect(36px, 9999px, 89px, 0);
  }
  12.5% {
    clip: rect(28px, 9999px, 55px, 0);
  }
  16.666666666666664% {
    clip: rect(79px, 9999px, 101px, 0);
  }
  20.833333333333336% {
    clip: rect(58px, 9999px, 70px, 0);
  }
  25% {
    clip: rect(83px, 9999px, 128px, 0);
  }
  29.166666666666668% {
    clip: rect(86px, 9999px, 65px, 0);
  }
  33.33333333333333% {
    clip: rect(113px, 9999px, 66px, 0);
  }
  37.5% {
    clip: rect(86px, 9999px, 121px, 0);
  }
  41.66666666666667% {
    clip: rect(138px, 9999px, 134px, 0);
  }
  45.83333333333333% {
    clip: rect(73px, 9999px, 115px, 0);
  }
  50% {
    clip: rect(134px, 9999px, 103px, 0);
  }
  54.166666666666664% {
    clip: rect(5px, 9999px, 38px, 0);
  }
  58.333333333333336% {
    clip: rect(120px, 9999px, 90px, 0);
  }
  62.5% {
    clip: rect(76px, 9999px, 79px, 0);
  }
  66.66666666666666% {
    clip: rect(101px, 9999px, 62px, 0);
  }
  70.83333333333334% {
    clip: rect(125px, 9999px, 141px, 0);
  }
  75% {
    clip: rect(129px, 9999px, 67px, 0);
  }
  79.16666666666666% {
    clip: rect(107px, 9999px, 147px, 0);
  }
  83.33333333333334% {
    clip: rect(47px, 9999px, 116px, 0);
  }
  87.5% {
    clip: rect(74px, 9999px, 29px, 0);
  }
  91.66666666666666% {
    clip: rect(137px, 9999px, 92px, 0);
  }
  95.83333333333334% {
    clip: rect(67px, 9999px, 70px, 0);
  }
  100% {
    clip: rect(125px, 9999px, 107px, 0);
  }
}
@keyframes glitch-anim {
  0% {
    clip: rect(49px, 9999px, 42px, 0);
  }
  4.166666666666666% {
    clip: rect(131px, 9999px, 23px, 0);
  }
  8.333333333333332% {
    clip: rect(36px, 9999px, 89px, 0);
  }
  12.5% {
    clip: rect(28px, 9999px, 55px, 0);
  }
  16.666666666666664% {
    clip: rect(79px, 9999px, 101px, 0);
  }
  20.833333333333336% {
    clip: rect(58px, 9999px, 70px, 0);
  }
  25% {
    clip: rect(83px, 9999px, 128px, 0);
  }
  29.166666666666668% {
    clip: rect(86px, 9999px, 65px, 0);
  }
  33.33333333333333% {
    clip: rect(113px, 9999px, 66px, 0);
  }
  37.5% {
    clip: rect(86px, 9999px, 121px, 0);
  }
  41.66666666666667% {
    clip: rect(138px, 9999px, 134px, 0);
  }
  45.83333333333333% {
    clip: rect(73px, 9999px, 115px, 0);
  }
  50% {
    clip: rect(134px, 9999px, 103px, 0);
  }
  54.166666666666664% {
    clip: rect(5px, 9999px, 38px, 0);
  }
  58.333333333333336% {
    clip: rect(120px, 9999px, 90px, 0);
  }
  62.5% {
    clip: rect(76px, 9999px, 79px, 0);
  }
  66.66666666666666% {
    clip: rect(101px, 9999px, 62px, 0);
  }
  70.83333333333334% {
    clip: rect(125px, 9999px, 141px, 0);
  }
  75% {
    clip: rect(129px, 9999px, 67px, 0);
  }
  79.16666666666666% {
    clip: rect(107px, 9999px, 147px, 0);
  }
  83.33333333333334% {
    clip: rect(47px, 9999px, 116px, 0);
  }
  87.5% {
    clip: rect(74px, 9999px, 29px, 0);
  }
  91.66666666666666% {
    clip: rect(137px, 9999px, 92px, 0);
  }
  95.83333333333334% {
    clip: rect(67px, 9999px, 70px, 0);
  }
  100% {
    clip: rect(125px, 9999px, 107px, 0);
  }
}
@-webkit-keyframes glitch-anim-2 {
  6.666666666666667% {
    clip: rect(59px, 9999px, 148px, 0);
  }
  10% {
    clip: rect(82px, 9999px, 66px, 0);
  }
  13.333333333333334% {
    clip: rect(149px, 9999px, 20px, 0);
  }
  16.666666666666664% {
    clip: rect(133px, 9999px, 86px, 0);
  }
  20% {
    clip: rect(73px, 9999px, 69px, 0);
  }
  23.333333333333332% {
    clip: rect(98px, 9999px, 132px, 0);
  }
  26.666666666666668% {
    clip: rect(24px, 9999px, 72px, 0);
  }
  30% {
    clip: rect(21px, 9999px, 140px, 0);
  }
  33.33333333333333% {
    clip: rect(44px, 9999px, 42px, 0);
  }
  36.666666666666664% {
    clip: rect(142px, 9999px, 114px, 0);
  }
  40% {
    clip: rect(44px, 9999px, 106px, 0);
  }
  43.333333333333336% {
    clip: rect(149px, 9999px, 44px, 0);
  }
  46.666666666666664% {
    clip: rect(77px, 9999px, 132px, 0);
  }
  50% {
    clip: rect(26px, 9999px, 32px, 0);
  }
  53.333333333333336% {
    clip: rect(120px, 9999px, 3px, 0);
  }
  56.666666666666664% {
    clip: rect(145px, 9999px, 51px, 0);
  }
  60% {
    clip: rect(36px, 9999px, 58px, 0);
  }
  63.33333333333333% {
    clip: rect(70px, 9999px, 147px, 0);
  }
  66.66666666666666% {
    clip: rect(74px, 9999px, 53px, 0);
  }
  70% {
    clip: rect(77px, 9999px, 120px, 0);
  }
  73.33333333333333% {
    clip: rect(81px, 9999px, 14px, 0);
  }
  76.66666666666667% {
    clip: rect(115px, 9999px, 16px, 0);
  }
  80% {
    clip: rect(38px, 9999px, 60px, 0);
  }
  83.33333333333334% {
    clip: rect(112px, 9999px, 15px, 0);
  }
  86.66666666666667% {
    clip: rect(133px, 9999px, 8px, 0);
  }
  90% {
    clip: rect(118px, 9999px, 73px, 0);
  }
  93.33333333333333% {
    clip: rect(44px, 9999px, 41px, 0);
  }
  96.66666666666667% {
    clip: rect(148px, 9999px, 125px, 0);
  }
  100% {
    clip: rect(31px, 9999px, 40px, 0);
  }
}
@keyframes glitch-anim-2 {
  6.666666666666667% {
    clip: rect(59px, 9999px, 148px, 0);
  }
  10% {
    clip: rect(82px, 9999px, 66px, 0);
  }
  13.333333333333334% {
    clip: rect(149px, 9999px, 20px, 0);
  }
  16.666666666666664% {
    clip: rect(133px, 9999px, 86px, 0);
  }
  20% {
    clip: rect(73px, 9999px, 69px, 0);
  }
  23.333333333333332% {
    clip: rect(98px, 9999px, 132px, 0);
  }
  26.666666666666668% {
    clip: rect(24px, 9999px, 72px, 0);
  }
  30% {
    clip: rect(21px, 9999px, 140px, 0);
  }
  33.33333333333333% {
    clip: rect(44px, 9999px, 42px, 0);
  }
  36.666666666666664% {
    clip: rect(142px, 9999px, 114px, 0);
  }
  40% {
    clip: rect(44px, 9999px, 106px, 0);
  }
  43.333333333333336% {
    clip: rect(149px, 9999px, 44px, 0);
  }
  46.666666666666664% {
    clip: rect(77px, 9999px, 132px, 0);
  }
  50% {
    clip: rect(26px, 9999px, 32px, 0);
  }
  53.333333333333336% {
    clip: rect(120px, 9999px, 3px, 0);
  }
  56.666666666666664% {
    clip: rect(145px, 9999px, 51px, 0);
  }
  60% {
    clip: rect(36px, 9999px, 58px, 0);
  }
  63.33333333333333% {
    clip: rect(70px, 9999px, 147px, 0);
  }
  66.66666666666666% {
    clip: rect(74px, 9999px, 53px, 0);
  }
  70% {
    clip: rect(77px, 9999px, 120px, 0);
  }
  73.33333333333333% {
    clip: rect(81px, 9999px, 14px, 0);
  }
  76.66666666666667% {
    clip: rect(115px, 9999px, 16px, 0);
  }
  80% {
    clip: rect(38px, 9999px, 60px, 0);
  }
  83.33333333333334% {
    clip: rect(112px, 9999px, 15px, 0);
  }
  86.66666666666667% {
    clip: rect(133px, 9999px, 8px, 0);
  }
  90% {
    clip: rect(118px, 9999px, 73px, 0);
  }
  93.33333333333333% {
    clip: rect(44px, 9999px, 41px, 0);
  }
  96.66666666666667% {
    clip: rect(148px, 9999px, 125px, 0);
  }
  100% {
    clip: rect(31px, 9999px, 40px, 0);
  }
}
</style>