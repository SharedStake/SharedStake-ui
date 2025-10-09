/**
 * Token balance composable for consistent token balance management
 * Centralizes token balance fetching and parsing logic
 */
import { useBigNumber } from "./useBigNumber";
import { useWallet } from "./useWallet";

export function useTokenBalance() {
  const { parseBN, formatBN } = useBigNumber();
  const { userAddress } = useWallet();

  /**
   * Get token balance from contract
   * @param {Function} contract - Contract instance
   * @param {string} address - User address
   * @returns {Promise<BN>} Token balance
   */
  const getTokenBalance = async (contract, address) => {
    try {
      if (!contract || !address) return parseBN(0);
      
      const balance = await contract.balanceOf(address);
      return parseBN(balance.toString());
    } catch (error) {
      console.error("Error getting token balance:", error);
      return parseBN(0);
    }
  };

  /**
   * Get ETH balance
   * @param {string} address - User address
   * @returns {Promise<BN>} ETH balance
   */
  const getETHBalance = async (address) => {
    try {
      if (!address) return parseBN(0);
      
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      
      return parseBN(balance);
    } catch (error) {
      console.error("Error getting ETH balance:", error);
      return parseBN(0);
    }
  };

  /**
   * Get token allowance
   * @param {Function} tokenContract - Token contract
   * @param {string} owner - Owner address
   * @param {string} spender - Spender address
   * @returns {Promise<BN>} Token allowance
   */
  const getTokenAllowance = async (tokenContract, owner, spender) => {
    try {
      if (!tokenContract || !owner || !spender) return parseBN(0);
      
      const allowance = await tokenContract.allowance(owner, spender);
      return parseBN(allowance.toString());
    } catch (error) {
      console.error("Error getting token allowance:", error);
      return parseBN(0);
    }
  };

  /**
   * Check if user has sufficient balance
   * @param {BN} balance - User balance
   * @param {BN} amount - Required amount
   * @returns {boolean} Has sufficient balance
   */
  const hasSufficientBalance = (balance, amount) => {
    return balance.gte(amount);
  };

  /**
   * Check if user has approved sufficient amount
   * @param {BN} allowance - Current allowance
   * @param {BN} amount - Required amount
   * @returns {boolean} Has sufficient allowance
   */
  const hasSufficientAllowance = (allowance, amount) => {
    return allowance.gte(amount);
  };

  /**
   * Format balance for display
   * @param {BN} balance - Balance to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted balance
   */
  const formatBalance = (balance, decimals = 6) => {
    return formatBN(balance, decimals);
  };

  return {
    getTokenBalance,
    getETHBalance,
    getTokenAllowance,
    hasSufficientBalance,
    hasSufficientAllowance,
    formatBalance,
    parseBN,
    formatBN
  };
}