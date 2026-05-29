<template>
  <div class="flex flex-col gap-4">
    <div class="text-lg font-semibold">
      veSGT Governance Lock
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          SGT Balance
        </div>
        <div class="font-semibold">
          {{ store.formattedSGT }} SGT
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          veSGT Balance
        </div>
        <div class="font-semibold">
          {{ store.formattedVeSGT }} veSGT
        </div>
      </div>
    </div>

    <!-- Lock info -->
    <div
      v-if="store.lockedAmount !== '0'"
      class="rounded-lg border border-border bg-card p-4"
    >
      <div class="mb-2 text-sm font-medium">
        Current Lock
      </div>
      <div class="text-sm text-muted-foreground">
        Locked: {{ store.formattedLocked }} SGT
      </div>
      <div class="text-sm text-muted-foreground">
        Expires: {{ lockExpiryDate }}
      </div>
      <div class="text-sm text-muted-foreground">
        Status: {{ store.lockExpired ? 'Expired ✅' : 'Active 🔒' }}
      </div>

      <button
        v-if="store.lockExpired"
        class="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-500"
        :disabled="store.loading"
        @click="handleWithdraw"
      >
        {{ store.loading ? 'Withdrawing...' : 'Withdraw SGT' }}
      </button>
      <button
        v-else
        class="mt-3 w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-500"
        :disabled="store.loading"
        @click="handleEmergencyWithdraw"
      >
        {{ store.loading ? 'Withdrawing...' : 'Emergency Withdraw (penalty)' }}
      </button>
    </div>

    <!-- Create lock -->
    <div
      v-else
      class="rounded-lg border border-border bg-card p-4"
    >
      <div class="mb-2 text-sm font-medium">
        Create New Lock
      </div>

      <div class="mb-3">
        <label class="mb-1 block text-xs text-muted-foreground">Amount (SGT)</label>
        <input
          v-model="lockAmount"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
        >
      </div>

      <div class="mb-3">
        <label class="mb-1 block text-xs text-muted-foreground">Lock Duration (days)</label>
        <input
          v-model="lockDays"
          type="number"
          min="7"
          max="1095"
          step="1"
          placeholder="365"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
        >
        <div class="mt-1 text-xs text-muted-foreground">
          Min: 7 days | Max: 3 years
        </div>
      </div>

      <button
        class="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-medium text-white hover:bg-pink-500"
        :disabled="!canLock || store.loading"
        @click="handleLock"
      >
        <span v-if="store.loading">Locking...</span>
        <span v-else>Lock SGT → veSGT</span>
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="store.error || txError"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error || txError }}
    </div>

    <!-- Info -->
    <div class="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
      <p>veSGT is vote-escrowed SGT used for governance voting.</p>
      <p class="mt-1">
        Longer locks = more voting power. Minimum lock: 7 days.
      </p>
    </div>
  </div>
</template>

<script>
import { useGovernanceStore } from '@/stores/governance'
import { useWalletStore } from '@/stores/wallet'

export default {
  name: 'LockPanel',

  setup() {
    return {
      store: useGovernanceStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      lockAmount: '',
      lockDays: '365',
      txError: null,
    }
  },

  computed: {
    canLock() {
      return (
        this.walletStore.isAuth &&
        this.store.contractsDeployed &&
        this.lockAmount &&
        parseFloat(this.lockAmount) > 0 &&
        this.lockDays &&
        parseInt(this.lockDays) >= 7
      )
    },
    lockExpiryDate() {
      try {
        const end = parseInt(this.store.lockedEnd)
        if (end === 0) return '—'
        return new Date(end * 1000).toLocaleDateString()
      } catch { return '—' }
    },
  },

  methods: {
    async handleLock() {
      if (!this.canLock) return
      this.txError = null
      try {
        await this.store.lockSGT(this.lockAmount, parseInt(this.lockDays))
        this.lockAmount = ''
      } catch (e) {
        console.error('Lock error:', e)
        this.txError = e?.reason || e?.message || 'Lock failed'
      }
    },
    async handleWithdraw() {
      this.txError = null
      try {
        await this.store.withdrawVeSGT()
      } catch (e) {
        console.error('Withdraw error:', e)
        this.txError = e?.reason || e?.message || 'Withdraw failed'
      }
    },
    async handleEmergencyWithdraw() {
      this.txError = null
      try {
        await this.store.emergencyWithdrawVeSGT()
      } catch (e) {
        console.error('Emergency withdraw error:', e)
        this.txError = e?.reason || e?.message || 'Emergency withdraw failed'
      }
    },
  },
}
</script>
