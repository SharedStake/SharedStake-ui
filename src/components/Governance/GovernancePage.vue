<template>
  <div class="flex flex-col items-center min-h-screen py-12 px-4">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-foreground">
        Governance & veSGT
      </h1>
      <p class="mt-2 text-muted-foreground text-sm max-w-lg">
        Lock SGT to receive veSGT for governance voting power and operator bond discounts. Longer locks = more voting power.
      </p>
    </div>

    <!-- Two-column grid -->
    <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Lock Panel -->
      <div class="rounded-2xl border border-border bg-card shadow-lg p-6">
        <LockPanel />
      </div>

      <!-- Governance Panel -->
      <div class="rounded-2xl border border-border bg-card shadow-lg p-6">
        <GovernancePanel />
      </div>
    </div>
  </div>
</template>

<script>
import LockPanel from '@/components/ModularStaking/LockPanel.vue'
import GovernancePanel from '@/components/ModularStaking/GovernancePanel.vue'

export default {
  name: 'GovernancePage',

  components: {
    LockPanel,
    GovernancePanel,
  },
}
</script>