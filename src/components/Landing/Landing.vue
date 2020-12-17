<template>
  <div class="flex_column landingPage">
    <div class="wrapper">
      <div class="header">
        <imageVue :src="'logo-4.png'" :size="'14vw'" class="myLogo" />
        <router-link class="loginButton" to="/app">Launch App </router-link>
      </div>
      <div class="flex_column content">
        <div id="title">
          <spam name="rainbow" id="rainbow"> SharedStake </spam>
          <br />
          <spam name="exp" id="exp"
            >Decentralized Ethereum Staking Service</spam
          >
        </div>
        <div id="subtitle">
          Earn more money by holding incentivised vEth2 token.
        </div>
        <div id="subtitle">
          • Liquidty Mining with SharedStake Governance Token rewards!
        </div>
        <div id="subtitle">• Airdrops every 3 months!</div>
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
      <div id="flex_row title" class="typewriter">
        <spam id="solution">Perfect Solution For {{ perfect }}</spam>
      </div>
      <div class="header">
        <socials class="socials" />
      </div>
    </div>
    <!-- <div class="header" id="Down">
        <imageVue :src="'back-button.png'" :size="'32px'" id="down" />
      </div> -->
    <!-- <div class="Below">
      <div class="Below2">
        <div class="flex_column Wrapper" id="W2">
          <div id="flex_row title" class="typewriter">
            <spam id="exp">Perfect Solution For {{ perfect }}</spam>
          </div>
        </div>
        <div class="flex_row Wrapper" id="W2"></div>
        <div class="flex_row Wrapper" id="W2"></div>
      </div>
    </div> -->
  </div>
</template>

<script>
import imageVue from "../Handlers/image.vue";
import Socials from "../Root/Root/Socials.vue";
import { timeout } from "../../utils/helpers";
export default {
  components: { imageVue, Socials },
  data: function () {
    return { perfect: " Defi" };
  },
  mounted: async function () {
    let newPerfect = "Ethereum 2";
    for (let i = 0; i < 100; i++) {
      console.log(this.perfect);
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
        console.log(this.perfect, len);
        await timeout(100);
      }
      await timeout(5000);
      newPerfect = oldPerfect;
    }
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Ubuntu:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap");
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
    rgba(36, 36, 36, 1) 100%
  );
  align-items: center;
  justify-content: center;
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
  padding: 20px 20px 0 0;
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
  background: transparent;
  border: 1px #0d5cf8 solid;
  border-radius: 5px;
  text-decoration: none;
  padding: 0 10px 0 10px;
  font-size: 18px;
  color: #0d5cf8;
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
  padding: 20px 20px 0 20px;
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
  font-size: 5vw;
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
#notion:hover {
  transform: scale(0.95);
}
#Down {
  align-items: center;
  justify-content: center;
}
#down {
  filter: invert(1);
  transform: rotate(270deg);
  margin-left: 5vh;
  transition: all 0.2s ease-in-out;
}

.Wrapper {
  position: relative;
  padding: 20px 0 0 20px;
  height: 99vh;
  align-items: flex-start;
  overflow: hidden;
}

#W2 {
  margin-top: 15vh;
  align-items: center;
  justify-content: flex-start;
  width: 99vw;
}

.Below {
  overflow-x: scroll;
  width: 99vw;
}
.Below2 {
  display: flex;
  width: 298vw;
}
.typewriter {
  overflow-x: hidden; /* Ensures the content is not revealed until the animation */
  border-right: 0.15em solid orange; /* The typwriter cursor */
  white-space: nowrap; /* Keeps the content on a single line */
  margin: 20px auto 0 auto; /* Gives that scrolling effect as the typing happens */
  letter-spacing: 0.15em; /* Adjust as needed */
  animation: blink-caret 0.75s step-end infinite;
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
  #title {
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
  #notion {
    font-size: 20px;
  }
  #subtitle {
    font-size: 32px;
  }
}
@media only screen and (max-width: 540px) {
  #title {
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
    font-size: 6vw;
  }
}
</style>