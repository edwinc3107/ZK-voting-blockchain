import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract ABI - This would normally be imported from your compiled contract
const CONTRACT_ABI = [
  "function getCase(uint256 caseId) external view returns (tuple(string description, uint256 yesVotes, uint256 noVotes, bool isActive, uint256 deadline, uint256 createdAt))",
  "function getVoteRecords(uint256 caseId) external view returns (tuple(address voter, bool vote, uint256 caseId, uint256 timestamp, bytes32 nullifierHash)[])",
  "function submitVote(uint256 caseId, bool vote, bytes32 nullifierHash) external",
  "function isVoterVerified(address voter) external view returns (bool)",
  "function isBoardMember(address member) external view returns (bool)",
  "function hasVoterVoted(address voter, uint256 caseId) external view returns (bool)",
  "function casesCount() external view returns (uint256)",
  "function getBoardMembers() external view returns (address[])",
  "event VoteSubmitted(address indexed voter, uint256 indexed caseId, bool vote)",
  "event EthicsCaseCreated(uint256 indexed caseId, string description)",
  "event CaseResolved(uint256 indexed caseId, bool approved)"
];

// Contract address - Hospital Ethics Contract (deployed to localhost)
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Function to create mock contract
  const createMockContract = () => {
    console.log('Creating fresh mock contract...');
    
    // Create mock contract with test data
    let mockCasesCount = 2; // Start with 2 existing cases
    const createdCases = []; // Store dynamically created cases
    
    return {
      // Mock contract methods
      getCase: async (caseId) => {
        const testCases = [
          {
            description: "Should we approve experimental treatment for Patient X with terminal cancer?",
            yesVotes: 3,
            noVotes: 1,
            isActive: true,
            deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
            createdAt: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
          },
          {
            description: "Should we allow family to make end-of-life decisions for unconscious patient?",
            yesVotes: 2,
            noVotes: 2,
            isActive: true,
            deadline: Math.floor(Date.now() / 1000) + 172800, // 48 hours from now
            createdAt: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
          }
        ];
        
        // If requesting a case beyond the initial test cases, return a created case
        if (caseId >= testCases.length) {
          const createdCaseIndex = caseId - testCases.length;
          if (createdCases[createdCaseIndex]) {
            return createdCases[createdCaseIndex];
          }
          return {
            description: "Newly created ethics case",
            yesVotes: 0,
            noVotes: 0,
            isActive: true,
            deadline: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
            createdAt: Math.floor(Date.now() / 1000) // Just created
          };
        }
        
        return testCases[caseId] || testCases[0];
      },
      
      getVoteRecords: async (caseId) => {
        const mockVotes = [
          {
            voter: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            vote: true,
            caseId: 0,
            timestamp: Math.floor(Date.now() / 1000) - 1800,
            nullifierHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
          },
          {
            voter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            vote: false,
            caseId: 0,
            timestamp: Math.floor(Date.now() / 1000) - 1200,
            nullifierHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
          }
        ];
        return mockVotes.filter(vote => vote.caseId === caseId);
      },
      
      casesCount: async () => mockCasesCount,
      
      isVoterVerified: async (address) => {
        const verifiedVoters = [
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          // Demo mode addresses
          "0x1234567890123456789012345678901234567890", // Board Member 1
          "0x2345678901234567890123456789012345678901", // Board Member 2
          "0x3456789012345678901234567890123456789012", // Doctor Smith
          "0x4567890123456789012345678901234567890123", // Nurse Johnson
          "0x5678901234567890123456789012345678901234"  // Staff Member
        ];
        const isVerified = verifiedVoters.includes(address);
        console.log(`🔍 Checking voter verification for ${address}: ${isVerified}`);
        return isVerified;
      },
      
      isBoardMember: async (address) => {
        const boardMembers = [
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          "0x90F79bf6EB2c4f870365E785982E1f101E9b3526",
          "0x15d34AAf54267DB7D7c367839AAaf71A00a2C6A65",
          // Demo mode addresses
          "0x1234567890123456789012345678901234567890", // Board Member 1
          "0x2345678901234567890123456789012345678901"  // Board Member 2
        ];
        const isBoardMember = boardMembers.includes(address);
        console.log(`👥 Checking board member status for ${address}: ${isBoardMember}`);
        return isBoardMember;
      },
      
      hasVoterVoted: async (voter, caseId) => {
        // Mock - some voters have voted
        return Math.random() > 0.5;
      },
      
      submitVote: async (caseId, vote, nullifierHash) => {
        console.log(`Mock vote submitted: Case ${caseId}, Vote: ${vote}, Nullifier: ${nullifierHash}`);
        return { 
          hash: "0xmockedtransactionhash",
          wait: async () => {
            console.log(`Mock transaction confirmed: ${nullifierHash}`);
            return { status: 1 };
          }
        };
      },

      createEthicsCase: async (description, votingDuration) => {
        console.log(`Mock case created: "${description}", Duration: ${votingDuration} seconds`);
        
        // Store the created case
        const newCase = {
          description: description,
          yesVotes: 0,
          noVotes: 0,
          isActive: true,
          deadline: Math.floor(Date.now() / 1000) + votingDuration,
          createdAt: Math.floor(Date.now() / 1000)
        };
        createdCases.push(newCase);
        mockCasesCount++; // Increment the cases count
        
        return { 
          hash: "0xmockedcasecreationhash",
          wait: async () => {
            console.log(`Mock case creation confirmed: ${description}`);
            return { status: 1 };
          }
        };
      },

      resolveCase: async (caseId) => {
        console.log(`Mock case resolved: Case ${caseId}`);
        return { 
          hash: "0xmockedcaseresolutionhash",
          wait: async () => {
            console.log(`Mock case resolution confirmed: Case ${caseId}`);
            return { status: 1 };
          }
        };
      }
    };
  };

  const connectWallet = async () => {
    // Check if we want to use real MetaMask or test mode
    const useTestMode = true; // Set to false to use real MetaMask
    
    if (useTestMode) {
      console.log('Using test mode for demo');
      
      const mockContract = createMockContract();
      setContract(mockContract);
      // Return a verified voter address for testing
      return "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    }

    // Real MetaMask connection
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);

      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setContract(null);
    setProvider(null);
    setSigner(null);
  };

  // Function to update contract when account changes
  const updateContract = () => {
    console.log('🔄 Updating contract for new account...');
    const newContract = createMockContract();
    setContract(newContract);
    console.log('✅ Contract updated successfully');
  };

  return {
    contract,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    updateContract
  };
};

// Utility function to generate nullifier hash (ZK simulation)
export const generateNullifier = (voterAddress, caseId) => {
  const salt = Math.random().toString(36);
  const data = ethers.solidityPacked(
    ["address", "uint256", "string"],
    [voterAddress, caseId, salt]
  );
  return ethers.keccak256(data);
};

// Utility function to format time remaining
export const formatTimeRemaining = (deadline) => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;
  
  if (remaining <= 0) return "Voting ended";
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Utility function to check if voting is active
export const isVotingActive = (deadline) => {
  const now = Math.floor(Date.now() / 1000);
  return deadline > now;
};
