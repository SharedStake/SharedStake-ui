// Transaction composable to eliminate duplication across components
import { useTokenBalance } from './useTokenBalance';
import { notifyHandler, notifyNotification } from '@/utils/common';

export function useTransaction() {
  const { BN } = useTokenBalance();
  
  const executeTransaction = async (abiCall, argsArr = [], senderObj = {}, cb = () => {}) => {
    if (!abiCall || typeof abiCall !== 'function') {
      console.error("abiCall is not a valid function");
      return false;
    }

    // ethers.js transaction syntax
    const txOptions = {
      // Transactions now handled in accordance EIP-1559
      maxFeePerGas: BN(senderObj.maxFeePerGas || 0)
        .multipliedBy(1000000000)
        .toString(),
      maxPriorityFeePerGas: BN(senderObj.maxPriorityFeePerGas || 0)
        .multipliedBy(1000000000)
        .toString(),
      ...senderObj,
    };

    // Remove 'from' field as ethers.js uses the signer's address automatically
    delete txOptions.from;

    try {
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
        notifyNotification("Tx successful", "success");
        await cb();
        return true;
      } else {
        notifyNotification("Tx failed", "error");
        return false;
      }
    } catch (error) {
      console.error("Transaction error:", error);
      notifyNotification("Transaction failed", "error");
      return false;
    }
  };
  
  return {
    executeTransaction,
    BN
  };
}