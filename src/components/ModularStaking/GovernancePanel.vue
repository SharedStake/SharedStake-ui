<template>
  <div class="flex flex-col gap-4">
    <div class="text-lg font-semibold">
      Governance
    </div>

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
          {{ formattedQuorum }}
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-card p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="text-sm font-medium">
          Active Proposals
        </div>
        <button
          class="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
          :disabled="store.loading || refreshing || !store.contractsDeployed"
          @click="refreshProposals"
        >
          {{ refreshing ? 'Loading' : 'Refresh' }}
        </button>
      </div>

      <div
        v-if="store.proposals.length === 0"
        class="text-sm text-muted-foreground"
      >
        No governance proposals found in the recent event window.
      </div>

      <div
        v-for="proposal in store.proposals"
        :key="proposal.proposalId"
        class="mb-3 rounded-md border border-border bg-muted p-3 text-sm last:mb-0"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate font-medium text-foreground">
              {{ proposalExcerpt(proposal.description) }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ truncateId(proposal.proposalId) }}
            </div>
          </div>
          <span
            class="shrink-0 rounded px-2 py-1 text-xs font-medium"
            :class="statusClass(proposal.stateLabel)"
          >
            {{ proposal.stateLabel }}
          </span>
        </div>

        <div
          v-if="proposal.state === 1"
          class="mt-3 grid grid-cols-3 gap-2"
        >
          <button
            v-for="option in voteOptions"
            :key="option.value"
            class="rounded-md bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-card disabled:cursor-not-allowed disabled:text-muted-foreground"
            :disabled="store.loading || votingProposalId === proposal.proposalId"
            @click="vote(proposal.proposalId, option.value)"
          >
            {{ votingProposalId === proposal.proposalId ? 'Voting' : option.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-card p-4">
      <div class="mb-3 text-sm font-medium">
        Create Proposal
      </div>

      <div class="flex flex-col gap-3 text-sm">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Description</span>
          <textarea
            v-model="proposalDescription"
            rows="3"
            class="rounded-md border border-border bg-muted px-3 py-2 text-foreground outline-none focus:border-pink-500"
          />
        </label>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Target</span>
            <input
              v-model="proposalTarget"
              class="rounded-md border border-border bg-muted px-3 py-2 text-foreground outline-none focus:border-pink-500"
              placeholder="0x..."
            >
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Value Wei</span>
            <input
              v-model="proposalValue"
              class="rounded-md border border-border bg-muted px-3 py-2 text-foreground outline-none focus:border-pink-500"
              inputmode="numeric"
            >
          </label>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Calldata</span>
          <textarea
            v-model="proposalCalldata"
            rows="3"
            class="rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-pink-500"
          />
        </label>

        <button
          class="w-full rounded-lg py-2 text-sm font-medium transition-all"
          :class="canCreateProposal
            ? 'bg-pink-600 text-white hover:bg-pink-500'
            : 'bg-muted text-muted-foreground cursor-not-allowed'"
          :disabled="!canCreateProposal || store.loading || creating"
          @click="submitProposal"
        >
          {{ creating ? 'Submitting' : 'Propose' }}
        </button>
      </div>
    </div>

    <div
      v-if="store.error"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error }}
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import { useGovernanceStore } from '@/stores/governance'

export default {
  name: 'GovernancePanel',

  setup() {
    return {
      store: useGovernanceStore(),
    }
  },

  data() {
    return {
      proposalDescription: '',
      proposalTarget: '',
      proposalValue: '0',
      proposalCalldata: '0x',
      creating: false,
      refreshing: false,
      votingProposalId: null,
      voteOptions: [
        { label: 'Against', value: 0 },
        { label: 'For', value: 1 },
        { label: 'Abstain', value: 2 },
      ],
    }
  },

  computed: {
    formattedVotingDelay() {
      try {
        const blocks = parseInt(this.store.votingDelay)
        const mins = Math.round((blocks * 12) / 60)
        return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`
      } catch { return '-' }
    },
    formattedVotingPeriod() {
      try {
        const blocks = parseInt(this.store.votingPeriod)
        const days = Math.round((blocks * 12) / 86400)
        return `${days} day${days === 1 ? '' : 's'}`
      } catch { return '-' }
    },
    formattedProposalThreshold() {
      try {
        return parseFloat(ethers.formatEther(this.store.proposalThreshold || '0')).toLocaleString()
      } catch { return '0' }
    },
    formattedQuorum() {
      try {
        const q = BigInt(this.store.quorum || '0')
        if (q === 0n) return '-'
        return `${parseFloat(ethers.formatEther(q)).toLocaleString()} veSGT`
      } catch { return '-' }
    },
    hasProposalThreshold() {
      try {
        return BigInt(this.store.veSGTBalance || '0') >= BigInt(this.store.proposalThreshold || '0')
      } catch { return false }
    },
    isProposalValueValid() {
      try {
        return BigInt(String(this.proposalValue || '0')) >= 0n
      } catch { return false }
    },
    canCreateProposal() {
      return (
        this.store.connected &&
        this.store.contractsDeployed &&
        this.hasProposalThreshold &&
        this.isProposalValueValid &&
        this.proposalDescription.trim().length > 0 &&
        ethers.isAddress(this.proposalTarget) &&
        ethers.isHexString(this.proposalCalldata || '0x')
      )
    },
  },

  watch: {
    'store.chainId'() {
      this.refreshProposals()
    },
  },

  mounted() {
    this.refreshProposals()
  },

  methods: {
    truncateId(id) {
      const value = String(id || '')
      return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value
    },
    proposalExcerpt(text) {
      const value = String(text || 'Untitled proposal').trim()
      return value.length > 120 ? `${value.slice(0, 117)}...` : value
    },
    statusClass(label) {
      const normalized = String(label || '').toLowerCase()
      if (normalized === 'active' || normalized === 'succeeded') return 'bg-green-500/10 text-green-700 dark:text-green-400'
      if (normalized === 'defeated' || normalized === 'canceled' || normalized === 'expired') return 'bg-red-500/10 text-red-700 dark:text-red-400'
      return 'bg-background text-muted-foreground'
    },
    async refreshProposals() {
      this.refreshing = true
      try {
        await this.store.loadProposals()
      } finally {
        this.refreshing = false
      }
    },
    async submitProposal() {
      this.creating = true
      try {
        await this.store.createProposal(
          this.proposalDescription,
          [this.proposalTarget],
          [this.proposalValue || '0'],
          [this.proposalCalldata || '0x'],
        )
        this.proposalDescription = ''
        this.proposalTarget = ''
        this.proposalValue = '0'
        this.proposalCalldata = '0x'
      } finally {
        this.creating = false
      }
    },
    async vote(proposalId, support) {
      this.votingProposalId = proposalId
      try {
        await this.store.castVote(proposalId, support)
      } finally {
        this.votingProposalId = null
      }
    },
  },
}
</script>
