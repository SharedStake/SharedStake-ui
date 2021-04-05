<template>
  <div class="Root">
    <div
      :class="{
        navbar: true,
        'navbar--hidden': !showNavbar,
      }"
    >
      <router-link to="/">
        <div class="flex_row LogoContainer">
          <ImageVue :src="'logo-white.svg'" :size="'30px'" class="Logo" />
          <div class="main">SharedStake</div>
        </div>
      </router-link>
      <div class="links" v-show="windowWidth > 900">
        <router-link class="link" to="/stake"> Stake </router-link>
        <router-link class="link" to="/earn"> Earn </router-link>
        <router-link class="link" to="/dashboard"> Dashboard </router-link>
      </div>
      <div class="links" v-show="windowWidth > 900">
        <span class="link">
          <a
            href="https://snapshot.page/#/sharedstake.eth"
            target="_blank"
            rel="noopener noreferrer"
            >DAO
          </a>
        </span>
        <span class="link">
          <a
            href="https://docs.sharedstake.org/"
            target="_blank"
            rel="noopener noreferrer"
            >Docs
          </a>
        </span>
        <span class="link">
          <a
            href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x84810bcf08744d5862b8181f12d17bfd57d3b078"
            target="_blank"
            rel="noopener noreferrer"
            >Buy SGT ${{ sgtPrice }}
          </a>
        </span>
        <span class="link" v-bind:style="{ opacity: 1 }">
          <div v-if="userAddress" class="ConnectButton" @click="Connect">
            {{ userAddress.slice(0, 12) }}
          </div>
          <div v-else class="ConnectButton animatedButton" @click="Connect">
            Connect Wallet
          </div>
        </span>
      </div>
      <div
        @click="showSidebar = !showSidebar"
        class="showers"
        v-show="windowWidth < 900"
      >
        <svg
          viewBox="0 0 32 2"
          fill="white"
          class="shower"
          :class="{ cross1: showSidebar }"
        >
          <path fill="currentColor" d="M0 0h32v2H0z"></path></svg
        ><svg
          viewBox="0 0 32 2"
          fill="white"
          class="shower"
          :class="{ cross2: showSidebar }"
        >
          <path fill="currentColor" d="M0 0h32v2H0z"></path>
        </svg>
      </div>
    </div>
    <div class="sidebar" v-show="windowWidth < 900 && showSidebar">
      <span class="link" v-bind:style="{ opacity: 1 }">
        <div v-if="userAddress" class="ConnectButton" @click="Connect">
          {{ userAddress.slice(0, 12) }}
        </div>
        <div v-else class="ConnectButton animatedButton" @click="Connect">
          Connect Wallet
        </div>
      </span>
      <router-link class="link" to="/stake" @click.native="showSidebar = false">
        Stake
      </router-link>
      <router-link class="link" to="/earn" @click.native="showSidebar = false">
        Earn
      </router-link>
      <router-link
        class="link"
        to="/dashboard"
        @click.native="showSidebar = false"
      >
        Dashboard
      </router-link>
      <span class="link">
        <a
          href="https://snapshot.page/#/sharedstake.eth"
          target="_blank"
          rel="noopener noreferrer"
          >DAO
        </a>
      </span>
      <span class="link">
        <a
          href="https://docs.sharedstake.org/"
          target="_blank"
          rel="noopener noreferrer"
          >Docs
        </a>
      </span>
      <span class="link">
        <a
          href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x84810bcf08744d5862b8181f12d17bfd57d3b078"
          target="_blank"
          rel="noopener noreferrer"
          >Buy SGT ${{ sgtPrice }}
        </a>
      </span>
    </div>
    <!--App-->
    <router-view :scrolled="currentScrollPosition" :windowWidth="windowWidth" />
    <!--App-->
    <div class="footer">
      <div class="disclaimer">
        <p>
          Please note that this is a Beta version of the SharedStake protocol.
          The platform, its software, and all content found on it are provided
          on an “as is” and “as available” basis.
        </p>
        <p>
          While we have made reasonable efforts to ensure the security and
          functionality of the SharedStake platform, nothing approaching the
          rigor of a formal audit has been conducted at this time and the
          front-end is actively being tested.
        </p>
        <p>
          We strongly advise caution to anyone who chooses to use the current
          experimental version.
        </p>
        <p>PLEASE DO NOT RISK ANY FUNDS YOU CANNOT AFFORD TO LOSE</p>
      </div>
      <div class="flex_row LogoContainer">
        <div class="footerLinks">
        <ImageVue :src="'logo-white.svg'" :size="'80px'" class="FooterLogo" />
        <div class="footerGroup">
          <div class="footerGroupName">Community</div>
          <span class="link footerLink">
            <a
              href="https://twitter.com/SharedStake"
              target="_blank"
              rel="noopener noreferrer"
              >Twitter
            </a></span
          >
          <span class="link footerLink">
            <a
              href="https://discord.com/invite/VezkjY9udC"
              target="_blank"
              rel="noopener noreferrer"
              >Discord
            </a></span
          >
          <span class="link footerLink">
            <a
              href="https://www.reddit.com/r/SharedStake/"
              target="_blank"
              rel="noopener noreferrer"
              >Reddit
            </a></span
          >
        </div>
        <div class="footerGroup">
          <div class="footerGroupName">Developers</div>
          <span class="link footerLink">
            <a
              href="https://github.com/SharedStake"
              target="_blank"
              rel="noopener noreferrer"
              >Github
            </a></span
          >
          <span class="link footerLink">
            <a
              href="https://docs.sharedstake.org/"
              target="_blank"
              rel="noopener noreferrer"
              >Documentation
            </a></span
          >
          <span class="link footerLink">
            <a
              href="https://sips.sharedstake.org/"
              target="_blank"
              rel="noopener noreferrer"
              >SIPs
            </a></span
          >
        </div>
        <div class="footerGroup">
          <div class="footerGroupName">About</div>
          <span class="link footerLink">
            <a
              href="https://docs.sharedstake.org/faq."
              target="_blank"
              rel="noopener noreferrer"
              >FAQ
            </a></span
          >
          <span class="link footerLink">
            <a
              href="https://docs.sharedstake.org/risks"
              target="_blank"
              rel="noopener noreferrer"
              >Risks
            </a></span
          >
        </div>
      </div>
      </div>
      <div class="bottom">SharedStake © 2021</div>
    </div>
  </div>
</template>

<script>
import ImageVue from "./components/Handlers/ImageVue";
import { mapGetters, mapActions } from "vuex";
import { priceInUsdAsync } from "@/utils/coingecko";

export default {
  components: { ImageVue },
  data() {
    return {
      showNavbar: true,
      lastScrollPosition: 0,
      currentScrollPosition: 0,
      windowWidth: window.innerWidth,
      showSidebar: false,
      sgtPrice: null,
    };
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("scroll", this.onScroll);
    this.setSgtPrice();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.onScroll);
  },
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },
  methods: {
    ...mapActions(["setAddress"]),
    async Connect() {
      await this.setAddress();
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    onScroll() {
      const currentScrollPosition =
        window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollPosition < 0) {
        return;
      }
      this.currentScrollPosition = currentScrollPosition;
      // Stop executing this function if the difference between
      // current scroll position and last scroll position is less than some offset
      if (Math.abs(currentScrollPosition - this.lastScrollPosition) < 100) {
        return;
      }
      this.showNavbar = currentScrollPosition < this.lastScrollPosition;
      this.lastScrollPosition = currentScrollPosition;
    },
    async setSgtPrice() {
      const sgtCoinId = "sharedstake-governance-token";
      this.sgtPrice = await priceInUsdAsync(sgtCoinId);
    },
  },
};
</script>

<style scoped>
.Root {
  min-height: 100vh;
  background: rgb(15, 16, 19);
}
.navbar,
.footer {
  z-index: 100;
}
.navbar {
  display: flex;
  flex-direction: row;
  -webkit-box-pack: justify;
  justify-content: center;
  -webkit-box-align: center;
  align-items: center;
  box-sizing: border-box;
  padding: 1.5rem;
  width: 100%;
  position: fixed;
  top: -1px;
  background: rgb(15, 16, 19);
  color: rgb(255, 255, 255);
  transform: translate3d(0, 0, 0);
  transition: 0.5s all ease-out;
}
.navbar.navbar--hidden {
  box-shadow: none;
  transform: translate3d(0, -100%, 0);
}

.showers {
  width: max-content;
  min-width: 32px;
  height: 32px;
  padding-right: 32px;
  display: flex;
  align-self: center;
  flex-direction: column;

  overflow: visible;
}
.shower {
  margin-bottom: 8px;
  height: auto;
  transform-origin: center;
  transition-duration: 250ms;
  transition-property: transform;
  transition-timing-function: linear;
}
.cross1 {
  transform: rotate(45deg);
}
.cross2 {
  transform: rotate(-45deg);
}
.LogoContainer {
  font-size: 24px;
  align-items: center;
  cursor: pointer;
  /* grid-area: Logo; */
  justify-content: center;
}

.Logo {
  transition: all 0.25s ease 0s;
}
.FooterLogo,
.Logo:hover {
  -webkit-filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7));
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7));
  /* Similar syntax to box-shadow */
}
.FooterLogo {
  margin-bottom: 50px;
}
.main {
  padding: 0 0 0 10px;
  font-weight: 400;
}
.footerGroup,
.links {
  box-sizing: border-box;
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  transition: right 0.25s ease 0s;
}
.sidebar {
  position: fixed;
  top: 84px;
  width: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  -webkit-box-align: center;
  align-items: flex-start;
  -webkit-box-pack: center;
  justify-content: center;
  transition: right 0.25s ease 0s;
  animation: SidebarUp 0.5s ease-out 0s forwards;
  z-index: 99;
  background: rgb(15, 16, 19);
}
@keyframes SidebarUp {
  from {
    transform: translate3d(0, -100%, 0);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}
.link {
  text-decoration: none;
  margin: 0px;
  --tw-space-x-reverse: 0;
  margin-right: calc(2.5rem * var(--tw-space-x-reverse));
  margin-left: calc(2.5rem * (1 - var(--tw-space-x-reverse)));
  color: rgb(255, 255, 255);
  opacity: 0.5;
  padding: 15px 0px;
  border-radius: 0.5rem;
  font-weight: 400;
  width: fit-content;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.35s ease 0s;
}
.router-link-active,
.link:hover {
  opacity: 1;
}
.ConnectButton {
  padding: 0.5rem 1.5rem;
  border: 3px double transparent;
  border-radius: 80px;
  background: linear-gradient(rgb(13, 14, 33), rgb(13, 14, 33)),
    radial-gradient(
      circle at left top,
      rgb(250, 82, 160) 0%,
      rgb(37, 167, 219) 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-size: 100% 100%;
  transition: filter 0.5s ease-out;
  white-space: nowrap;
}
.animatedButton {
  animation: animatedButton 3s ease-out backwards infinite;
}
.ConnectButton:hover {
  -webkit-filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7))
    brightness(200%);
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7)) brightness(120%);
}
@keyframes animatedButton {
  from {
    background-position: 0px;
  }

  to {
    background-position: 168.6px;
  }
}
.footer {
  padding: 40px 30px 10px 30px;
  background-color: rgb(24, 24, 24);
  color: rgb(255, 255, 255);
  min-height: 350px;
  /* display: grid; */
  /* grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 0.4fr;
  gap: 0px 0px;
  grid-template-areas:
    "Disclaimer Logo"
    "Disclaimer Info"
    "bottom bottom "; */
  align-items: center;
}

.disclaimer {
  grid-area: Disclaimer;
  font-size: 14px;
  padding: 0 0 50px 0;
  text-align: center;
  text-justify: inter-word;
  line-height: 22px;
  opacity: 0.5;
  transition: opacity 0.35s ease 0s;
}
.disclaimer:hover {
  opacity: 1;
}
.footerLinks {
  grid-area: Info;
  max-width: 1500px;
  width: calc(100% - 60px);
  margin: 0px auto;
  display: flex;
  flex-wrap: wrap;
  -webkit-box-pack: justify;
  justify-content: space-around;
  padding: 0 0 50px 0;
}
.footerGroup {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0 10px 10px 10px;
}
.footerGroupName {
  color: inherit;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 1.25em;
  opacity: 0.75;
}
.footerLink {
  margin: 0;
  padding: 0 0 14px 0;
}
.bottom {
  text-align: center;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  grid-area: bottom;
  color: #afafaf;
}
.icebear {
  padding: 0 10px;
}
@media only screen and (max-width: 900px) {
  .footer {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 0.3fr 1fr 1fr 0.4fr;
    grid-template-areas:
      "Logo Logo"
      "Info Info "
      "Disclaimer Disclaimer"
      "bottom bottom ";
  }
}
</style>