<template>
  <div class="flex_column landingPage">
    <div id="Launcher">
      <imageVue :src="'logo-4.png'" :size="'14vw'" class="myLogo" />
      <router-link class="loginButton" to="/app">Launch App </router-link>
    </div>
    <div class="wrapper">
      <div class="flex_column content">
        <div id="title">
          <span name="rainbow" id="rainbow"> SharedStake </span>
          <br />
          <span name="exp1" id="exp"
            >Decentralized Ethereum Staking Service</span
          >
        </div>
        <div id="subtitle">Easiest way to stake ETH for Ethereum 2</div>
        <div id="subtitle">
          • Liquidity Mining with SharedStake Governance Token rewards!
        </div>
        <div id="subtitle">• Profits are distributed via airdrops!</div>
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
      <div class="header">
        <socials class="socials" />
      </div>
      <div class="header" id="Down" @click="() => scrollToNext(W2)">
        <imageVue :src="'back-button.png'" :size="'32px'" id="down" />
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
            <span name="hodl" class="hodl">Just HODL</span>
            <div id="subtitle">Stake Any Amount!</div>
            <div id="subtitle">
              Deposit Ether and receive vETH2<imageVue
                :src="'logo-4.png'"
                :size="'28px'"
              />
              token in return.
            </div>
            <div id="subtitle">
              Hold vETH2<imageVue :src="'logo-4.png'" :size="'28px'" /> for any
              amount of time and be eligible for the airdrop.
            </div>
            <div id="subtitle">
              • There will be airdrops of profit, that distributes the profit.
              You can claim it whenever you want.
            </div>
          </div>
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
            :style="
              width < 680
                ? ''
                : { transform: 'translate(0, ' + w2translate * -3 + 'px)' }
            "
          >
            <imageVue
              :size="width < 680 ? '60vw' : '40vw'"
              :src="'hodl.gif'"
              :height="width < 680 ? false : true"
              :class="hovered ? 'photosHover' : 'photos'"
            />
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
              :size="width < 680 ? '60vw' : '40vw'"
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
          <div
            class="flex_column"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
            :style="
              width < 680
                ? ''
                : { transform: 'translate(0, ' + w4translate * -3 + 'px)' }
            "
          >
            <a
              href="https://snowswap.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <imageVue
                :src="'snowswap.svg'"
                :size="width < 680 ? '60vw' : '40vw'"
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
  mounted: async function () {
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
@import url("https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Ubuntu:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap");
.secondPage {
  text-align: left;
  padding: 20px 20px 50px 20px;
  max-width: 1000px;
  align-items: flex-start;
  font-weight: 300;
}
a {
  text-decoration: none;
  color: #f5f5f7;
  font-family: "Roboto";
  font-weight: 300;
}
.landingPage {
  color: #f5f5f7;
  background: rgb(0, 0, 0);
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 1) 0%,
    rgba(45, 45, 45, 1) 100%
  );
  align-items: center;
  justify-content: center;
  font-family: "Roboto";
  width: 100%;
}
.wrapper {
  width: 100vw;
  font-family: "Roboto";
  max-width: 1000px;
  font-weight: 300;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}
.header {
  padding: 10px 0px 0 0;
  width: 100vw;
  max-width: 1000px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.socials {
  width: 100%;
}
.loginButton {
  margin-right: 20px;
  background: transparent;
  border: 1px #6296ff solid;
  border-radius: 5px;
  text-decoration: none;
  padding: 0 10px 0 10px;
  font-size: 18px;
  color: #6296ff;
  text-align: center;
  line-height: 50px; /* same as height! */
  max-height: 50px;
  transition: transform 0.2s ease-in-out;
}
.loginButton:hover {
  transform: scale(0.95);
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
  font-size: 12vw;
  align-items: flex-start;
  justify-content: space-between;
  text-align: left;
  font-family: "Black Ops One", cursive;
  padding: 50px 0 0 0;
}
.hodl {
  font-size: 12vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #0d5cf8;
}

#rainbow {
  font-weight: 500;
  margin: 0;
  background-clip: text;
  -webkit-background-clip: text;
  color: rgba(256, 256, 256, 0.1);
  background-image: url("bg.gif");
  background-size: contain;
  text-shadow: 0px 0px #fafafa45;
}
#solution {
  z-index: 100;
  font-size: 3.8vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #0d5cf8;
}
#exp {
  font-size: 8vw;
  font-family: "Roboto";
  text-shadow: 2px 2px #0d5cf8;
}

#subtitle {
  padding: 20px 0 0 0;
  font-size: 3vw;
  text-align: left;
}
#notion {
  margin: 20px 0 0 0;
  border: 1px #fafafa solid;
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
#continue:hover,
#notion:hover {
  transform: scale(0.95);
}
#Down {
  align-items: center;
  justify-content: center;
}
#down {
  cursor: pointer;
  filter: invert(1);
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

.Below {
  overflow-x: hidden;
  width: 99vw;
}
.Below2 {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 298vh;
}
.typewriter {
  overflow-x: hidden; /* Ensures the content is not revealed until the animation */
  border-right: 0.15em solid orange; /* The typwriter cursor */
  white-space: nowrap; /* Keeps the content on a single line */
  margin: 20px auto 0 auto; /* Gives that scrolling effect as the typing happens */
  letter-spacing: 0.15em; /* Adjust as needed */
  animation: blink-caret 0.75s step-end infinite;
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
  overflow: hidden;
  width: 99vw;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  position: fixed;
  top: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 100;
  backdrop-filter: blur(5px);
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
  #exp,
  .content {
    font-size: 48px;
  }
  #solution {
    font-size: 32px;
  }
  #continue,
  #notion {
    font-size: 20px;
  }
  #subtitle {
    font-size: 32px;
  }
}
@media only screen and (max-width: 540px) {
  #title,
  .hodl {
    font-size: 64px;
  }
  .header,
  .content,
  #exp {
    line-height: 100%;
    font-size: 8vw;
  }
  #rainbow {
    line-height: 100%;
    word-break: break-all;
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
</style>