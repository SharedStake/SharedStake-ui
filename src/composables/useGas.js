/**
 * Gas management composable for consistent gas price handling
 * Centralizes gas price fetching and management logic
 */
import { getCurrentGasPrices } from "@/utils/common";
import { useBigNumber } from "./useBigNumber";

export function useGas() {
  const { parseBN } = useBigNumber();

  /**
   * Get current gas prices
   * @returns {Promise<Object>} Gas prices object
   */
  const getGasPrices = async () => {
    try {
      return await getCurrentGasPrices();
    } catch (error) {
      console.error("Error fetching gas prices:", error);
      // Return fallback gas prices
      return {
        low: { maxFeePerGas: 29, maxPriorityFeePerGas: 1 },
        medium: { maxFeePerGas: 58, maxPriorityFeePerGas: 2 },
        high: { maxFeePerGas: 117, maxPriorityFeePerGas: 3 }
      };
    }
  };

  /**
   * Get gas price in gwei for display
   * @param {Object} gasPrice - Gas price object
   * @returns {string} Formatted gas price
   */
  const getGasPriceDisplay = (gasPrice) => {
    if (!gasPrice) return "0";
    const total = gasPrice.maxFeePerGas + gasPrice.maxPriorityFeePerGas;
    return total.toFixed(1);
  };

  /**
   * Convert gas price to wei for transaction
   * @param {Object} gasPrice - Gas price object
   * @returns {Object} Gas price in wei
   */
  const convertGasToWei = (gasPrice) => {
    if (!gasPrice) return { maxFeePerGas: "0", maxPriorityFeePerGas: "0" };
    
    return {
      maxFeePerGas: parseBN(gasPrice.maxFeePerGas)
        .multipliedBy(1000000000)
        .toString(),
      maxPriorityFeePerGas: parseBN(gasPrice.maxPriorityFeePerGas)
        .multipliedBy(1000000000)
        .toString()
    };
  };

  /**
   * Calculate gas cost for a transaction
   * @param {Object} gasPrice - Gas price object
   * @param {number} gasLimit - Gas limit (default: 200000)
   * @returns {BN} Total gas cost in wei
   */
  const calculateGasCost = (gasPrice, gasLimit = 200000) => {
    if (!gasPrice) return parseBN(0);
    
    const totalGasPrice = parseBN(gasPrice.maxFeePerGas + gasPrice.maxPriorityFeePerGas);
    return totalGasPrice.multipliedBy(gasLimit).multipliedBy(1000000000);
  };

  /**
   * Get gas level names
   * @returns {Array} Array of gas level names
   */
  const getGasLevels = () => ["low", "medium", "high"];

  return {
    getGasPrices,
    getGasPriceDisplay,
    convertGasToWei,
    calculateGasCost,
    getGasLevels
  };
}