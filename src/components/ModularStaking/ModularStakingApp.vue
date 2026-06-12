<template>
  <div class="flex flex-col items-center min-h-screen py-12 px-4">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-foreground">
        SharedStake V2
      </h1>
      <p class="mt-2 text-muted-foreground text-sm max-w-sm">
        Modular staking liquid staking: deposit ETH, receive rebasing stETH, wrap to non-rebasing wstETH, and withdraw with a queue.
      </p>
    </div>

    <!-- Main card -->
    <div class="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg">
      <!-- Tab bar -->
      <div class="flex border-b border-border">
        <button
          v-for="(tab, i) in tabs"
          :key="tab.label"
          class="flex-1 py-4 text-sm font-semibold transition-colors"
          :class="activeTab === i
            ? 'text-foreground border-b-2 border-pink-600'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = i"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Panel -->
      <div class="p-5">
        <component :is="tabs[activeTab].component" />
      </div>
    </div>

    <!-- Protocol info footer -->
    <div class="mt-6 w-full max-w-md rounded-xl border border-border bg-card p-4">
      <div class="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div class="text-muted-foreground text-xs mb-1">
            Total Staked
          </div>
          <div class="font-semibold">
            {{ store.formattedTotalPooled }} ETH
          </div>
        </div>
        <div>
          <div class="text-muted-foreground text-xs mb-1">
            Your stETH
          </div>
          <div class="font-semibold">
            {{ store.formattedStTokenBalance }}
          </div>
        </div>
        <div>
          <div class="text-muted-foreground text-xs mb-1">
            Your wstETH
          </div>
          <div class="font-semibold">
            {{ store.formattedWstTokenBalance }}
          </div>
        </div>
      </div>

      <!-- Wallet not connected notice -->
      <div
        v-if="!walletStore.isAuth"
        class="mt-3 text-center text-xs text-muted-foreground"
      >
        Connect your wallet to see your balances and interact with the protocol.
      </div>
    </div>

    <!-- Security notice -->
    <div class="mt-4 w-full max-w-md rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-muted-foreground">
      <strong class="text-foreground">Security note:</strong> These contracts implement Modular staking mechanics (share accounting, rebasing stETH, withdrawal queue). They are pre-audit — use only on testnet until the external audit is complete.
    </div>

    <!-- Validator CTA -->
    <div class="mt-4 w-full max-w-md rounded-lg border border-border bg-card p-4">
      <div class="text-sm font-medium text-foreground mb-3">
        Want to run validators?
      </div>
      <p class="text-xs text-muted-foreground mb-4">
        Solo operators bond SGT to earn validator slots.
      </p>
      <div class="flex gap-3">
        <router-link
          to="/solo-stake"
          class="flex-1 text-center rounded-lg bg-pink-600 py-2 text-sm font-medium text-white hover:bg-pink-500"
        >
          Register as Solo Operator
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { useModularStakingStore } from '@/stores/modularStaking'
import { useWalletStore } from '@/stores/wallet'
import StakePanel from './StakePanel.vue'
import WrapPanel from './WrapPanel.vue'
import WithdrawPanel from './WithdrawPanel.vue'
import GovernancePanel from './GovernancePanel.vue'
import LockPanel from './LockPanel.vue'

export default {
  name: 'ModularStakingApp',

  components: { StakePanel, WrapPanel, WithdrawPanel, GovernancePanel, LockPanel },

  setup() {
    return {
      store: useModularStakingStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      activeTab: 0,
      tabs: [
        { label: 'Stake', component: 'StakePanel' },
        { label: 'Wrap', component: 'WrapPanel' },
        { label: 'Withdraw', component: 'WithdrawPanel' },
        { label: 'Governance', component: 'GovernancePanel' },
        { label: 'Lock', component: 'LockPanel' },
      ],
    }
  },

  watch: {
    'walletStore.address': {
      immediate: true,
      async handler(address) {
        const chainId = this.walletStore.getNetworkId
        await this.store.init(chainId, address)
      },
    },
    'walletStore.network': {
      async handler(networkId) {
        await this.store.init(networkId, this.walletStore.address)
      },
    },
  },
}
</script>
