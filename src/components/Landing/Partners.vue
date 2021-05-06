<template>
  <div>
    <div class="header">Partners</div>
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
          text: "SGT liquidity pools are on UniSwap.",
          link:
            "https://v2.info.uniswap.org/pair/0x3d07f6e1627DA96B8836190De64c1aED70e3FC55/",
          key: 1,
        },
        {
          name: "Ruler",
          imageUrl: "ruler.png",
          text: "Use Ruler to get loans using vETH2 as collateral!",
          link: "https://rulerprotocol.com/",
          key: 2,
        },
        {
          name: "Saddle",
          imageUrl: "saddle.png",
          text: "vETH2 liquidity pool provider.",
          link: "https://saddle.finance",
          key: 3,
        },
        {
          name: "Defi Pulse",
          imageUrl: "defipulse.png",
          text:
            "The latest analytics, rankings, and resources for DeFi applications & protocols.",
          link: "https://defipulse.com/",
          key: 4,
        },
      ],
    };
  },
};
</script>

<style scoped>
.header {
  color: rgb(255, 255, 255);
  align-items: center;
  font-size: 50px;
  line-height: 1.16em;
  margin: 30px;
  font-weight: 300;
  -webkit-animation: EnterFromBelow 0.4s ease-out backwards;
  animation: EnterFromBelow 0.4s ease-out backwards;
  text-align: center;
  margin-bottom: 10vh;
}

.partner-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;

  margin: 0px auto 30px;
  padding: 0px;
  -webkit-animation: EnterFromBelow 0.4s ease-out backwards 0.2s;
  animation: EnterFromBelow 0.4s ease-out backwards 0.2s;
}

.partner-item {
  margin-bottom: 3vh;
  width: 30%;
}

.partner-item-quad {
  margin-bottom: 3vh;
  width: 35%;
}

@media only screen and (max-width: 1024px) {
  .partner-item {
    width: 45%;
    margin-bottom: 7vh;
  }
}

@media only screen and (max-width: 768px) {
  .partner-item {
    width: 80%;
    margin-bottom: 3vh;
  }

  .partner-item-quad {
    width: 80%;
    margin-bottom: 3vh;
  }
}

@keyframes EnterFromBelow {
  from {
    transform: translate3d(0, 2rem, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}
</style>