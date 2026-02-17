/**
 * BigNumber composable for consistent configuration across the app
 * Centralizes BigNumber.js configuration to reduce duplication
 */
import BN from "bignumber.js";

// Configure BigNumber globally
BN.config({ 
  ROUNDING_MODE: BN.ROUND_DOWN,
  DECIMAL_PLACES: 5,
  EXPONENTIAL_AT: 100 
});

export function useBigNumber() {
  /**
   * Parse a value to BigNumber with consistent formatting
   * @param {string|number|BN} value - Value to parse
   * @returns {BN} BigNumber instance
   */
  const parseBN = (value) => {
    if (!value || value === 0) return BN(0);
    return BN(value);
  };

  /**
   * Format BigNumber to readable string with 6 decimal places
   * @param {BN} bn - BigNumber instance
   * @param {number} decimals - Number of decimal places (default: 6)
   * @returns {string} Formatted string
   */
  const formatBN = (bn, decimals = 6) => {
    if (!bn || !bn.isBigNumber) return "0";
    return bn.dividedBy(1e18).decimalPlaces(decimals).toString();
  };

  /**
   * Convert ETH amount to wei
   * @param {string|number} amount - Amount in ETH
   * @returns {string} Amount in wei
   */
  const toWei = (amount) => {
    if (!amount || amount === 0) return "0";
    return BN(amount).multipliedBy(1e18).toString();
  };

  /**
   * Convert wei to ETH
   * @param {string|number} wei - Amount in wei
   * @returns {string} Amount in ETH
   */
  const fromWei = (wei) => {
    if (!wei || wei === 0) return "0";
    return BN(wei).dividedBy(1e18).toString();
  };

  /**
   * Check if amount is valid (greater than 0 and not NaN)
   * @param {string|number} amount - Amount to validate
   * @returns {boolean} Is valid amount
   */
  const isValidAmount = (amount) => {
    if (!amount || amount === "" || isNaN(amount)) return false;
    return parseFloat(amount) > 0;
  };

  /**
   * Get max amount considering gas fees
   * @param {BN} balance - User balance
   * @param {Object} gasFees - Gas fees object
   * @returns {BN} Max amount after gas deduction
   */
  const getMaxAmountAfterGas = (balance, gasFees) => {
    if (!gasFees || !balance) return balance;
    
    const gasCost = BN(gasFees.maxFeePerGas + gasFees.maxPriorityFeePerGas)
      .multipliedBy(200000) // Estimated gas limit
      .multipliedBy(1000000000); // Convert to wei
    
    return balance.minus(gasCost);
  };

  return {
    BN,
    parseBN,
    formatBN,
    toWei,
    fromWei,
    isValidAmount,
    getMaxAmountAfterGas
  };
}