/**
 * Vue 2 compatible composable for Web3 operations
 * Provides common Web3 utilities and error handling
 */
export function useWeb3() {
  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Helper function to format token amount
  const formatTokenAmount = (amount, decimals = 18, precision = 4) => {
    if (!amount) return '0';
    const formatted = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(precision);
    return parseFloat(formatted).toString();
  };

  // Helper function to parse token amount
  const parseTokenAmount = (amount, decimals = 18) => {
    if (!amount) return '0';
    return (parseFloat(amount) * Math.pow(10, decimals)).toString();
  };

  // Helper function to handle Web3 errors
  const handleWeb3Error = (error, context = 'Web3 operation') => {
    console.error(`${context} failed:`, error);
    
    // Common error patterns
    if (error.message?.includes('user rejected')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message?.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (error.message?.includes('gas')) {
      return 'Gas estimation failed';
    }
    if (error.message?.includes('network')) {
      return 'Network error occurred';
    }
    
    return 'Transaction failed';
  };

  // Helper function to validate address
  const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Helper function to validate amount
  const isValidAmount = (amount) => {
    if (!amount || amount === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  // Helper function to get network name from chain ID
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      42: 'Kovan Testnet',
      11155111: 'Sepolia Testnet'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  // Helper function to wait for transaction confirmation
  const waitForTransaction = async (txHash, provider, confirmations = 1) => {
    try {
      const receipt = await provider.waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error) {
      throw new Error(`Transaction confirmation failed: ${error.message}`);
    }
  };

  return {
    formatAddress,
    formatTokenAmount,
    parseTokenAmount,
    handleWeb3Error,
    isValidAddress,
    isValidAmount,
    getNetworkName,
    waitForTransaction
  };
}