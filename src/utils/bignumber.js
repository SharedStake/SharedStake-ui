/**
 * BigNumber utility functions
 */
import BN from "bignumber.js";

/**
 * Parse BigNumber from wei to readable format
 * @param {BN|string|number} n - BigNumber value in wei
 * @param {number} decimals - Number of decimal places (default: 18)
 * @param {number} displayDecimals - Number of decimal places to display (default: 6)
 * @returns {string} Formatted number string
 */
export function parseBN(n, decimals = 18, displayDecimals = 6) {
  if (!n || BN.isBigNumber(n) === false) {
    return "0";
  }
  return BN(n)
    .div(10 ** decimals)
    .decimalPlaces(displayDecimals)
    .toString();
}

/**
 * Truncate number to 0.1 with ".." suffix if larger, for compact table display
 * @param {BN|string|number} n - BigNumber value in wei
 * @param {number} decimals - Number of decimal places (default: 18)
 * @returns {string} Truncated number string (e.g., "0.1.." or "0.05")
 */
export function truncateNumber(n, decimals = 18) {
  if (!n) {
    return "0";
  }
  try {
    const parsed = BN(n).div(10 ** decimals);
    const threshold = BN(0.1);
    
    if (parsed.gt(threshold)) {
      return "0.1..";
    }
    
    return parsed.decimalPlaces(6).toString();
  } catch (error) {
    console.warn("Error truncating number:", error);
    return "0";
  }
}
