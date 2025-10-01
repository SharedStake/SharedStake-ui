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
      class="fixed top-16 w-full p-3 navbar transition-all duration-500 ease-out bg-dark-bg text-white transform"
    >
      <div
        class="flex items-center justify-between gap-6 mx-auto max-w-content"
      >
        <router-link to="/" class="flex items-center gap-2.5 text-2xl cursor-pointer">
          <ImageVue :src="'logo-white.svg'" :size="'30px'" class="transition-all duration-250 ease-in-out hover:drop-shadow-[0px_0px_4px_rgba(255,255,255,0.7)]" />
          <div class="pl-2.5 font-normal">SharedStake</div>
        </router-link>

        <!-- Desktop menu -->
        <template v-if="windowWidth >= 960">
          <Menu :sgtPrice="sgtPrice" />
          <ConnectButton />
        </template>

        <!-- Burger menu -->
        <div
          @click="showSidebar = !showSidebar"
          class="w-max min-w-8 flex flex-col self-center overflow-visible"
          v-show="windowWidth < 960"
        >
          <svg
            viewBox="0 0 32 2"
            fill="white"
            class="h-0.5 mb-2 origin-center transition-all duration-250 ease-linear"
            :class="{ 'rotate-45 relative left-0.5 top-2.5': showSidebar }"
          >
            <path fill="currentColor" d="M0 0h32v2H0z"></path></svg
          ><svg
            viewBox="0 0 32 2"
            fill="white"
            class="h-0.5 origin-center transition-all duration-250 ease-linear"
            :class="{ '-rotate-45': showSidebar }"
          >
            <path fill="currentColor" d="M0 0h32v2H0z"></path>
          </svg>
        </div>
      </div>
    </div>
    <div class="fixed top-32 bottom-0 overflow-y-auto w-full p-6 pt-0 box-border flex flex-col items-start justify-center transition-all duration-250 ease-in-out animate-slide-up z-[99] bg-dark-bg" v-show="windowWidth < 960 && showSidebar">
      <ConnectButton />

      <div class="opacity-50 cursor-not-allowed pointer-events-none flex flex-col items-start py-2">
        <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out">Stake</span>
        <div class="text-xs text-gray-400 mt-0.5 font-normal">Coming Soon</div>
      </div>
      <router-link class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100" to="/wrap" @click.native="showSidebar = false">
        Wrap
      </router-link>
      <router-link
        class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100"
        to="/unwrap"
        @click.native="showSidebar = false"
      >
        Unwrap
      </router-link>
      <router-link
        class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100"
        to="/rollover"
        @click.native="showSidebar = false"
      >
        Rollover
      </router-link>
      <div class="opacity-50 cursor-not-allowed pointer-events-none flex flex-col items-start py-2">
        <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out">Withdraw</span>
        <div class="text-xs text-gray-400 mt-0.5 font-normal">Coming Soon</div>
      </div>
      <router-link class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100" to="/earn" @click.native="showSidebar = false">
        Earn
      </router-link>
      <router-link class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100" to="#Stats" @click.native="showSidebar = false">
        <a href="#Stats">
          Stats
        </a>
      </router-link>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
        <a
          href="https://snapshot.page/#/sharedstake.eth"
          target="_blank"
          rel="noopener noreferrer"
          >DAO
        </a>
      </span>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
        <a
          href="https://docs.sharedstake.finance/"
          target="_blank"
          rel="noopener noreferrer"
          >Docs
        </a>
      </span>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
        <a
          href="https://duneanalytics.com/sushi2000/shared-stake-metrics"
          target="_blank"
          rel="noopener noreferrer"
          >Dune
        </a>
      </span>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
        <a
          href="https://sharedtools.org"
          target="_blank"
          rel="noopener noreferrer"
          >Get veSGT
        </a>
      </span>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
        <a
          href="https://curve.fi/factory/49"
          target="_blank"
          rel="noopener noreferrer"
          >Get CRV-vETH2-LP
        </a>
      </span>
      <span class="text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
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
    <div class="z-[100] px-8 py-10 bg-dark-footer text-white min-h-[350px] flex items-center">
      <div class="text-sm pb-12 text-center leading-[22px] opacity-50 transition-opacity duration-[350ms] ease-in-out hover:opacity-100" style="text-justify: inter-word;">
        <p>
          Please note that SharedStake protocol, its software, and all content
          found on it are provided on an "as is" and "as available" basis.
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
      <div class="flex items-center justify-center">
        <div class="max-w-[1500px] w-[calc(100%-60px)] mx-auto flex flex-wrap justify-around pb-12">
          <ImageVue
            :src="'logo-white.svg'"
            :size="'100px'"
            class="mb-12 transition-all duration-250 ease-in-out hover:drop-shadow-[0px_0px_4px_rgba(255,255,255,0.7)]"
          />
          <div class="flex flex-col items-start justify-start px-2.5 pb-2.5">
            <div class="text-white font-bold text-base mb-5 opacity-[0.75]">Community</div>
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://twitter.com/ChimeraDefi"
                target="_blank"
                rel="noopener noreferrer"
                >Twitter
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://discord.gg/C9GhCv86My"
                target="_blank"
                rel="noopener noreferrer"
                >Discord
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://medium.com/@chimera_defi"
                target="_blank"
                rel="noopener noreferrer"
                >Medium
              </a></span
            >
          </div>
          <div class="flex flex-col items-start justify-start px-2.5 pb-2.5">
            <div class="text-white font-bold text-base mb-5 opacity-[0.75]">Developers</div>
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://github.com/SharedStake"
                target="_blank"
                rel="noopener noreferrer"
                >Github
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://docs.sharedstake.finance/"
                target="_blank"
                rel="noopener noreferrer"
                >Documentation
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://snapshot.page/#/sharedstake.eth"
                target="_blank"
                rel="noopener noreferrer"
                >SIPs
              </a>
            </span>
          </div>
          <div class="flex flex-col items-start justify-start px-2.5 pb-2.5">
            <div class="text-white font-bold text-base mb-5 opacity-[0.75]">About</div>
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://www.certik.org/projects/sharedstake"
                target="_blank"
                rel="noopener noreferrer"
                >Audit
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <router-link to="/FAQ">FAQ </router-link>
            </span>
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <a
                href="https://docs.sharedstake.org/risks"
                target="_blank"
                rel="noopener noreferrer"
                >Risks
              </a></span
            >
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <router-link to="/privacy">Privacy Policy </router-link>
            </span>
            <span class="m-0 pb-3.5 text-white opacity-[0.67] py-2 rounded-lg font-normal w-fit text-base cursor-pointer transition-opacity duration-[350ms] ease-in-out hover:opacity-100">
              <router-link to="/terms">Terms of Service </router-link>
            </span>
          </div>
        </div>
      </div>
      <div class="text-center text-xs flex items-center justify-center text-[#afafaf]">SharedStake © 2021</div>
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
  @apply min-h-screen bg-dark-bg;
}

.navbar {
  @apply bg-dark-bg text-white transform transition-all duration-500 ease-out;
  z-index: 100;
}

.navbar.navbar--hidden {
  @apply shadow-none transform -translate-y-full;
}

.ConnectButton {
  @apply px-6 py-2 border-double border-transparent bg-gradient-to-r from-brand-accent to-brand-secondary bg-origin-border bg-clip-padding transition-all duration-500 ease-out whitespace-nowrap;
  border-width: 3px;
  border-radius: 80px;
  background-image: linear-gradient(#0d0e21, #0d0e21), radial-gradient(circle at left top, #fa52a0 0%, #25a7db 100%);
  background-size: 100% 100%;
}

.ConnectButton:hover {
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7)) brightness(120%);
}

.animatedButton {
  @apply animate-button-shift;
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

@media only screen and (max-width: 700px) {
  .maintenance-banner {
    @apply text-sm px-4 py-2;
  }
  .maintenance-banner svg {
    @apply w-5 h-5;
  }
}
</style>
