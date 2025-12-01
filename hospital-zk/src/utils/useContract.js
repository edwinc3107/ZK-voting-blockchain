import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import the contract ABI
import contractArtifact from '../../../artifacts/contracts/HospitalEthicsVoting.sol/HospitalEthicsVoting.json';

const CONTRACT_ABI = contractArtifact.abi;

// Contract address - Update this after deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      // Check and switch to localhost network if needed
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);
      
      if (chainId !== '0x539') { // 0x539 = 1337 in hex (Hardhat localhost)
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

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      console.log('Available accounts:', accounts);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Test the contract with a simple call
      try {
        console.log('Testing contract connection...');
        const casesCount = await contract.casesCount();
        console.log('✅ Real contract is working, cases count:', casesCount.toString());
      } catch (contractError) {
        console.log('❌ Real contract failed:', contractError.message);
        // Check if it's a network/RPC error
        if (contractError.code === 'CALL_EXCEPTION' || contractError.message.includes('missing revert data')) {
          throw new Error('Hardhat localhost node is not running. Please start it with: npx hardhat node');
        }
        throw contractError;
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

  const setDemoMode = async (demoAccount) => {
    console.log('🎭 Setting demo mode with account:', demoAccount);
    
    if (!window.ethereum) {
      console.log('🎭 Using demo mode without MetaMask');
      return;
    }

    try {
      // Check and switch to localhost network if needed
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔗 Current chain ID:', chainId);
      
      if (chainId !== '0x539') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
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
          }
        }
      }

      // Get current MetaMask accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('📋 MetaMask accounts:', accounts);
      console.log('🎯 Target demo account:', demoAccount);
      
      // Check if the target account is in MetaMask
      const accountMatches = accounts.some(acc => acc.toLowerCase() === demoAccount.toLowerCase());
      
      if (!accountMatches) {
        console.log('ℹ️ Demo account not in MetaMask. Using current MetaMask account.');
        console.log('   To use demo account, import it in MetaMask using the private key shown in Demo Mode.');
      }
      
      // Try to request account switch if the account exists but isn't active
      if (accountMatches) {
        const currentAccount = accounts[0]?.toLowerCase();
        const targetAccount = demoAccount.toLowerCase();
        
        if (currentAccount !== targetAccount) {
          console.log('🔄 Requesting account switch in MetaMask...');
          try {
            // Request permissions - this will show MetaMask's account selection
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            });
            
            // Re-check accounts after permission request
            const newAccounts = await window.ethereum.request({ method: 'eth_accounts' });
            const switched = newAccounts.some(acc => acc.toLowerCase() === targetAccount);
            
            if (switched) {
              console.log('✅ Account switched successfully in MetaMask');
            } else {
              console.log('ℹ️ Account switch cancelled. Please manually switch to the target account in MetaMask.');
            }
          } catch (error) {
            console.log('ℹ️ Account switch cancelled or failed:', error.message);
            console.log('   Please manually switch to the target account in MetaMask.');
          }
        }
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the current signer (whatever account MetaMask is using now)
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('✍️ Current MetaMask signer:', signerAddress);
      
      const signerMatches = signerAddress.toLowerCase() === demoAccount.toLowerCase();
      
      if (signerMatches) {
        console.log('✅ Using demo account:', signerAddress);
      } else {
        console.log('ℹ️ Current MetaMask account:', signerAddress);
        console.log('   Expected demo account:', demoAccount);
        console.log('   Using current MetaMask account for transactions.');
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Test the contract and verify permissions
      try {
        const casesCount = await contract.casesCount();
        console.log('✅ Contract connected, cases count:', casesCount.toString());
        
        // Verify account permissions (use signerAddress, not demoAccount)
        const isVerified = await contract.isVoterVerified(signerAddress);
        const isBoardMember = await contract.isBoardMember(signerAddress);
        console.log('👤 Account permissions:', { 
          address: signerAddress,
          isVerified, 
          isBoardMember,
          targetAccount: demoAccount,
          matches: signerAddress.toLowerCase() === demoAccount.toLowerCase()
        });
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        
        // Return both the account and permission status so App.jsx can update immediately
        return {
          account: signerAddress,
          contract: contract, // Return contract so it can be used immediately
          isVerified,
          isBoardMember
        };
      } catch (error) {
        console.log('❌ Contract test failed:', error.message);
        if (error.code === 'CALL_EXCEPTION' || error.message.includes('missing revert data')) {
          throw new Error('Hardhat localhost node is not running. Please start it with: npx hardhat node');
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Demo mode error:', error);
      throw error;
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

