<template>
  <div>
    <div class="header"></div>
    <div class="partner-container">
      <PartnerItem
        :class="partners.length == 4 ? 'partner-item-quad' : 'partner-item'"
        v-for="partner in partners"
        :key="partner.key"
        :name="partner.name"
        :text="partner.text"
        :imageUrl="partner.imageUrl"
        :link="partner.link"
      />
    </div>
  </div>
</template>

<script>
import PartnerItem from "./PartnerItem";

export default {
  components: { PartnerItem },
  data() {
    return {
      partners: [
        {
          name: "UniSwap",
          imageUrl: "uniswap.png",
          text: "SGT and vETH2 liquidity pools are on UniSwap.",
          link:
            "https://v2.info.uniswap.org/pair/0x3d07f6e1627DA96B8836190De64c1aED70e3FC55/",
          key: 1,
        },
        {
          name: "Defi Pulse",
          imageUrl: "defipulse.png",
          text:
            "The latest analytics, rankings, and resources for DeFi applications & protocols.",
          link: "https://defipulse.com/",
          key: 2,
        },
        {
          name: "Gnosis",
          imageUrl: "gnosis.svg",
          text:
            "The most trusted platform to manage digital assets on Ethereum.",
          link: "https://gnosis.io/",
          key: 3,
        },
        {
          name: "Bunni.pro",
          imageUrl: "uniswap.png",
          text: "Earn yield on your univ3 position using bunni",
          link: "https://bunni.pro/",
          key: 4,
        },
        {
          name: "Immunefi",
          imageUrl: "immunefi.png",
          text: "DeFi's leading bug bounty platform.",
          link: "https://immunefi.com/",
          key: 5,
        },
      ],
    };
  },
};
</script>

<style scoped>
/* Partners Section Layout */
.header {
  @apply text-4xl md:text-5xl font-light text-center mb-12;
  color: #fff;
  animation: fadeIn 0.5s ease-out;
}

.partner-container {
  @apply flex justify-center flex-wrap gap-8 max-w-6xl mx-auto px-6;
  animation: slideUp 0.6s ease-out 0.2s backwards;
}

.partner-item,
.partner-item-quad {
  @apply transition-all duration-300;
  flex-basis: calc(33.333% - 2rem);
}

.partner-item-quad {
  flex-basis: calc(25% - 2rem);
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

/* Responsive Design */
@media (max-width: 1024px) {
  .partner-item,
  .partner-item-quad {
    flex-basis: calc(50% - 1rem);
  }
}

@media (max-width: 640px) {
  .partner-item,
  .partner-item-quad {
    flex-basis: 100%;
  }
}
</style>
