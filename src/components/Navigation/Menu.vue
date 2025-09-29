<template>
  <section class="flex items-center justify-around gap-4 lg:gap-6 xl:gap-8">
    <div class="relative py-2 cursor-pointer group">
      <div class="flex items-center gap-1 px-6 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap disabled-dropdown-item">
        <span>Stake</span>
        <DropdownArrow />
      </div>
      <DropdownGroup>
        <div class="flex items-center gap-1 px-4 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap disabled-dropdown-item has-coming-soon">
          <span>Stake</span>
          <div class="coming-soon">Coming Soon</div>
        </div>
        <DropdownItemRouter to="/rollover">
          Rollover
        </DropdownItemRouter>
        <div class="flex items-center gap-1 px-4 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap disabled-dropdown-item has-coming-soon">
          <span>Withdraw</span>
          <div class="coming-soon">Coming Soon</div>
        </div>
        <DropdownItemRouter to="/wrap">
          Wrap
        </DropdownItemRouter>
        <DropdownItemRouter to="/unwrap">
          Unwrap
        </DropdownItemRouter>
        <DropdownItemRouter to="/earn">
          Earn
        </DropdownItemRouter>
      </DropdownGroup>
    </div>

    <div class="relative py-2 cursor-pointer group">
      <DropdownItemAnchor href="https://docs.sharedstake.finance/" class="px-6">
        Learn
        <DropdownArrow />
      </DropdownItemAnchor>
      <DropdownGroup>
        <DropdownItemAnchor href="https://docs.sharedstake.finance/">
          Docs
        </DropdownItemAnchor>
        <DropdownItemAnchor href="https://snapshot.org/#/sharedstake.eth">
          DAO
        </DropdownItemAnchor>
        <DropdownItemAnchor href="https://duneanalytics.com/sushi2000/shared-stake-metrics">
          Dune Dashboard
        </DropdownItemAnchor>
        <DropdownItemAnchor href="https://sharedtools.org">
          SharedTools
        </DropdownItemAnchor>
        <DropdownItemAnchor href="https://discord.gg/C9GhCv86My">
          Discord
        </DropdownItemAnchor>
        <div class="flex items-center gap-1 px-4 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap disabled-dropdown-item has-coming-soon">
          <span>Telegram</span>
          <div class="coming-soon">Coming Soon</div>
        </div>
        <DropdownItemAnchor href="https://twitter.com/ChimeraDefi">
          Twitter
        </DropdownItemAnchor>
      </DropdownGroup>
    </div>

    <div class="relative py-2 cursor-pointer group">
      <DropdownItemAnchor class="px-6"
        href="https://app.uniswap.org/#/swap?outputCurrency=0x24C19F7101c1731b85F1127EaA0407732E36EcDD">
        Buy $SGT <span class="font-normal">{{ formattedSgtPrice }}</span>
        <DropdownArrow />
      </DropdownItemAnchor>
      <DropdownGroup>
        <DropdownItemAnchor
          href="https://app.uniswap.org/#/swap?outputCurrency=0x24C19F7101c1731b85F1127EaA0407732E36EcDD">
          Buy on Uniswap
        </DropdownItemAnchor>
        <DropdownItemAnchor href="https://swap.cow.fi/#/1/swap/ETH/0x24C19F7101c1731b85F1127EaA0407732E36EcDD">
          Buy on Cowswap
        </DropdownItemAnchor>
      </DropdownGroup>
    </div>
  </section>
</template>

<script>
import DropdownItemRouter from "./DropdownItemRouter.vue";
import DropdownItemAnchor from "./DropdownItemAnchor.vue";
import DropdownGroup from "./DropdownGroup.vue";
import DropdownArrow from "./DropdownArrow.vue";
export default {
  name: "DropdownMenu",
  props: {
    sgtPrice: Number,
  },
  components: {
    DropdownItemRouter,
    DropdownItemAnchor,
    DropdownGroup,
    DropdownArrow,
  },
  computed: {
    formattedSgtPrice() {
      return this.sgtPrice ? `($${this.sgtPrice.toFixed(4)})` : "";
    },
  },
};
</script>

<style scoped>
.disabled-dropdown-item {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.disabled-dropdown-item.has-coming-soon {
  flex-direction: column;
  align-items: flex-start;
}

.coming-soon {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  font-weight: normal;
}
</style>
