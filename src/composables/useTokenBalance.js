// Token balance composable to eliminate duplication across components
import { BN } from '@/utils/bignumberConfig';
import { useWallet } from './useWallet';

export function useTokenBalance() {
  const { userAddress } = useWallet();
  
  const formatBalance = (balance, decimals = 18, displayDecimals = 6) => {
    if (!balance) return '0';
    return BN(balance.toString())
      .div(10 ** decimals)
      .decimalPlaces(displayDecimals)
      .toString();
  };
  
  const parseBalance = (amount, decimals = 18) => {
    if (!amount) return BN(0);
    return BN(amount).multipliedBy(10 ** decimals);
  };
  
  const getTokenBalance = async (contract) => {
    if (!contract || !userAddress) return BN(0);
    try {
      const balance = await contract.balanceOf(userAddress);
      return BN(balance.toString());
    } catch (error) {
      console.error('Error getting token balance:', error);
      return BN(0);
    }
  };
  
  const getTokenAllowance = async (tokenContract, spenderAddress) => {
    if (!tokenContract || !userAddress || !spenderAddress) return BN(0);
    try {
      const allowance = await tokenContract.allowance(userAddress, spenderAddress);
      return BN(allowance.toString());
    } catch (error) {
      console.error('Error getting token allowance:', error);
      return BN(0);
    }
  };
  
  return {
    formatBalance,
    parseBalance,
    getTokenBalance,
    getTokenAllowance,
    BN
  };
}