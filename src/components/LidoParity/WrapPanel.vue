<template>
  <div class="flex flex-col gap-4">
    <!-- Mode toggle -->
    <div class="flex rounded-xl border border-border overflow-hidden">
      <button
        v-for="(tab, i) in ['Wrap', 'Unwrap']"
        :key="tab"
        class="flex-1 py-2.5 text-sm font-semibold transition-colors"
        :class="mode === i ? 'bg-pink-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'"
        @click="mode = i; inputAmount = ''"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Exchange rate -->
    <div class="rounded-lg bg-muted p-3 text-sm flex justify-between">
      <span class="text-muted-foreground">1 wstETH =</span>
      <span class="font-medium">{{ wstRateDisplay }} stETH</span>
    </div>

    <!-- Input -->
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="mb-1 flex items-center justify-between text-sm text-muted-foreground">
        <span>{{ mode === 0 ? 'You give (stETH)' : 'You give (wstETH)' }}</span>
        <button
          class="hover:text-foreground transition-colors"
          @click="setMax"
        >
          Balance: {{ mode === 0 ? store.formattedStTokenBalance : store.formattedWstTokenBalance }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="inputAmount"
          type="number"
          min="0"
          step="0.001"
          placeholder="0.0"
          class="w-full bg-transparent text-2xl font-medium outline-none placeholder-muted-foreground"
        >
        <span class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {{ mode === 0 ? 'stETH' : 'wstETH' }}
        </span>
      </div>
    </div>

    <div class="flex justify-center text-muted-foreground">
      ↓
    </div>

    <!-- Output -->
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="mb-1 text-sm text-muted-foreground">
        You receive (estimated)
      </div>
      <div class="flex items-center gap-2">
        <span class="w-full text-2xl font-medium">{{ outputDisplay }}</span>
        <span class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {{ mode === 0 ? 'wstETH' : 'stETH' }}
        </span>
      </div>
    </div>

    <div
      v-if="store.error"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error }}
    </div>
    <div
      v-if="txHash"
      class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
    >
      Done! Tx: {{ txHash.slice(0, 10) }}...
    </div>

    <button
      class="w-full rounded-xl py-3.5 text-base font-semibold transition-all"
      :class="canSubmit
        ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer'
        : 'bg-muted text-muted-foreground cursor-not-allowed'"
      :disabled="!canSubmit || store.loading"
      @click="handleAction"
    >
      <span v-if="store.loading">{{ mode === 0 ? 'Wrapping...' : 'Unwrapping...' }}</span>
      <span v-else-if="!walletStore.isAuth">Connect Wallet</span>
      <span v-else-if="!inputAmount || parseFloat(inputAmount) <= 0">Enter Amount</span>
      <span v-else>{{ mode === 0 ? 'Wrap stETH' : 'Unwrap wstETH' }}</span>
    </button>
  </div>
</template>

<script>
import { useLidoParityStore } from '@/stores/lidoParity'
import { useWalletStore } from '@/stores/wallet'
import { ethers } from 'ethers'

export default {
  name: 'WrapPanel',

  setup() {
    return {
      store: useLidoParityStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      mode: 0, // 0 = wrap, 1 = unwrap
      inputAmount: '',
      txHash: null,
    }
  },

  computed: {
    wstRateDisplay() {
      return parseFloat(this.store.wstExchangeRate).toFixed(6)
    },
    outputDisplay() {
      if (!this.inputAmount || parseFloat(this.inputAmount) <= 0) return '0.0'
      try {
        const amount = parseFloat(this.inputAmount)
        const rate = parseFloat(this.store.wstExchangeRate) || 1
        if (this.mode === 0) {
          // wrap: stToken → wstToken; wstAmount ≈ stAmount / rate
          return (amount / rate).toFixed(6)
        } else {
          // unwrap: wstToken → stToken; stAmount ≈ wstAmount × rate
          return (amount * rate).toFixed(6)
        }
      } catch { return '0.0' }
    },
    canSubmit() {
      return (
        this.walletStore.isAuth &&
        this.store.contractsDeployed &&
        this.inputAmount &&
        parseFloat(this.inputAmount) > 0 &&
        !this.store.loading
      )
    },
  },

  methods: {
    setMax() {
      if (this.mode === 0) {
        try { this.inputAmount = ethers.formatEther(this.store.stTokenBalance) } catch (_e) { /* ignore */ }
      } else {
        try { this.inputAmount = ethers.formatEther(this.store.wstTokenBalance) } catch (_e) { /* ignore */ }
      }
    },

    async handleAction() {
      if (!this.canSubmit) return
      this.txHash = null
      try {
        let tx
        if (this.mode === 0) {
          tx = await this.store.wrap(this.inputAmount)
        } else {
          tx = await this.store.unwrap(this.inputAmount)
        }
        this.txHash = tx.hash
        this.inputAmount = ''
      } catch (e) {
        console.error('Wrap/unwrap error:', e)
      }
    },
  },
}
</script>
