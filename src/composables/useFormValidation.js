/**
 * Form validation composable for consistent form handling
 * Centralizes form validation and state management logic
 */
import { useBigNumber } from "./useBigNumber";
import { useTokenBalance } from "./useTokenBalance";

export function useFormValidation() {
  const { parseBN, isValidAmount } = useBigNumber();
  const { hasSufficientBalance, hasSufficientAllowance } = useTokenBalance();

  /**
   * Validate amount input
   * @param {string|number} amount - Amount to validate
   * @param {BN} balance - User balance
   * @param {BN} gasCost - Gas cost (optional)
   * @returns {Object} Validation result
   */
  const validateAmount = (amount, balance, gasCost = null) => {
    if (!amount || amount === "" || amount === "0") {
      return {
        isValid: false,
        error: "Enter an amount"
      };
    }

    if (!isValidAmount(amount)) {
      return {
        isValid: false,
        error: "Invalid amount"
      };
    }

    const amountBN = parseBN(amount).multipliedBy(1e18);
    
    if (amountBN.lte(0)) {
      return {
        isValid: false,
        error: "Amount must be greater than 0"
      };
    }

    if (balance && !hasSufficientBalance(balance, amountBN)) {
      return {
        isValid: false,
        error: "Insufficient balance"
      };
    }

    if (gasCost && balance) {
      const availableBalance = balance.minus(gasCost);
      if (amountBN.gt(availableBalance)) {
        return {
          isValid: false,
          error: "Insufficient balance for gas"
        };
      }
    }

    return {
      isValid: true,
      error: null
    };
  };

  /**
   * Validate approval requirement
   * @param {BN} allowance - Current allowance
   * @param {BN} amount - Required amount
   * @returns {Object} Validation result
   */
  const validateApproval = (allowance, amount) => {
    if (!hasSufficientAllowance(allowance, amount)) {
      return {
        isValid: false,
        error: "Insufficient allowance",
        needsApproval: true
      };
    }

    return {
      isValid: true,
      error: null,
      needsApproval: false
    };
  };

  /**
   * Get button text based on validation state
   * @param {Object} validation - Validation result
   * @param {string} action - Action name (e.g., "Stake", "Unstake")
   * @returns {string} Button text
   */
  const getButtonText = (validation, action = "Submit") => {
    if (!validation.isValid) {
      return validation.error || "Enter an amount";
    }

    return action;
  };

  /**
   * Validate contract state
   * @param {Object} contractState - Contract state object
   * @returns {Object} Validation result
   */
  const validateContractState = (contractState) => {
    const { isFull, remainingSpace, hasFunds } = contractState;

    if (isFull) {
      return {
        isValid: false,
        error: "Contract is full"
      };
    }

    if (remainingSpace && remainingSpace.lte(0)) {
      return {
        isValid: false,
        error: "No space available"
      };
    }

    if (hasFunds === false) {
      return {
        isValid: false,
        error: "Not enough funds in pool"
      };
    }

    return {
      isValid: true,
      error: null
    };
  };

  return {
    validateAmount,
    validateApproval,
    getButtonText,
    validateContractState
  };
}