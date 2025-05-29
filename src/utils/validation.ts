// Validation Utilities for Wallet Application
// Provides comprehensive validation for addresses, transactions, and user inputs

import { isAddress, getAddress } from 'ethers';

/**
 * Validates Ethereum address format and checksum
 * @param address - The address to validate
 * @returns True if address is valid
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    // Remove any whitespace
    const cleanAddress = address.trim();
    
    // Check if it's a valid Ethereum address
    return isAddress(cleanAddress);
  } catch (error) {
    return false;
  }
}

/**
 * Validates and normalizes an Ethereum address (checksum format)
 * @param address - The address to normalize
 * @returns Checksummed address or null if invalid
 */
export function normalizeAddress(address: string): string | null {
  if (!isValidAddress(address)) {
    return null;
  }

  try {
    return getAddress(address.trim());
  } catch (error) {
    return null;
  }
}

/**
 * Validates transaction amount
 * @param amount - Amount as string
 * @param maxAmount - Optional maximum allowed amount
 * @returns Validation result with error message if invalid
 */
export function validateAmount(amount: string, maxAmount?: number): {
  isValid: boolean;
  error?: string;
  normalizedAmount?: number;
} {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount is unreasonably large' };
  }

  if (maxAmount && numAmount > maxAmount) {
    return { isValid: false, error: `Amount exceeds maximum of ${maxAmount} ETH` };
  }

  // Check for too many decimal places (max 18 for ETH)
  const decimalPlaces = (amount.split('.')[1] || '').length;
  if (decimalPlaces > 18) {
    return { isValid: false, error: 'Too many decimal places (max 18)' };
  }

  return { isValid: true, normalizedAmount: numAmount };
}

/**
 * Validates if amount is within available balance
 * @param amount - Amount to send
 * @param balance - Available balance
 * @param gasBuffer - Buffer for gas fees (default 10%)
 * @returns Validation result
 */
export function validateBalance(
  amount: string, 
  balance: string, 
  gasBuffer: number = 0.1
): {
  isValid: boolean;
  error?: string;
  requiredAmount?: number;
} {
  const amountValidation = validateAmount(amount);
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  const numAmount = amountValidation.normalizedAmount!;
  const numBalance = parseFloat(balance);

  if (isNaN(numBalance)) {
    return { isValid: false, error: 'Invalid balance' };
  }

  // Calculate required amount including gas buffer
  const requiredAmount = numAmount * (1 + gasBuffer);

  if (numBalance < requiredAmount) {
    return { 
      isValid: false, 
      error: `Insufficient balance. Required: ${requiredAmount.toFixed(6)} ETH (including gas), Available: ${numBalance.toFixed(6)} ETH`,
      requiredAmount 
    };
  }

  return { isValid: true, requiredAmount };
}

/**
 * Validates recipient address with additional checks
 * @param address - Recipient address
 * @param senderAddress - Sender address (to prevent self-send)
 * @returns Validation result
 */
export function validateRecipient(
  address: string, 
  senderAddress?: string
): {
  isValid: boolean;
  error?: string;
  normalizedAddress?: string;
} {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Recipient address is required' };
  }

  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }

  // Check for self-send
  if (senderAddress && normalizedAddress.toLowerCase() === senderAddress.toLowerCase()) {
    return { isValid: false, error: 'Cannot send to your own address' };
  }

  // Check for zero address
  if (normalizedAddress === '0x0000000000000000000000000000000000000000') {
    return { isValid: false, error: 'Cannot send to zero address' };
  }

  return { isValid: true, normalizedAddress };
}

/**
 * Validates transaction data before submission
 * @param data - Transaction data
 * @returns Comprehensive validation result
 */
export function validateTransaction(data: {
  to: string;
  amount: string;
  from?: string;
  balance?: string;
}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: {
    to: string;
    amount: number;
    requiredAmount: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate recipient
  const recipientValidation = validateRecipient(data.to, data.from);
  if (!recipientValidation.isValid) {
    errors.push(recipientValidation.error!);
  }

  // Validate amount
  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.isValid) {
    errors.push(amountValidation.error!);
  }

  // Validate balance if provided
  let balanceValidation;
  if (data.balance && amountValidation.isValid) {
    balanceValidation = validateBalance(data.amount, data.balance);
    if (!balanceValidation.isValid) {
      errors.push(balanceValidation.error!);
    }
  }

  // Add warnings for large amounts
  if (amountValidation.isValid && amountValidation.normalizedAmount! > 10) {
    warnings.push('Large transaction amount - please verify recipient address');
  }

  // Add warnings for round numbers (potential typos)
  if (amountValidation.isValid) {
    const amount = amountValidation.normalizedAmount!;
    if (amount >= 1 && amount % 1 === 0 && amount <= 1000) {
      warnings.push('Round number amount - please verify this is correct');
    }
  }

  const isValid = errors.length === 0;
  const normalizedData = isValid ? {
    to: recipientValidation.normalizedAddress!,
    amount: amountValidation.normalizedAmount!,
    requiredAmount: balanceValidation?.requiredAmount || amountValidation.normalizedAmount!
  } : undefined;

  return {
    isValid,
    errors,
    warnings,
    normalizedData
  };
}

/**
 * Debounced validation function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Validates network compatibility
 * @param chainId - Current chain ID
 * @param supportedChains - Array of supported chain IDs
 * @returns Validation result
 */
export function validateNetwork(
  chainId: number,
  supportedChains: number[] = [1, 5, 11155111] // Mainnet, Goerli, Sepolia
): {
  isValid: boolean;
  error?: string;
  networkName?: string;
} {
  const networkNames: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai'
  };

  if (!supportedChains.includes(chainId)) {
    return {
      isValid: false,
      error: `Unsupported network. Please switch to a supported network.`,
      networkName: networkNames[chainId] || `Unknown Network (${chainId})`
    };
  }

  return {
    isValid: true,
    networkName: networkNames[chainId] || `Network ${chainId}`
  };
}

/**
 * Sanitizes user input to prevent XSS and other attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Validates gas price input
 * @param gasPrice - Gas price in Gwei
 * @returns Validation result
 */
export function validateGasPrice(gasPrice: string): {
  isValid: boolean;
  error?: string;
  normalizedGasPrice?: number;
} {
  const numGasPrice = parseFloat(gasPrice);

  if (isNaN(numGasPrice)) {
    return { isValid: false, error: 'Gas price must be a valid number' };
  }

  if (numGasPrice < 0) {
    return { isValid: false, error: 'Gas price cannot be negative' };
  }

  if (numGasPrice > 1000) {
    return { isValid: false, error: 'Gas price seems unreasonably high' };
  }

  return { isValid: true, normalizedGasPrice: numGasPrice };
}
