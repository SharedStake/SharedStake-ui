/**
 * Pinia store for the SharedStake V2 modular staking protocol
 * (StakingCore / StToken / WstToken / WithdrawalQueueV2).
 *
 * Separating this from the legacy wallet store keeps the new protocol isolated
 * while still sharing the wallet connection (provider/signer) from useWalletStore.
 */
import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import { useWalletStore } from './wallet'
import { normalizeChainId } from '@/utils/common'

import stTokenABI from '@/contracts/abis/stToken.json'
import wstTokenABI from '@/contracts/abis/wstToken.json'
import stakingCoreABI from '@/contracts/abis/stakingCore.json'
import withdrawalQueueV2ABI from '@/contracts/abis/withdrawalQueueV2.json'
import stakingRouterABI from '@/contracts/abis/stakingRouter.json'
import mainnetAddresses from '@/contracts/addresses/mainnet.json'
import goerliAddresses from '@/contracts/addresses/goerli.json'
import sepoliaAddresses from '@/contracts/addresses/sepolia.json'
import localAddresses from '@/contracts/addresses/local.json'

// Placeholder zero address used when contracts are not deployed on the connected chain.
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const ADDRESS_BOOK_BY_CHAIN = {
  '0x1': mainnetAddresses,
  '0x5': goerliAddresses,
  '0xaa36a7': sepoliaAddresses,
  '0x7a69': localAddresses,
  '0x539': localAddresses, // Ganache-style local chain id
}

function getAddresses(chainId) {
  const cid = normalizeChainId(chainId)
  const source = ADDRESS_BOOK_BY_CHAIN[cid]
  if (!source) return null
  return {
    stakingCore: source.stakingCore || ZERO_ADDR,
    stToken: source.stToken || ZERO_ADDR,
    wstToken: source.wstToken || ZERO_ADDR,
    withdrawalQueueV2: source.withdrawalQueueV2 || ZERO_ADDR,
    stakingRouter: source.stakingRouter || ZERO_ADDR,
  }
}

function normalizeAmountInput(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid numeric amount')
    return value.toString()
  }
  if (typeof value === 'bigint') return value.toString()
  return String(value ?? '').trim()
}

export const useModularStakingStore = defineStore('modularStaking', {
  state: () => ({
    // Network / connection
    chainId: null,
    connected: false,
    loading: false,
    error: null,

    // Protocol stats
    totalPooledEther: '0',
    totalShares: '0',
    exchangeRate: '1.0',   // stTokens per 1 ETH

    // User balances
    ethBalance: '0',
    stTokenBalance: '0',
    stTokenShares: '0',
    wstTokenBalance: '0',
    wstExchangeRate: '1.0', // stTokens per 1 wstToken

    // Withdrawal queue
    userRequests: [],        // [{id, owner, stShares, ethAmount, requestedAt, finalized, claimed}]
    nextRequestId: '1',
    lastFinalizedRequestId: '0',

    // Withdrawal mode (TURBO=0, BUNKER=1) and bunker-mode parameters
    withdrawalMode: 0,        // 0 = TURBO, 1 = BUNKER
    bunkerMinRequestAge: 0,   // seconds
    bunkerMaxPerFinalize: 0,  // max requests per finalize call in BUNKER mode

    // Module registry / inflow cap (StakingRouter)
    defaultModuleId: null,
    defaultModuleInfo: null,    // { addr, mintCapEth, active, paused, moduleType }
    moduleInflowUsed: '0',      // ETH used in current window (wei)
    moduleInflowLimit: '0',     // ETH limit per window (wei) — 0 = unlimited
    moduleInflowWindowReset: 0, // unix timestamp when window resets

    // Contract deployment status
    contractsDeployed: false,
  }),

  getters: {
    formattedTotalPooled: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.totalPooledEther)).toFixed(4)
      } catch { return '0.0000' }
    },
    formattedEthBalance: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.ethBalance)).toFixed(4)
      } catch { return '0.0000' }
    },
    formattedStTokenBalance: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.stTokenBalance)).toFixed(4)
      } catch { return '0.0000' }
    },
    formattedWstTokenBalance: (state) => {
      try {
        return parseFloat(ethers.formatEther(state.wstTokenBalance)).toFixed(4)
      } catch { return '0.0000' }
    },
    pendingRequests: (state) => state.userRequests.filter(r => !r.finalized),
    finalizedRequests: (state) => state.userRequests.filter(r => r.finalized && !r.claimed),
    claimedRequests: (state) => state.userRequests.filter(r => r.claimed),
    isBunkerMode: (state) => state.withdrawalMode !== 0,
    withdrawalModeLabel: (state) => state.withdrawalMode === 0 ? 'TURBO' : 'BUNKER',

    /// Inflow-cap utilisation as an integer percentage (0..>=100).
    /// Returns null when the limit is unset (0 = unlimited).
    moduleCapPercent: (state) => {
      try {
        const limit = BigInt(state.moduleInflowLimit || '0')
        const used = BigInt(state.moduleInflowUsed || '0')
        if (limit === 0n) return null
        return Number((used * 100n) / limit)
      } catch {
        return null
      }
    },
  },

  actions: {
    // ── Internal helpers ──────────────────────────────────────────────────────

    _getContracts() {
      const walletStore = useWalletStore()
      let provider = walletStore.ethersProvider
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum)
        walletStore.setEthersProvider(provider)
        if (!walletStore.network && window.ethereum.chainId) {
          walletStore.setNetwork(String(window.ethereum.chainId).toLowerCase())
        }
      }
      if (!provider) return null

      const fallbackWindowChainId =
        typeof window !== 'undefined' && window.ethereum ? window.ethereum.chainId : null
      const chainId = this.chainId || walletStore.network || fallbackWindowChainId
      const addresses = getAddresses(chainId)
      if (!addresses) return null

      // Check that contracts are actually deployed (non-zero address).
      const allDeployed = Object.values(addresses).every(a => a !== ZERO_ADDR)
      this.contractsDeployed = allDeployed
      if (!allDeployed) return null

      const make = (abi, addr) => {
        if (!addr || addr === ZERO_ADDR) return null
        return new ethers.Contract(addr, abi, provider)
      }
      const makeSigned = async (abi, addr) => {
        if (!addr || addr === ZERO_ADDR) return null
        const signer = await provider.getSigner()
        return new ethers.Contract(addr, abi, signer)
      }

      return { addresses, make, makeSigned }
    },

    async _withTx(fn) {
      this.loading = true
      this.error = null
      try {
        const result = await fn()
        const walletStore = useWalletStore()
        await this.init(this.chainId, walletStore.address)
        return result
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    // ── Data fetching ──────────────────────────────────────────────────────────

    async init(chainId, userAddress) {
      this.chainId = chainId
      this.connected = !!userAddress

      const ctx = this._getContracts()
      if (!ctx) return

      const { addresses, make } = ctx

      try {
        const stToken = make(stTokenABI, addresses.stToken)
        const wstToken = make(wstTokenABI, addresses.wstToken)
        const queue = make(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        const walletStore = useWalletStore()
        const provider = walletStore.ethersProvider

        if (stToken) {
          this.totalPooledEther = (await stToken.totalPooledEther()).toString()
          this.totalShares = (await stToken.getTotalShares()).toString()

          if (userAddress) {
            this.stTokenBalance = (await stToken.balanceOf(userAddress)).toString()
            this.stTokenShares = (await stToken.sharesOf(userAddress)).toString()
          }
        }

        if (wstToken) {
          this.wstExchangeRate = ethers.formatEther(await wstToken.stTokensPerToken())
          if (userAddress) {
            this.wstTokenBalance = (await wstToken.balanceOf(userAddress)).toString()
          }
        }

        if (provider && userAddress) {
          this.ethBalance = (await provider.getBalance(userAddress)).toString()
        }

        if (queue) {
          this.nextRequestId = (await queue.nextRequestId()).toString()
          this.lastFinalizedRequestId = (await queue.lastFinalizedRequestId()).toString()

          // Read withdrawal-mode metadata. Wrapped in try/catch so older
          // deployments without these getters don't break the entire init flow.
          try {
            if (typeof queue.withdrawalMode === 'function') {
              const mode = await queue.withdrawalMode()
              this.withdrawalMode = Number(mode)
            }
            if (typeof queue.bunkerMinRequestAge === 'function') {
              const minAge = await queue.bunkerMinRequestAge()
              this.bunkerMinRequestAge = Number(minAge)
            }
            if (typeof queue.bunkerMaxRequestsPerFinalize === 'function') {
              const maxPer = await queue.bunkerMaxRequestsPerFinalize()
              this.bunkerMaxPerFinalize = Number(maxPer)
            }
          } catch (modeErr) {
            // Non-fatal: surface in console only. Defaults remain (TURBO).
            console.warn('ModularStakingStore: failed to read withdrawal-mode metadata', modeErr)
          }

          if (userAddress) {
            await this.fetchUserRequests(userAddress)
          }
        }

        // Compute exchange rate: 1 ETH = how many stTokens
        if (BigInt(this.totalShares) > 0n) {
          const rate = (BigInt(this.totalPooledEther) * BigInt(1e18)) / BigInt(this.totalShares)
          this.exchangeRate = ethers.formatEther(rate)
        }

        // Read StakingRouter module metadata (non-fatal if missing).
        try {
          const routerAddr = addresses.stakingRouter
          if (routerAddr && routerAddr !== ZERO_ADDR) {
            const router = make(stakingRouterABI, routerAddr)
            if (router) {
              const modId = await router.defaultModuleId()
              this.defaultModuleId = modId

              if (modId && modId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                const mod = await router.modules(modId)
                this.defaultModuleInfo = {
                  addr: mod.addr,
                  moduleType: mod.moduleType,
                  mintCapEth: mod.mintCapEth.toString(),
                  active: mod.active,
                  paused: mod.paused,
                }

                const winState = await router.moduleInflowWindowState(modId)
                this.moduleInflowUsed = winState.inflowEth.toString()

                const limitCfg = await router.moduleInflowLimitConfig(modId)
                this.moduleInflowLimit = limitCfg.maxInflowEthPerWindow.toString()

                // Compute window reset timestamp.
                const now = Math.floor(Date.now() / 1000)
                const windowStart = Number(winState.windowStart)
                const windowSeconds = Number(limitCfg.windowSeconds)
                if (windowSeconds > 0) {
                  const elapsed = now - windowStart
                  const remaining = Math.max(0, windowSeconds - (elapsed % windowSeconds))
                  this.moduleInflowWindowReset = now + remaining
                } else {
                  this.moduleInflowWindowReset = 0
                }
              }
            }
          }
        } catch (routerErr) {
          console.warn('ModularStakingStore: failed to read StakingRouter metadata', routerErr)
        }
      } catch (e) {
        console.error('ModularStakingStore.init error:', e)
        this.error = e.message
      }
    },

    async fetchUserRequests(userAddress) {
      const ctx = this._getContracts()
      if (!ctx) return

      const { addresses, make } = ctx
      const queue = make(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
      if (!queue) return

      const nextId = parseInt(this.nextRequestId)
      const requests = []

      for (let id = 1; id < nextId; id++) {
        try {
          const req = await queue.getRequest(id)
          if (req.owner.toLowerCase() === userAddress.toLowerCase()) {
            requests.push({
              id,
              owner: req.owner,
              stShares: req.stShares.toString(),
              ethAmount: req.ethAmount.toString(),
              // requestedAt may be undefined on older ABI deployments; coerce safely.
              requestedAt: req.requestedAt != null ? req.requestedAt.toString() : null,
              finalized: req.finalized,
              claimed: req.claimed,
            })
          }
        } catch { /* ignore missing/reverted requests */ }
      }
      this.userRequests = requests
    },

    // ── Transactions ──────────────────────────────────────────────────────────

    async stake(ethAmountStr, referral = '0x0000000000000000000000000000000000000000') {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available on this network')

        const { addresses, makeSigned } = ctx

        // Prefer StakingRouter (modular V2 path) when available,
        // falling back to StakingCore for legacy / non-modular deployments.
        let contract = null
        let contractName = 'StakingRouter'
        if (addresses.stakingRouter && addresses.stakingRouter !== ZERO_ADDR) {
          contract = await makeSigned(stakingRouterABI, addresses.stakingRouter)
        }
        if (!contract) {
          contract = await makeSigned(stakingCoreABI, addresses.stakingCore)
          contractName = 'StakingCore'
        }
        if (!contract) throw new Error(`${contractName} not deployed`)

        const amount = ethers.parseEther(normalizeAmountInput(ethAmountStr))
        const tx = await contract.submit(referral, { value: amount })
        await tx.wait()
        return tx
      })
    },

    async wrap(stAmountStr) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const wstToken = await makeSigned(wstTokenABI, addresses.wstToken)
        const stToken = await makeSigned(stTokenABI, addresses.stToken)
        if (!wstToken || !stToken) throw new Error('Contracts not deployed')

        const amount = ethers.parseEther(normalizeAmountInput(stAmountStr))

        // Approve wstToken to spend stToken.
        const approveTx = await stToken.approve(addresses.wstToken, amount)
        await approveTx.wait()

        const wrapTx = await wstToken.wrap(amount)
        await wrapTx.wait()
        return wrapTx
      })
    },

    async unwrap(wstAmountStr) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const wstToken = await makeSigned(wstTokenABI, addresses.wstToken)
        if (!wstToken) throw new Error('WstToken not deployed')

        const amount = ethers.parseEther(normalizeAmountInput(wstAmountStr))
        const tx = await wstToken.unwrap(amount)
        await tx.wait()
        return tx
      })
    },

    async requestWithdrawal(stAmountStr) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const queue = await makeSigned(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        if (!queue) throw new Error('WithdrawalQueueV2 not deployed')

        const walletStore = useWalletStore()
        const amount = ethers.parseEther(normalizeAmountInput(stAmountStr))
        const tx = await queue.requestWithdrawals([amount], walletStore.address)
        await tx.wait()
        return tx
      })
    },

    async claimWithdrawal(requestId) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const queue = await makeSigned(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        if (!queue) throw new Error('WithdrawalQueueV2 not deployed')

        const walletStore = useWalletStore()
        const tx = await queue.claimWithdrawal(requestId, walletStore.address)
        await tx.wait()
        return tx
      })
    },

    async finalize(lastRequestId) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const queue = await makeSigned(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        if (!queue) throw new Error('WithdrawalQueueV2 not deployed')

        const tx = await queue.finalize(lastRequestId)
        await tx.wait()
        return tx
      })
    },
  },
})
