<template>
  <!-- Footer on landing page -->
  <div class="Root">
    <!-- Maintenance Banner -->
    <div
      class="maintenance-banner fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4 text-lg font-bold text-center text-white bg-red-600 shadow-lg"
    >
      <div class="flex items-center space-x-2">
        <svg class="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>⚠️ UNDER MAINTENANCE ⚠️</span>
        <svg class="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
    <div
      class="fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center p-2 text-sm font-semibold text-center text-white bg-brand-primary"
    >
      🚀 v2 - Sepolia testnet live now! 🚀 Switch network to Sepolia and try staking/unstaking now for a chance to get an airdrop! 🚀
      <p
        class="text-xs pt-0.5 border-t border-brand-primary-light font-normal mt-0.5"
      >
        Get ready for V2!
        <br />
        Over 90% of veth2 already redeemed! New v2 withdrawawls contracts with better UX coming soon for remaining users! 
        <br />
        version: 1.0.6
      </p>
    </div>
    <div
      :class="{ 'navbar--hidden': !showNavbar }"
      class="fixed top-16 w-full p-3 navbar"
    >
      <div
        class="flex items-center justify-between gap-6 mx-auto max-w-content"
      >
        <router-link to="/">
          <div class="flex-center-row LogoContainer">
            <ImageVue :src="'logo-white.svg'" :size="'30px'" class="logo-glow" />
            <div class="pl-2.5 font-normal text-2xl">SharedStake</div>
          </div>
        </router-link>

        <!-- Desktop menu -->
        <template v-if="windowWidth >= 960">
          <Menu :sgtPrice="sgtPrice" />
          <ConnectButton />
        </template>

        <!-- Burger menu -->
        <div
          @click="showSidebar = !showSidebar"
          class="showers"
          v-show="windowWidth < 960"
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
    </div>
    <div class="sidebar" v-show="windowWidth < 960 && showSidebar">
      <ConnectButton />

      <div class="link disabled-link flex flex-col items-start">
        <span>Stake</span>
        <div class="coming-soon">Coming Soon</div>
      </div>
      <router-link class="link" to="/wrap" @click.native="showSidebar = false">
        Wrap
      </router-link>
      <router-link
        class="link"
        to="/unwrap"
        @click.native="showSidebar = false"
      >
        Unwrap
      </router-link>
      <router-link
        class="link"
        to="/rollover"
        @click.native="showSidebar = false"
      >
        Rollover
      </router-link>
      <div class="link disabled-link flex flex-col items-start">
        <span>Withdraw</span>
        <div class="coming-soon">Coming Soon</div>
      </div>
      <router-link class="link" to="/earn" @click.native="showSidebar = false">
        Earn
      </router-link>
      <router-link class="link" to="#Stats" @click.native="showSidebar = false">
        <a href="#Stats">
          Stats
        </a>
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
          href="https://docs.sharedstake.finance/"
          target="_blank"
          rel="noopener noreferrer"
          >Docs
        </a>
      </span>
      <span class="link">
        <a
          href="https://duneanalytics.com/sushi2000/shared-stake-metrics"
          target="_blank"
          rel="noopener noreferrer"
          >Dune
        </a>
      </span>
      <span class="link">
        <a
          href="https://sharedtools.org"
          target="_blank"
          rel="noopener noreferrer"
          >Get veSGT
        </a>
      </span>
      <span class="link">
        <a
          href="https://curve.fi/factory/49"
          target="_blank"
          rel="noopener noreferrer"
          >Get CRV-vETH2-LP
        </a>
      </span>
      <span class="link">
        <a
          href="https://app.uniswap.org/#/swap?outputCurrency=0x24C19F7101c1731b85F1127EaA0407732E36EcDD"
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
          Please note that SharedStake protocol, its software, and all content
          found on it are provided on an “as is” and “as available” basis.
        </p>
        <p>
          While we have made reasonable efforts to ensure the security and
          functionality of the SharedStake platform, including a formal audit by
          Certik, we are constantly working on the front-end. Please inform us on
          Discord if you are experiencing any bugs or odd behaviour on the UI.
        </p>
        <p>
          We strongly advise caution to anyone who chooses to use the current
          version.
        </p>
        <p>
          By using the SharedStake software you agree to not hold SharedStake or
          it's operators liable for any losses
        </p>
        <p>PLEASE DO NOT RISK ANY FUNDS YOU CANNOT AFFORD TO LOSE</p>
      </div>
      <div class="flex-center-row LogoContainer">
        <div class="footerLinks">
          <ImageVue
            :src="'logo-white.svg'"
            :size="'100px'"
            class="FooterLogo"
          />
          <div class="footerGroup">
            <div class="footerGroupName">Community</div>
            <span class="link footerLink">
              <a
                href="https://twitter.com/ChimeraDefi"
                target="_blank"
                rel="noopener noreferrer"
                >Twitter
              </a></span
            >
            <span class="link footerLink">
              <a
                href="https://discord.gg/C9GhCv86My"
                target="_blank"
                rel="noopener noreferrer"
                >Discord
              </a></span
            >
            <span class="link footerLink">
              <a
                href="https://medium.com/@chimera_defi"
                target="_blank"
                rel="noopener noreferrer"
                >Medium
              </a></span
            >
            <!-- <span class="link footerLink">
              <a
                href="https://www.reddit.com/r/SharedStake/"
                target="_blank"
                rel="noopener noreferrer"
                >Reddit
              </a></span 
            > -->
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
                href="https://docs.sharedstake.finance/"
                target="_blank"
                rel="noopener noreferrer"
                >Documentation
              </a></span
            >
            <span class="link footerLink">
              <a
                href="https://snapshot.page/#/sharedstake.eth"
                target="_blank"
                rel="noopener noreferrer"
                >SIPs
              </a>
            </span>
          </div>
          <div class="footerGroup">
            <div class="footerGroupName">About</div>
            <span class="link footerLink">
              <a
                href="https://www.certik.org/projects/sharedstake"
                target="_blank"
                rel="noopener noreferrer"
                >Audit
              </a></span
            >
            <span class="link footerLink">
              <router-link to="/FAQ">FAQ </router-link>
            </span>
            <span class="link footerLink">
              <a
                href="https://docs.sharedstake.org/risks"
                target="_blank"
                rel="noopener noreferrer"
                >Risks
              </a></span
            >
            <span class="link footerLink">
              <router-link to="/privacy">Privacy Policy </router-link>
            </span>
            <span class="link footerLink">
              <router-link to="/terms">Terms of Service </router-link>
            </span>
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
import Menu from "./components/Navigation/Menu.vue";
import ConnectButton from "./components/Common/ConnectButton.vue";

export default {
  components: { ImageVue, Menu, ConnectButton },
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

  mounted: async function() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("scroll", this.onScroll);
    await this.setSgtPrice();
  },

  goto(refName) {
    var element = this.$refs[refName];
    var top = element.offsetTop;

    window.scrollTo(0, top);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.onScroll);
  },

  watch: {
    showSidebar(show) {
      if (show) {
        // Prevent scroll on document behind sidebar.
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    },
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
  @apply min-h-screen;
  background: rgb(15, 16, 19);
}
.navbar,
.footer {
  @apply z-50;
}
.navbar {
  @apply text-white transition-all duration-500;
  background: #0f1013;
  transform: translate3d(0, 0, 0);
}
.navbar.navbar--hidden {
  @apply shadow-none;
  transform: translate3d(0, -100%, 0);
}

.showers {
  @apply w-max min-w-[32px] flex self-center flex-col overflow-visible;
}
.shower {
  @apply mb-2 h-0.5 transition-transform duration-300 origin-center;
}
.cross1 {
  @apply relative left-px top-2.5;
  transform: rotate(45deg);
}
.cross2 {
  transform: rotate(-45deg);
}
.LogoContainer {
  @apply text-2xl items-center cursor-pointer justify-center;
}
.FooterLogo {
  @apply mb-12 logo-glow;
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7));
}
.footerGroup,
.links {
  @apply box-border flex items-center justify-center pl-2.5 transition-all duration-300;
}
.sidebar {
  @apply fixed top-32 bottom-0 overflow-y-auto w-full px-6 pt-0 box-border flex flex-col items-start justify-center transition-all duration-300 z-50;
  background: rgb(15, 16, 19);
  animation: SidebarUp 0.5s ease-out 0s forwards;
}

/* Animation moved to main.css */
.link {
  @apply nav-link mx-10;
}

.sidebar .link {
  @apply py-2 text-sm mx-0;
}
/* Button styles moved to main.css */
.footer {
  @apply px-8 pt-10 pb-2.5 text-white min-h-[350px] items-center;
  background-color: rgb(24, 24, 24);
}

.disclaimer {
  @apply text-sm pb-12 text-center leading-6 opacity-50 transition-opacity duration-300 hover:opacity-100;
  text-justify: inter-word;
}
.footerLinks {
  @apply max-w-[1500px] w-[calc(100%-60px)] mx-auto flex flex-wrap justify-around pb-12;
}
.footerGroup {
  @apply flex-col items-start justify-start p-2.5 pb-2.5;
}
.footerGroupName {
  @apply text-base font-bold mb-5 opacity-75;
  color: inherit;
}
.footerLink {
  @apply footer-link;
}
.bottom {
  @apply text-xs flex items-center justify-center text-gray-400;
}
.icebear {
  @apply px-2.5;
}
.disabled-link {
  @apply opacity-50 cursor-not-allowed pointer-events-none;
}

.coming-soon {
  @apply text-xs text-gray-500 mt-0.5 font-normal;
}

@media only screen and (max-width: 1100px) {
  .navbar {
    @apply justify-between;
  }
}

@media only screen and (max-width: 700px) {
  .maintenance-banner {
    @apply text-sm px-4 py-2;
  }
  .maintenance-banner svg {
    @apply w-5 h-5;
  }
}
</style>
