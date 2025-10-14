/**
 * Transaction composable for consistent transaction handling
 * Centralizes transaction execution and error handling logic
 */
import { notifyHandler, notifyNotification } from "@/utils/common";
import { useBigNumber } from "./useBigNumber";
import { useGas } from "./useGas";

export function useTransaction() {
  const { parseBN } = useBigNumber();
  const { convertGasToWei } = useGas();

  /**
   * Execute a transaction with proper error handling
   * @param {Function} abiCall - Contract function to call
   * @param {Array} argsArr - Arguments for the function
   * @param {Object} senderObj - Transaction options
   * @param {Function} cb - Callback function
   * @returns {Promise<Object>} Transaction result
   */
  const executeTransaction = async (abiCall, argsArr = [], senderObj = {}, cb = () => {}) => {
    if (!abiCall || typeof abiCall !== 'function') {
      throw new Error("abiCall is not a valid function");
    }

    try {
      // Convert gas prices to wei if they exist
      const txOptions = {
        ...senderObj,
        ...(senderObj.maxFeePerGas && senderObj.maxPriorityFeePerGas 
          ? convertGasToWei({
              maxFeePerGas: senderObj.maxFeePerGas,
              maxPriorityFeePerGas: senderObj.maxPriorityFeePerGas
            })
          : {}
        )
      };

      // Remove 'from' field as ethers.js uses the signer's address automatically
      delete txOptions.from;

      const tx = await abiCall(...argsArr, txOptions);
      
      // Validate transaction object
      if (!tx || !tx.hash) {
        throw new Error("Invalid transaction object returned from contract call");
      }
      
      // Handle transaction hash notification
      notifyHandler(tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        notifyNotification("Transaction successful", "success");
        await cb();
        return { success: true, receipt };
      } else {
        notifyNotification("Transaction failed", "error");
        return { success: false, error: "Transaction failed" };
      }
    } catch (error) {
      console.error("Transaction error:", error);
      notifyNotification("Transaction failed", "error");
      return { success: false, error: error.message };
    }
  };

  /**
   * Create transaction object for DappTxBtn
   * @param {Function} abiCall - Contract function
   * @param {Array} argsArr - Function arguments
   * @param {Object} senderObj - Transaction options
   * @param {Function} cb - Callback function
   * @returns {Object} Transaction object
   */
  const createTransaction = (abiCall, argsArr = [], senderObj = {}, cb = () => {}) => {
    return {
      abiCall,
      argsArr,
      senderObj,
      cb
    };
  };

  /**
   * Validate transaction parameters
   * @param {Object} params - Transaction parameters
   * @returns {boolean} Is valid
   */
  const validateTransaction = (params) => {
    const { abiCall, argsArr, senderObj } = params;
    
    if (!abiCall || typeof abiCall !== 'function') {
      console.error("Invalid abiCall");
      return false;
    }
    
    if (!Array.isArray(argsArr)) {
      console.error("argsArr must be an array");
      return false;
    }
    
    if (!senderObj || typeof senderObj !== 'object') {
      console.error("senderObj must be an object");
      return false;
    }
    
    return true;
  };

  return {
    executeTransaction,
    createTransaction,
    validateTransaction
  };
}