<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="text-2xl font-semibold text-foreground">
      Operator Onboarding
    </div>

    <!-- Deploy notice when contracts not yet live -->
    <div
      v-if="!contractsDeployed"
      class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400"
    >
      OperatorRegistry not yet deployed on this network. Connect to localhost or a supported testnet.
    </div>

    <!-- Step 1: Check Eligibility -->
    <div
      v-if="currentStep === 1"
      class="flex flex-col gap-4"
    >
      <div class="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        <p class="font-semibold text-foreground mb-2">
          Requirements to become an operator:
        </p>
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              ETH Bond Required
            </div>
            <div class="font-semibold text-foreground">
              {{ ethBondRequired }} ETH
            </div>
          </div>
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              SGT Bond Required
            </div>
            <div class="font-semibold text-foreground">
              {{ sgtBondRequired }} SGT
            </div>
          </div>
        </div>
      </div>

      <!-- veSGT callout -->
      <div class="rounded-lg border border-border bg-card p-3 text-sm">
        <div class="text-muted-foreground">
          Hold veSGT (locked SGT) to qualify for reduced bond requirements in future tiers.
        </div>
        <router-link
          to="/govern"
          class="inline-block mt-2 text-pink-600 hover:text-pink-500 text-xs font-medium"
        >
          Lock SGT → veSGT
        </router-link>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Your ETH Balance</span>
          <span class="font-semibold text-foreground">{{ formattedEthBalance }} ETH</span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-muted-foreground">Your SGT Balance</span>
          <span class="font-semibold text-foreground">{{ formattedSgtBalance }} SGT</span>
        </div>
      </div>

      <!-- Already registered notice -->
      <div
        v-if="isRegistered"
        class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
      >
        You are already registered as an operator.
      </div>

      <button
        class="w-full rounded-xl py-3.5 text-base font-semibold transition-all"
        :class="canProceedToStep2
          ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer'
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
        :disabled="!canProceedToStep2 || loading"
        @click="goToStep2"
      >
        <span v-if="loading">Checking...</span>
        <span v-else-if="!walletStore.isAuth">Connect Wallet</span>
        <span v-else-if="isRegistered">View Dashboard</span>
        <span v-else>Proceed to Bond</span>
      </button>
    </div>

    <!-- Step 2: Bond SGT + ETH -->
    <div
      v-if="currentStep === 2"
      class="flex flex-col gap-4"
    >
      <div class="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        <p class="font-semibold text-foreground mb-2">
          Bond Configuration
        </p>
        
        <div class="mt-3">
          <label class="text-xs text-muted-foreground">Number of Slots (1-10)</label>
          <input
            v-model="slotCount"
            type="number"
            min="1"
            max="10"
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            @input="updateBondAmounts"
          >
        </div>

        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              ETH Bond Required
            </div>
            <div class="font-semibold text-foreground">
              {{ totalEthBond }} ETH
            </div>
          </div>
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              SGT Bond Required
            </div>
            <div class="font-semibold text-foreground">
              {{ totalSgtBond }} SGT
            </div>
          </div>
        </div>
      </div>

      <!-- SGT Allowance Check -->
      <div
        v-if="!hasSgtAllowance"
        class="rounded-lg border border-border bg-card p-4"
      >
        <div class="text-sm text-muted-foreground mb-2">
          SGT Allowance: {{ formattedSgtAllowance }} / {{ totalSgtBond }} SGT
        </div>
        <button
          class="w-full rounded-xl py-3.5 text-base font-semibold transition-all bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
          :disabled="loading || !contractsDeployed"
          @click="approveSgt"
        >
          <span v-if="loading">Approving...</span>
          <span v-else>Approve SGT</span>
        </button>
      </div>

      <!-- Register Button (shown after approval) -->
      <div
        v-if="hasSgtAllowance"
        class="rounded-lg border border-border bg-card p-4"
      >
        <div class="text-sm text-muted-foreground mb-2">
          Ready to register as operator with {{ slotCount }} slot(s)
        </div>
        <button
          class="w-full rounded-xl py-3.5 text-base font-semibold transition-all bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
          :disabled="loading || !contractsDeployed"
          @click="registerOperator"
        >
          <span v-if="loading">Registering...</span>
          <span v-else>Register as Operator</span>
        </button>
      </div>

      <button
        class="w-full rounded-xl py-3.5 text-base font-semibold transition-all bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        :disabled="loading"
        @click="goToStep1"
      >
        Back
      </button>
    </div>

    <!-- Step 3: Operator Dashboard -->
    <div
      v-if="currentStep === 3"
      class="flex flex-col gap-4"
    >
      <div class="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        <p class="font-semibold text-foreground mb-2">
          Operator Dashboard
        </p>
        
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              Bonded ETH
            </div>
            <div class="font-semibold text-foreground">
              {{ formattedEthBonded }} ETH
            </div>
          </div>
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              Bonded SGT
            </div>
            <div class="font-semibold text-foreground">
              {{ formattedSgtBonded }} SGT
            </div>
          </div>
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              Validator Slots
            </div>
            <div class="font-semibold text-foreground">
              {{ operatorInfo.totalSlots }}
            </div>
          </div>
          <div class="rounded bg-card p-3">
            <div class="text-muted-foreground text-xs">
              Active Validators
            </div>
            <div class="font-semibold text-foreground">
              {{ operatorInfo.activeValidators }}
            </div>
          </div>
        </div>

        <div class="rounded bg-card p-3 mt-3">
          <div class="text-muted-foreground text-xs">
            Available Slots
          </div>
          <div class="font-semibold text-foreground">
            {{ availableSlots }}
          </div>
        </div>
      </div>

      <!-- Expand Slots -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="text-sm text-muted-foreground mb-2">
          Expand Slots
        </div>
        <div class="flex gap-2">
          <input
            v-model="expandSlotCount"
            type="number"
            min="1"
            max="10"
            placeholder="Additional slots"
            class="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-foreground"
          >
          <button
            class="rounded-xl px-4 py-2 text-base font-semibold transition-all bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
            :disabled="loading || !contractsDeployed || !expandSlotCount"
            @click="expandSlots"
          >
            <span v-if="loading">Expanding...</span>
            <span v-else>Expand</span>
          </button>
        </div>
      </div>

      <!-- Exit Bond (danger action) -->
      <div
        v-if="operatorInfo.activeValidators === 0"
        class="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
      >
        <div class="text-sm text-red-700 dark:text-red-400 mb-2">
          ⚠️ This returns your full ETH and SGT bond. You cannot have active validators.
        </div>
        <button
          class="w-full rounded-xl py-3.5 text-base font-semibold transition-all bg-red-600 hover:bg-red-500 text-white cursor-pointer"
          :disabled="loading || !contractsDeployed"
          @click="exitBond"
        >
          <span v-if="loading">Exiting...</span>
          <span v-else>Exit Bond</span>
        </button>
      </div>

      <button
        class="w-full rounded-xl py-3.5 text-base font-semibold transition-all bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        :disabled="loading"
        @click="goToStep1"
      >
        Back to Eligibility
      </button>
    </div>

    <!-- Error messages -->
    <div
      v-if="error"
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ error }}
    </div>

    <!-- Success message -->
    <div
      v-if="successMessage"
      class="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
    >
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
import { useModularStakingStore } from '@/stores/modularStaking'
import { useWalletStore } from '@/stores/wallet'
import { ethers } from 'ethers'
import operatorRegistryABI from '@/contracts/abis/operatorRegistry.json'
import sgtTokenABI from '@/contracts/abis/sgETH.json'

export default {
  name: 'SoloStakePanel',

  setup() {
    return {
      store: useModularStakingStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      currentStep: 1,
      loading: false,
      error: null,
      successMessage: null,
      
      // Bond configuration (default values, will be updated from contract)
      ethBondPerSlot: 1,
      sgtBondPerSlot: 1000,
      
      // User input
      slotCount: 1,
      expandSlotCount: 1,
      
      // Operator info
      operatorInfo: {
        ethBonded: '0',
        sgtBonded: '0',
        activeValidators: 0,
        totalSlots: 0,
      },
      
      // SGT allowance
      sgtAllowance: '0',
      sgtBalance: '0',
      
      // Contract deployment status
      contractsDeployed: false,
    }
  },

  computed: {
    formattedEthBalance() {
      if (!this.store.ethBalance || this.store.ethBalance === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.store.ethBalance)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    formattedSgtBalance() {
      if (!this.sgtBalance || this.sgtBalance === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.sgtBalance)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    formattedSgtAllowance() {
      if (!this.sgtAllowance || this.sgtAllowance === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.sgtAllowance)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    ethBondRequired() {
      return this.ethBondPerSlot
    },
    
    sgtBondRequired() {
      return this.sgtBondPerSlot
    },
    
    totalEthBond() {
      return (this.ethBondPerSlot * this.slotCount).toFixed(2)
    },
    
    totalSgtBond() {
      return (this.sgtBondPerSlot * this.slotCount).toLocaleString()
    },
    
    hasSgtAllowance() {
      const required = ethers.parseEther(this.totalSgtBond.replace(/,/g, ''))
      const allowance = BigInt(this.sgtAllowance || '0')
      return allowance >= required
    },
    
    isRegistered() {
      return this.operatorInfo.totalSlots > 0
    },
    
    canProceedToStep2() {
      return (
        this.walletStore.isAuth &&
        !this.loading
      )
    },
    
    formattedEthBonded() {
      if (!this.operatorInfo.ethBonded || this.operatorInfo.ethBonded === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.operatorInfo.ethBonded)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    formattedSgtBonded() {
      if (!this.operatorInfo.sgtBonded || this.operatorInfo.sgtBonded === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.operatorInfo.sgtBonded)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    availableSlots() {
      return Math.max(0, this.operatorInfo.totalSlots - this.operatorInfo.activeValidators)
    },
  },

  async mounted() {
    await this.checkContractDeployment()
    if (this.walletStore.isAuth) {
      await this.fetchUserData()
    }
  },

  methods: {
    async checkContractDeployment() {
      try {
        const chainId = this.store.chainId
        if (!chainId) return
        
        const addresses = this.getAddresses(chainId)
        if (!addresses) return
        
        // Check if operatorRegistry is deployed (non-zero address)
        this.contractsDeployed = addresses.operatorRegistry !== '0x0000000000000000000000000000000000000000'
        
        if (this.contractsDeployed) {
          await this.fetchBondConfig()
        }
      } catch (e) {
        console.error('Error checking contract deployment:', e)
        this.contractsDeployed = false
      }
    },
    
    getAddresses(chainId) {
      const normalizeChainId = (id) => {
        if (!id && id !== 0) return ''
        if (typeof id === 'bigint') return '0x' + id.toString(16)
        if (typeof id === 'number') return '0x' + id.toString(16)
        if (typeof id === 'string' && !id.toLowerCase().startsWith('0x')) return '0x' + parseInt(id, 10).toString(16)
        return id.toLowerCase()
      }
      
      const CONTRACT_ADDRESSES = {
        '0x1': {
          stakingRouter: '0x0000000000000000000000000000000000000000',
          stToken: '0x0000000000000000000000000000000000000000',
          wstToken: '0x0000000000000000000000000000000000000000',
          withdrawalQueueV2: '0x0000000000000000000000000000000000000000',
          validatorModule: '0x0000000000000000000000000000000000000000',
          operatorRegistry: '0x0000000000000000000000000000000000000000',
          sgtToken: '0x84810bcF08744d5862B8181f12d17bfd57d3b078',
        },
        '0xaa36a7': {
          stakingRouter: '0x0000000000000000000000000000000000000000',
          stToken: '0x0000000000000000000000000000000000000000',
          wstToken: '0x0000000000000000000000000000000000000000',
          withdrawalQueueV2: '0x0000000000000000000000000000000000000000',
          validatorModule: '0x0000000000000000000000000000000000000000',
          operatorRegistry: '0x0000000000000000000000000000000000000000',
          sgtToken: '0x0000000000000000000000000000000000000000',
        },
        '0x7a69': {
          stakingRouter: '0x0000000000000000000000000000000000000000',
          stToken: '0x0000000000000000000000000000000000000000',
          wstToken: '0x0000000000000000000000000000000000000000',
          withdrawalQueueV2: '0x0000000000000000000000000000000000000000',
          validatorModule: '0x0000000000000000000000000000000000000000',
          operatorRegistry: '0x0000000000000000000000000000000000000000',
          sgtToken: '0x0000000000000000000000000000000000000000',
        },
      }
      
      const cid = normalizeChainId(chainId)
      return CONTRACT_ADDRESSES[cid] || null
    },
    
    async fetchBondConfig() {
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) return
        
        const provider = this.walletStore.ethersProvider
        if (!provider) return
        
        const operatorRegistry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, provider)
        
        // Get default config
        const defaultConfigName = await operatorRegistry.defaultConfigName()
        const config = await operatorRegistry.bondConfigs(defaultConfigName)
        
        this.ethBondPerSlot = parseFloat(ethers.formatEther(config.ethBondPerSlot))
        this.sgtBondPerSlot = parseFloat(ethers.formatEther(config.sgtBondPerSlot))
      } catch (e) {
        console.error('Error fetching bond config:', e)
      }
    },
    
    async fetchUserData() {
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) return
        
        const provider = this.walletStore.ethersProvider
        if (!provider) return
        
        const userAddress = this.walletStore.address
        if (!userAddress) return
        
        // Get SGT balance and allowance
        const sgtToken = new ethers.Contract(addresses.sgtToken, sgtTokenABI, provider)
        this.sgtBalance = (await sgtToken.balanceOf(userAddress)).toString()
        this.sgtAllowance = (await sgtToken.allowance(userAddress, addresses.operatorRegistry)).toString()
        
        // Get operator info
        const operatorRegistry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, provider)
        const opInfo = await operatorRegistry.operators(userAddress)
        
        this.operatorInfo = {
          ethBonded: opInfo.ethBonded.toString(),
          sgtBonded: opInfo.sgtBonded.toString(),
          activeValidators: Number(opInfo.activeValidators),
          totalSlots: Number(opInfo.totalSlots),
        }
        
        // If already registered, skip to step 3
        if (this.isRegistered && this.currentStep === 1) {
          this.currentStep = 3
        }
      } catch (e) {
        console.error('Error fetching user data:', e)
      }
    },
    
    updateBondAmounts() {
      // Ensure slot count is within bounds
      if (this.slotCount < 1) this.slotCount = 1
      if (this.slotCount > 10) this.slotCount = 10
    },
    
    goToStep1() {
      this.currentStep = 1
      this.error = null
      this.successMessage = null
    },
    
    async goToStep2() {
      if (this.isRegistered) {
        this.currentStep = 3
      } else {
        this.currentStep = 2
      }
      this.error = null
      this.successMessage = null
    },
    
    async approveSgt() {
      this.loading = true
      this.error = null
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) {
          throw new Error('Contracts not deployed')
        }
        
        const provider = this.walletStore.ethersProvider
        const signer = await provider.getSigner()
        const sgtToken = new ethers.Contract(addresses.sgtToken, sgtTokenABI, signer)
        
        const amount = ethers.parseEther(this.totalSgtBond.replace(/,/g, ''))
        const tx = await sgtToken.approve(addresses.operatorRegistry, amount)
        await tx.wait()
        
        // Refresh allowance
        await this.fetchUserData()
        this.successMessage = 'SGT approved successfully'
      } catch (e) {
        this.error = e.message
        console.error('Error approving SGT:', e)
      } finally {
        this.loading = false
      }
    },
    
    async registerOperator() {
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) {
          throw new Error('Contracts not deployed')
        }
        
        const provider = this.walletStore.ethersProvider
        const signer = await provider.getSigner()
        const operatorRegistry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, signer)
        
        const ethAmount = ethers.parseEther(this.totalEthBond)
        const configName = ethers.encodeBytes32String('default') // Use default config
        
        const tx = await operatorRegistry.registerBond(configName, this.slotCount, { value: ethAmount })
        await tx.wait()
        
        // Refresh user data
        await this.fetchUserData()
        this.currentStep = 3
        this.successMessage = 'Operator registered successfully'
      } catch (e) {
        this.error = e.message
        console.error('Error registering operator:', e)
      } finally {
        this.loading = false
      }
    },
    
    async expandSlots() {
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) {
          throw new Error('Contracts not deployed')
        }
        
        const provider = this.walletStore.ethersProvider
        const signer = await provider.getSigner()
        const operatorRegistry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, signer)
        
        const ethAmount = ethers.parseEther((this.ethBondPerSlot * this.expandSlotCount).toString())
        
        const tx = await operatorRegistry.expandSlots(this.expandSlotCount, { value: ethAmount })
        await tx.wait()
        
        // Refresh user data
        await this.fetchUserData()
        this.successMessage = 'Slots expanded successfully'
        this.expandSlotCount = 1
      } catch (e) {
        this.error = e.message
        console.error('Error expanding slots:', e)
      } finally {
        this.loading = false
      }
    },
    
    async exitBond() {
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const chainId = this.store.chainId
        const addresses = this.getAddresses(chainId)
        if (!addresses || !this.contractsDeployed) {
          throw new Error('Contracts not deployed')
        }
        
        const provider = this.walletStore.ethersProvider
        const signer = await provider.getSigner()
        const operatorRegistry = new ethers.Contract(addresses.operatorRegistry, operatorRegistryABI, signer)
        
        const tx = await operatorRegistry.exitBond()
        await tx.wait()
        
        // Refresh user data
        await this.fetchUserData()
        this.currentStep = 1
        this.successMessage = 'Bond exited successfully'
      } catch (e) {
        this.error = e.message
        console.error('Error exiting bond:', e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>