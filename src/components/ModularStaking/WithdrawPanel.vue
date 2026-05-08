<template>
  <div class="flex flex-col gap-4">
    <!-- Tab: Request vs Claims -->
    <div class="flex rounded-xl border border-border overflow-hidden">
      <button
        v-for="(tab, i) in ['Request', 'My Requests']"
        :key="tab"
        class="flex-1 py-2.5 text-sm font-semibold transition-colors"
        :class="activeTab === i ? 'bg-pink-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'"
        @click="activeTab = i"
      >
        {{ tab }}
        <span
          v-if="i === 1 && store.finalizedRequests.length > 0"
          class="ml-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs text-white"
        >
          {{ store.finalizedRequests.length }}
        </span>
      </button>
    </div>

    <!-- Withdrawal mode banner -->
    <div
      v-if="store.connected"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
      :class="store.isBunkerMode
        ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
        : 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'"
    >
      <span>{{ store.isBunkerMode ? '⚠' : '✓' }}</span>
      <span>{{ store.withdrawalModeLabel }} mode</span>
      <span
        v-if="store.isBunkerMode"
        class="text-xs text-muted-foreground ml-auto"
      >
        Finalization slower — guardian operating carefully
      </span>
    </div>

    <!-- Request tab -->
    <div
      v-if="activeTab === 0"
      class="flex flex-col gap-4"
    >
      <div class="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        Burn stETH and join the withdrawal queue. Your ETH will be claimable after the guardian finalizes the batch.
      </div>

      <!-- Input -->
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="mb-1 flex items-center justify-between text-sm text-muted-foreground">
          <span>stETH to withdraw</span>
          <button
            class="hover:text-foreground transition-colors"
            @click="setMax"
          >
            Balance: {{ store.formattedStTokenBalance }} stETH
          </button>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="withdrawAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.0"
            class="w-full bg-transparent text-2xl font-medium outline-none placeholder-muted-foreground"
          >
          <span class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium">stETH</span>
        </div>
      </div>

      <div
        v-if="store.error"
        class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
      >
        {{ store.error }}
      </div>
      <div
        v-if="claimTxHash"
        class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
      >
        Claimed! Tx: {{ claimTxHash.slice(0, 10) }}...
      </div>
      <div
        v-if="requestTxHash"
        class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
      >
        Request submitted! Tx: {{ requestTxHash.slice(0, 10) }}...
      </div>

      <button
        class="w-full rounded-xl py-3.5 text-base font-semibold transition-all"
        :class="canRequest
          ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer'
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
        :disabled="!canRequest || store.loading"
        @click="handleRequest"
      >
        <span v-if="store.loading">Requesting...</span>
        <span v-else-if="!walletStore.isAuth">Connect Wallet</span>
        <span v-else-if="!withdrawAmount || parseFloat(withdrawAmount) < 0.01">Min 0.01 stETH</span>
        <span v-else>Request Withdrawal</span>
      </button>
    </div>

    <!-- My Requests tab -->
    <div
      v-if="activeTab === 1"
      class="flex flex-col gap-3"
    >
      <div
        v-if="store.userRequests.length === 0"
        class="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground"
      >
        No withdrawal requests yet.
      </div>

      <div
        v-for="req in store.userRequests"
        :key="req.id"
        class="rounded-xl border border-border bg-card p-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm font-medium">
              Request #{{ req.id }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              <span
                v-if="req.claimed"
                class="text-muted-foreground"
              >Claimed</span>
              <span
                v-else-if="req.finalized"
                class="text-green-500"
              >Ready to claim</span>
              <span
                v-else
                class="text-yellow-500"
              >Pending finalization</span>
            </div>
            <div
              v-if="!req.finalized && store.isBunkerMode && req.requestedAt"
              class="text-xs text-muted-foreground mt-1"
            >
              Age: {{ formatAge(req.requestedAt) }}
              <span
                v-if="!isOldEnough(req.requestedAt)"
                class="text-yellow-500"
              >
                · Min {{ store.bunkerMinRequestAge / 3600 }}h required
              </span>
            </div>
          </div>
          <div class="text-right text-sm">
            <div
              v-if="req.ethAmount !== '0'"
              class="font-medium"
            >
              {{ formatEth(req.ethAmount) }} ETH
            </div>
            <div
              v-else
              class="text-muted-foreground"
            >
              Amount TBD
            </div>
          </div>
        </div>

        <button
          v-if="req.finalized && !req.claimed"
          class="mt-3 w-full rounded-lg bg-pink-600 hover:bg-pink-500 py-2 text-sm font-semibold text-white transition-colors"
          :disabled="store.loading"
          @click="handleClaim(req.id)"
        >
          <span v-if="store.loading && claimingId === req.id">Claiming...</span>
          <span v-else>Claim ETH</span>
        </button>
      </div>

      <!-- Queue info -->
      <div class="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Next ID: {{ store.nextRequestId }} · Last finalized: {{ store.lastFinalizedRequestId }}
      </div>
    </div>
  </div>
</template>

<script>
import { useModularStakingStore } from '@/stores/modularStaking'
import { useWalletStore } from '@/stores/wallet'
import { ethers } from 'ethers'

export default {
  name: 'WithdrawPanel',

  setup() {
    return {
      store: useModularStakingStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      activeTab: 0,
      withdrawAmount: '',
      requestTxHash: null,
      claimingId: null,
      claimTxHash: null,
      claimSuccessId: null,
    }
  },

  computed: {
    canRequest() {
      return (
        this.walletStore.isAuth &&
        this.store.contractsDeployed &&
        this.withdrawAmount &&
        parseFloat(this.withdrawAmount) >= 0.01 &&
        !this.store.loading
      )
    },
  },

  methods: {
    formatEth(wei) {
      try {
        return parseFloat(ethers.formatEther(wei)).toFixed(6)
      } catch { return '0' }
    },

    formatAge(requestedAtSecs) {
      const ageSeconds = Math.floor(Date.now() / 1000) - Number(requestedAtSecs)
      if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m`
      return `${(ageSeconds / 3600).toFixed(1)}h`
    },

    isOldEnough(requestedAtSecs) {
      const ageSeconds = Math.floor(Date.now() / 1000) - Number(requestedAtSecs)
      return ageSeconds >= this.store.bunkerMinRequestAge
    },

    setMax() {
      try { this.withdrawAmount = ethers.formatEther(this.store.stTokenBalance) } catch { /* ignore */ }
    },

    async handleRequest() {
      if (!this.canRequest) return
      this.requestTxHash = null
      try {
        const tx = await this.store.requestWithdrawal(this.withdrawAmount)
        this.requestTxHash = tx.hash
        this.withdrawAmount = ''
        this.activeTab = 1
      } catch (e) {
        console.error('Withdrawal request error:', e)
      }
    },

    async handleClaim(requestId) {
      this.claimTxHash = null
      this.claimingId = requestId
      try {
        const tx = await this.store.claimWithdrawal(requestId)
        this.claimTxHash = tx.hash
      } catch (e) {
        console.error('Claim error:', e)
      } finally {
        this.claimingId = null
      }
    },
  },
}
</script>
