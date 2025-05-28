// Web3 Utility Functions for UnhackableWallet
// Common helper functions for Ethereum address and value formatting

import { ethers, formatUnits, parseUnits } from 'ethers';

/**
 * Shorten an Ethereum address for display
 * @param {string} address - The address to shorten
 * @param {number} chars - Number of characters to keep at start and end (default: 4)
 * @returns {string} Shortened address (e.g., 0x1234...5678)
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  
  const prefix = address.startsWith('0x') ? '0x' : '';
  const start = prefix.length;
  
  if (address.length <= start + chars * 2) {
    return address;
  }
  
  return `${address.substring(0, start + chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Format a number to a specific number of decimal places
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted number
 */
export function formatDecimal(value: number | string, decimals: number = 4): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toFixed(decimals);
}

/**
 * Format Wei to ETH
 * @param {bigint|string} wei - The amount in Wei
 * @param {number} decimals - Number of decimal places for display (default: 4)
 * @returns {string} Formatted ETH amount
 */
export function formatEth(wei: bigint | string, decimals: number = 4): string {
  const ethValue = formatUnits(wei, 18);
  return formatDecimal(ethValue, decimals);
}

/**
 * Parse ETH to Wei
 * @param {string} eth - The amount in ETH
 * @returns {bigint} Amount in Wei
 */
export function parseEth(eth: string): bigint {
  return parseUnits(eth, 18);
}

/**
 * Check if a string is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} Whether the address is valid
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format timestamp to human-readable date
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format transaction hash for display
 * @param {string} hash - Transaction hash
 * @param {number} chars - Number of characters to keep at start and end (default: 6)
 * @returns {string} Shortened transaction hash
 */
export function formatTxHash(hash: string, chars: number = 6): string {
  return shortenAddress(hash, chars);
}

/**
 * Generate Etherscan URL for an address or transaction
 * @param {string} value - Address or transaction hash
 * @param {string} type - Type of URL ('address' or 'tx')
 * @param {number} chainId - Network chain ID
 * @returns {string} Etherscan URL
 */
export function getEtherscanUrl(value: string, type: 'address' | 'tx', chainId: number = 1): string {
  // Base URLs for different networks
  const baseUrls: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    56: 'https://bscscan.com',
    97: 'https://testnet.bscscan.com',
    42161: 'https://arbiscan.io',
    // Add more networks as needed
  };
  
  const baseUrl = baseUrls[chainId] || 'https://etherscan.io';
  
  return `${baseUrl}/${type}/${value}`;
}

/**
 * Format currency value for display
 * @param {number} value - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Calculate gas fee in ETH
 * @param {number} gasLimit - Gas limit for transaction
 * @param {bigint} gasPrice - Gas price in Wei
 * @returns {string} Gas fee formatted in ETH
 */
export function calculateGasFee(gasLimit: number, gasPrice: bigint): string {
  const gasFee = gasPrice * BigInt(gasLimit);
  return formatUnits(gasFee, 18);
}

/**
 * Get network explorer URL based on chain ID
 * @param {number} chainId - Network chain ID
 * @returns {string} Explorer base URL
 */
export function getExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    56: 'https://bscscan.com',
    97: 'https://testnet.bscscan.com',
    42161: 'https://arbiscan.io',
    // Add more networks as needed
  };
  
  return explorers[chainId] || 'https://etherscan.io';
}
