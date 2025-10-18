// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Voting
 * @dev A blockchain-based voting system with privacy features
 * @author Edwin
 */
contract Voting is Ownable, ReentrancyGuard {
    
    // Struct to hold candidate information
    struct Candidate {
        string name;
        uint256 voteCount;
        bool exists;
    }
    
    // Struct to hold voter information
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidate;
    }
    
    // State variables
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bytes32) public commitments; // For commit-reveal scheme
    
    uint256 public candidatesCount;
    uint256 public totalVotes;
    bool public votingActive;
    bool public revealPhase;
    
    // Events
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 candidateId);
    event VoteCommitted(address indexed voter, bytes32 commitment);
    event VoteRevealed(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VotingStarted();
    event VotingEnded();
    event RevealPhaseStarted();
    
    // Modifiers
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        _;
    }
    
    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        _;
    }
    
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        votingActive = false;
        revealPhase = false;
        candidatesCount = 0;
        totalVotes = 0;
    }
    
    /**
     * @dev Register a new voter (only owner can do this)
     * @param voter Address of the voter to register
     */
    function registerVoter(address voter) external onlyOwner {
        require(!voters[voter].isRegistered, "Voter already registered");
        voters[voter] = Voter(true, false, 0);
        emit VoterRegistered(voter);
    }
    
    /**
     * @dev Add a new candidate (only owner can do this)
     * @param name Name of the candidate
     */
    function addCandidate(string memory name) external onlyOwner {
        require(!votingActive, "Cannot add candidates during voting");
        candidates[candidatesCount] = Candidate(name, 0, true);
        emit CandidateAdded(candidatesCount, name);
        candidatesCount++;
    }
    
    /**
     * @dev Start the voting process (only owner)
     */
    function startVoting() external onlyOwner {
        require(candidatesCount >= 2, "Need at least 2 candidates");
        votingActive = true;
        emit VotingStarted();
    }
    
    /**
     * @dev End the voting process and start reveal phase (only owner)
     */
    function endVoting() external onlyOwner {
        require(votingActive, "Voting is not active");
        votingActive = false;
        revealPhase = true;
        emit VotingEnded();
        emit RevealPhaseStarted();
    }
    
    /**
     * @dev Cast a direct vote (Phase 1 - Basic voting)
     * @param candidateId ID of the candidate to vote for
     */
    function vote(uint256 candidateId) 
        external 
        onlyRegisteredVoter 
        votingIsActive 
        hasNotVoted 
        nonReentrant 
    {
        require(candidateId < candidatesCount, "Invalid candidate ID");
        require(candidates[candidateId].exists, "Candidate does not exist");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidate = candidateId;
        candidates[candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(msg.sender, candidateId);
    }
    
    /**
     * @dev Commit a vote hash (Phase 3 - Commit-Reveal)
     * @param commitment Hash of (vote + salt)
     */
    function commitVote(bytes32 commitment) 
        external 
        onlyRegisteredVoter 
        votingIsActive 
        hasNotVoted 
        nonReentrant 
    {
        commitments[msg.sender] = commitment;
        emit VoteCommitted(msg.sender, commitment);
    }
    
    /**
     * @dev Reveal a vote (Phase 3 - Commit-Reveal)
     * @param candidateId ID of the candidate voted for
     * @param salt Random salt used in commitment
     */
    function revealVote(uint256 candidateId, string memory salt) 
        external 
        onlyRegisteredVoter 
        nonReentrant 
    {
        require(revealPhase, "Reveal phase not active");
        require(commitments[msg.sender] != bytes32(0), "No commitment found");
        require(!voters[msg.sender].hasVoted, "Vote already revealed");
        require(candidateId < candidatesCount, "Invalid candidate ID");
        require(candidates[candidateId].exists, "Candidate does not exist");
        
        // Verify the commitment
        bytes32 hash = keccak256(abi.encodePacked(candidateId, salt));
        require(hash == commitments[msg.sender], "Invalid commitment");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidate = candidateId;
        candidates[candidateId].voteCount++;
        totalVotes++;
        
        // Clear the commitment
        delete commitments[msg.sender];
        
        emit VoteRevealed(msg.sender, candidateId);
    }
    
    /**
     * @dev Get the current vote count for a candidate
     * @param candidateId ID of the candidate
     * @return voteCount Number of votes for the candidate
     */
    function getVoteCount(uint256 candidateId) external view returns (uint256) {
        require(candidateId < candidatesCount, "Invalid candidate ID");
        return candidates[candidateId].voteCount;
    }
    
    /**
     * @dev Get all candidates and their vote counts
     * @return candidateNames Array of candidate names
     * @return voteCounts Array of vote counts
     */
    function getAllResults() external view returns (string[] memory candidateNames, uint256[] memory voteCounts) {
        candidateNames = new string[](candidatesCount);
        voteCounts = new uint256[](candidatesCount);
        
        for (uint256 i = 0; i < candidatesCount; i++) {
            candidateNames[i] = candidates[i].name;
            voteCounts[i] = candidates[i].voteCount;
        }
    }
    
    /**
     * @dev Check if an address is a registered voter
     * @param voter Address to check
     * @return isRegistered True if the address is registered
     */
    function isRegisteredVoter(address voter) external view returns (bool) {
        return voters[voter].isRegistered;
    }
    
    /**
     * @dev Check if an address has voted
     * @param voter Address to check
     * @return hasVoted True if the address has voted
     */
    function hasVoted(address voter) external view returns (bool) {
        return voters[voter].hasVoted;
    }
}
