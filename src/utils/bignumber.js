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
  if (!n || !BN || !BN.isBigNumber || BN.isBigNumber(n) === false) {
    return "0";
  }
  return BN(n)
    .div(10 ** decimals)
    .decimalPlaces(displayDecimals)
    .toString();
}
