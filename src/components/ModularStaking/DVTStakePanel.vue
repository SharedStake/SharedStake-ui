<template>
  <div class="flex flex-col gap-4">
    <!-- Section A: Module Stats -->
    <section class="rounded-xl border border-border bg-card p-4">
      <div class="text-sm font-semibold text-foreground mb-3">
        DVT Module
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-lg bg-muted p-3">
          <div class="text-xs text-muted-foreground">
            Buffered Ether
          </div>
          <div class="text-sm font-semibold text-foreground mt-1">
            {{ formattedBufferedEther }} ETH
          </div>
        </div>
        <div class="rounded-lg bg-muted p-3">
          <div class="text-xs text-muted-foreground">
            Beacon Validators
          </div>
          <div class="text-sm font-semibold text-foreground mt-1">
            {{ beaconValidators }}
          </div>
        </div>
        <div class="rounded-lg bg-muted p-3">
          <div class="text-xs text-muted-foreground">
            Deposited Validators
          </div>
          <div class="text-sm font-semibold text-foreground mt-1">
            {{ depositedValidatorCount }}
          </div>
        </div>
      </div>
    </section>

    <hr class="border-border">

    <!-- Section B: My Clusters -->
    <section class="rounded-xl border border-border bg-card p-4">
      <div class="text-sm font-semibold text-foreground mb-3">
        My Clusters
      </div>

      <div
        v-if="!walletStore.isAuth"
        class="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-center"
      >
        Connect wallet to see your clusters
      </div>

      <div
        v-else-if="!contractsDeployed"
        class="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-center"
      >
        DVTModule not yet deployed on this network
      </div>

      <div
        v-else-if="userClusters.length === 0"
        class="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-center"
      >
        You are not a member of any DVT cluster
      </div>

      <div
        v-else
        class="flex flex-col gap-3"
      >
        <div
          v-for="cluster in userClusters"
          :key="cluster.id"
          class="rounded-lg border border-border bg-muted p-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-muted-foreground">
                Cluster ID
              </div>
              <div class="text-sm font-medium text-foreground">
                {{ truncateHex(cluster.id) }}
              </div>
            </div>
            <div
              class="rounded px-2 py-1 text-xs font-medium"
              :class="cluster.active ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-border bg-muted text-muted-foreground'"
            >
              {{ cluster.active ? 'Active' : 'Inactive' }}
            </div>
          </div>

          <div class="mt-2 text-xs text-muted-foreground">
            {{ cluster.operators.length }} operators, {{ cluster.threshold }}-of-{{ cluster.operators.length }} required
          </div>

          <div class="mt-2 text-xs text-muted-foreground">
            Deposits: {{ cluster.depositCount }}
          </div>

          <button
            class="mt-3 w-full rounded-lg bg-card py-2 text-sm font-medium text-foreground hover:bg-muted-foreground/10 transition-colors"
            @click="toggleProposals(cluster.id)"
          >
            {{ expandedClusters[cluster.id] ? 'Hide Proposals' : 'View Proposals' }}
          </button>

          <div
            v-if="expandedClusters[cluster.id]"
            class="mt-3 flex flex-col gap-2"
          >
            <div
              v-for="proposal in cluster.proposals"
              :key="proposal.id"
              class="rounded-lg border border-border bg-card p-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs text-muted-foreground">
                    Pubkey
                  </div>
                  <div class="text-sm font-medium text-foreground">
                    {{ truncateHex(proposal.pubkey, 12) }}
                  </div>
                </div>
                <div
                  class="rounded px-2 py-1 text-xs font-medium"
                  :class="getStatusClass(proposal)"
                >
                  {{ proposal.status }}
                </div>
              </div>

              <div class="mt-2 text-xs text-muted-foreground">
                {{ proposal.approvalCount }} / {{ cluster.threshold }} approvals
              </div>

              <div
                v-if="proposal.status === 'Pending' && !proposal.hasApproved"
                class="mt-3"
              >
                <button
                  class="w-full rounded-lg bg-pink-600 py-2 text-sm font-semibold text-white hover:bg-pink-500 transition-colors"
                  :disabled="loading"
                  @click="approveDeposit(proposal.id)"
                >
                  <span v-if="loading">Approving...</span>
                  <span v-else>Approve</span>
                </button>
              </div>

              <div
                v-else-if="proposal.status === 'Pending' && proposal.hasApproved"
                class="mt-3 rounded-lg border border-border bg-muted p-2 text-center text-xs text-muted-foreground"
              >
                Approved ✓
              </div>

              <div
                v-if="proposal.status === 'Pending' && cluster.isOperator"
                class="mt-2"
              >
                <button
                  class="w-full rounded-lg border border-border bg-muted py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  :disabled="loading"
                  @click="cancelProposal(proposal.id)"
                >
                  <span v-if="loading">Cancelling...</span>
                  <span v-else>Cancel</span>
                </button>
              </div>
            </div>

            <div
              v-if="cluster.proposals.length === 0"
              class="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground"
            >
              No proposals yet
            </div>
          </div>
        </div>
      </div>
    </section>

    <hr
      v-if="hasActiveCluster"
      class="border-border"
    >

    <!-- Section C: Propose New Deposit -->
    <section
      v-if="hasActiveCluster"
      class="rounded-xl border border-border bg-card p-4"
    >
      <div class="text-sm font-semibold text-foreground mb-3">
        Propose Validator Deposit
      </div>

      <div class="flex flex-col gap-3">
        <div>
          <label class="text-xs text-muted-foreground">Cluster</label>
          <select
            v-model="form.clusterId"
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option
              v-for="cluster in activeClusters"
              :key="cluster.id"
              :value="cluster.id"
            >
              {{ truncateHex(cluster.id) }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs text-muted-foreground">Pubkey</label>
          <input
            v-model="form.pubkey"
            type="text"
            placeholder="0x..."
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
        </div>

        <div>
          <label class="text-xs text-muted-foreground">Withdrawal Credentials</label>
          <input
            v-model="form.withdrawalCredentials"
            type="text"
            placeholder="0x..."
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
        </div>

        <div>
          <label class="text-xs text-muted-foreground">Signature</label>
          <input
            v-model="form.signature"
            type="text"
            placeholder="0x..."
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
        </div>

        <div>
          <label class="text-xs text-muted-foreground">Deposit Data Root</label>
          <input
            v-model="form.depositDataRoot"
            type="text"
            placeholder="0x..."
            class="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
        </div>

        <button
          class="w-full rounded-xl py-3.5 text-base font-semibold transition-all"
          :class="canPropose ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer' : 'bg-muted text-muted-foreground cursor-not-allowed'"
          :disabled="!canPropose || loading"
          @click="proposeDeposit"
        >
          <span v-if="loading">Proposing...</span>
          <span v-else-if="!contractsDeployed">Not Deployed</span>
          <span v-else>Propose Deposit</span>
        </button>
      </div>

      <div class="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        The DVT module buffers ETH from the protocol. Your cluster submits deposit data to activate validators. Ensure withdrawal credentials match the module's expectedWithdrawalCredentials before proposing.
      </div>
    </section>

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
import { getModularStakingAddresses, useModularStakingStore } from '@/stores/modularStaking'
import { useWalletStore } from '@/stores/wallet'
import { ethers } from 'ethers'
import dvtModuleABI from '@/contracts/abis/dvtModule.json'

export default {
  name: 'DVTStakePanel',

  setup() {
    return {
      store: useModularStakingStore(),
      walletStore: useWalletStore(),
    }
  },

  data() {
    return {
      loading: false,
      error: null,
      successMessage: null,
      contractsDeployed: false,
      
      // Module stats
      moduleStats: {
        bufferedEther: '0',
        beaconValidators: '0',
        depositedValidatorCount: '0',
      },
      
      // User clusters
      userClusters: [],
      expandedClusters: {},
      
      // Form
      form: {
        clusterId: '',
        pubkey: '',
        withdrawalCredentials: '',
        signature: '',
        depositDataRoot: '',
      },
    }
  },

  computed: {
    formattedBufferedEther() {
      if (!this.moduleStats.bufferedEther || this.moduleStats.bufferedEther === '0') return '0.0000'
      try {
        return parseFloat(ethers.formatEther(this.moduleStats.bufferedEther)).toFixed(4)
      } catch { return '0.0000' }
    },
    
    beaconValidators() {
      return this.moduleStats.beaconValidators.toString()
    },
    
    depositedValidatorCount() {
      return this.moduleStats.depositedValidatorCount.toString()
    },
    
    activeClusters() {
      return this.userClusters.filter(c => c.active)
    },
    
    hasActiveCluster() {
      return this.activeClusters.length > 0
    },
    
    canPropose() {
      return (
        this.walletStore.isAuth &&
        this.contractsDeployed &&
        this.form.clusterId &&
        this.form.pubkey &&
        this.form.withdrawalCredentials &&
        this.form.signature &&
        this.form.depositDataRoot &&
        !this.loading
      )
    },
  },

  watch: {
    'walletStore.address': 'refreshDVTData',
    'store.chainId': 'refreshForNetwork',
  },

  async mounted() {
    await this.checkContractDeployment()
    await this.refreshDVTData()
  },

  methods: {
    async refreshForNetwork() {
      this.contractsDeployed = false
      this.userClusters = []
      this.form.clusterId = ''
      await this.checkContractDeployment()
      await this.refreshDVTData()
    },

    async refreshDVTData() {
      await this.fetchModuleStats()

      if (this.walletStore.isAuth) {
        await this.fetchUserClusters()
      } else {
        this.userClusters = []
        this.form.clusterId = ''
      }
    },

    async checkContractDeployment() {
      try {
        const chainId = this.store.chainId
        if (!chainId) {
          this.contractsDeployed = false
          return
        }
        
        const addresses = this.getAddresses(chainId)
        if (!addresses) {
          this.contractsDeployed = false
          return
        }
        
        this.contractsDeployed = addresses.dvtModule !== '0x0000000000000000000000000000000000000000'
      } catch (e) {
        console.error('Error checking contract deployment:', e)
        this.contractsDeployed = false
      }
    },
    
    getAddresses(chainId) {
      return getModularStakingAddresses(chainId)
    },
    
    async getDVTContract() {
      const provider = this.walletStore.ethersProvider
      if (!provider) return null
      
      const chainId = this.store.chainId
      const addresses = this.getAddresses(chainId)
      if (!addresses || !this.contractsDeployed) return null
      
      return new ethers.Contract(addresses.dvtModule, dvtModuleABI, provider)
    },
    
    async getDVTContractSigned() {
      const provider = this.walletStore.ethersProvider
      if (!provider) return null
      
      const chainId = this.store.chainId
      const addresses = this.getAddresses(chainId)
      if (!addresses || !this.contractsDeployed) return null
      
      const signer = await provider.getSigner()
      return new ethers.Contract(addresses.dvtModule, dvtModuleABI, signer)
    },
    
    async fetchModuleStats() {
      try {
        const contract = await this.getDVTContract()
        if (!contract) return
        
        this.moduleStats.bufferedEther = (await contract.bufferedEther()).toString()
        this.moduleStats.beaconValidators = await contract.beaconValidators()
        this.moduleStats.depositedValidatorCount = await contract.depositedValidatorCount()
      } catch (e) {
        console.error('Error fetching module stats:', e)
      }
    },
    
    async fetchUserClusters() {
      try {
        const contract = await this.getDVTContract()
        if (!contract) return
        
        const userAddress = this.walletStore.address
        if (!userAddress) return
        
        const clusterCount = Number(await contract.clusterCount())
        const clusters = []
        
        for (let i = 0; i < clusterCount; i++) {
          const clusterId = await contract.clusterIdAt(i)
          const cluster = await contract.getCluster(clusterId)
          
          // Check if user is an operator in this cluster
          const isOperator = cluster.operators.some(op => op.toLowerCase() === userAddress.toLowerCase())
          
          if (isOperator) {
            const depositCount = await contract.clusterDepositCount(clusterId)
            
            // Fetch proposals
            const proposalCount = Number(await contract.clusterProposalCount(clusterId))
            const proposals = []
            
            for (let j = 0; j < proposalCount; j++) {
              const proposalId = await contract.clusterProposalAt(clusterId, j)
              const proposal = await contract.depositProposals(proposalId)
              const hasApproved = await contract.hasApproved(proposalId, userAddress)
              
              let status = 'Pending'
              if (proposal.executed) status = 'Executed'
              else if (proposal.cancelled) status = 'Cancelled'
              
              proposals.push({
                id: proposalId,
                pubkey: proposal.pubkey,
                approvalCount: Number(proposal.approvalCount),
                status,
                hasApproved,
              })
            }
            
            clusters.push({
              id: clusterId,
              operators: cluster.operators,
              threshold: Number(cluster.threshold),
              active: cluster.active,
              depositCount: Number(depositCount),
              isOperator,
              proposals,
            })
          }
        }
        
        this.userClusters = clusters
        
        // Set default cluster for form
        if (this.activeClusters.length > 0 && !this.form.clusterId) {
          this.form.clusterId = this.activeClusters[0].id
        }
      } catch (e) {
        console.error('Error fetching user clusters:', e)
      }
    },
    
    truncateHex(hex, length = 8) {
      if (!hex) return ''
      return hex.slice(0, 2 + length) + '...'
    },
    
    getStatusClass(proposal) {
      if (proposal.status === 'Pending') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      if (proposal.status === 'Executed') return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
      return 'border-border bg-muted text-muted-foreground'
    },
    
    toggleProposals(clusterId) {
      this.expandedClusters[clusterId] = !this.expandedClusters[clusterId]
    },
    
    async approveDeposit(proposalId) {
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const contract = await this.getDVTContractSigned()
        if (!contract) throw new Error('Contract not available')
        
        const tx = await contract.approveDeposit(proposalId)
        await tx.wait()
        
        this.successMessage = `Approved proposal ${this.truncateHex(proposalId)}`
        await this.fetchUserClusters()
        await this.fetchModuleStats()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    
    async cancelProposal(proposalId) {
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const contract = await this.getDVTContractSigned()
        if (!contract) throw new Error('Contract not available')
        
        const tx = await contract.cancelProposal(proposalId)
        await tx.wait()
        
        this.successMessage = `Cancelled proposal ${this.truncateHex(proposalId)}`
        await this.fetchUserClusters()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    
    async proposeDeposit() {
      if (!this.canPropose) return
      
      this.loading = true
      this.error = null
      this.successMessage = null
      try {
        const contract = await this.getDVTContractSigned()
        if (!contract) throw new Error('Contract not available')
        
        const tx = await contract.proposeDeposit(
          this.form.clusterId,
          this.form.pubkey,
          this.form.withdrawalCredentials,
          this.form.signature,
          this.form.depositDataRoot
        )
        const receipt = await tx.wait()
        
        // Find the DepositProposed event to get the proposalId
        const event = receipt.logs.find(log => {
          try {
            const parsed = contract.interface.parseLog(log)
            return parsed && parsed.name === 'DepositProposed'
          } catch { return false }
        })
        
        let proposalId = 'unknown'
        if (event) {
          const parsed = contract.interface.parseLog(event)
          proposalId = parsed.args.proposalId
        }
        
        this.successMessage = `Proposal submitted: ${this.truncateHex(proposalId)}`
        
        // Reset form
        this.form.pubkey = ''
        this.form.withdrawalCredentials = ''
        this.form.signature = ''
        this.form.depositDataRoot = ''
        
        await this.fetchUserClusters()
        await this.fetchModuleStats()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
