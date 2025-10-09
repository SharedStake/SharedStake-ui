// Wallet composable for Vue 3 Composition API
import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'

export function useWallet() {
  const walletStore = useWalletStore()
  
  // Computed properties
  const userAddress = computed(() => walletStore.userAddress)
  const isConnected = computed(() => walletStore.isAuth)
  const network = computed(() => walletStore.getNetwork)
  const networkId = computed(() => walletStore.getNetworkId)
  const ethersProvider = computed(() => walletStore.ethersProvider)
  
  // Methods
  const connect = async () => {
    await walletStore.setAddress()
  }
  
  const disconnect = () => {
    walletStore.exit()
  }
  
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  const isAddressValid = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
  
  return {
    // State
    userAddress,
    isConnected,
    network,
    networkId,
    ethersProvider,
    
    // Methods
    connect,
    disconnect,
    formatAddress,
    isAddressValid
  }
}