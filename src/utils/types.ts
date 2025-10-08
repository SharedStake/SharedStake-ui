// TypeScript utility types for SharedStake UI

export interface Web3Provider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI?: string;
}

export interface PoolInfo {
  name: string;
  address: string;
  token: TokenInfo;
  apy?: number;
  tvl?: number;
  staked?: number;
}

export interface UserStake {
  poolAddress: string;
  amount: string;
  reward: string;
  timestamp: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  featured?: boolean;
}

// Utility type for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Utility type for contract interactions
export interface ContractCall {
  method: string;
  params: any[];
  value?: string;
  gasLimit?: number;
}

// Type guards
export function isWeb3Provider(obj: any): obj is Web3Provider {
  return obj && typeof obj.request === 'function';
}

export function isTokenInfo(obj: any): obj is TokenInfo {
  return obj && 
    typeof obj.symbol === 'string' && 
    typeof obj.name === 'string' && 
    typeof obj.decimals === 'number' && 
    typeof obj.address === 'string';
}