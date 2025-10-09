// Gas management composable for Vue 3 Composition API
import { ref, computed } from 'vue'
import { getCurrentGasPrices } from '@/utils/common.js'

export function useGas() {
  // Reactive state
  const gas = ref({
    low: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
    medium: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
    high: { maxFeePerGas: 0, maxPriorityFeePerGas: 0 },
  })
  const chosenGas = ref({ maxFeePerGas: 0, maxPriorityFeePerGas: 0 })
  const gasLevels = ref(['low', 'medium', 'high'])
  const isLoading = ref(false)
  
  // Computed properties
  const gasOptions = computed(() => [
    {
      text: (gas.value.low.maxFeePerGas + gas.value.low.maxPriorityFeePerGas).toFixed(1),
      value: 'low'
    },
    {
      text: (gas.value.medium.maxFeePerGas + gas.value.medium.maxPriorityFeePerGas).toFixed(1),
      value: 'medium'
    },
    {
      text: (gas.value.high.maxFeePerGas + gas.value.high.maxPriorityFeePerGas).toFixed(1),
      value: 'high'
    }
  ])
  
  // Methods
  const loadGasPrices = async () => {
    isLoading.value = true
    try {
      const gasPrices = await getCurrentGasPrices()
      gas.value = gasPrices
      chosenGas.value = gasPrices.medium // Default to medium
    } catch (error) {
      console.error('Error loading gas prices:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  const updateGas = (level) => {
    if (gas.value[level]) {
      chosenGas.value = gas.value[level]
    }
  }
  
  const getGasForTransaction = () => {
    return {
      maxFeePerGas: chosenGas.value.maxFeePerGas,
      maxPriorityFeePerGas: chosenGas.value.maxPriorityFeePerGas
    }
  }
  
  const calculateGasCost = (gasLimit = 200000) => {
    const totalGasCost = (chosenGas.value.maxFeePerGas + chosenGas.value.maxPriorityFeePerGas) * gasLimit
    return totalGasCost
  }
  
  return {
    // State
    gas,
    chosenGas,
    gasLevels,
    isLoading,
    
    // Computed
    gasOptions,
    
    // Methods
    loadGasPrices,
    updateGas,
    getGasForTransaction,
    calculateGasCost
  }
}