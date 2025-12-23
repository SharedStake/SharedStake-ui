/**
 * Wallet composable for consistent wallet state management
 * Centralizes wallet-related logic to reduce duplication
 */
import { useWalletStore } from "@/stores/wallet";

export function useWallet() {
  const walletStore = useWalletStore();

  /**
   * Get user's wallet address
   * @returns {string|null} User's wallet address
   */
  const userAddress = () => walletStore.userAddress;

  /**
   * Check if user is connected
   * @returns {boolean} Is user connected
   */
  const isConnected = () => !!walletStore.userAddress;

  /**
   * Connect wallet
   */
  const connect = async () => {
    await walletStore.setAddress();
  };

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    walletStore.exit();
  };

  /**
   * Get formatted address (first 4 + last 4 characters)
   * @returns {string} Formatted address
   */
  const getFormattedAddress = () => {
    const address = userAddress();
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  /**
   * Get network information
   * @returns {Object} Network info
   */
  const getNetwork = () => ({
    id: walletStore.getNetworkId,
    name: walletStore.getNetwork
  });

  return {
    userAddress,
    isConnected,
    connect,
    disconnect,
    getFormattedAddress,
    getNetwork,
    walletStore
  };
}