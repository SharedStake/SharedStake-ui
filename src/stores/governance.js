/**
 * Pinia store for SharedStake V2 Governance
 * (VoteEscrowV2 + SharedStakeGovernor + GovernanceTimelock)
 */
import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import { useWalletStore } from './wallet'
import { normalizeChainId } from '@/utils/common'

import voteEscrowV2ABI from '@/contracts/abis/voteEscrowV2.json'
import sharedStakeGovernorABI from '@/contracts/abis/sharedStakeGovernor.json'
import sgtABI from '@/contracts/abis/erc20.json'

import mainnetAddresses from '@/contracts/addresses/mainnet.json'
import goerliAddresses from '@/contracts/addresses/goerli.json'
import sepoliaAddresses from '@/contracts/addresses/sepolia.json'
import localAddresses from '@/contracts/addresses/local.json'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const ADDRESS_BOOK = {
  '0x1': mainnetAddresses,
  '0x5': goerliAddresses,
  '0xaa36a7': sepoliaAddresses,
  '0x7a69': localAddresses,
  '0x539': localAddresses,
}

function getAddresses(chainId) {
  const cid = normalizeChainId(chainId)
  const source = ADDRESS_BOOK[cid]
  if (!source) return null
  return {
    voteEscrowV2: source.voteEscrowV2 || ZERO_ADDR,
    sharedStakeGovernor: source.sharedStakeGovernor || ZERO_ADDR,
    governanceTimelock: source.governanceTimelock || ZERO_ADDR,
    sgtV2: source.sgtV2 || ZERO_ADDR,
  }
}

export const useGovernanceStore = defineStore('governance', {
  state: () => ({
    chainId: null,
    connected: false,
    loading: false,
    error: null,

    // VoteEscrowV2
    veSGTBalance: '0',
    lockedAmount: '0',
    lockedEnd: '0',
    minLockedAmount: '0',
    earlyWithdrawPenaltyRate: '0',

    // Governor
    proposalCount: '0',
    quorum: '0',
    votingDelay: '0',
    votingPeriod: '0',
    proposalThreshold: '0',

    // SGT
    sgtBalance: '0',
    sgtAllowance: '0',

    contractsDeployed: false,
  }),

  getters: {
    formattedVeSGT: (state) => {
      try { return parseFloat(ethers.formatEther(state.veSGTBalance)).toFixed(4) } catch { return '0.0000' }
    },
    formattedLocked: (state) => {
      try { return parseFloat(ethers.formatEther(state.lockedAmount)).toFixed(4) } catch { return '0.0000' }
    },
    formattedSGT: (state) => {
      try { return parseFloat(ethers.formatEther(state.sgtBalance)).toFixed(4) } catch { return '0.0000' }
    },
    lockExpired: (state) => {
      try { return Date.now() / 1000 > Number(state.lockedEnd) } catch { return false }
    },
    lockTimeRemaining: (state) => {
      try {
        const remaining = Number(state.lockedEnd) - Math.floor(Date.now() / 1000)
        return remaining > 0 ? remaining : 0
      } catch { return 0 }
    },
  },

  actions: {
    _getContracts() {
      const walletStore = useWalletStore()
      let provider = walletStore.ethersProvider
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum)
        walletStore.setEthersProvider(provider)
      }
      if (!provider) return null

      const chainId = this.chainId || walletStore.network
      const addresses = getAddresses(chainId)
      if (!addresses) return null

      const allDeployed = Object.values(addresses).every(a => a !== ZERO_ADDR)
      this.contractsDeployed = allDeployed
      if (!allDeployed) return null

      const make = (abi, addr) => new ethers.Contract(addr, abi, provider)
      const makeSigned = async (abi, addr) => {
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

    async init(chainId, userAddress) {
      this.chainId = chainId
      this.connected = !!userAddress

      const ctx = this._getContracts()
      if (!ctx) return

      const { addresses, make } = ctx
      try {
        const ve = make(voteEscrowV2ABI, addresses.voteEscrowV2)
        const gov = make(sharedStakeGovernorABI, addresses.sharedStakeGovernor)
        const sgt = make(sgtABI, addresses.sgtV2)

        if (ve) {
          this.minLockedAmount = (await ve.minLockedAmount()).toString()
          this.earlyWithdrawPenaltyRate = (await ve.earlyWithdrawPenaltyRate()).toString()
          if (userAddress) {
            const locked = await ve.locked(userAddress)
            this.lockedAmount = locked.amount.toString()
            this.lockedEnd = locked.end.toString()
            this.veSGTBalance = (await ve.balanceOf(userAddress)).toString()
          }
        }

        if (gov) {
          this.votingDelay = (await gov.votingDelay()).toString()
          this.votingPeriod = (await gov.votingPeriod()).toString()
          this.proposalThreshold = (await gov.proposalThreshold()).toString()
          // quorum takes blockNumber param
          try {
            const walletStore2 = useWalletStore()
            const providerRef = walletStore2.ethersProvider
            const block = await providerRef.getBlockNumber()
            this.quorum = (await gov.quorum(block)).toString()
          } catch (err) {
            console.warn('GovernanceStore: failed to read quorum', err)
          }
        }

        if (sgt && userAddress) {
          this.sgtBalance = (await sgt.balanceOf(userAddress)).toString()
          this.sgtAllowance = (await sgt.allowance(userAddress, addresses.voteEscrowV2)).toString()
        }
      } catch (e) {
        console.error('GovernanceStore.init error:', e)
        this.error = e.message
      }
    },

    async lockSGT(amountStr, days) {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Governance contracts not available')

        const { addresses, makeSigned } = ctx
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2)
        const sgt = await makeSigned(sgtABI, addresses.sgtV2)

        const amount = ethers.parseEther(amountStr)

        // Approve if needed
        const allowance = await sgt.allowance(
          (await sgt.runner.getAddress()),
          addresses.voteEscrowV2
        )
        if (allowance < amount) {
          const approveTx = await sgt.approve(addresses.voteEscrowV2, amount)
          await approveTx.wait()
        }

        const tx = await ve.create_lock(amount, days)
        await tx.wait()
        return tx
      })
    },

    async withdrawVeSGT() {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Governance contracts not available')

        const { addresses, makeSigned } = ctx
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2)

        const tx = await ve.withdraw()
        await tx.wait()
        return tx
      })
    },

    async emergencyWithdrawVeSGT() {
      return this._withTx(async () => {
        const ctx = this._getContracts()
        if (!ctx) throw new Error('Governance contracts not available')

        const { addresses, makeSigned } = ctx
        const ve = await makeSigned(voteEscrowV2ABI, addresses.voteEscrowV2)

        const tx = await ve.emergencyWithdraw()
        await tx.wait()
        return tx
      })
    },
  },
})
