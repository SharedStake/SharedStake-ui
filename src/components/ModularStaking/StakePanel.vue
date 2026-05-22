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

    <!-- Referral -->
    <div class="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-700 dark:text-purple-400">
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-1">
          <div class="font-medium text-foreground">
            Referral
          </div>
          <div
            v-if="referralSource === 'code'"
            class="text-purple-700 dark:text-purple-300"
          >
            Source: code <span class="font-semibold">{{ referralCode }}</span>
          </div>
          <div
            v-else-if="referralSource === 'address'"
            class="text-purple-700 dark:text-purple-300"
          >
            Source: address {{ referralAddress }}
          </div>
          <div
            v-else
            class="text-muted-foreground"
          >
            No active referral
          </div>
          <div
            v-if="referralSource === 'code' && activeResolvedAddress"
            class="text-muted-foreground"
          >
            Resolved address: {{ activeResolvedAddress }}
          </div>
          <div
            v-if="referralSource === 'code' && !activeResolvedAddress && referralAddress"
            class="text-muted-foreground"
          >
            Fallback address: {{ referralAddress }}
          </div>
          <div
            v-if="referralLoading"
            class="text-muted-foreground"
          >
            Resolving code...
          </div>
          <div
            v-else-if="referralWarning"
            class="text-yellow-700 dark:text-yellow-300"
          >
            {{ referralWarning }}
          </div>
        </div>
        <button
          v-if="referralSource"
          class="text-xs underline hover:text-purple-900 dark:hover:text-purple-200"
          @click="clearReferral"
        >
          Clear
        </button>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <input
          v-model="referralCodeInput"
          type="text"
          placeholder="Referral code"
          class="w-full rounded-md border border-purple-500/30 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder-muted-foreground"
          @keyup.enter="applyReferralCodeInput"
        >
        <button
          class="rounded-md border border-purple-500/40 px-2.5 py-1.5 text-xs font-medium text-purple-800 transition-colors hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-200"
          :disabled="referralLoading"
          @click="applyReferralCodeInput"
        >
          Apply
        </button>
      </div>
      <div
        v-if="referralCodeError"
        class="mt-1 text-xs text-red-700 dark:text-red-300"
      >
        {{ referralCodeError }}
      </div>
    </div>

    <!-- Success -->
    <div
      v-if="txHash"
      class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
    >
      Transaction submitted: {{ txHash.slice(0, 10) }}...
    </div>
    <div
      v-if="txError"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ txError }}
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
import { useModularStakingStore } from '@/stores/modularStaking'
import { useWalletStore } from '@/stores/wallet'
import { isValidReferralCode, normalizeReferralCode } from '@/utils/referral'
import { ethers } from 'ethers'

const REFERRAL_ADDRESS_KEY = 'sharedstake_referral'
const REFERRAL_CODE_KEY = 'sharedstake_referral_code'
const REFERRAL_RESOLVED_ADDRESS_KEY = 'sharedstake_referral_code_resolved_address'
const REFERRAL_RESOLVED_CODE_KEY = 'sharedstake_referral_code_resolved_code'

export default {
  name: 'StakePanel',

  setup() {
    return {
      store: useModularStakingStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      inputAmount: '',
      outputAmount: '',
      txHash: null,
      txError: null,
      referralSource: null,
      referralAddress: null,
      referralCode: '',
      referralCodeInput: '',
      resolvedReferralAddress: null,
      resolvedReferralCode: '',
      referralLoading: false,
      referralWarning: null,
      referralCodeError: null,
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
    activeResolvedAddress() {
      if (this.referralSource !== 'code') return null
      if (!this.resolvedReferralAddress) return null
      if (this.resolvedReferralCode !== this.referralCode) return null
      return this.resolvedReferralAddress
    },
    effectiveReferralAddress() {
      if (this.referralSource === 'address') return this.referralAddress
      if (this.referralSource === 'code') return this.activeResolvedAddress || this.referralAddress
      return null
    },
    effectiveReferralCodeHash() {
      if (this.referralSource !== 'code') return null
      if (!isValidReferralCode(this.referralCode)) return null
      try {
        return ethers.keccak256(ethers.toUtf8Bytes(this.referralCode))
      } catch {
        return null
      }
    },
    referralApiBaseUrl() {
      const base = String(import.meta.env.VITE_REFERRAL_API_BASE_URL || '').trim()
      return base.replace(/\/+$/, '')
    },
  },

  mounted() {
    this.initializeReferralState()
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
      } catch { /* ignore parse errors */ }
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

    toCanonicalAddress(address) {
      if (!address) return null
      try {
        const canonical = ethers.getAddress(String(address).trim())
        if (canonical === ethers.ZeroAddress) return null
        return canonical
      } catch {
        return null
      }
    },

    setResolvedAddressForCode(code, address) {
      const canonical = this.toCanonicalAddress(address)
      if (!canonical || !isValidReferralCode(code)) return
      this.resolvedReferralAddress = canonical
      this.resolvedReferralCode = code
      localStorage.setItem(REFERRAL_RESOLVED_ADDRESS_KEY, canonical)
      localStorage.setItem(REFERRAL_RESOLVED_CODE_KEY, code)
    },

    clearResolvedAddressCache() {
      this.resolvedReferralAddress = null
      this.resolvedReferralCode = ''
      localStorage.removeItem(REFERRAL_RESOLVED_ADDRESS_KEY)
      localStorage.removeItem(REFERRAL_RESOLVED_CODE_KEY)
    },

    async initializeReferralState() {
      const urlParams = new URLSearchParams(window.location.search)
      const referralAddressFromUrl = this.toCanonicalAddress(urlParams.get('ref'))
      const referralCodeFromUrl = normalizeReferralCode(urlParams.get('r'))

      const storedAddress = this.toCanonicalAddress(localStorage.getItem(REFERRAL_ADDRESS_KEY))
      const storedCode = normalizeReferralCode(localStorage.getItem(REFERRAL_CODE_KEY))
      const storedResolvedAddress = this.toCanonicalAddress(localStorage.getItem(REFERRAL_RESOLVED_ADDRESS_KEY))
      const storedResolvedCode = normalizeReferralCode(localStorage.getItem(REFERRAL_RESOLVED_CODE_KEY))

      if (referralAddressFromUrl) {
        this.referralAddress = referralAddressFromUrl
        localStorage.setItem(REFERRAL_ADDRESS_KEY, referralAddressFromUrl)
      } else if (storedAddress) {
        this.referralAddress = storedAddress
      } else {
        localStorage.removeItem(REFERRAL_ADDRESS_KEY)
      }

      if (storedResolvedAddress && isValidReferralCode(storedResolvedCode)) {
        this.resolvedReferralAddress = storedResolvedAddress
        this.resolvedReferralCode = storedResolvedCode
      }

      const hasUrlCode = isValidReferralCode(referralCodeFromUrl)
      const hasStoredCode = isValidReferralCode(storedCode)

      if (hasUrlCode) {
        await this.activateReferralCode(
          referralCodeFromUrl,
          referralAddressFromUrl || this.referralAddress,
        )
        return
      }

      if (hasStoredCode) {
        await this.activateReferralCode(
          storedCode,
          this.resolvedReferralCode === storedCode ? this.resolvedReferralAddress : this.referralAddress,
        )
        return
      }

      if (this.referralAddress) {
        this.referralSource = 'address'
      }
    },

    extractResolvedAddress(payload) {
      if (!payload || typeof payload !== 'object') return null
      const candidates = [
        payload.address,
        payload.referralAddress,
        payload.referrer,
        payload?.data?.address,
        payload?.data?.referralAddress,
        payload?.result?.address,
      ]
      for (const candidate of candidates) {
        const canonical = this.toCanonicalAddress(candidate)
        if (canonical) return canonical
      }
      return null
    },

    async resolveReferralCode(code) {
      if (!isValidReferralCode(code)) return
      if (!this.referralApiBaseUrl) return

      this.referralLoading = true
      this.referralWarning = null

      try {
        const response = await fetch(
          `${this.referralApiBaseUrl}/v1/codes/${encodeURIComponent(code)}/resolve`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error(`resolve API returned ${response.status}`)
        }

        const payload = await response.json()
        const resolvedAddress = this.extractResolvedAddress(payload)
        if (!resolvedAddress) {
          throw new Error('resolve API returned no valid address')
        }

        this.setResolvedAddressForCode(code, resolvedAddress)
      } catch (error) {
        console.warn('Referral code resolution failed:', error)
        this.referralWarning = 'Could not verify referral code from API. Staking will continue with fallback behavior.'
      } finally {
        this.referralLoading = false
      }
    },

    async activateReferralCode(code, fallbackResolvedAddress = null) {
      const normalizedCode = normalizeReferralCode(code)
      if (!isValidReferralCode(normalizedCode)) {
        this.referralCodeError = 'Enter a valid referral code (4-24 chars, A-Z/0-9/_/-).'
        return
      }

      this.referralSource = 'code'
      this.referralCode = normalizedCode
      this.referralCodeInput = normalizedCode
      this.referralCodeError = null
      this.referralWarning = null
      localStorage.setItem(REFERRAL_CODE_KEY, normalizedCode)

      if (fallbackResolvedAddress) {
        this.setResolvedAddressForCode(normalizedCode, fallbackResolvedAddress)
      } else if (this.resolvedReferralCode !== normalizedCode) {
        this.clearResolvedAddressCache()
      }

      await this.resolveReferralCode(normalizedCode)
    },

    async applyReferralCodeInput() {
      const normalizedCode = normalizeReferralCode(this.referralCodeInput)
      this.referralCodeInput = normalizedCode
      await this.activateReferralCode(normalizedCode, this.referralAddress)
    },

    clearReferral() {
      this.referralSource = null
      this.referralCode = ''
      this.referralCodeInput = ''
      this.referralAddress = null
      this.referralWarning = null
      this.referralCodeError = null
      this.clearResolvedAddressCache()
      localStorage.removeItem(REFERRAL_ADDRESS_KEY)
      localStorage.removeItem(REFERRAL_CODE_KEY)
    },

    async handleStake() {
      if (!this.canSubmit) return
      this.txHash = null
      this.txError = null
      try {
        const tx = await this.store.stake(this.inputAmount, {
          referralAddress: this.effectiveReferralAddress,
          referralCodeHash: this.effectiveReferralCodeHash,
        })
        this.txHash = tx.hash
        this.inputAmount = ''
        this.outputAmount = ''
      } catch (e) {
        console.error('Stake error:', e)
        this.txError = e?.reason || e?.message || 'Transaction failed'
      }
    },
  },
}
</script>
