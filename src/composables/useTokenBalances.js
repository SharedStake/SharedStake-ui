// Token balance management composable for Vue 3 Composition API
import { ref, computed } from 'vue'
import BN from 'bignumber.js'
import { useWallet } from './useWallet'
import { validator, sgETH, wsgETH } from '@/contracts'
import { toChecksumAddress } from '@/utils/common'

BN.config({ ROUNDING_MODE: BN.ROUND_DOWN })
BN.config({ DECIMAL_PLACES: 5 })
BN.config({ EXPONENTIAL_AT: 100 })

export function useTokenBalances() {
  const { userAddress } = useWallet()
  
  // Reactive state
  const ethBalance = ref(BN(0))
  const vEth2Balance = ref(BN(0))
  const wsgETHBalance = ref(BN(0))
  const userApprovedVEth2 = ref(BN(0))
  const userApprovedwsgETH = ref(BN(0))
  const contractBalance = ref(BN(0))
  const remaining = ref(BN(0))
  const remainingByFee = ref(BN(0))
  const wsgETHRedemptionPrice = ref(BN(0))
  const isLoading = ref(false)
  
  // Computed properties
  const ethBalanceFormatted = computed(() => 
    ethBalance.value.dividedBy(1e18).toFixed(6)
  )
  
  const vEth2BalanceFormatted = computed(() => 
    vEth2Balance.value.dividedBy(1e18).toFixed(6)
  )
  
  const wsgETHBalanceFormatted = computed(() => 
    wsgETHBalance.value.dividedBy(1e18).toFixed(6)
  )
  
  const enoughFundsInExitPool = computed(() => 
    contractBalance.value.gt(0) // Simplified check
  )
  
  // Methods
  const loadBalances = async () => {
    if (!userAddress.value) return
    
    isLoading.value = true
    try {
      // Load ETH balance
      const amount = await window.ethereum.request({
        method: "eth_getBalance",
        params: [userAddress.value, "latest"],
      })
      ethBalance.value = BN(amount)
      
      // Load sgETH balance
      const sgETHContract = sgETH()
      if (sgETHContract) {
        const veth2 = await sgETHContract.balanceOf(userAddress.value)
        vEth2Balance.value = BN(veth2)
      }
      
      // Load wsgETH balance
      await loadWsgETHBalance()
      
      // Load contract data
      await loadContractData()
      
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  const loadWsgETHBalance = async () => {
    const wsgETHContract = wsgETH()
    if (!wsgETHContract) return
    
    try {
      const balance = await wsgETHContract.balanceOf(userAddress.value)
      wsgETHBalance.value = BN(balance)
    } catch (error) {
      console.error('Error loading wsgETH balance:', error)
    }
  }
  
  const loadContractData = async () => {
    const validatorContract = validator()
    if (!validatorContract) return
    
    try {
      // Load remaining space
      const remainingSpace = await validatorContract.remainingSpaceInEpoch()
      remaining.value = BN(remainingSpace)
      
      // Load admin fee total
      const adminFeeTotal = await validatorContract.adminFeeTotal()
      remainingByFee.value = BN(adminFeeTotal).multipliedBy(320)
      
      // Load contract balance
      const contractBal = await window.ethereum.request({
        method: "eth_getBalance",
        params: [toChecksumAddress(validatorContract.target), "latest"],
      })
      contractBalance.value = BN(contractBal)
      
      // Load wsgETH redemption price
      await loadWsgETHRedemptionPrice()
      
    } catch (error) {
      console.error('Error loading contract data:', error)
    }
  }
  
  const loadWsgETHRedemptionPrice = async () => {
    const wsgETHContract = wsgETH()
    if (!wsgETHContract) return
    
    try {
      const price = await wsgETHContract.pricePerShare()
      wsgETHRedemptionPrice.value = BN(price)
    } catch (error) {
      console.error('Error loading wsgETH redemption price:', error)
    }
  }
  
  const loadApprovals = async () => {
    if (!userAddress.value) return
    
    const wsgETHContract = wsgETH()
    const validatorContract = validator()
    
    if (!wsgETHContract || !validatorContract) return
    
    try {
      const userApproved = await wsgETHContract.allowance(
        userAddress.value, 
        validatorContract.target
      )
      userApprovedwsgETH.value = BN(userApproved)
    } catch (error) {
      console.error('Error loading approvals:', error)
    }
  }
  
  const refreshAll = async () => {
    await Promise.all([
      loadBalances(),
      loadApprovals()
    ])
  }
  
  return {
    // State
    ethBalance,
    vEth2Balance,
    wsgETHBalance,
    userApprovedVEth2,
    userApprovedwsgETH,
    contractBalance,
    remaining,
    remainingByFee,
    wsgETHRedemptionPrice,
    isLoading,
    
    // Computed
    ethBalanceFormatted,
    vEth2BalanceFormatted,
    wsgETHBalanceFormatted,
    enoughFundsInExitPool,
    
    // Methods
    loadBalances,
    loadWsgETHBalance,
    loadContractData,
    loadWsgETHRedemptionPrice,
    loadApprovals,
    refreshAll
  }
}