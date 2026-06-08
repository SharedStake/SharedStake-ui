/**
 * Pinia store for the Lido-parity staking protocol (StakingCore / StToken / WstToken / WithdrawalQueueV2).
 *
 * Separating this from the legacy wallet store keeps the new protocol isolated
 * while still sharing the wallet connection (provider/signer) from useWalletStore.
 */
import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import { useWalletStore } from './wallet'

import stTokenABI from '@/contracts/abis/stToken.json'
import wstTokenABI from '@/contracts/abis/wstToken.json'
import stakingRouterABI from '@/contracts/abis/stakingRouter.json'
import withdrawalQueueV2ABI from '@/contracts/abis/withdrawalQueueV2.json'
import validatorModuleABI from '@/contracts/abis/validatorModule.json'
import operatorRegistryABI from '@/contracts/abis/operatorRegistry.json'
import mainnetAddresses from '@/contracts/addresses/mainnet.json'
import goerliAddresses from '@/contracts/addresses/goerli.json'
import sepoliaAddresses from '@/contracts/addresses/sepolia.json'
import localAddresses from '@/contracts/addresses/local.json'

// Placeholder zero address used when contracts are not deployed on the connected chain.
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

// Placeholder module ID for solo validator staking (bytes32(1))
const SOLO_VALIDATOR_MODULE_ID = '0x' + '0'.repeat(63) + '1'
const ERC721_ENUMERABLE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
]

// Per-chain contract addresses come from the same JSON files used by the
// legacy contract index. Local/fork deployments update local.json through
// scripts/contracts/sync-addresses.sh.
const DEFAULT_CONTRACT_ADDRESSES = {
  stakingRouter: ZERO_ADDR,
  stToken: ZERO_ADDR,
  wstToken: ZERO_ADDR,
  withdrawalQueueV2: ZERO_ADDR,
  validatorModule: ZERO_ADDR,
  dvtModule: ZERO_ADDR,
  operatorRegistry: ZERO_ADDR,
  sgtToken: ZERO_ADDR,
  nftContract: ZERO_ADDR,
}

const SGT_TOKEN_BY_CHAIN = {
  '0x1': '0x84810bcF08744d5862B8181f12d17bfd57d3b078',
}

const ADDRESS_MAPS_BY_CHAIN = {
  '0x1': mainnetAddresses,
  '0x5': goerliAddresses,
  '0xaa36a7': sepoliaAddresses,
  '0x7a69': localAddresses,
  '0x539': localAddresses,
}

const LOCAL_CHAIN_IDS = new Set(['0x7a69', '0x539'])
const ADDRESS_OVERRIDES_QUERY_KEY = 'e2eContracts'
const ADDRESS_OVERRIDES_STORAGE_KEY = 'e2eContractAddresses'

function normalizeChainId(id) {
  if (!id && id !== 0) return ''
  if (typeof id === 'bigint') return '0x' + id.toString(16)
  if (typeof id === 'number') return '0x' + id.toString(16)
  if (typeof id === 'string' && !id.toLowerCase().startsWith('0x')) return '0x' + parseInt(id, 10).toString(16)
  return id.toLowerCase()
}

function validAddress(value) {
  return typeof value === 'string' && ethers.isAddress(value) ? value : null
}

function pickAddress(source, key, fallbackKey = null) {
  if (!source) return ZERO_ADDR
  return validAddress(source[key]) || (fallbackKey ? validAddress(source[fallbackKey]) : null) || ZERO_ADDR
}

function pickFirstAddress(values) {
  return values.map(validAddress).find(Boolean) || ZERO_ADDR
}

function parseAddressOverrides(rawValue) {
  if (!rawValue) return null
  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to parse modular staking address overrides:', error)
  }
  return null
}

function getLocalAddressOverrides(chainId) {
  if (!LOCAL_CHAIN_IDS.has(chainId)) return null
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const queryOverride = parseAddressOverrides(params.get(ADDRESS_OVERRIDES_QUERY_KEY))
  if (queryOverride) return queryOverride
  return parseAddressOverrides(window.localStorage?.getItem(ADDRESS_OVERRIDES_STORAGE_KEY))
}

function getAddresses(chainId) {
  const cid = normalizeChainId(chainId)
  const baseSource = ADDRESS_MAPS_BY_CHAIN[cid]
  const overrides = getLocalAddressOverrides(cid)
  const source = overrides ? { ...baseSource, ...overrides } : baseSource
  if (!source) return null

  return {
    ...DEFAULT_CONTRACT_ADDRESSES,
    stakingRouter: pickAddress(source, 'stakingRouter'),
    stToken: pickAddress(source, 'stToken'),
    wstToken: pickAddress(source, 'wstToken'),
    withdrawalQueueV2: pickAddress(source, 'withdrawalQueueV2'),
    validatorModule: pickAddress(source, 'validatorModule'),
    dvtModule: pickAddress(source, 'dvtModule'),
    operatorRegistry: pickAddress(source, 'operatorRegistry'),
    sgtToken: pickFirstAddress([source.sgtToken, source.sgtV2, SGT_TOKEN_BY_CHAIN[cid]]),
    nftContract: pickAddress(source, 'nftContract'),
  }
}

export function getModularStakingAddresses(chainId) {
  return getAddresses(chainId)
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

    // Validator module (solo staking)
    validatorModuleInfo: null,  // { bufferedEther, beaconValidators, depositedValidatorCount, beaconBalance }

    // Optional NFT bond credit
    nftBalance: '0',
    nftTokenIds: [],
    nftSgtCredit: '0',
    lockedNftCount: '0',

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
      }
      if (!provider) return null

      const chainId = this.chainId
      const addresses = getAddresses(chainId)
      if (!addresses) return null

      // Check that core staking contracts are deployed. NFT credit is optional.
      const requiredContracts = ['stakingRouter', 'stToken', 'wstToken', 'withdrawalQueueV2', 'validatorModule']
      const allDeployed = requiredContracts.every(key => addresses[key] && addresses[key] !== ZERO_ADDR)
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

        // Read module inflow data from StakingRouter
        try {
          const stakingRouter = make(stakingRouterABI, addresses.stakingRouter)
          if (stakingRouter) {
            this.defaultModuleId = await stakingRouter.defaultModuleId()
            const inflowState = await stakingRouter.globalInflowWindowState()
            const inflowConfig = await stakingRouter.globalInflowLimitConfig()
            this.moduleInflowUsed = inflowState.totalDeposited.toString()
            this.moduleInflowLimit = inflowConfig.limit.toString()
            this.moduleInflowWindowReset = Number(inflowState.windowStart)
          }
        } catch (inflowErr) {
          // Non-fatal: surface in console only. Happens when address is zero.
          console.warn('ModularStakingStore: failed to read module inflow data', inflowErr)
        }

        // Read ValidatorModule data for solo staking
        try {
          if (addresses.validatorModule && addresses.validatorModule !== ZERO_ADDR) {
            const validatorModule = make(validatorModuleABI, addresses.validatorModule)
            if (validatorModule) {
              const bufferedEther = await validatorModule.bufferedEther()
              const beaconValidators = await validatorModule.beaconValidators()
              const depositedValidatorCount = await validatorModule.depositedValidatorCount()
              const beaconBalance = await validatorModule.beaconBalance()
              this.validatorModuleInfo = {
                bufferedEther: bufferedEther.toString(),
                beaconValidators: beaconValidators.toString(),
                depositedValidatorCount: depositedValidatorCount.toString(),
                beaconBalance: beaconBalance.toString(),
              }
            }
          }
        } catch (validatorModuleErr) {
          // Non-fatal: surface in console only. Happens when address is zero.
          console.warn('ModularStakingStore: failed to read validator module data', validatorModuleErr)
        }

        // Compute exchange rate: 1 ETH = how many stTokens
        if (BigInt(this.totalShares) > 0n) {
          const rate = (BigInt(this.totalPooledEther) * BigInt(1e18)) / BigInt(this.totalShares)
          this.exchangeRate = ethers.formatEther(rate)
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
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available on this network')

        const { addresses, makeSigned } = ctx
        const stakingRouter = await makeSigned(stakingRouterABI, addresses.stakingRouter)
        if (!stakingRouter) throw new Error('StakingRouter not deployed')

        const amount = ethers.parseEther(String(ethAmountStr))
        const tx = await stakingRouter.submit(referral, { value: amount })
        await tx.wait()

        const walletStore = useWalletStore()
        await this.init(this.chainId, walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async wrap(stAmountStr) {
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const wstToken = await makeSigned(wstTokenABI, addresses.wstToken)
        const stToken = await makeSigned(stTokenABI, addresses.stToken)
        if (!wstToken || !stToken) throw new Error('Contracts not deployed')

        const amount = ethers.parseEther(String(stAmountStr))
        const walletStore = useWalletStore()

        // Skip approve when existing allowance already covers the amount.
        const allowance = await stToken.allowance(walletStore.address, addresses.wstToken)
        if (allowance < amount) {
          const approveTx = await stToken.approve(addresses.wstToken, amount)
          await approveTx.wait()
        }

        const wrapTx = await wstToken.wrap(amount)
        await wrapTx.wait()
        await this.init(this.chainId, walletStore.address)
        return wrapTx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async unwrap(wstAmountStr) {
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const wstToken = await makeSigned(wstTokenABI, addresses.wstToken)
        if (!wstToken) throw new Error('WstToken not deployed')

        const amount = ethers.parseEther(String(wstAmountStr))
        const tx = await wstToken.unwrap(amount)
        await tx.wait()

        const walletStore = useWalletStore()
        await this.init(this.chainId, walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async requestWithdrawal(stAmountStr) {
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const queue = await makeSigned(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        if (!queue) throw new Error('WithdrawalQueueV2 not deployed')

        const walletStore = useWalletStore()
        const amount = ethers.parseEther(String(stAmountStr))
        const tx = await queue.requestWithdrawals([amount], walletStore.address)
        await tx.wait()

        await this.init(this.chainId, walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async claimWithdrawal(requestId) {
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const queue = await makeSigned(withdrawalQueueV2ABI, addresses.withdrawalQueueV2)
        if (!queue) throw new Error('WithdrawalQueueV2 not deployed')

        const walletStore = useWalletStore()
        const tx = await queue.claimWithdrawal(requestId, walletStore.address)
        await tx.wait()

        await this.init(this.chainId, walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },


    async checkNftBalance(userAddress) {
      const walletStore = useWalletStore()
      const provider = walletStore.ethersProvider
      const addresses = getAddresses(this.chainId)
      if (!provider || !addresses || !userAddress || !addresses.nftContract || addresses.nftContract === ZERO_ADDR) {
        this.nftBalance = '0'
        this.nftTokenIds = []
        this.nftSgtCredit = '0'
        this.lockedNftCount = '0'
        return { balance: '0', tokenIds: [] }
      }

      const nft = new ethers.Contract(addresses.nftContract, ERC721_ENUMERABLE_ABI, provider)
      const balance = await nft.balanceOf(userAddress)
      const maxToRead = balance > 20n ? 20n : balance
      const tokenIds = []
      for (let i = 0n; i < maxToRead; i++) {
        try {
          tokenIds.push((await nft.tokenOfOwnerByIndex(userAddress, i)).toString())
        } catch (err) {
          console.warn('ModularStakingStore: NFT token enumeration failed', err)
          break
        }
      }

      this.nftBalance = balance.toString()
      this.nftTokenIds = tokenIds

      if (addresses.operatorRegistry && addresses.operatorRegistry !== ZERO_ADDR) {
        const registry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, provider)
        try {
          this.nftSgtCredit = (await registry.nftSgtCredit()).toString()
          this.lockedNftCount = (await registry.escrowedNftCount(userAddress)).toString()
        } catch (err) {
          console.warn('ModularStakingStore: NFT credit metadata unavailable', err)
        }
      }

      return { balance: balance.toString(), tokenIds }
    },

    async lockNftForCredit(tokenId) {
      this.loading = true
      this.error = null
      try {
        const walletStore = useWalletStore()
        const provider = walletStore.ethersProvider
        const addresses = getAddresses(this.chainId)
        if (!provider || !addresses) throw new Error('Contracts not available')
        if (!addresses.operatorRegistry || addresses.operatorRegistry === ZERO_ADDR) throw new Error('OperatorRegistry not deployed')
        if (!addresses.nftContract || addresses.nftContract === ZERO_ADDR) throw new Error('NFT contract not configured')

        const signer = await provider.getSigner()
        const nft = new ethers.Contract(addresses.nftContract, ERC721_ENUMERABLE_ABI, signer)
        const registry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, signer)
        const id = BigInt(tokenId)

        const approved = await nft.getApproved(id)
        if (approved.toLowerCase() !== addresses.operatorRegistry.toLowerCase()) {
          const approveTx = await nft.approve(addresses.operatorRegistry, id)
          await approveTx.wait()
        }

        const tx = await registry.lockNftForCredit(id)
        await tx.wait()
        await this.checkNftBalance(walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async soloStake(ethAmountStr, referral = '0x0000000000000000000000000000000000000000') {
      this.loading = true
      this.error = null
      try {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Contracts not available')

        const { addresses, makeSigned } = ctx
        const router = await makeSigned(stakingRouterABI, addresses.stakingRouter)
        if (!router) throw new Error('StakingRouter not deployed')

        const amount = ethers.parseEther(String(ethAmountStr))
        if (amount < ethers.parseEther('32')) throw new Error('Minimum 32 ETH for solo staking')

        const tx = await router.submitToModule(SOLO_VALIDATOR_MODULE_ID, referral, { value: amount })
        await tx.wait()

        const walletStore = useWalletStore()
        await this.init(this.chainId, walletStore.address)
        return tx
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
