import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { emitTransaction } from './TransactionRecorder';
import { recordGasMetrics } from '../utils/gasUtils';

const BoardInterface = ({ contract, account, isConnected, userStatus }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCase, setNewCase] = useState({
    description: '',
    duration: 7
  });
  const [submittingCase, setSubmittingCase] = useState(false);
  const [actualAddress, setActualAddress] = useState(null);

  useEffect(() => {
    const getActualAddress = async () => {
      if (contract?.provider) {
        try {
          const signer = await contract.provider.getSigner();
          const addr = await signer.getAddress();
          setActualAddress(addr);
        } catch (error) {
          console.error('Error getting actual address:', error);
        }
      }
    };
    getActualAddress();
  }, [contract]);

  useEffect(() => {
    if (contract) {
      loadData();
    } else {
      setCases([]);
      setLoading(false);
    }
  }, [contract]);

  // Also reload when userStatus changes (permissions might have updated)
  useEffect(() => {
    if (contract && userStatus) {
      console.log('🔄 [BoardInterface] userStatus prop changed:', userStatus);
      loadData();
    }
  }, [userStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get the signer - contract might already have one, or we need to get it from provider
      let signer;
      let actualAddress;
      
      // Check if contract has a runner (signer) attached (ethers v6)
      if (contract.runner && typeof contract.runner.getAddress === 'function') {
        signer = contract.runner;
        actualAddress = await signer.getAddress();
      } else if (contract.provider) {
        // Fallback: get signer from provider
        signer = await contract.provider.getSigner();
        actualAddress = await signer.getAddress();
      } else if (window.ethereum) {
        // Last resort: create new provider and signer
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        actualAddress = await signer.getAddress();
      } else {
        console.warn('⚠️ No provider available for loading data');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Board Interface - Checking permissions for:', actualAddress);
      console.log('📋 Contract address:', contract.target || contract.address);
      
      // Verify the ACTUAL account is a board member
      let isBoardMember = false;
      try {
        isBoardMember = await contract.isBoardMember(actualAddress);
        console.log('✅ Permission check result:', { 
          actualAddress, 
          isBoardMember,
          addressLowercase: actualAddress.toLowerCase()
        });
      } catch (error) {
        console.error('❌ Error checking board member status:', error);
        console.error('   Error details:', {
          message: error.message,
          code: error.code,
          data: error.data
        });
      }
      
      // Don't block - let UI show warning if not board member
      if (!isBoardMember) {
        console.warn('⚠️ Actual MetaMask account is not a board member:', actualAddress);
        console.warn('   Expected board member: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
        console.warn('   Make sure:');
        console.warn('   1. Hardhat node is running (npx hardhat node)');
        console.warn('   2. Contract is deployed (npx hardhat run scripts/deploy-hospital-ethics.js --network localhost)');
        console.warn('   3. Contract address matches in useContract.js');
      }

      // Get cases count
      let casesCount = 0;
      try {
        casesCount = await contract.casesCount();
        console.log('📋 Cases count:', casesCount.toString());
      } catch (error) {
        console.error('Error getting cases count:', error);
        setLoading(false);
        return;
      }
      
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        try {
          const caseData = await contract.getCase(i);
          const now = Math.floor(Date.now() / 1000);
          const deadline = Number(caseData.deadline);
          const isActive = deadline > now && caseData.isActive;
          
          // Calculate time remaining
          let timeRemaining = '';
          if (deadline > 0 && isActive) {
            const remaining = deadline - now;
            const days = Math.floor(remaining / 86400);
            const hours = Math.floor((remaining % 86400) / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            if (days > 0) {
              timeRemaining = `${days}d ${hours}h`;
            } else if (hours > 0) {
              timeRemaining = `${hours}h ${minutes}m`;
            } else {
              timeRemaining = `${minutes}m`;
            }
          }
          
          casesData.push({
            id: i,
            description: caseData.description || '',
            createdAt: Number(caseData.createdAt) || 0,
            deadline: deadline,
            yesVotes: Number(caseData.yesVotes) || 0,
            noVotes: Number(caseData.noVotes) || 0,
            isActive: isActive,
            timeRemaining: timeRemaining
          });
        } catch (error) {
          console.error(`Error loading case ${i}:`, error);
          // Continue loading other cases even if one fails
        }
      }
      
      console.log(`✅ Loaded ${casesData.length} cases`);
      console.log('📋 Cases data:', casesData.map(c => ({ id: c.id, description: c.description, isActive: c.isActive })));

      setCases(casesData);
      console.log('✅ Cases state updated in BoardInterface');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!contract || !newCase.description.trim()) {
      console.error('❌ Cannot create case: missing contract or description');
      return;
    }

    try {
      // Get the signer - contract might already have one, or we need to get it from provider
      let signer;
      let actualAddress;
      
      // Check if contract has a runner (signer) attached (ethers v6)
      if (contract.runner && typeof contract.runner.getAddress === 'function') {
        signer = contract.runner;
        actualAddress = await signer.getAddress();
      } else if (contract.provider) {
        // Fallback: get signer from provider
        signer = await contract.provider.getSigner();
        actualAddress = await signer.getAddress();
      } else if (window.ethereum) {
        // Last resort: create new provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        actualAddress = await signer.getAddress();
      } else {
        alert('⚠️ No provider available. Please connect MetaMask.');
        return;
      }
      
      console.log('🔍 Create Case - Using account:', actualAddress);
      
      // Double-check the ACTUAL account is a board member
      const isBoardMember = await contract.isBoardMember(actualAddress);
      console.log('🔍 Create Case - Board member check:', { 
        actualAddress, 
        isBoardMember 
      });
      
      if (!isBoardMember) {
        console.error('❌ Cannot create case: actual MetaMask account is not a board member');
        alert('⚠️ Your MetaMask account is not a board member. Please switch to a board member account in MetaMask.');
        return;
      }

      setSubmittingCase(true);
      
      const durationInSeconds = newCase.duration * 24 * 60 * 60;
      
      // Use contract directly if it already has a signer, otherwise connect it
      const contractToUse = contract.runner ? contract : contract.connect(signer);
      const tx = await contractToUse.createEthicsCase(newCase.description, durationInSeconds);
      const receipt = await tx.wait();

      // Record gas metrics
      recordGasMetrics('BOARD_CREATE_CASE', receipt, actualAddress, {
        caseDescription: newCase.description,
        duration: newCase.duration
      });

      emitTransaction('case_created', {
        description: newCase.description,
        duration: newCase.duration,
        creator: actualAddress
      });

      setNewCase({ description: '', duration: 7 });
      
      // Force a refresh of the cases list - wait a bit for blockchain to update
      console.log('✅ Case created successfully, refreshing cases list...');
      
      // Wait a moment for the transaction to be mined and state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the data
      await loadData();
      
      // Also trigger another refresh after a longer delay to ensure blockchain state is fully updated
      setTimeout(async () => {
        console.log('🔄 Refreshing cases list again to ensure all cases are loaded...');
        await loadData();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setSubmittingCase(false);
    }
  };

  const handleResolveCase = async (caseId) => {
    if (!contract || !account) return;

    try {
      // Get the signer and actual address
      let signer;
      let actualAddress;
      
      // Check if contract has a runner (signer) attached (ethers v6)
      if (contract.runner && typeof contract.runner.getAddress === 'function') {
        signer = contract.runner;
        actualAddress = await signer.getAddress();
      } else if (contract.provider) {
        // Fallback: get signer from provider
        signer = await contract.provider.getSigner();
        actualAddress = await signer.getAddress();
      } else if (window.ethereum) {
        // Last resort: create new provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        actualAddress = await signer.getAddress();
      } else {
        alert('⚠️ No provider available. Please connect MetaMask.');
        return;
      }
      
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.resolveCase(caseId);
      const receipt = await tx.wait();

      // Record gas metrics
      const caseData = await contract.getCase(caseId);
      const approved = Number(caseData.yesVotes) > Number(caseData.noVotes);
      
      recordGasMetrics('BOARD_RESOLVE_CASE', receipt, actualAddress, {
        caseId,
        approved,
        yesVotes: Number(caseData.yesVotes),
        noVotes: Number(caseData.noVotes)
      });

      emitTransaction('case_resolved', {
        caseId,
        approved,
        yesVotes: Number(caseData.yesVotes),
        noVotes: Number(caseData.noVotes)
      });

      await loadData();
      
    } catch (error) {
      console.error('Error resolving case:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Board Member Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              {actualAddress ? `${actualAddress.slice(0, 6)}...${actualAddress.slice(-4)}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              MetaMask account
            </p>
          </div>
          {userStatus && userStatus.isBoardMember ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-medical-100 text-medical-800">
              👥 Board Member
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⚠️ Not Board Member
            </span>
          )}
        </div>
      </div>

      {/* Only show create case form if user is actually a board member */}
      {userStatus && userStatus.isBoardMember ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Ethics Case
          </h3>
          
          <form onSubmit={handleCreateCase} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Case Description
            </label>
            <textarea
              id="description"
              value={newCase.description}
              onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
              placeholder="Describe the ethics case that needs voting..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Voting Duration (days)
            </label>
            <select
              id="duration"
              value={newCase.duration}
              onChange={(e) => setNewCase({ ...newCase, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={submittingCase || !newCase.description.trim()}
            className={`btn-primary ${
              submittingCase || !newCase.description.trim() 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            {submittingCase ? 'Creating Case...' : 'Create Ethics Case'}
          </button>
        </form>
        </div>
      ) : (
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Access Restricted
          </h3>
          <p className="text-sm text-yellow-800">
            Your current MetaMask account is not a board member. Only board members can create ethics cases.
            Please switch to a board member account in MetaMask.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Ethics Cases Management
        </h3>
        
        {cases.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No cases created yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Case #{caseItem.id + 1}: {caseItem.description}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Created: {caseItem.createdAt && caseItem.createdAt > 0 
                        ? new Date(Number(caseItem.createdAt) * 1000).toLocaleDateString() 
                        : 'N/A'}</span>
                      <span>Deadline: {caseItem.deadline && caseItem.deadline > 0 
                        ? new Date(Number(caseItem.deadline) * 1000).toLocaleDateString() 
                        : 'N/A'}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    caseItem.isActive 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {caseItem.isActive ? '🟢 Active' : '🔴 Ended'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {Number(caseItem.yesVotes) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Yes Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-danger-600">
                      {Number(caseItem.noVotes) || 0}
                    </div>
                    <div className="text-sm text-gray-600">No Votes</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {caseItem.isActive ? (
                    <div className="text-center">
                      <div className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-100 text-blue-800">
                        <span className="mr-2">⏳</span>
                        Voting in progress
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleResolveCase(caseItem.id)}
                        className="btn-primary"
                      >
                        Resolve Case
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardInterface;

