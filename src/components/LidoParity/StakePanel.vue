<template>
  <div class="flex flex-col gap-4">
    <!-- Protocol Stats Banner -->
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Total Staked
        </div>
        <div class="font-semibold">
          {{ store.formattedTotalPooled }} ETH
        </div>
      </div>
      <div class="rounded-lg bg-muted p-3">
        <div class="text-muted-foreground">
          Exchange Rate
        </div>
        <div class="font-semibold">
          1 ETH → {{ exchangeRateDisplay }} stETH
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="mb-1 flex items-center justify-between text-sm text-muted-foreground">
        <span>You stake</span>
        <button
          class="hover:text-foreground transition-colors"
          @click="setMax"
        >
          Balance: {{ store.formattedEthBalance }} ETH
        </button>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="inputAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.0"
          class="w-full bg-transparent text-2xl font-medium outline-none placeholder-muted-foreground"
          @input="computeOutput"
        >
        <span class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium">ETH</span>
      </div>
    </div>

    <!-- Arrow -->
    <div class="flex justify-center text-muted-foreground">
      ↓
    </div>

    <!-- Output -->
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="mb-1 text-sm text-muted-foreground">
        You receive (estimated)
      </div>
      <div class="flex items-center gap-2">
        <span class="w-full text-2xl font-medium text-foreground">{{ outputDisplay }}</span>
        <span class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium">stETH</span>
      </div>
    </div>

    <!-- Deploy notice when contracts not yet live -->
    <div
      v-if="!store.contractsDeployed"
      class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400"
    >
      Contracts not yet deployed on this network. Connect to localhost or a supported testnet.
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.error }}
    </div>

    <!-- Success -->
    <div
      v-if="txHash"
      class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
    >
      Transaction submitted: {{ txHash.slice(0, 10) }}...
    </div>

    <!-- Submit button -->
    <button
      class="w-full rounded-xl py-3.5 text-base font-semibold transition-all"
      :class="canSubmit
        ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer'
        : 'bg-muted text-muted-foreground cursor-not-allowed'"
      :disabled="!canSubmit || store.loading"
      @click="handleStake"
    >
      <span v-if="store.loading">Staking...</span>
      <span v-else-if="!walletStore.isAuth">Connect Wallet</span>
      <span v-else-if="!store.contractsDeployed">Not Deployed</span>
      <span v-else-if="!inputAmount || parseFloat(inputAmount) <= 0">Enter Amount</span>
      <span v-else>Stake ETH</span>
    </button>
  </div>
</template>

<script>
import { useLidoParityStore } from '@/stores/lidoParity'
import { useWalletStore } from '@/stores/wallet'
import { ethers } from 'ethers'

export default {
  name: 'StakePanel',

  setup() {
    return {
      store: useLidoParityStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      inputAmount: '',
      outputAmount: '',
      txHash: null,
    }
  },

  computed: {
    exchangeRateDisplay() {
      return parseFloat(this.store.exchangeRate).toFixed(6)
    },
    outputDisplay() {
      if (!this.outputAmount) return '0.0'
      return parseFloat(ethers.formatEther(this.outputAmount)).toFixed(6)
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
      const bal = this.store.ethBalance
      if (!bal || bal === '0') return
      // Leave 0.01 ETH for gas.
      try {
        const balEth = parseFloat(ethers.formatEther(bal))
        this.inputAmount = Math.max(0, balEth - 0.01).toFixed(6)
        this.computeOutput()
      } catch (_e) { /* ignore parse errors */ }
    },

    computeOutput() {
      if (!this.inputAmount || parseFloat(this.inputAmount) <= 0) {
        this.outputAmount = ''
        return
      }
      try {
        const amountWei = ethers.parseEther(this.inputAmount)
        const totalShares = BigInt(this.store.totalShares)
        const totalPooled = BigInt(this.store.totalPooledEther)

        let shares
        if (totalPooled === 0n) {
          shares = amountWei
        } else {
          shares = (amountWei * totalShares) / totalPooled
        }
        this.outputAmount = shares.toString()
      } catch {
        this.outputAmount = ''
      }
    },

    async handleStake() {
      if (!this.canSubmit) return
      this.txHash = null
      try {
        const tx = await this.store.stake(this.inputAmount)
        this.txHash = tx.hash
        this.inputAmount = ''
        this.outputAmount = ''
      } catch (e) {
        console.error('Stake error:', e)
      }
    },
  },
}
</script>
