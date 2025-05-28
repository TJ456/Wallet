// Smart Contract Interaction Module for UnhackableWallet
// Handles all interactions with deployed smart contracts

import { Contract, formatUnits, parseUnits } from 'ethers';
import walletConnector from './wallet';
import UnhackableWalletABI from './abi/UnhackableWallet.json';
import { shortenAddress } from './utils';

// Contract addresses - can be moved to environment variables later
const CONTRACT_ADDRESSES = {
  // Use appropriate address for each network
  '1': '0x...', // Mainnet
  '5': '0x...', // Goerli testnet
  '11155111': '0x...', // Sepolia testnet
  '2023': '0x...', // Monad testnet
  // Add more networks as needed
};

/**
 * Smart contract interaction class for UnhackableWallet
 */
class ContractService {
  private contractInstance: Contract | null = null;

  /**
   * Initialize the contract instance
   * @returns {Promise<Contract>} The contract instance
   */
  async initContract(): Promise<Contract> {
    if (!walletConnector.provider || !walletConnector.signer || !walletConnector.chainId) {
      throw new Error('Wallet not connected');
    }

    const chainId = walletConnector.chainId.toString();
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) {
      throw new Error(`Contract not deployed on network ${walletConnector.networkName}`);
    }

    this.contractInstance = new Contract(
      contractAddress,
      UnhackableWalletABI.abi,
      walletConnector.signer
    );

    return this.contractInstance;
  }
  /**
   * Get the contract instance, initializing if necessary
   * @returns {Promise<Contract>} The contract instance
   */
  async getContract(): Promise<Contract> {
    if (!this.contractInstance) {
      return this.initContract();
    }
    return this.contractInstance;
  }

  /**
   * Report a potential scam address
   * @param {string} suspiciousAddress - The address suspected of scam activity   * @param {string} description - Description of the scam
   * @param {string} evidence - Evidence URL or IPFS hash
   * @returns {Promise<any>} Transaction result
   */  async reportScam(
    suspiciousAddress: string,
    reason: string,
    evidence: string
  ): Promise<any> {
    const contract = await this.getContract();
    
    console.log(`Reporting scam: ${shortenAddress(suspiciousAddress)}`);
    return contract.reportScam(suspiciousAddress, reason, evidence);
  }

  /**
   * Vote on a scam report (DAO functionality)
   * @param {number} reportId - The ID of the report to vote on
   * @param {boolean} isScam - Whether the user believes the report is valid   * @returns {Promise<any>} Transaction result
   */  async voteOnScamReport(
    proposalId: string,
    inSupport: boolean
  ): Promise<any> {
    const contract = await this.getContract();
    
    console.log(`Voting on report with proposalId: ${proposalId}, inSupport: ${inSupport}`);
    return contract.voteOnReport(proposalId, inSupport);
  }

  /**
   * Get all scam reports
   * @returns {Promise<any[]>} List of scam reports
   */
  async getScamReports(): Promise<any[]> {
    const contract = await this.getContract();
    
    const reportCount = await contract.getReportCount();
    const reports = [];
    
    for (let i = 0; i < reportCount.toNumber(); i++) {      const report = await contract.getReport(i);
      reports.push({
        id: i,
        reporter: report.reporter,
        suspiciousAddress: report.suspiciousAddress,
        description: report.description, // This matches with 'reason' in the contract
        evidence: report.evidence,
        timestamp: new Date(Number(report.timestamp) * 1000),
        votesFor: Number(report.votesFor),
        votesAgainst: Number(report.votesAgainst),
        confirmed: report.confirmed
      });
    }
    
    return reports;
  }

  /**
   * Get scam reports filed by the connected address
   * @returns {Promise<any[]>} List of user's scam reports
   */
  async getUserReports(): Promise<any[]> {
    const reports = await this.getScamReports();
    return reports.filter(
      report => report.reporter.toLowerCase() === walletConnector.address?.toLowerCase()
    );
  }

  /**
   * Transfer funds using the secure transfer function of the wallet
   * @param {string} to - Recipient address
   * @param {string} amount - Amount in ETH   * @returns {Promise<any>} Transaction result
   */
  async secureSendETH(
    to: string,
    amount: string
  ): Promise<any> {
    const contract = await this.getContract();
    
    // Convert ETH amount to Wei
    const amountWei = parseUnits(amount, 18);
    console.log(`Sending ${amount} ETH to ${shortenAddress(to)}`);
    return contract.secureTransfer(to, {
      value: amountWei
    });
  }

  /**
   * Check if an address has been reported as a scam
   * @param {string} address - The address to check
   * @returns {Promise<boolean>} Whether the address is flagged as a scam
   */
  async isScamAddress(address: string): Promise<boolean> {
    const contract = await this.getContract();
    return contract.isScamAddress(address);
  }

  /**
   * Get scam probability score for an address
   * @param {string} address - The address to check
   * @returns {Promise<number>} Score from 0-100 representing scam likelihood
   */
  async getScamScore(address: string): Promise<number> {
    const contract = await this.getContract();
    const score = await contract.getScamScore(address);
    return score.toNumber();
  }
}

// Create a singleton instance
const contractService = new ContractService();

export default contractService;
