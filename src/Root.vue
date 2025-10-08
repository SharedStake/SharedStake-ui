<template>
  <!-- Footer on landing page -->
  <div class="Root">
    <!-- Maintenance Banner -->
    <div
      :class="{ 'element-hidden': !maintenanceBannerVisible }"
      class="maintenance-banner fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4 text-lg font-bold text-center text-white bg-red-600 shadow-lg transition-transform duration-500"
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
      :class="{ 'element-hidden-bottom': !footerBannerVisible }"
      class="fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center p-2 text-sm font-semibold text-center text-white bg-brand-primary transition-transform duration-500"
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
          <div class="LogoContainer flex items-center justify-evenly">
            <ImageVue :src="'logo-white.svg'" :size="'30px'" class="Logo" />
            <div class="main">SharedStake</div>
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
      <router-link class="link" to="/blog" @click.native="showSidebar = false">
        Blog
      </router-link>
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
      <div class="LogoContainer flex items-center justify-evenly">
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
              <router-link to="/blog">Blog</router-link>
            </span>
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
      <div class="bottom">SharedStake © 2025</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import ImageVue from "./components/Handlers/ImageVue.vue";
import { priceInUsdAsync } from "@/utils/coingecko";
import Menu from "./components/Navigation/Menu.vue";
import ConnectButton from "./components/Common/ConnectButton.vue";
import { useScrollVisibility } from "./composables/useScrollVisibility";

export default {
  components: { ImageVue, Menu, ConnectButton },
  setup() {
    const walletStore = useWalletStore()
    
    // Reactive state
    const showNavbar = ref(true)
    const lastScrollPosition = ref(0)
    const currentScrollPosition = ref(0)
    const windowWidth = ref(window.innerWidth)
    const showSidebar = ref(false)
    const sgtPrice = ref(null)

    // Use the composable for maintenance banner
    const { isVisible: maintenanceBannerVisible } = useScrollVisibility({
      threshold: 50,
      hideOnScrollDown: true,
      showOnScrollUp: true
    });

    // Use the composable for footer banner
    const { isVisible: footerBannerVisible } = useScrollVisibility({
      threshold: 50,
      hideOnScrollDown: true,
      showOnScrollUp: true
    });

    // Computed
    const userAddress = computed(() => walletStore.userAddress)

    // Methods
    const Connect = async () => {
      await walletStore.connectWallet();
    }

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    }

    const onScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll < 0) {
        return;
      }
      currentScrollPosition.value = currentScroll;
      // Stop executing this function if the difference between
      // current scroll position and last scroll position is less than some offset
      if (Math.abs(currentScroll - lastScrollPosition.value) < 100) {
        return;
      }
      showNavbar.value = currentScroll < lastScrollPosition.value;
      lastScrollPosition.value = currentScroll;
    }

    const setSgtPrice = async () => {
      const sgtCoinId = "sharedstake-governance-token";
      sgtPrice.value = await priceInUsdAsync(sgtCoinId);
    }

    // Watch for sidebar changes
    watch(showSidebar, (show) => {
      if (show) {
        // Prevent scroll on document behind sidebar.
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    });

    // Lifecycle
    onMounted(async () => {
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", onScroll);
      await setSgtPrice();
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", onScroll);
    });

    return {
      // State
      showNavbar,
      lastScrollPosition,
      currentScrollPosition,
      windowWidth,
      showSidebar,
      sgtPrice,
      
      // Computed
      userAddress,
      
      // Methods
      Connect,
      handleResize,
      onScroll,
      setSgtPrice,
      
      // Composables
      maintenanceBannerVisible,
      footerBannerVisible
    };
  }
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
  background: #0f1013;
  color: rgb(255, 255, 255);
  transform: translate3d(0, 0, 0);
  transition: 0.5s all ease-out;
}
.navbar.navbar--hidden {
  box-shadow: none;
  transform: translate3d(0, -100%, 0);
}

/* Shared transition styles for scroll-based hiding */
.element-hidden {
  transform: translate3d(0, -100%, 0);
}

.element-hidden-bottom {
  transform: translate3d(0, 100%, 0);
}

.showers {
  width: max-content;
  min-width: 32px;
  display: flex;
  align-self: center;
  flex-direction: column;

  overflow: visible;
}
.shower {
  margin-bottom: 8px;
  height: 2px;
  transform-origin: center;
  transition-duration: 250ms;
  transition-property: transform;
  transition-timing-function: linear;
}
.cross1 {
  transform: rotate(45deg);
  position: relative;
  left: 1px;
  top: 10px;
}
.cross2 {
  transform: rotate(-45deg);
}
.LogoContainer {
  font-size: 24px;
  cursor: pointer;
  /* grid-area: Logo; */
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
  padding-left: 10px;
  transition: right 0.25s ease 0s;
}
.sidebar {
  position: fixed;
  top: 127px;
  bottom: 0;
  overflow-y: auto;
  width: 100%;
  padding: 1.5rem;
  padding-top: 0;
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
  opacity: 0.67;
  padding: 15px 0px;
  border-radius: 0.5rem;
  font-weight: 400;
  width: fit-content;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.35s ease 0s;
}

.sidebar .link {
  padding: 8px 0;
  font-size: 14px;
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
.disabled-link {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.coming-soon {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  font-weight: normal;
}

@media only screen and (max-width: 1100px) {
  .footer {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 0.3fr 1fr 1fr 0.4fr;
    grid-template-areas:
      "Logo Logo"
      "Info Info "
      "Disclaimer Disclaimer"
      "bottom bottom ";
  }
  .navbar {
    justify-content: space-between;
  }
}

@media only screen and (max-width: 700px) {
  .maintenance-banner {
    font-size: 14px;
    padding: 8px 16px;
  }
  .maintenance-banner svg {
    width: 20px;
    height: 20px;
  }
}
</style>
