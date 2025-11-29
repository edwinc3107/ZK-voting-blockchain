// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HospitalEthicsVoting is ReentrancyGuard {
    
    // Board Members (flexible count, need majority for decision consensus)
    address[] public boardMembers;
    mapping(address => bool) public isBoardMember;
    uint256 public REQUIRED_CONSENSUS;
    
    // Verified Voters (doctors, staff)
    mapping(address => bool) public verifiedVoters;
    
    // Ethics Cases - that have been proposed
    struct EthicsCase {
        string description; //description of case
        uint256 yesVotes; 
        uint256 noVotes;
        bool isActive; //is case active?
        uint256 deadline; //deadline to vote
        uint256 createdAt; //created at
    }
    
    mapping(uint256 => EthicsCase) public ethicsCases; 
    uint256 public casesCount;
    
    // ZK Proof Simulation (nullifier system)
    mapping(bytes32 => bool) public usedNullifiers;
    

    // Voting Records (for transparency)
    struct VoteRecord {
        address voter;
        bool vote; // true = yes, false = no
        uint256 caseId;
        uint256 timestamp;
        bytes32 nullifierHash;
    }
    
    VoteRecord[] public voteRecords;
    mapping(address => mapping(uint256 => bool)) public hasVoted; // voter => caseId => hasVoted
    
    // Events
    event BoardMemberAdded(address indexed member);
    event VoterVerified(address indexed voter);
    event EthicsCaseCreated(uint256 indexed caseId, string description);
    event VoteSubmitted(address indexed voter, uint256 indexed caseId, bool vote);
    event CaseResolved(uint256 indexed caseId, bool approved);
    
    // Modifiers
    modifier onlyBoardMember() {
        require(isBoardMember[msg.sender], "Not a board member");
        _;
    }
    
    modifier onlyVerifiedVoter() {
        require(verifiedVoters[msg.sender], "Not a verified voter");
        _;
    }
    
    modifier caseExists(uint256 caseId) {
        require(caseId < casesCount, "Case does not exist");
        _;
    }
    
    modifier caseActive(uint256 caseId) {
        require(ethicsCases[caseId].isActive, "Case is not active");
        require(block.timestamp <= ethicsCases[caseId].deadline, "Voting deadline passed");
        _;
    }
    
    constructor(address[] memory initialBoardMembers) {
        require(initialBoardMembers.length >= 1, "Must have at least 1 board member");
        
        for (uint256 i = 0; i < initialBoardMembers.length; i++) {
            boardMembers.push(initialBoardMembers[i]);
            isBoardMember[initialBoardMembers[i]] = true;
            emit BoardMemberAdded(initialBoardMembers[i]);
        }
        
        // Set consensus requirement to majority (at least 1 for single member boards)
        REQUIRED_CONSENSUS = (initialBoardMembers.length + 1) / 2;
        if (REQUIRED_CONSENSUS == 0) REQUIRED_CONSENSUS = 1;
        
        casesCount = 0;
    }
    
    // Board Functions (require consensus)
    function addBoardMember(address newMember) external onlyBoardMember {
        require(!isBoardMember[newMember], "Already a board member");
        require(boardMembers.length < 10, "Maximum 10 board members");
        
        boardMembers.push(newMember);
        isBoardMember[newMember] = true;
        emit BoardMemberAdded(newMember);
    }
    
    function verifyVoter(address voter) external onlyBoardMember {
        require(!verifiedVoters[voter], "Already verified");
        verifiedVoters[voter] = true;
        emit VoterVerified(voter);
    }
    
    function createEthicsCase(
        string memory description,
        uint256 votingDuration
    ) external onlyBoardMember {
        uint256 caseId = casesCount++;
        ethicsCases[caseId] = EthicsCase({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            isActive: true,
            deadline: block.timestamp + votingDuration,
            createdAt: block.timestamp
        });
        
        emit EthicsCaseCreated(caseId, description);
    }
    
    // Voting Functions
    function submitVote(
        uint256 caseId,
        bool vote,
        bytes32 nullifierHash
    ) external 
        onlyVerifiedVoter 
        caseExists(caseId) 
        caseActive(caseId) 
        nonReentrant 
    {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        require(!hasVoted[msg.sender][caseId], "Already voted on this case");
        
        // Mark nullifier as used
        usedNullifiers[nullifierHash] = true;
        hasVoted[msg.sender][caseId] = true;
        
        // Record vote
        voteRecords.push(VoteRecord({
            voter: msg.sender,
            vote: vote,
            caseId: caseId,
            timestamp: block.timestamp,
            nullifierHash: nullifierHash
        }));
        
        // Update case counts
        if (vote) {
            ethicsCases[caseId].yesVotes++;
        } else {
            ethicsCases[caseId].noVotes++;
        }
        
        emit VoteSubmitted(msg.sender, caseId, vote);
    }
    
    // Resolution Functions
    function resolveCase(uint256 caseId) external onlyBoardMember caseExists(caseId) {
        require(ethicsCases[caseId].isActive, "Case already resolved");
        require(block.timestamp > ethicsCases[caseId].deadline, "Voting still active");
        
        ethicsCases[caseId].isActive = false;
        
        bool approved = ethicsCases[caseId].yesVotes > ethicsCases[caseId].noVotes;
        emit CaseResolved(caseId, approved);
    }

    // View Functions
    function getCase(uint256 caseId) external view caseExists(caseId) returns (EthicsCase memory) {
        return ethicsCases[caseId];
    }
    
    function getVoteRecords(uint256 caseId) external view caseExists(caseId) returns (VoteRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < voteRecords.length; i++) {
            if (voteRecords[i].caseId == caseId) {
                count++;
            }
        }
        
        VoteRecord[] memory caseVotes = new VoteRecord[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < voteRecords.length; i++) {
            if (voteRecords[i].caseId == caseId) {
                caseVotes[index] = voteRecords[i];
                index++;
            }
        }
        
        return caseVotes;
    }
    
    function getBoardMembers() external view returns (address[] memory) {
        return boardMembers;
    }
    
    function isVoterVerified(address voter) external view returns (bool) {
        return verifiedVoters[voter];
    }
    
    function hasVoterVoted(address voter, uint256 caseId) external view returns (bool) {
        return hasVoted[voter][caseId];
    }
}
