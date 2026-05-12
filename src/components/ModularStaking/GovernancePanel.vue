<template>
  <div class="flex flex-col gap-4">
    <div class="text-lg font-semibold">
      Governance
    </div>

    <!-- Protocol params -->
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Voting Delay
        </div>
        <div class="font-semibold">
          {{ formattedVotingDelay }}
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Voting Period
        </div>
        <div class="font-semibold">
          {{ formattedVotingPeriod }}
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Proposal Threshold
        </div>
        <div class="font-semibold">
          {{ formattedProposalThreshold }} veSGT
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Quorum
        </div>
        <div class="font-semibold">
          4%
        </div>
      </div>
    </div>

    <!-- Active proposals placeholder -->
    <div class="rounded-lg border border-border bg-card p-4">
      <div class="mb-2 text-sm font-medium">
        Active Proposals
      </div>
      <div class="text-sm text-muted-foreground">
        Proposals will appear here once governance is live.
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Connect a wallet with enough veSGT to create proposals.
      </div>
    </div>

    <!-- Create proposal placeholder -->
    <div class="rounded-lg border border-border bg-card p-4">
      <div class="mb-2 text-sm font-medium">
        Create Proposal
      </div>
      <div class="text-sm text-muted-foreground">
        Requires {{ formattedProposalThreshold }} veSGT + 48h timelock.
      </div>
      <button
        class="mt-3 w-full rounded-lg bg-muted py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
        disabled
      >
        Coming Soon
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error }}
    </div>
  </div>
</template>

<script>
import { useGovernanceStore } from '@/stores/governance'

export default {
  name: 'GovernancePanel',

  setup() {
    return {
      store: useGovernanceStore(),
    }
  },

  computed: {
    formattedVotingDelay() {
      try {
        const blocks = parseInt(this.store.votingDelay)
        // ~12s per block on mainnet
        const mins = Math.round((blocks * 12) / 60)
        return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`
      } catch { return '—' }
    },
    formattedVotingPeriod() {
      try {
        const blocks = parseInt(this.store.votingPeriod)
        const days = Math.round((blocks * 12) / 86400)
        return `${days} day${days === 1 ? '' : 's'}`
      } catch { return '—' }
    },
    formattedProposalThreshold() {
      try {
        return parseFloat(
          this.store.proposalThreshold / 1e18
        ).toLocaleString()
      } catch { return '1,000' }
    },
  },
}
</script>
