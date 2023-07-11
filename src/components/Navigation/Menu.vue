<template>
  <section class="flex items-center justify-around gap-4 lg:gap-6 xl:gap-8">
    <div class="relative py-2 cursor-pointer group">
      <DropdownItemRouter to="/stake" class="px-6">
        Stake
        <DropdownArrow />
      </DropdownItemRouter>
      <DropdownGroup>
        <DropdownItemRouter to="/stake">
          Stake
        </DropdownItemRouter>
        <DropdownItemRouter to="/rollover">
          Rollover
        </DropdownItemRouter>
        <DropdownItemRouter to="/withdraw">
          Withdraw
        </DropdownItemRouter>
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
      <DropdownItemAnchor href="https://chimera-1.gitbook.io/sharedstake-v2/" class="px-6">
        Learn
        <DropdownArrow />
      </DropdownItemAnchor>
      <DropdownGroup>
        <DropdownItemAnchor href="https://chimera-1.gitbook.io/sharedstake-v2/">
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
