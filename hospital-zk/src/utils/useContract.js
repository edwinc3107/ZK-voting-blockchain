import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import the real contract ABI
import contractArtifact from '../../../artifacts/contracts/HospitalEthicsVoting.sol/HospitalEthicsVoting.json';

// Use the real ABI from the compiled contract
const CONTRACT_ABI = contractArtifact.abi;

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
          "0xbda5747bfd65f08deb54cb465eb87d40e51b197e", // My Account
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Dr. Sarah Chen (also board member)
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  // Dr. Michael Rodriguez
        ];
        const isVerified = verifiedVoters.includes(address);
        console.log(`🔍 Checking voter verification for ${address}: ${isVerified}`);
        return isVerified;
      },
      
      isBoardMember: async (address) => {
        const boardMembers = [
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  // Dr. Sarah Chen (only board member)
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
    // Try real contract first, fallback to mock if it fails
    console.log('Attempting to connect to real contract...');

    // Real MetaMask connection
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      // Check and switch to localhost network if needed
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);
      
      if (chainId !== '0x539') { // 0x539 = 1337 in hex
        console.log('Switching to localhost network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });
        } catch (switchError) {
          // If localhost network doesn't exist, add it
          if (switchError.code === 4902) {
            console.log('Adding localhost network...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x539',
                chainName: 'Hardhat Localhost',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: null,
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Force MetaMask to show account selection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      console.log('Available accounts:', accounts);
      
      // If multiple accounts, let user choose
      if (accounts.length > 1) {
        console.log('Multiple accounts detected. User should select the funded account.');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Test the contract with a simple call
      try {
        console.log('Testing contract connection...');
        console.log('Contract address:', CONTRACT_ADDRESS);
        console.log('Provider network:', await provider.getNetwork());
        
        const casesCount = await contract.casesCount();
        console.log('✅ Real contract is working, cases count:', casesCount.toString());
      } catch (contractError) {
        console.log('❌ Real contract failed, falling back to mock mode');
        console.log('Contract error:', contractError.message);
        console.log('Error details:', contractError);
        
        // Fallback to mock contract
        const mockContract = createMockContract();
        setContract(mockContract);
        return accounts[0];
      }

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

  // Function to set demo mode with real contract
  const setDemoMode = async (demoAccount) => {
    console.log('Setting demo mode with account:', demoAccount);
    
    // Check if this is the funded account that needs MetaMask
    const isFundedAccount = demoAccount === "0xbda5747bfd65f08deb54cb465eb87d40e51b197e";
    
    if (isFundedAccount) {
      // For funded account, try MetaMask interaction
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask not detected');
        }

        // Check and switch to localhost network if needed
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Demo mode - Current chain ID:', chainId);
        
        if (chainId !== '0x539') { // 0x539 = 1337 in hex
          console.log('Demo mode - Switching to localhost network...');
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }],
            });
          } catch (switchError) {
            // If localhost network doesn't exist, add it
            if (switchError.code === 4902) {
              console.log('Demo mode - Adding localhost network...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x539',
                  chainName: 'Hardhat Localhost',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: null,
                }],
              });
            } else {
              throw switchError;
            }
          }
        }

        // Switch to demo account if provided
        if (demoAccount) {
          try {
            // First ensure we're on the right network
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }]
            });
            
            // Request permissions to access accounts
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            });
            
            // Get current accounts
            const accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            
            console.log('Available accounts:', accounts);
            console.log('Target demo account:', demoAccount);
            
            // Check if the demo account is available
            if (accounts.includes(demoAccount)) {
              console.log('✅ Demo account is available');
            } else {
              console.log('❌ Demo account not found in MetaMask');
              console.log('Please add the demo account to MetaMask or use a different account');
            }
            
          } catch (switchError) {
            console.log('Account switch failed:', switchError.message);
          }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // Test the contract
        try {
          const casesCount = await contract.casesCount();
          console.log('✅ Demo mode using real contract, cases count:', casesCount.toString());
          
          // For board members, we need a signer for transactions
          let contractWithSigner = contract;
          let signer = null;
          
          if (demoAccount && await contract.isBoardMember(demoAccount)) {
            console.log('🔐 Board member detected - creating contract with signer');
            signer = await provider.getSigner();
            contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          }
          
          setProvider(provider);
          setSigner(signer);
          setContract(contractWithSigner);
        } catch (error) {
          console.log('❌ Real contract failed in demo mode, using mock');
          console.log('Contract error:', error.message);
          
          // Fallback to mock contract
          const mockContract = createMockContract();
          setProvider(null);
          setSigner(null);
          setContract(mockContract);
        }
        
      } catch (error) {
        console.log('❌ Demo mode error, using mock contract');
        console.log('Error:', error.message);
        
        // Fallback to mock contract
        const mockContract = createMockContract();
        setProvider(null);
        setSigner(null);
        setContract(mockContract);
      }
    } else {
      // For all other demo accounts, use pure mock mode (no MetaMask)
      console.log('🎭 Using pure demo mode (no MetaMask required)');
      const mockContract = createMockContract();
      setProvider(null);
      setSigner(null);
      setContract(mockContract);
    }
  };


  return {
    contract,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    setDemoMode
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
