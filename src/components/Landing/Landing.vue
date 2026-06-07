<template>
  <div class="Landing">
    <!-- Animated background elements -->
    <div
      class="animated-bg"
      aria-hidden="true"
    >
      <div class="gradient-orb orb-1" />
      <div class="gradient-orb orb-2" />
      <div class="gradient-orb orb-3" />
      <div class="floating-shapes">
        <div class="shape shape-1" />
        <div class="shape shape-2" />
        <div class="shape shape-3" />
        <div class="shape shape-4" />
      </div>
    </div>
    <div
      v-show="scrolled >= 0"
      class="Container first"
      :style="windowWidth <= 900 ? { paddingTop: (headerOffset || 128) + 'px' } : {}"
    >
      <div class="LogoContainer">
        <ImageVue
          class="align-self-center justify-self-center"
          :src="'logo-red.svg'"
          :size="windowWidth > 900 ? '180px' : '20vw'"
        />
      </div>
      <div class="hero-content flex flex-col justify-center h-full p-4">
        <div class="hero-copy mb-8 text-center md-large:max-w-xl md-large:text-left">
          <h1 class="relative mb-6 mainTitle">
            <span
              title="Established in 2020"
              class="absolute p-1 px-2 text-xs font-semibold text-gray-800 transform -translate-x-1/2 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-sm -bottom-6 md:bottom-auto md:-top-6 md:left-0 left-1/2 md:translate-x-0 animate-pulse"
            >
              EST. 2020
            </span>
            <span
              class="text-white"
              style="text-transform: uppercase; letter-spacing: 0.06em;"
            >Ethereum Liquid Staking Derivative!</span> <br>
            <span class="subtitle-text">Experience the Future of DeFi</span>
          </h1>
          <div class="exp hero-description">
            SharedStake is a decentralized Ethereum 2 staking solution that
            allows users to stake any amount of Ether and earn additional yield
            on top of their ETH2 rewards.
          </div>
        </div>
        <div
          class="hero-actions flex items-center justify-center gap-6 mb-8 md-large:justify-start flex-wrap"
        >
          <ComingSoonPill
            label="STAKE V2"
            class="hero-cta px-6 py-3 text-xl font-semibold transition-all border-2 border-transparent rounded-full bg-gradient-to-r from-gray-600 to-gray-700 md:font-medium md:text-3xl md:px-8 whitespace-nowrap cursor-not-allowed opacity-50 flex flex-col items-center shadow-lg"
            aria-label="Stake V2 is coming soon"
          />
          <a
            class="hero-cta px-6 py-3 text-xl font-medium transition-all duration-300 border border-transparent rounded-full whitespace-nowrap md:text-2xl md:px-8 bg-gradient-to-r from-[#e6007a] via-[#c30066] to-[#9f004f] hover:from-[#f30082] hover:via-[#d3006f] hover:to-[#ac0056] hover:scale-105 hover:shadow-xl text-white"
            rel="noopener noreferrer nofollow"
            href="https://app.passch.com/"
            target="_blank"
          >
            MINT NFT
          </a>
          <button
            type="button"
            class="hero-cta px-6 py-3 text-xl font-medium transition-all duration-300 border border-white/30 rounded-full whitespace-nowrap md:text-2xl md:px-8 bg-white/10 hover:bg-white/15 hover:scale-105 hover:shadow-xl text-white"
            @click="scrollToEmailSignup"
          >
            Sign up for our email list
          </button>
        </div>

        <div class="flex items-center justify-center md-large:justify-start">
          <p class="gap-8 mb-3 text-lg">
            Join the conversation:
          </p>
        </div>
        <div
          class="hero-socials flex items-center justify-center gap-8 mb-8 md-large:justify-start"
        >
          <template
            v-for="social in socialLinks"
            :key="social.key"
          >
            <a
              v-if="!social.disabled"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
              :aria-label="social.ariaLabel"
            >
              <ImageVue
                :src="social.icon"
                size="24px"
                class="socialLogo"
              />
            </a>
            <div
              v-else
              class="social-link social-link-disabled cursor-not-allowed opacity-50 flex flex-col items-center"
              aria-disabled="true"
              :aria-label="social.ariaLabel"
            >
              <ImageVue
                :src="social.icon"
                size="24px"
                class="socialLogo"
              />
              <div class="text-xs mt-1 text-center">
                {{ social.subLabel || "Coming Soon" }}
              </div>
            </div>
          </template>
        </div>

        <div class="flex items-center justify-center md-large:justify-start">
          <p class="mb-3 text-lg">
            vETH2 Redemptions:
          </p>
        </div>
        <div
          class="hero-redemption-actions flex items-center justify-center gap-4 mb-8 md-large:justify-start"
        >
          <button
            type="button"
            class="px-4 py-2 text-base font-medium transition-all duration-300 border border-cyan-400 rounded-full whitespace-nowrap md:text-lg hover:border-cyan-300 hover:text-cyan-300 hover:bg-cyan-400/10 md:px-6 cursor-not-allowed opacity-70"
            disabled
            aria-disabled="true"
          >
            Rollover (Returning soon!)
          </button>
          <ComingSoonPill
            label="Withdraw"
            class="px-4 py-2 text-base font-medium transition-all border border-gray-500 rounded-full whitespace-nowrap md:text-lg md:px-6 cursor-not-allowed opacity-50 flex flex-col items-center bg-gradient-to-r from-gray-600 to-gray-700"
            aria-label="Withdraw is coming soon"
          />
        </div>
      </div>
    </div>
    <div
      v-show="scrolled >= 0"
      class="downSign glow"
      aria-hidden="true"
    >
      <ImageVue
        :src="'down.svg'"
        :size="'30px'"
      />
    </div>
    <div
      v-show="scrolled >= 350"
      class="Stats flex flex-col items-center justify-evenly"
    >
      <div class="StatsHeader gradient-text">
        Capital efficient staking
      </div>
      <div class="StatsExp">
        <span class="highlight-text">Financial optimization at its finest.</span>
      </div>
      <div class="StatsExp">
        Better rewards, improved user experience, and more DeFi compatibility
        than any other Staking-as-a-Service model on the market.
      </div>

      <div v-if="isMobile()">
        <p class="text-center">
          More detailed dashboard available on desktops with an ETH RPC provider
        </p>
      </div>
    </div>
    <div
      v-show="scrolled >= 1000"
      class="Container"
    >
      <div class="exp background2" />
      <div class="second">
        <div class="X Eth">
          <ImageVue
            :src="'eth.png'"
            :size="'90px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next1"
        />
        <div class="X vEth2">
          <ImageVue
            :src="'vEth2.png'"
            :size="'163px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next2"
        />
        <div class="X reward">
          <ImageVue
            :src="'Reward.png'"
            :size="'127px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next3"
        />
        <div class="X harvest">
          <ImageVue
            :src="'Harvest.png'"
            :size="'92px'"
          />
        </div>
        <div class="Exp EthExp">
          Stake any amount of Eth
        </div>
        <div class="Exp vEth2Exp">
          Receive your vEth2 token
        </div>
        <div class="Exp rewardExp">
          Simply holding vEth2 entitles you to staking rewards
        </div>
        <div class="Exp harvestExp">
          Harvest more yield with your vEth2 in supported DeFi protocols!
        </div>
        <div
          v-show="scrolled >= 1500"
          class="exp Information"
        >
          <div
            v-show="scrolled >= 1500"
            class="InfoHeader centertext"
          >
            Staking with SharedStake
          </div>
          <div
            v-show="scrolled >= 1500"
            class="exp Info"
          >
            SharedStake users earn staking rewards every block, whether you hodl
            your stake or decide to invest your vEth2 in supported Ethereum
            dapps like Uniswap, SushiSwap, Curve, Maker, Compound, Aave, and
            many more...
          </div>
          <div
            v-show="scrolled >= 1500"
            class="exp Info"
          >
            vEth2 is designed for DeFi compatibility. It is a yield bearing
            token for legacy SharedStake staking exposure. vEth2 staking is
            also incentivized further with SGT, the SharedStake Governance Token.
          </div>
          <a
            class="LearnButton"
            href="https://docs.sharedstake.finance/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
    <div
      v-show="scrolled >= 2500"
      class="Container flex flex-col items-center justify-evenly"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="vEth2PanelHeader flex flex-row items-center justify-evenly">
        <ImageVue
          :src="'vEth2.png'"
          :size="'123px'"
          class="exp veth2-panel-icon"
        />
        <div class="StatsHeader gradient-text veth2-panel-title">
          vEth2
        </div>
      </div>
      <div class="exp InfoHeader centertext text-gray-200 panel-subtitle">
        Yield Bearing Wrapped Ether
      </div>
      <div class="exp background3" />
      <div class="third">
        <div class="Bubble enhanced-bubble wide-bubble">
          <div class="exp InfoHeader gradient-text">
            Financially Optimized
          </div>
          <div class="exp Info mb30">
            SharedStake optimizes Eth2 staking profits by creating an off-chain
            yield bearing token for legacy staking exposure. Legacy vEth2 exits
            use protocol liquidity or the governed old-vEth2 withdrawal queue.
          </div>
          <ImageVue
            :src="'discount.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            DeFi Compatible
          </div>
          <div class="exp Info mb30">
            By using vEth2 instead of other wrapped Ether tokens, DeFi users
            gain an extra 8-9% yearly growth with off-chain profit distribution.
            <br>
            Since vEth2 doesn't contain any 'imaginary' staking rewards, its
            value is intended to track the protocol's underlying staking
            position and available legacy redemption paths.
          </div>
          <ImageVue
            :src="'diamond.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            Incentivized Staking
          </div>
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
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            Built-in Exit Pool
          </div>
          <div class="exp Info mb30">
            10% of all staked Ether remains in the staking contract, creating a
            liquidity bridge between all users, old and new. <br>
            Legacy vEth2 exits depend on available protocol liquidity or FIFO
            withdrawal queue finalization at the configured redemption rate.
          </div>
          <ImageVue
            :src="'balance.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
      </div>
      <a
        class="LearnButton enhanced-learn-button"
        href="https://sips.sharedstake.org/SIPS/sip-3.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn More
      </a>
    </div>
    <div v-show="scrolled > 3800">
      <Partners />
    </div>
    <div
      v-show="scrolled >= 4400"
      class="BadgeContainer flex flex-col items-center justify-evenly"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="StatsHeader">
        Audit
      </div>
      <div class="flex flex-col items-center justify-evenly">
        <a
          href="https://github.com/SharedStake/SharedStake-ui/blob/main/public/assets/static/AuditReport.pdf?raw=true"
          target="_blank"
          rel="noopener noreferrer"
          class="certikLogo"
        >
          <ImageVue
            :src="'certik-foundation-logo-white.png'"
            :size="'400px'"
            class="certikLogo"
          />
        </a>
      </div>
    </div>
    <div
      id="email-signup"
      class="email-signup-section"
    >
      <div class="exp Information email-signup-info email-signup-card">
        <div class="InfoHeader centertext">
          Stay in the loop
        </div>
        <div class="exp centertext email-signup-desc">
          Get the latest on vETH2 staking rewards, governance proposals, and new DeFi integrations — straight from the team.
        </div>
        <div class="exp Info">
          <MailingListSubscribeForm />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";
import MailingListSubscribeForm from "../Common/MailingListSubscribeForm.vue";
import Partners from "./Partners.vue";
import ComingSoonPill from "./ComingSoonPill.vue";
import axios from "axios";
import BN from "bignumber.js";
import { priceInUsdAsync } from "@/utils/coingecko";

export default {
  components: {
    ImageVue,
    MailingListSubscribeForm,
    Partners,
    ComingSoonPill,
  },
  props: ["scrolled", "windowWidth", "headerOffset"],
  data() {
    return {
      TVL: 16000,
      TVLinUsd: 0,
      APY: "",
      validatorTotalBalance: 16543,
      validatorVirtualPrice: 1.0377,
      validatorsSlashed: 0,
      validatorApr: 6,
      vpPostFees: 1.03,
      elapsed: 1,
      validatorsOnline: 500,
      profit: 543,
      indices: [],
      indicesLoaderPromise: null,
      contractsLoaderPromise: null,
      socialLinks: [
        {
          key: "discord",
          href: "https://discord.gg/C9GhCv86My",
          ariaLabel: "Join SharedStake on Discord",
          icon: "socialmediaicons/Discord.svg",
        },
        {
          key: "telegram",
          disabled: true,
          ariaLabel: "Telegram is coming soon",
          icon: "socialmediaicons/TG.svg",
          subLabel: "Coming Soon",
        },
        {
          key: "github",
          href: "https://github.com/SharedStake",
          ariaLabel: "SharedStake GitHub",
          icon: "socialmediaicons/Git.svg",
        },
        {
          key: "medium",
          href: "https://medium.com/@chimera_defi",
          ariaLabel: "SharedStake Medium",
          icon: "socialmediaicons/Medium.svg",
        },
        {
          key: "twitter",
          href: "https://twitter.com/ChimeraDefi",
          ariaLabel: "SharedStake on X",
          icon: "socialmediaicons/Twitter.svg",
        },
      ],
    };
  },
  async mounted() {
    this.setupTvl();
    if (!this.isMobile() && !import.meta.env.DEV) {
      this.setupApy().catch(() => {
        this.APY = '5';
      });
      this.getValidatorInfo().catch(() => {
        // Third-party validator stats are best-effort; may be blocked by CORS locally.
      });
    }
  },
  methods: {
    scrollToEmailSignup() {
      const target = document.getElementById("email-signup");
      if (!target) return;

      const scrollAttempt = (triesRemaining) => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        if (triesRemaining <= 0) return;
        setTimeout(() => scrollAttempt(triesRemaining - 1), 350);
      };

      // This landing page progressively reveals sections based on scroll position.
      // As the user scrolls, new sections become visible and push the target down.
      // Retrying the scroll a few times ensures we land on the actual signup section.
      scrollAttempt(3);
    },
    isMobile() {
      // https://stackoverflow.com/questions/48515023/display-different-vuejs-components-for-mobile-browsers
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        return true; // Mobile browsers are allowed regardless of wallet availability.
      } else {
        return false;
      }
    },
    async setupTvl() {
      try {
        this.TVL = await this.fetchTvlFromEtherscan();
      } catch {
        const STATIC_TVL = 17688; // Updated 1 feb 2023

        if (!this.isMobile()) {
          try {
            this.TVL = await this.fetchTvlWithWallet();
          } catch {
            this.TVL = BN(STATIC_TVL).toString();
          }
        } else {
          this.TVL = BN(STATIC_TVL).toString();
        }
      } finally {
        this.setTvlInUsd(this.TVL);
      }
    },
    async getValidatorInfo() {
      const indices = await this.loadValidatorIndices();
      let results = [];
      let reqUrl = "https://beaconcha.in/api/v1/validator/";
      let chunkArray = (array, size) => {
        if (array.length <= size) {
          return [array];
        }
        return [array.slice(0, size), ...chunkArray(array.slice(size), size)];
      };
      async function getAllValidatorInfo(indices) {
        // disable the dashboard, exit early for now with just 1 validator
        const indicesToQuery = [indices[0]];
        // beacon chain api supports 100 indices per call, and a max of 10 calls/min for free tier
        await Promise.all(
          chunkArray(indicesToQuery, 100).map(async (chunk) => {
            let url = reqUrl.concat(chunk.toString());
            let res = await axios.get(url);
            results = results.concat(res.data.data);
          })
        );
      }
      await getAllValidatorInfo(indices);

      let startTime = 1616502743000;
      let elapsed = Date.now() - startTime;
      let msInYr = 1000 * 60 * 60 * 24 * 365;

      let totalBal = 0;
      let effectiveBal = 0;
      let status = 0;
      let slashed = 0;
      results.forEach((validator) => {
        totalBal += validator.balance;
        effectiveBal += validator.effectivebalance;
        if (validator.status == "active_online") status++;
        if (validator.slashed) slashed++;
      });
      this.validatorsSlashed = slashed;
      this.validatorsOnline = status;
      this.validatorVirtualPrice = BN(totalBal / effectiveBal)
        .toFixed(4)
        .toString();
      this.validatorTotalBalance = BN(totalBal)
        .div(1e9)
        .toFixed(0)
        .toString();
      this.profit = BN(totalBal - effectiveBal)
        .div(1e9)
        .toFixed(2)
        .toString();
      this.validatorApr = (((this.profit / elapsed) * msInYr) / this.TVL) * 100;
      this.validatorApr = this.validatorApr.toFixed(2);
      this.vpPostFees =
        this.validatorVirtualPrice - (this.validatorVirtualPrice - 1) * 0.2;
      this.vpPostFees = this.vpPostFees.toFixed(4);
      this.elapsed = ((12 * elapsed) / msInYr).toFixed(2);

    },
    async loadValidatorIndices() {
      if (this.indices.length > 0) {
        return this.indices;
      }

      if (!this.indicesLoaderPromise) {
        this.indicesLoaderPromise = import("./validatorIndices").then(
          (module) => {
            this.indices = module.default;
            return this.indices;
          }
        );
      }

      return this.indicesLoaderPromise;
    },
    async setupApy() {
      try {
        this.getAPY();
      } catch {
        this.APY = await BN(6).toString();
      }
    },
    async getAPY() {
      // Temporary till defi mining starts again
      this.APY = 5;
      try {
        const { SGT_uniswap, geyser_SGT_uniswap } = await this.loadContracts();
        let token = SGT_uniswap();
        let tokenGeyser = geyser_SGT_uniswap();
        if (!token || !tokenGeyser) {
          console.error("Contracts not available");
          return;
        }
        let reserves = await token.getReserves();
        let Sgt = reserves[0];
        let totalSupply = await token.totalSupply();
        let tokenPerSgt = totalSupply / (Sgt * 2n);
        let totalStaked = await tokenGeyser.totalSupply();
        totalStaked = BN(totalStaked.toString());
        let now = Math.floor(Date.now() / 1000);
        let until = await tokenGeyser.periodFinish();
        let remDays = BN(Number(until) - now).div(60).div(60).div(24); //get remaining days
        let stakedSchedule = remDays;
        let duration = await tokenGeyser.rewardsDuration(); //in second
        let remRewards = BN(remDays).times(
          BN(75000).div(
            BN(Number(duration))
              .div(60)
              .div(60)
              .div(24)
          )
        );
        let locked = BN(remRewards);
        let APY = Math.round(
          BN(
            100 *
              tokenPerSgt *
              ((locked * 1e18) / totalStaked) *
              (360 / stakedSchedule)
          )
        ).toString();
        this.APY = APY;
        return await Promise.resolve(APY);
      } catch {
        this.APY = BN(6).toString();
        return await Promise.resolve(BN(6).toString());
      }
    },
    async fetchTvlFromEtherscan() {
      let response = await axios.get(
        `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x898bad2774eb97cf6b94605677f43b41871410b1&apikey=${import.meta.env.VITE_ETHERSCAN_KEY || ""}`
      );
      return BN(response.data.result)
        .div(1e18)
        .toFixed(0)
        .toString();
    },
    async fetchTvlWithWallet() {
      if (!window.ethereum) {
        throw "Window doesn't have ethereum enabled";
      }

      const { vEth2 } = await this.loadContracts();
      const vEth2Contract = vEth2();
      if (!vEth2Contract) {
        console.error("vETH2 contract not available");
        return "0";
      }
      const vETH2TotalSupply = await vEth2Contract.totalSupply();

      return BN(vETH2TotalSupply.toString())
        .div(1e18)
        .toFixed(0)
        .toString();
    },
    async setTvlInUsd(tvlInETH) {
      const etherPrice = await priceInUsdAsync("ethereum");
      this.TVLinUsd = etherPrice * tvlInETH;
    },
    async loadContracts() {
      if (!this.contractsLoaderPromise) {
        this.contractsLoaderPromise = import("@/contracts");
      }
      return this.contractsLoaderPromise;
    },
  },
};
</script>

<style scoped>
/*this is ok until 900px */

/* Animated background elements */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 1;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(230, 0, 122, 0.4) 0%, rgba(230, 0, 122, 0) 70%);
  top: 5%;
  left: 5%;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(78, 205, 196, 0.2) 0%, rgba(78, 205, 196, 0) 70%);
  top: 55%;
  right: 10%;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(230, 0, 122, 0.15) 0%, rgba(100, 0, 60, 0) 70%);
  bottom: 15%;
  left: 25%;
  animation-delay: -14s;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 15s ease-in-out infinite;
}

.shape-1 {
  width: 20px;
  height: 20px;
  top: 20%;
  left: 80%;
  animation-delay: -3s;
}

.shape-2 {
  width: 15px;
  height: 15px;
  top: 70%;
  left: 10%;
  animation-delay: -8s;
}

.shape-3 {
  width: 25px;
  height: 25px;
  top: 40%;
  right: 15%;
  animation-delay: -12s;
}

.shape-4 {
  width: 18px;
  height: 18px;
  bottom: 30%;
  left: 70%;
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(15px) rotate(240deg);
  }
}

/* Enhanced text styles */
.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
}

.subtitle-text {
  font-size: 0.6em;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5rem;
  display: block;
}

.highlight-text {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 500;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Enhanced social links */
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  transition: all 0.3s ease;
  border-radius: 50%;
  padding: 8px;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.social-link-disabled {
  pointer-events: none;
}

.social-link-disabled .socialLogo {
  filter: brightness(190%);
}

/* Enhanced bubble styling */
.enhanced-bubble {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.enhanced-bubble:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Enhanced learn button */
.LearnButton.enhanced-learn-button {
  background: linear-gradient(135deg, #e6007a 0%, #b0005c 100%);
  border: 2px solid rgba(230, 0, 122, 0.4);
  position: relative;
  overflow: hidden;
}

.LearnButton.enhanced-learn-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.LearnButton.enhanced-learn-button:hover::before {
  left: 100%;
}

.LearnButton.enhanced-learn-button:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(230, 0, 122, 0.4);
}
.downSign {
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 10px;
  position: sticky;
}

.Container {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  z-index: 1;
}

.Container,
.Stats,
.BadgeContainer {
  transition: opacity 0.4s ease;
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

.BadgeContainer {
  position: relative;
  justify-content: center;
  align-items: center;
  color: #fff;
  z-index: 1;
}

.first {
  padding-top: 10rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: ". .";
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
  overflow-wrap: normal;
  max-width: 900px;
  font-size: 64px;
  font-weight: 500;
  line-height: 1.05;
}

.exp {
  font-size: 21px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.9);
  text-justify: inter-word;
  animation: TextEnter 0.6s ease-out backwards 0.2s;
  z-index: 1;
  max-width: 65ch;
  text-wrap: pretty;
}

.hero-actions {
  row-gap: 0.9rem;
}

.hero-copy {
  max-width: 52rem;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.65;
}

.hero-cta {
  min-width: 220px;
  text-align: center;
  justify-content: center;
}

.hero-socials,
.hero-redemption-actions {
  flex-wrap: wrap;
}

.hero-socials {
  row-gap: 0.65rem;
}

.hero-redemption-actions {
  row-gap: 0.75rem;
}

.hero-cta:focus-visible,
.LearnButton:focus-visible,
.social-link:focus-visible {
  outline: 2px solid rgba(255, 122, 193, 0.95);
  outline-offset: 3px;
}

.panel-subtitle {
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.04em;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
  width: fit-content;
  max-width: calc(100% - 2rem);
  margin: 0 auto 1.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(135deg, rgba(8, 12, 21, 0.75), rgba(18, 26, 40, 0.65));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
  text-wrap: balance;
}

.Information .exp,
.Bubble .exp {
  max-width: 100%;
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
  display: inline-block;
  width: fit-content;
  margin: 24px auto 0;
  font-size: 21px;
  padding: 0.5rem 1.5rem;
  border: 2px solid #fff;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.5s ease-out;
  cursor: pointer;
  z-index: 3;
  grid-area: Button;
  color: #fff;
}

.LearnButton:hover:not(.enhanced-learn-button),
.StakeButton:hover {
  transform: scale(0.98);
}

.StakeButton {
  font-size: 21px;
  font-weight: 500;
  color: black;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #e6007a;
  background-color: #e6007a;
  border-radius: 10px;
  text-align: center;
  width: 142px;
  /* max-height: 25px; */
  transition: transform 0.5s ease-out;
  cursor: pointer;
  z-index: 3;
  grid-area: Button;
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
  margin: auto;
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
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(17, 26, 25, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 2px;
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
  padding: 0 0 50px 0;
  align-items: center;
  font-size: 50px;
  line-height: 1.16em;
  margin: 30px;
  font-weight: 300;
  animation: TextEnter 0.4s ease-out backwards;
  text-align: center;
}

.StatsExp {
  max-width: 800px;
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
  height: 100%;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 2rem;
  gap: 0.5rem;
  border-radius: 2rem;
  text-align: center;
  flex-basis: 1/3;
}

.Num {
  font-size: 64px;
  line-height: 1.125;
  font-weight: 600;
}
.Num:after {
  content: "";
  @apply bg-brand-primary h-1 w-16 block mx-auto my-1;
}

.NumExp {
  font-weight: 300;
  font-size: 21px;
  line-height: 1.25;
}

.NumDetail {
  font-weight: 300;
  font-size: 14px;
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
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.veth2-panel-icon {
  animation: Glow 2s ease-in-out alternate infinite;
}

.veth2-panel-title {
  margin: 0 0 0 1rem;
  padding: 0;
  line-height: 1.08;
  font-size: clamp(2.25rem, 5vw, 3.3rem);
}

.third {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 5% 2% 5%;
  z-index: 1;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.wide-bubble {
  grid-row: span 2;
}

.Bubble {
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

.centertext {
  text-align: center;
}

.glow {
  filter: brightness(300%);
}

.reverse {
  filter: invert(1);
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
    filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.08)) brightness(102%);
  }

  to {
    filter: drop-shadow(0px 0px 6px rgba(230, 0, 122, 0.42)) brightness(112%);
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

.email-signup-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1rem;
  scroll-margin-top: 96px;
}

.email-signup-info {
  grid-area: unset;
  width: min(70%, 860px);
}

.email-signup-card {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  background: radial-gradient(circle at top right, rgba(230, 0, 122, 0.2), rgba(0, 0, 0, 0.55));
  backdrop-filter: blur(8px);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}

.email-signup-desc {
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 640px;
  margin: 0 auto 2rem;
}

@media only screen and (max-width: 900px) {
  .first {
    padding-top: 128px; /* fallback when headerOffset prop unavailable */
    display: grid;
    gap: 0px 0px;
    grid-template-areas: ".";
    background-image: url(bg-1.png);
    background-repeat: no-repeat;
    background-position: center;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    justify-content: center;
    align-items: start;
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
    font-size: clamp(2.7rem, 7vw, 3.6rem);
    line-height: 1.06;
  }

  .Explanation {
    padding: 0 20px 80px 20px;
    animation: TextEnter 0.4s ease-out backwards;
  }

  .StatsContent {
    flex-direction: column;
    align-items: center;
    padding: 0px;
  }

  .StatsHeader {
    font-size: 40px;
  }

  .InfoHeader {
    padding: 12px 0;
    font-size: 24px;
    line-height: 1.35;
  }

  .third {
    grid-template-columns: 1fr;
  }

  .wide-bubble {
    grid-row: span 1;
  }

  .hero-actions {
    width: 100%;
    margin-bottom: 1.5rem;
    row-gap: 0.7rem;
  }

  .hero-cta {
    width: 100%;
    min-width: 0;
    font-size: 1rem;
    line-height: 1.35;
    padding: 0.8rem 1.1rem;
    max-width: 34rem;
    margin-inline: auto;
  }

  .hero-description {
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .hero-socials {
    gap: 0.5rem 0.9rem;
    width: 100%;
    justify-content: center;
  }

  .hero-redemption-actions {
    gap: 0.65rem;
  }

  .hero-redemption-actions > * {
    flex: 1 1 240px;
    text-align: center;
    justify-content: center;
  }

  .panel-subtitle {
    font-size: 1.25rem;
    line-height: 1.45;
    letter-spacing: 0.03em;
  }

  .email-signup-section {
    padding: 3.4rem 0.85rem;
  }

  .email-signup-info {
    width: min(95%, 860px);
  }

  .email-signup-desc {
    font-size: 1rem;
    line-height: 1.55;
    margin-bottom: 1.5rem;
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

  .Information {
    width: 100%;
    padding: 20px 14px;
  }

  .certikLogo {
    max-width: 80%;
    text-align: center;
  }

  .mainTitle {
    font-size: 42px;
    line-height: 1.08;
    margin-bottom: 24px;
  }

  .vEth2PanelHeader {
    flex-direction: column;
    gap: 0.65rem;
    padding-top: 3.25rem;
  }

  .veth2-panel-title {
    margin: 0;
    font-size: clamp(2rem, 10vw, 2.6rem);
  }

  .hero-cta {
    font-size: 0.95rem;
    padding: 0.75rem 1rem;
  }

  .hero-description {
    font-size: 1rem;
    line-height: 1.58;
  }

  .subtitle-text {
    font-size: 0.56em;
    margin-top: 0.35rem;
  }

  .Explanation {
    padding: 0 16px 64px 16px;
  }

  .hero-redemption-actions > * {
    flex: 1 1 100%;
    max-width: 320px;
  }

  .email-signup-info {
    width: 100%;
  }

  .email-signup-card {
    border-radius: 20px;
  }

  .panel-subtitle {
    font-size: 1.1rem;
    line-height: 1.4;
    letter-spacing: 0.02em;
    max-width: calc(100% - 1rem);
    padding: 0.4rem 0.8rem;
  }
}

@media only screen and (max-width: 375px) {
  .mainTitle {
    font-size: 34px;
  }

  .hero-cta {
    font-size: 0.9rem;
  }

  .email-signup-card {
    border-radius: 16px;
  }

  .panel-subtitle {
    font-size: 1rem;
    line-height: 1.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-orb,
  .shape,
  .gradient-text,
  .exp,
  .social-link,
  .enhanced-bubble,
  .LearnButton {
    animation: none !important;
    transition: none !important;
  }
}
</style>
