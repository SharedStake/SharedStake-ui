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
          <socials v-if="mouseOverCommunity" class="socials" :dir="'down'" />
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
      <span name="exp1" id="exp1">Decentralized Ethereum Staking Service</span>
      <div class="subtitles">
        <div id="subtitle">Easiest way to stake ETH for Ethereum 2:</div>
        <div id="subtitle">• Stake Eth and earn staking rewards</div>
        <div id="subtitle">• Use vEth2 on Defi Protocols</div>
        <div id="subtitle">
          • Liquidity Mining with Governance Token rewards!
        </div>
        <div id="subtitle">• SGT airdrop on : 02/02/2021</div>
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
          >Perfect Solution For {{ perfect }}</span
        >
      </div>
      <div class="flex_column header">
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
              class="flex_column"
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
              <div id="continue" @click="() => scrollToNext(W3)">
                <div id="continue">Stake Any Amount of Eth</div>
              </div>
            </div>
            <div>
              <imageVue :src="'back-button.png'" :size="'32px'" id="right" />
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
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'logo-4.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue" @click="() => scrollToNext(W3)">
                <div id="continue">Receive vETH2 token in return.</div>
              </div>
            </div>
            <div>
              <imageVue :src="'back-button.png'" :size="'32px'" id="right" />
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
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'earn.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue" @click="() => scrollToNext(W3)">
                <div id="continue">
                  Get your staking rewards <br />
                  with currently 10% APY
                </div>
              </div>
            </div>
            <div>
              <imageVue :src="'back-button.png'" :size="'32px'" id="right" />
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
              <imageVue
                :size="width < 680 ? '25vw' : '25vh'"
                :src="'sickle.png'"
                :height="width < 680 ? false : true"
                :class="'photos'"
              />
              <div id="continue" @click="() => scrollToNext(W3)">
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
        <div
          class="flex_row Wrapper"
          id="W3"
          :style="
            width < 680
              ? ''
              : {
                  transform: 'translate(0, ' + w3translate + 'px)',
                  opacity: w3opacity,
                }
          "
        >
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
            :style="
              width < 680
                ? ''
                : { transform: 'translate(0, ' + w3translate * -3 + 'px)' }
            "
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
              vETH2<imageVue :src="'logo-4.png'" :size="'28px'" /> is erc-20
              version of staked Eth.
            </div>
            <div id="subtitle">
              By staking your vETH2 on our staking contracts you can harvest
              Sharedstake governance token (SGT).
            </div>
            <div id="subtitle">
              SGT is the Governance Token of SharedStake platform. DAO will be
              launched after the first airdrop that issued snowswap stakers!
            </div>
            <div id="subtitle">
              SharedStake is also incentivising Ethereum staking via
              collabration with defi projects.
            </div>
          </div>
        </div>
        <div
          class="flex_row Wrapper"
          id="W4"
          :style="
            width < 680
              ? ''
              : {
                  transform: 'translate(0, ' + w4translate + 'px)',
                  opacity: w4opacity,
                }
          "
        >
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
            :style="
              width > 680
                ? { transform: 'translate(0, ' + w4translate * -3 + 'px)' }
                : ''
            "
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
      w3translate: 0,
      w3opacity: 1,
      W4: 0,
      w4translate: 0,
      w4opacity: 1,
    };
  },
  created: function () {
    this.width = window.innerWidth;
    this.W2 = this.w2translate = this.W3 = this.w3translate = this.W4 = this.w4translate = 0;
  },
  mounted: async function () {
    this.onResize();
    window.addEventListener("scroll", this.handleScroll);
    this.width = window.innerWidth;
    window.addEventListener("resize", this.onResize);
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

      this.w3opacity = this.getOpacity(scr, this.W3);
      this.w3translate = (this.W3 - scr).toFixed(0);

      this.w4opacity = this.getOpacity(scr, this.W4);
      this.w4translate = (this.W4 - scr).toFixed(0);
    },
    scrollToNext: function (y) {
      console.log(y);
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    onResize() {
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
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,500;0,700;1,700&display=swap");
@font-face {
  font-family: hacked;
  src: url(Hacked.ttf);
}
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
  height: 85vh;
  padding-top: 15vh; /*
  // display: flex;
  // flex-direction: column;
  // align-items: flex-start;
  // justify-content: space-between;
  */
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
}

.socials {
  position: absolute;
  top: 100%;
  width: 80%;
  background: #050505;
  border: 1px transparent solid;
  height: 30vh;
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
  transition: transform 0.2s ease-in-out;
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
.hodl {
  font-size: 8vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #f60574;
}

#rainbow {
  font-weight: 500;
  margin-bottom: 6vh;
  color: #09fa8b;
  letter-spacing: 1vw;
}
#solution {
  z-index: 100;
  border-right: 0.15em solid orange; /* The typwriter cursor */
  font-size: 3.8vw;
  font-family: hacked, "Consolas";
  text-shadow: 2px 2px #f60574;
  animation: blink-caret 0.75s step-end infinite;
}
#exp1,
#exp {
  font-size: 8vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #f60574;
}
#exp1 {
  text-align: left;
  grid-area: exp1;
}
#subtitle {
  padding: 20px 0 0 0;
  font-size: 3vw;
  text-align: left;
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
  margin-top: 2vh;
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
  overflow-x: hidden; /* Ensures the content is not revealed until the animation */
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
  overflow: visible;
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
    font-size: 48px;
  }
  .header,
  .content,
  #exp1,
  #exp {
    line-height: 100%;
    font-size: 6vw;
  }
  #rainbow {
    line-height: 100%;
    word-break: break-all;
  }
  .loginButton {
    font-size: 14px;
  }

  #subtitle {
    font-size: 5vw;
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
</style>