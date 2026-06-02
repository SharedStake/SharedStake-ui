<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-lg font-semibold">veSGT Governance Lock</div>
        <div class="text-xs text-muted-foreground">
          Four-year max vote escrow with linearly decaying governance power.
        </div>
      </div>
      <button
        class="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
        :disabled="
          store.loading || !store.contractsDeployed || !walletStore.isAuth
        "
        @click="handleCheckpoint"
      >
        {{ store.loading ? "Syncing" : "Checkpoint" }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">SGT Balance</div>
        <div class="font-semibold">{{ store.formattedSGT }} SGT</div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">Projected veSGT</div>
        <div class="font-semibold">
          {{ store.formattedProjectedVeSGT }} veSGT
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">Total Locked</div>
        <div class="font-semibold">{{ store.formattedTotalLocked }} SGT</div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">Avg Lock</div>
        <div class="font-semibold">
          {{ formattedAverageLockDuration }}
        </div>
      </div>
    </div>

    <div v-if="hasLock" class="rounded-lg border border-border bg-card p-4">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium">Current Lock</div>
          <div class="text-xs text-muted-foreground">
            {{ store.lockExpired ? "Expired" : "Active" }} lock,
            {{ formattedRemaining }} remaining
          </div>
        </div>
        <div class="text-right text-xs text-muted-foreground">
          <div>Max {{ maxLockYears }} years</div>
          <div>{{ votingPowerRatio }} of max power</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-muted-foreground">Locked</div>
          <div class="font-semibold">{{ store.formattedLocked }} SGT</div>
        </div>
        <div>
          <div class="text-muted-foreground">Expires</div>
          <div class="font-semibold">{{ lockExpiryDate }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Duration</div>
          <div class="font-semibold">{{ formattedLockDuration }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Checkpointed</div>
          <div class="font-semibold">
            {{ formattedCheckpointedPower }} veSGT
          </div>
        </div>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-pink-600 transition-all"
          :style="{ width: `${lockProgressPct}%` }"
        />
      </div>

      <div v-if="!store.lockExpired" class="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs text-muted-foreground"
            >Add SGT</label
          >
          <input
            v-model="addAmount"
            type="number"
            min="0"
            step="0.1"
            placeholder="0.0"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            class="mt-2 w-full rounded-lg bg-muted py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
            :disabled="!canIncreaseAmount || store.loading"
            @click="handleIncreaseAmount"
          >
            {{ store.loading ? "Adding" : "Increase Amount" }}
          </button>
        </div>

        <div>
          <label class="mb-1 block text-xs text-muted-foreground"
            >Extend By</label
          >
          <select
            v-model="extendDays"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option
              v-for="option in durationOptions"
              :key="option.days"
              :value="option.days"
            >
              {{ option.label }}
            </option>
          </select>
          <button
            class="mt-2 w-full rounded-lg bg-muted py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
            :disabled="!canExtendLock || store.loading"
            @click="handleExtendLock"
          >
            {{ store.loading ? "Extending" : "Extend Lock" }}
          </button>
        </div>
      </div>

      <button
        v-if="store.lockExpired"
        class="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-500"
        :disabled="store.loading"
        @click="handleWithdraw"
      >
        {{ store.loading ? "Withdrawing" : "Withdraw SGT" }}
      </button>
      <button
        v-else
        class="mt-4 w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-500"
        :disabled="store.loading"
        @click="handleEmergencyWithdraw"
      >
        {{
          store.loading
            ? "Withdrawing"
            : `Emergency Withdraw (${penaltyPct} penalty)`
        }}
      </button>
    </div>

    <div v-else class="rounded-lg border border-border bg-card p-4">
      <div class="mb-3 text-sm font-medium">Create New Lock</div>

      <div class="mb-3">
        <label class="mb-1 block text-xs text-muted-foreground"
          >Amount (SGT)</label
        >
        <input
          v-model="lockAmount"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
        />
      </div>

      <div class="mb-3">
        <label class="mb-1 block text-xs text-muted-foreground"
          >Lock Duration</label
        >
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in durationOptions"
            :key="option.days"
            type="button"
            class="rounded-md px-2 py-2 text-xs font-medium"
            :class="
              Number(lockDays) === option.days
                ? 'bg-pink-600 text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            "
            @click="setDuration(option.days)"
          >
            {{ option.shortLabel }}
          </button>
        </div>
        <input
          v-model="lockDays"
          type="number"
          :min="minLockDays"
          :max="maxLockDays"
          step="7"
          class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
        />
        <div class="mt-1 text-xs text-muted-foreground">
          Min {{ minLockDays }} days. Max {{ maxLockDays }} days. Durations
          round up to whole weeks.
        </div>
      </div>

      <div class="mb-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">
        Estimated initial power:
        <span class="font-medium text-foreground"
          >{{ estimatedPower }} veSGT</span
        >
      </div>

      <button
        class="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-medium text-white hover:bg-pink-500 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        :disabled="!canLock || store.loading"
        @click="handleLock"
      >
        {{ store.loading ? "Locking" : "Lock SGT for veSGT" }}
      </button>
    </div>

    <div
      v-if="store.error || txError"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error || txError }}
    </div>

    <div class="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
      <p>
        veSGT is non-transferable governance power. A full four-year lock starts
        near 1 veSGT per 1 SGT and decays linearly to zero.
      </p>
      <p class="mt-1">
        Checkpoint before proposal snapshots or voting to align stale
        checkpointed power with projected lock power.
      </p>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { useGovernanceStore } from "@/stores/governance";
import { useWalletStore } from "@/stores/wallet";

const SECONDS_PER_DAY = 24 * 60 * 60;

export default {
  name: "LockPanel",

  setup() {
    return {
      store: useGovernanceStore(),
      walletStore: useWalletStore(),
    };
  },

  data() {
    return {
      lockAmount: "",
      lockDays: "365",
      addAmount: "",
      extendDays: 182,
      txError: null,
      durationOptions: [
        { label: "1 month", shortLabel: "1M", days: 28 },
        { label: "6 months", shortLabel: "6M", days: 182 },
        { label: "1 year", shortLabel: "1Y", days: 364 },
        { label: "2 years", shortLabel: "2Y", days: 728 },
        { label: "4 years", shortLabel: "4Y", days: 1460 },
      ],
    };
  },

  computed: {
    minLockDays() {
      return Number(this.store.minLockDays || 7);
    },
    maxLockDays() {
      return Number(this.store.maxLockDays || 1460);
    },
    maxLockYears() {
      return (this.maxLockDays / 365).toFixed(0);
    },
    hasLock() {
      try {
        return BigInt(this.store.lockedAmount || "0") > 0n;
      } catch {
        return false;
      }
    },
    canLock() {
      return (
        this.walletStore.isAuth &&
        this.store.contractsDeployed &&
        this.lockAmount &&
        parseFloat(this.lockAmount) > 0 &&
        this.lockDays &&
        Number(this.lockDays) >= this.minLockDays &&
        Number(this.lockDays) <= this.maxLockDays
      );
    },
    canIncreaseAmount() {
      return (
        this.walletStore.isAuth &&
        this.hasLock &&
        !this.store.lockExpired &&
        this.addAmount &&
        parseFloat(this.addAmount) > 0
      );
    },
    canExtendLock() {
      return (
        this.walletStore.isAuth &&
        this.hasLock &&
        !this.store.lockExpired &&
        Number(this.extendDays) >= this.minLockDays
      );
    },
    lockExpiryDate() {
      try {
        const end = parseInt(this.store.lockedEnd);
        if (end === 0) return "-";
        return new Date(end * 1000).toLocaleDateString();
      } catch {
        return "-";
      }
    },
    formattedRemaining() {
      return this.formatDuration(Number(this.store.lockRemaining || 0));
    },
    formattedLockDuration() {
      return this.formatDuration(Number(this.store.lockDuration || 0));
    },
    formattedAverageLockDuration() {
      return this.formatDuration(Number(this.store.averageLockDuration || 0));
    },
    formattedCheckpointedPower() {
      try {
        return parseFloat(
          ethers.formatEther(this.store.checkpointedLockPower || "0"),
        ).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
    penaltyPct() {
      try {
        return `${(Number(this.store.earlyWithdrawPenaltyRate || 0) / 1000).toFixed(1)}%`;
      } catch {
        return "0.0%";
      }
    },
    lockProgressPct() {
      const duration = Number(this.store.lockDuration || 0);
      const remaining = Number(this.store.lockRemaining || 0);
      if (!duration || remaining <= 0) return 100;
      const elapsed = Math.max(duration - remaining, 0);
      return Math.min(Math.round((elapsed / duration) * 100), 100);
    },
    votingPowerRatio() {
      try {
        const projected = Number(
          ethers.formatEther(this.store.projectedVeSGTBalance || "0"),
        );
        const max = Number(ethers.formatEther(this.store.maxLockPower || "0"));
        if (!max) return "0%";
        return `${Math.min((projected / max) * 100, 100).toFixed(1)}%`;
      } catch {
        return "0%";
      }
    },
    estimatedPower() {
      try {
        const amount = Number(this.lockAmount || 0);
        const days = Math.min(
          Math.max(Number(this.lockDays || 0), this.minLockDays),
          this.maxLockDays,
        );
        const roundedDays = Math.min(Math.ceil(days / 7) * 7, this.maxLockDays);
        return ((amount * roundedDays) / this.maxLockDays).toFixed(4);
      } catch {
        return "0.0000";
      }
    },
  },

  methods: {
    setDuration(days) {
      this.lockDays = String(days);
    },
    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return "0 days";
      const days = Math.round(seconds / SECONDS_PER_DAY);
      if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
      if (days < 730) return `${Math.round(days / 30)} months`;
      return `${(days / 365).toFixed(1)} years`;
    },
    async handleLock() {
      if (!this.canLock) return;
      this.txError = null;
      try {
        await this.store.lockSGT(this.lockAmount, parseInt(this.lockDays));
        this.lockAmount = "";
      } catch (e) {
        console.error("Lock error:", e);
        this.txError = e?.reason || e?.message || "Lock failed";
      }
    },
    async handleIncreaseAmount() {
      if (!this.canIncreaseAmount) return;
      this.txError = null;
      try {
        await this.store.increaseLockAmount(this.addAmount);
        this.addAmount = "";
      } catch (e) {
        console.error("Increase lock amount error:", e);
        this.txError = e?.reason || e?.message || "Increase amount failed";
      }
    },
    async handleExtendLock() {
      if (!this.canExtendLock) return;
      this.txError = null;
      try {
        await this.store.extendLockDays(Number(this.extendDays));
      } catch (e) {
        console.error("Extend lock error:", e);
        this.txError = e?.reason || e?.message || "Extend lock failed";
      }
    },
    async handleCheckpoint() {
      this.txError = null;
      try {
        await this.store.checkpointVeSGT();
      } catch (e) {
        console.error("Checkpoint error:", e);
        this.txError = e?.reason || e?.message || "Checkpoint failed";
      }
    },
    async handleWithdraw() {
      this.txError = null;
      try {
        await this.store.withdrawVeSGT();
      } catch (e) {
        console.error("Withdraw error:", e);
        this.txError = e?.reason || e?.message || "Withdraw failed";
      }
    },
    async handleEmergencyWithdraw() {
      this.txError = null;
      try {
        await this.store.emergencyWithdrawVeSGT();
      } catch (e) {
        console.error("Emergency withdraw error:", e);
        this.txError = e?.reason || e?.message || "Emergency withdraw failed";
      }
    },
  },
};
</script>
