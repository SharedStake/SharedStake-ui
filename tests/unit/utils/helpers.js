// Mock helper functions for testing demonstration
// In a real application, these would be imported from the actual utils

export function formatAddress(address) {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatBalance(balance) {
  if (!balance) return '0.0 ETH';
  const eth = parseFloat(balance) / 1e18;
  return `${eth.toFixed(1)} ETH`;
}

export function calculateAPY(principal, rewards, timeInDays) {
  if (!principal || !timeInDays) return 0;
  const dailyRate = rewards / principal / timeInDays;
  const annualRate = dailyRate * 365;
  return Math.round(annualRate * 100) / 100;
}