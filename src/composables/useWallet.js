// Wallet composable for Vue 2 - eliminates duplication across 17+ components
import { useWalletStore } from '@/stores/wallet';

export function useWallet() {
  const walletStore = useWalletStore();
  
  return {
    walletStore,
    userAddress: walletStore.userAddress,
    isConnected: !!walletStore.userAddress,
    connect: () => walletStore.setAddress(),
    disconnect: () => walletStore.exit()
  };
}