<template>
  <div class="landing">
    <!-- Hero Section -->
    <section class="hero-section" v-show="scrolled >= 0">
      <div class="hero-container">
        <!-- Logo -->
        <div class="logo-wrapper">
          <ImageVue
            :src="'logo-red.svg'"
            :size="windowWidth > 900 ? '160px' : '120px'"
            class="hero-logo"
          />
        </div>

        <!-- Content -->
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="hero-badge">EST. 2020</span>
              Ethereum Liquid Staking Derivative
            </h1>
            <p class="hero-description">
              SharedStake is a decentralized Ethereum 2 staking solution that
              allows users to stake any amount of Ether and earn additional yield
              on top of their ETH2 rewards.
            </p>
          </div>

          <!-- CTA Buttons -->
          <div class="hero-actions">
            <button class="btn btn-disabled">
              <span>STAKE V2</span>
              <span class="btn-subtitle">Coming Soon</span>
            </button>
            <a
              href="https://app.passch.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline"
            >
              MINT NFT
            </a>
          </div>

          <!-- Social Links -->
          <div class="social-section">
            <p class="social-label">Join the conversation:</p>
            <div class="social-links">
              <a href="https://discord.gg/C9GhCv86My" target="_blank" rel="noopener noreferrer" class="social-link">
                <ImageVue :src="'socialmediaicons/Discord.svg'" size="24px" />
              </a>
              <div class="social-link social-disabled">
                <ImageVue :src="'socialmediaicons/TG.svg'" size="24px" />
                <span class="social-soon">Soon</span>
              </div>
              <a href="https://github.com/SharedStake" target="_blank" rel="noopener noreferrer" class="social-link">
                <ImageVue :src="'socialmediaicons/Git.svg'" size="24px" />
              </a>
              <a href="https://medium.com/@chimera_defi" target="_blank" rel="noopener noreferrer" class="social-link">
                <ImageVue :src="'socialmediaicons/Medium.svg'" size="24px" />
              </a>
              <a href="https://twitter.com/ChimeraDefi" target="_blank" rel="noopener noreferrer" class="social-link">
                <ImageVue :src="'socialmediaicons/Twitter.svg'" size="24px" />
              </a>
            </div>
          </div>

          <!-- Redemption Options -->
          <div class="redemption-section">
            <p class="redemption-label">vETH2 Redemptions:</p>
            <div class="redemption-links">
              <span class="btn btn-small btn-outline">
                Rollover (Returning soon!)
              </span>
              <button class="btn btn-small btn-disabled">
                <span>Withdraw</span>
                <span class="btn-subtitle">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator" v-show="scrolled >= 0">
      <ImageVue :src="'down.svg'" :size="'24px'" />
    </div>

    <!-- Stats Section -->
    <section class="stats-section" v-show="scrolled >= 350">
      <div class="section-container">
        <h2 class="section-title">Capital Efficient Staking</h2>
        <p class="section-subtitle">Financial optimization at its finest.</p>
        <p class="section-description">
          Better rewards, improved user experience, and more DeFi compatibility
          than any other Staking-as-a-Service model on the market.
        </p>
        
        <div v-if="isMobile()" class="mobile-notice">
          <p>More detailed dashboard available on desktop with an ETH RPC provider</p>
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="process-section" v-show="scrolled >= 1000">
      <div class="section-container">
        <div class="process-grid">
          <ProcessStep
            v-for="(step, index) in processSteps"
            :key="index"
            :image="step.image"
            :size="step.size"
            :title="step.title"
            :description="step.description"
            :delay="index * 0.2"
          />
        </div>

        <div class="info-card" v-show="scrolled >= 1500">
          <h3 class="info-title">Staking with SharedStake</h3>
          <p class="info-text">
            SharedStake users earn staking rewards every block, whether you hodl
            your stake or decide to invest your vEth2 in supported Ethereum
            dapps like Uniswap, SushiSwap, Curve, Maker, Compound, Aave, and
            many more...
          </p>
          <p class="info-text">
            vEth2 is designed for DeFi compatibility. It is a yield bearing
            token with a 1:1 price ratio with Ether. vEth2 staking is also
            incentivized further with SGT, the SharedStake Governance Token.
          </p>
          <a
            href="https://docs.sharedstake.finance/"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>

    <!-- vETH2 Features Section -->
    <section class="features-section" v-show="scrolled >= 2500">
      <div class="section-container">
        <div class="features-header">
          <ImageVue :src="'vEth2.png'" :size="'100px'" class="features-logo" />
          <h2 class="section-title">vETH2</h2>
        </div>
        <p class="section-subtitle text-gradient">
          Yield Bearing Wrapped Ether
        </p>

        <div class="features-grid">
          <FeatureCard
            v-for="(feature, index) in features"
            :key="index"
            :icon="feature.icon"
            :title="feature.title"
            :description="feature.description"
          />
        </div>

        <a
          href="https://sips.sharedstake.org/SIPS/sip-3.html"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary"
        >
          Learn More
        </a>
      </div>
    </section>

    <!-- Partners Section -->
    <div v-show="scrolled > 3800">
      <Partners />
    </div>

    <!-- Audit Section -->
    <section class="audit-section" v-show="scrolled >= 4400">
      <div class="section-container">
        <h2 class="section-title">Audit</h2>
        <a
          href="https://github.com/SharedStake/SharedStake-ui/blob/main/public/assets/static/AuditReport.pdf?raw=true"
          target="_blank"
          rel="noopener noreferrer"
          class="audit-link"
        >
          <ImageVue
            :src="'certik-foundation-logo-white.png'"
            :size="windowWidth > 768 ? '350px' : '250px'"
            class="audit-logo"
          />
        </a>
      </div>
    </section>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";
import Partners from "./Partners";

// Process Step Component
const ProcessStep = {
  props: ['image', 'size', 'title', 'description', 'delay'],
  components: { ImageVue },
  template: `
    <div class="process-step" :style="{ animationDelay: delay + 's' }">
      <ImageVue :src="image" :size="size" class="process-icon" />
      <h4 class="process-title">{{ title }}</h4>
      <p class="process-description">{{ description }}</p>
    </div>
  `
};

// Feature Card Component
const FeatureCard = {
  props: ['icon', 'title', 'description'],
  components: { ImageVue },
  template: `
    <div class="feature-card">
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
      <ImageVue :src="icon" size="60px" class="feature-icon" />
    </div>
  `
};

export default {
  components: {
    ImageVue,
    Partners,
    ProcessStep,
    FeatureCard
  },
  props: ["scrolled", "windowWidth"],
  data() {
    return {
      processSteps: [
        {
          image: 'eth.png',
          size: '80px',
          title: 'Stake ETH',
          description: 'Stake any amount of Eth'
        },
        {
          image: 'vEth2.png',
          size: '140px',
          title: 'Receive vETH2',
          description: 'Receive your vEth2 token'
        },
        {
          image: 'Reward.png',
          size: '110px',
          title: 'Earn Rewards',
          description: 'Simply holding vEth2 entitles you to staking rewards'
        },
        {
          image: 'Harvest.png',
          size: '80px',
          title: 'Maximize Yield',
          description: 'Harvest more yield with your vEth2 in supported DeFi protocols!'
        }
      ],
      features: [
        {
          icon: 'discount.svg',
          title: 'Financially Optimized',
          description: 'SharedStake optimizes Eth2 staking profits by creating an off-chain yield bearing stable token (vEth2 has a 1:1 price ratio with Ether). Ethereum2 profit distribution will start with the Eth2 launch so until then, track your Eth2 profits in the SharedStake Dashboard.'
        },
        {
          icon: 'diamond.svg',
          title: 'DeFi Compatible',
          description: 'By using vEth2 instead of other wrapped Ether tokens, DeFi users gain an extra 8-9% yearly growth with off-chain profit distribution. Since vEth2 doesn\'t contain any \'imaginary\' staking rewards, its stability is derived from its peg to Ether\'s value, practically eliminating concerns with Impermanent Loss.'
        },
        {
          icon: 'dowload.svg',
          title: 'Incentivized Staking',
          description: 'On top of Ethereum2 staking profits, holding vEth2 and leveraging it on other Decentralized Finance applications is further incentivized with SGT, used as a Proof of Participation token within the SharedStake Protocol.'
        },
        {
          icon: 'balance.svg',
          title: 'Built-in Exit Pool',
          description: '10% of all staked Ether remains in the staking contract, creating a liquidity bridge between all users, old and new. SharedStakers can un-stake their Ether at anytime by burning their vEth2 through the staking contract, subject to the pooled amount.'
        }
      ]
    };
  },
  methods: {
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) && !window.ethereum;
    }
  }
};
</script>

<style scoped>
/* Base Layout */
.landing {
  min-height: 100vh;
  background: rgb(15, 16, 19);
  position: relative;
  overflow-x: hidden;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 6rem 0 4rem;
  background-image: url(bg-1.png);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.hero-container {
  @apply max-w-6xl mx-auto px-6;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 4rem;
  align-items: center;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.6s ease-out;
}

.hero-logo {
  filter: drop-shadow(0 0 30px rgba(230, 0, 122, 0.3));
}

.hero-content {
  animation: slideUp 0.8s ease-out;
}

.hero-text {
  margin-bottom: 3rem;
}

.hero-title {
  @apply text-5xl md:text-6xl font-light leading-tight mb-6;
  color: #fff;
  position: relative;
}

.hero-badge {
  @apply absolute -top-8 left-0 px-3 py-1 text-xs font-semibold;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.hero-description {
  @apply text-xl leading-relaxed;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
}

.hero-actions {
  @apply flex flex-wrap gap-4 mb-8;
}

/* Buttons */
.btn {
  @apply px-6 py-3 rounded-full font-medium transition-all duration-300;
  @apply inline-flex flex-col items-center justify-center;
  border: 2px solid transparent;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.btn-primary {
  @apply bg-brand-primary text-white;
  border-color: #e6007a;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(230, 0, 122, 0.3);
}

.btn-outline {
  @apply text-white;
  border-color: rgba(255, 255, 255, 0.3);
  background: transparent;
}

.btn-outline:hover {
  border-color: #e6007a;
  color: #e6007a;
  background: rgba(230, 0, 122, 0.1);
}

.btn-disabled {
  @apply opacity-50 cursor-not-allowed;
  background: rgba(255, 255, 255, 0.1);
}

.btn-small {
  @apply px-4 py-2 text-sm;
}

.btn-subtitle {
  @apply text-xs mt-1 opacity-75;
}

/* Social Section */
.social-section {
  @apply mb-8;
}

.social-label,
.redemption-label {
  @apply text-lg mb-3;
  color: rgba(255, 255, 255, 0.9);
}

.social-links {
  @apply flex gap-6 items-center;
}

.social-link {
  @apply transition-all duration-300;
  filter: brightness(100%);
  position: relative;
}

.social-link:hover {
  filter: brightness(150%);
  transform: translateY(-2px);
}

.social-disabled {
  @apply opacity-50 cursor-not-allowed;
}

.social-soon {
  @apply absolute -bottom-4 left-1/2 transform -translate-x-1/2;
  @apply text-xs text-gray-400;
}

/* Redemption Section */
.redemption-section {
  margin-top: 2rem;
}

.redemption-links {
  @apply flex flex-wrap gap-3;
}

/* Scroll Indicator */
.scroll-indicator {
  @apply fixed bottom-8 left-1/2 transform -translate-x-1/2;
  @apply animate-bounce;
  filter: brightness(200%);
  z-index: 10;
}

/* Section Styles */
.stats-section,
.process-section,
.features-section,
.audit-section {
  @apply py-24;
  animation: fadeIn 0.6s ease-out;
}

.section-title {
  @apply text-4xl md:text-5xl font-light text-center mb-6;
  color: #fff;
}

.section-subtitle {
  @apply text-xl md:text-2xl text-center mb-4;
  color: rgba(255, 255, 255, 0.9);
}

.section-description {
  @apply text-lg text-center max-w-3xl mx-auto;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
}

/* Process Section */
.process-section {
  background-image: url(bg-2.png);
  background-size: cover;
  background-position: center;
  position: relative;
}

.process-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16;
}

.process-step {
  @apply text-center p-6;
  animation: slideUp 0.6s ease-out backwards;
}

.process-icon {
  @apply mb-4 mx-auto;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

.process-title {
  @apply text-xl font-medium mb-2;
  color: #fff;
}

.process-description {
  @apply text-sm;
  color: rgba(255, 255, 255, 0.75);
}

/* Info Card */
.info-card {
  @apply p-8 rounded-2xl max-w-4xl mx-auto;
  background: rgba(17, 26, 25, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.8s ease-out;
}

.info-title {
  @apply text-3xl font-light mb-6 text-center;
  color: #fff;
}

.info-text {
  @apply text-base mb-4 leading-relaxed;
  color: rgba(255, 255, 255, 0.85);
}

/* Features Section */
.features-section {
  background-image: url(bg-3.png);
  background-size: cover;
  background-position: center;
  position: relative;
}

.features-header {
  @apply flex items-center justify-center gap-6 mb-8;
}

.features-logo {
  filter: drop-shadow(0 0 20px rgba(230, 0, 122, 0.4));
  animation: glow 3s ease-in-out infinite alternate;
}

.features-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto;
}

.feature-card {
  @apply p-8 rounded-2xl relative overflow-hidden;
  background: rgba(17, 26, 25, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(230, 0, 122, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.feature-title {
  @apply text-2xl font-medium mb-4;
  color: #fff;
}

.feature-description {
  @apply text-sm leading-relaxed mb-6;
  color: rgba(255, 255, 255, 0.8);
}

.feature-icon {
  @apply absolute bottom-4 right-4 opacity-20;
  filter: invert(1);
}

/* Audit Section */
.audit-section {
  @apply text-center;
}

.audit-link {
  @apply inline-block transition-all duration-300;
}

.audit-logo {
  @apply mx-auto;
  transition: all 0.3s ease;
}

.audit-logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
}

/* Mobile Notice */
.mobile-notice {
  @apply mt-8 p-4 rounded-lg text-center;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
}

/* Utility Classes */
.text-gradient {
  background: linear-gradient(135deg, #e6007a 0%, #e2539e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(2rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes glow {
  0% {
    filter: brightness(100%) drop-shadow(0 0 10px rgba(230, 0, 122, 0.2));
  }
  100% {
    filter: brightness(120%) drop-shadow(0 0 25px rgba(230, 0, 122, 0.5));
  }
}

/* Responsive Design */
@media (max-width: 900px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-badge {
    @apply left-1/2 transform -translate-x-1/2;
  }

  .hero-title {
    @apply text-4xl md:text-5xl;
  }

  .hero-description {
    @apply mx-auto;
  }

  .hero-actions,
  .social-links,
  .redemption-links {
    @apply justify-center;
  }

  .social-label,
  .redemption-label {
    @apply text-center;
  }

  .process-grid {
    @apply grid-cols-1;
  }

  .features-grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 640px) {
  .hero-title {
    @apply text-3xl;
  }

  .hero-description {
    @apply text-base;
  }

  .section-title {
    @apply text-3xl;
  }

  .btn {
    @apply px-4 py-2 text-sm;
  }
}
</style>