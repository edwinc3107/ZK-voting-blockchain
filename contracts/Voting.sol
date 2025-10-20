// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


//Ownable - helps us create functions, where only the owner/deployer of the contract can make changes
//ReentrancyGuard - helps prevent race conditions and acts like a mutex lock


contract Voting is Ownable, ReentrancyGuard {
    
    // Struct to hold candidate information - name, count of votes, validate if he/she exists
    struct Candidate {
        string name; 
        uint256 voteCount;
        bool exists;
    }
    
    // Struct to hold voter information - is Registered? , has voted?, the voted candidate
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidate;
    }
    
    //variables
    mapping(address => Voter) public voters; //voters[address] = Voter
    mapping(uint256 => Candidate) public candidates; //candidate[uint256] = Candidate
    mapping(address => bytes32) public commitments; // For commit-reveal plan, commitments[address] = bytes32
    
    uint256 public candidatesCount; //number of candidates
    uint256 public totalVotes; //total votes

    //conditional variables
    bool public votingActive; //if true, we cannot reveal votes
    bool public revealPhase; //if true, we cannot vote
    
    // Events/emit
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VotingStarted();
    event VotingEnded();
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 candidateId);
    event VoteCommitted(address indexed voter, bytes32 commitment);
    event VoteRevealed(address indexed voter, uint256 candidateId);
    event RevealPhaseStarted();
    
    // Modifiers - add verification features to functions
    //Because of Ownable - we don't need custom owner check

    //ensure the voter is registered
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        _;
    }
    
    //ensure voting has started
    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        _;
    }
    
    //ensure no double votes
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
    


     //Add candidates and register voters - add voter by address and candidate by name
    function registerVoter(address voter) external onlyOwner {
        require(!voters[voter].isRegistered, "Voter already registered");

        //if not already registered, register now!
        voters[voter] = Voter(true, false, 0);
        emit VoterRegistered(voter);
    }
    
    function addCandidate(string memory name) external onlyOwner {

        //once voting has started, no new candidates.
        require(!votingActive, "Cannot add candidates during voting");

        //if voting is not yet started, we can add:
        candidates[candidatesCount] = Candidate(name, 0, true);
        emit CandidateAdded(candidatesCount, name);
        candidatesCount++;
    }
    

    //once set up election, we can start the voting
    //We should be able to vote once.
    //The count of votes for each candidate should respectively increase

    function startVoting() external onlyOwner {
        //we want a competition - so minimum 2
        require(candidatesCount >= 2, "Need at least 2 candidates");

        //if there are 2 candidates:
        votingActive = true;
        emit VotingStarted();
    }
    

    function endVoting() external onlyOwner {

        //there should be a voting session first
        require(votingActive, "Voting is not active");

        //if there is an active voting session:
        votingActive = false;
        //start reveal phase
        revealPhase = true;

        emit VotingEnded();
        emit RevealPhaseStarted();
    }
    
    //the vote function - must be valid voter/candidate, increment by 1, change state of voter/candidate.
    //modifiers are used here
    function vote(uint256 candidateId) external onlyRegisteredVoter votingIsActive hasNotVoted nonReentrant{
        
        //check for valid candidateId and if exists
        require(candidateId < candidatesCount, "Invalid candidate ID");
        require(candidates[candidateId].exists, "Candidate does not exist");
        
        //voters
        voters[msg.sender].hasVoted = true; //change state of voter -> voters[msg.sender]
        voters[msg.sender].votedCandidate = candidateId; //change votedCandidate of voter -> voters[msg.sender]

        //candidates
        candidates[candidateId].voteCount++; //change state of candidate -> candidates[candidateId]

        //global
        totalVotes++;
        
        emit VoteCast(msg.sender, candidateId); //logs voter and candidate
    }
    

    function commitVote(bytes32 commitment) external onlyRegisteredVoter votingIsActive hasNotVoted nonReentrant {

        commitments[msg.sender] = commitment;

        emit VoteCommitted(msg.sender, commitment);
    }


    function revealVote(uint256 candidateId, string memory salt) external onlyRegisteredVoter nonReentrant {

        require(revealPhase, "Reveal phase not active");

        require(candidateId < candidatesCount, "Invalid candidate ID");
        require(candidates[candidateId].exists, "Candidate does not exist");

        require(commitments[msg.sender] != bytes32(0), "No commitment found");
        
        require(!voters[msg.sender].hasVoted, "Vote already revealed");
        
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


    //helper functions
    function getVoteCount(uint256 candidateId) external view returns (uint256) {
        //check if valid candidateId
        require(candidateId < candidatesCount, "Invalid candidate ID");
        return candidates[candidateId].voteCount;
    }
    

    function getAllResults() external view returns (string[] memory candidateNames, uint256[] memory voteCounts) {
        candidateNames = new string[](candidatesCount);
        voteCounts = new uint256[](candidatesCount);
        
        for (uint256 i = 0; i < candidatesCount; i++) {
            candidateNames[i] = candidates[i].name;
            voteCounts[i] = candidates[i].voteCount;
        }
    }

    function isRegisteredVoter(address voter) external view returns (bool) {
        return voters[voter].isRegistered;
    }
    

    function hasVoted(address voter) external view returns (bool) {
        return voters[voter].hasVoted;
    }
}
