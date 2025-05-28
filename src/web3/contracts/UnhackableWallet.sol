// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UnhackableWallet
 * @dev Smart contract for secure wallet operations with scam reporting and DAO voting
 */
contract UnhackableWallet {
    address public owner;
    
    // Events
    event ScamReported(address indexed reporter, address indexed suspiciousAddress, string description);
    event VoteCast(address indexed voter, bytes32 indexed proposalId, bool inSupport);
    event SecureTransfer(address indexed from, address indexed to, uint256 amount, bool safe);

    // Structures
    struct Report {
        address reporter;
        string reason;
        string evidence;  // URL or IPFS hash for evidence
        uint timestamp;
        uint votesFor;
        uint votesAgainst;
        bool confirmed;   // True if confirmed as scam by DAO
    }

    struct Vote {
        bool inSupport;
        address voter;
        uint timestamp;
    }

    // Storage
    mapping(address => Report[]) public reports;
    mapping(bytes32 => Vote[]) public daoVotes;
    mapping(address => bool) public confirmedScammers;
    mapping(address => uint256) public scamScore; // 0-100 score for addresses
    
    // Total report count for analytics
    uint public totalReports;

    /**
     * @dev Constructor sets deployer as owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier for owner-only functions
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    /**
     * @dev Report a suspicious address as potential scam
     * @param scammer The suspicious address to report
     * @param reason Description of the scam activity
     * @param evidence URL or IPFS hash with evidence
     */
    function reportScam(address scammer, string calldata reason, string calldata evidence) external {
        require(scammer != address(0), "Invalid address");
        require(bytes(reason).length > 0, "Reason cannot be empty");
        
        // Create and store the report
        reports[scammer].push(Report({
            reporter: msg.sender,
            reason: reason,
            evidence: evidence,
            timestamp: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            confirmed: false
        }));
        
        totalReports++;
        
        // Update scam score - initial report adds 10 points
        if (scamScore[scammer] <= 90) {
            scamScore[scammer] += 10;
        }
        
        emit ScamReported(msg.sender, scammer, reason);
    }

    /**
     * @dev Get all reports for a specific address
     * @param scammer The address to check reports for
     * @return Array of reports for the address
     */
    function getReports(address scammer) external view returns (Report[] memory) {
        return reports[scammer];
    }
    
    /**
     * @dev Get report count for contract-wide report statistics
     * @return The total number of reports submitted
     */
    function getReportCount() external view returns (uint) {
        return totalReports;
    }
    
    /**
     * @dev Get a specific report by index
     * @param index The index of the report to retrieve
     * @return The report data
     */
    function getReport(uint index) external view returns (
        address reporter,
        address suspiciousAddress,
        string memory description,
        string memory evidence,
        uint timestamp,
        uint votesFor,
        uint votesAgainst,
        bool confirmed
    ) {
        require(index < totalReports, "Report index out of bounds");
        
        // Implementation would require tracking reports in an array
        // This is a placeholder for the interface
        return (
            address(0),
            address(0),
            "",
            "",
            0,
            0,
            0,
            false
        );
    }

    /**
     * @dev Vote on a proposal in the DAO
     * @param proposalId The ID of the proposal to vote on
     * @param inSupport Whether the vote is in support or against
     */
    function voteOnReport(bytes32 proposalId, bool inSupport) external {
        // Check if user already voted
        for (uint i = 0; i < daoVotes[proposalId].length; i++) {
            require(daoVotes[proposalId][i].voter != msg.sender, "Already voted");
        }
        
        // Add the vote
        daoVotes[proposalId].push(Vote({
            inSupport: inSupport,
            voter: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit VoteCast(msg.sender, proposalId, inSupport);
    }

    /**
     * @dev Get all votes for a specific proposal
     * @param proposalId The ID of the proposal
     * @return Array of votes for the proposal
     */
    function getVotes(bytes32 proposalId) external view returns (Vote[] memory) {
        return daoVotes[proposalId];
    }

    /**
     * @dev Secure transfer function with scam check
     * @param to The recipient address
     */
    function secureTransfer(address payable to) public payable {
        require(to != address(0), "Invalid recipient");
        
        // Check if recipient is a confirmed scammer
        bool isSafe = !confirmedScammers[to];
        
        // Transfer funds
        to.transfer(msg.value);
        
        emit SecureTransfer(msg.sender, to, msg.value, isSafe);
    }
    
    /**
     * @dev Check if address is confirmed as scam
     * @param addr The address to check
     * @return Whether address is confirmed as scam
     */
    function isScamAddress(address addr) external view returns (bool) {
        return confirmedScammers[addr];
    }
    
    /**
     * @dev Get scam likelihood score for an address (0-100)
     * @param addr The address to check
     * @return Score from 0-100, higher means more likely to be scam
     */
    function getScamScore(address addr) external view returns (uint256) {
        return scamScore[addr];
    }

    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}
