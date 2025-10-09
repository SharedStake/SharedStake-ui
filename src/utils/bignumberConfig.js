// Centralized BigNumber configuration to eliminate duplication
import BigNumber from 'bignumber.js';

export function configureBigNumber() {
  BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });
  BigNumber.config({ EXPONENTIAL_AT: 100 });
  return BigNumber;
}

// Pre-configured BN instance
export const BN = configureBigNumber();