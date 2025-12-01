import React, { useState, useEffect } from 'react';
import { generateNullifier } from '../utils/useContract';
import { emitTransaction } from './TransactionRecorder';
import ReceiptDisplay from './ReceiptDisplay';
import { getVoterReceipt, saveReceipt } from '../utils/receiptUtils';
import PieChart from './PieChart';

const VotingInterface = ({ contract, account, isConnected, userStatus: propUserStatus }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState({});
  const [userStatus, setUserStatus] = useState(propUserStatus || {
    isVerified: false,
    isBoardMember: false
  });
  
  // Sync with prop
  useEffect(() => {
    if (propUserStatus) {
      console.log('📊 VotingInterface - User status prop updated:', propUserStatus);
      setUserStatus(propUserStatus);
    }
  }, [propUserStatus]);
  const [notifications, setNotifications] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState({ hash: '', caseId: null });
  const [actualAddress, setActualAddress] = useState(null);

  useEffect(() => {
    if (contract) {
      loadData();
      
      // Set up live vote count updates every 5 seconds
      const interval = setInterval(() => {
        updateVoteCounts();
      }, 5000);
      
      return () => clearInterval(interval);
    } else {
      setCases([]);
      setUserStatus({ isVerified: false, isBoardMember: false });
      setLoading(false);
    }
  }, [contract, account]);

  const updateVoteCounts = async () => {
    if (!contract) return;
    
    try {
      const casesCount = await contract.casesCount();
      
      for (let i = 0; i < casesCount; i++) {
        const caseData = await contract.getCase(i);
        const newTotalVotes = Number(caseData.yesVotes) + Number(caseData.noVotes);
        
        setCases(prevCases => {
          const updatedCases = prevCases.map(c => {
            if (c.id === i) {
              const oldTotalVotes = c.totalVotes || 0;
              
              if (newTotalVotes > oldTotalVotes) {
                const newNotification = {
                  id: Date.now(),
                  message: `🔐 Anonymous vote cast on Case #${i + 1}`,
                  timestamp: new Date(),
                  type: 'vote'
                };
                
                setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
                
                setTimeout(() => {
                  setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
                }, 10000);
              }
              
              return { 
                ...c, 
                yesVotes: Number(caseData.yesVotes),
                noVotes: Number(caseData.noVotes),
                totalVotes: newTotalVotes
              };
            }
            return c;
          });
          
          return updatedCases;
        });
      }
    } catch (error) {
      console.error('Error updating vote counts:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Always add dummy cases for UI demo, even if contract isn't ready
      const now = Math.floor(Date.now() / 1000);
      const dummyActiveCase = {
        id: -1,
        description: 'Ethics review for telemedicine patient privacy protocols',
        createdAt: now - (2 * 24 * 60 * 60),
        deadline: now + (5 * 24 * 60 * 60),
        yesVotes: 0,
        noVotes: 0,
        hasVoted: false,
        timeRemaining: '5d 12h',
        isActive: true,
        totalVotes: 0,
        isDummy: true
      };
      
      const dummyClosedCases = [
        {
          id: -2,
          description: 'Patient consent for experimental treatment protocol',
          createdAt: now - (14 * 24 * 60 * 60),
          deadline: now - (7 * 24 * 60 * 60),
          yesVotes: 45,
          noVotes: 12,
          hasVoted: true,
          timeRemaining: '',
          isActive: false,
          totalVotes: 57,
          isDummy: true
        },
        {
          id: -3,
          description: 'Resource allocation for emergency department expansion',
          createdAt: now - (21 * 24 * 60 * 60),
          deadline: now - (14 * 24 * 60 * 60),
          yesVotes: 32,
          noVotes: 28,
          hasVoted: true,
          timeRemaining: '',
          isActive: false,
          totalVotes: 60,
          isDummy: true
        },
        {
          id: -4,
          description: 'Ethics review for AI-assisted diagnosis implementation',
          createdAt: now - (10 * 24 * 60 * 60),
          deadline: now - (3 * 24 * 60 * 60),
          yesVotes: 18,
          noVotes: 5,
          hasVoted: false,
          timeRemaining: '',
          isActive: false,
          totalVotes: 23,
          isDummy: true
        }
      ];
      
      // Get provider and signer - try multiple methods for ethers v6 compatibility
      let provider, signer, actualAddress;
      
      try {
        // Method 1: Try contract.runner (ethers v6)
        if (contract.runner && typeof contract.runner.getAddress === 'function') {
          signer = contract.runner;
          actualAddress = await signer.getAddress();
          provider = signer.provider;
        }
        // Method 2: Try contract.provider.getSigner()
        else if (contract.provider) {
          provider = contract.provider;
          signer = await provider.getSigner();
          actualAddress = await signer.getAddress();
        }
        // Method 3: Use window.ethereum directly
        else if (window.ethereum) {
          const { ethers } = await import('ethers');
          provider = new ethers.BrowserProvider(window.ethereum);
          signer = await provider.getSigner();
          actualAddress = await signer.getAddress();
        }
        else {
          throw new Error('No provider available');
        }
      } catch (error) {
        console.error('⚠️ Error getting provider/signer:', error);
        console.log('⚠️ Showing dummy cases only');
        setCases([dummyActiveCase, ...dummyClosedCases]);
        setLoading(false);
        return;
      }
      
      if (!provider || !signer || !actualAddress) {
        console.log('⚠️ No provider/signer available, showing dummy cases only');
        setCases([dummyActiveCase, ...dummyClosedCases]);
        setLoading(false);
        return;
      }
      
      console.log('🔍 Loading data for account:', actualAddress);
      
      // Check permissions based on ACTUAL account
      let isVerified = false;
      let isBoardMember = false;
      
      try {
        isVerified = await contract.isVoterVerified(actualAddress);
        isBoardMember = await contract.isBoardMember(actualAddress);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
      
      console.log('User status check:', { 
        actualAddress, 
        isVerified, 
        isBoardMember 
      });
      
      setUserStatus({ isVerified, isBoardMember });
      setActualAddress(actualAddress);
      
      console.log('✅ VotingInterface - Updated user status:', { actualAddress, isVerified, isBoardMember });

      // Get cases count
      let casesCount = 0;
      try {
        casesCount = await contract.casesCount();
        console.log('📋 Cases count:', casesCount.toString());
      } catch (error) {
        console.error('Error getting cases count:', error);
        // Even if contract fails, show dummy cases
        setCases([dummyActiveCase, ...dummyClosedCases]);
        setLoading(false);
        return;
      }
      
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        try {
          const caseData = await contract.getCase(i);
          let hasVoted = false;
          
          try {
            hasVoted = await contract.hasVoterVoted(actualAddress, i);
          } catch (error) {
            console.warn(`Error checking vote status for case ${i}:`, error);
          }
          
          const createdAt = caseData.createdAt ? Number(caseData.createdAt) : 0;
          const deadline = caseData.deadline ? Number(caseData.deadline) : 0;
          
          const now = Math.floor(Date.now() / 1000);
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
            createdAt: createdAt,
            deadline: deadline,
            yesVotes: Number(caseData.yesVotes) || 0,
            noVotes: Number(caseData.noVotes) || 0,
            hasVoted,
            timeRemaining: timeRemaining,
            isActive: isActive,
            totalVotes: (Number(caseData.yesVotes) || 0) + (Number(caseData.noVotes) || 0)
          });
        } catch (error) {
          console.error(`Error loading case ${i}:`, error);
          // Continue loading other cases even if one fails
        }
      }

      // Combine: real cases first, then dummy closed cases
      // Only add dummy active case if NO real active cases exist
      const hasRealActiveCase = casesData.some(c => c.isActive);
      let allCases;
      if (hasRealActiveCase) {
        // Real active cases exist - ONLY show real cases + dummy closed cases (NO dummy active case)
        allCases = [...casesData, ...dummyClosedCases];
        console.log('✅ Real active cases found - showing real cases only (dummy active excluded)');
        console.log(`   Real active cases: ${casesData.filter(c => c.isActive).length}`);
        console.log(`   Real closed cases: ${casesData.filter(c => !c.isActive).length}`);
        console.log(`   Dummy closed cases: ${dummyClosedCases.length}`);
      } else {
        // No real active cases - show dummy active case + real cases + dummy closed cases
        allCases = [dummyActiveCase, ...casesData, ...dummyClosedCases];
        console.log('⚠️ No real active cases - showing dummy active case');
      }
      
      console.log('✅ Setting cases:', {
        totalCases: allCases.length,
        realCases: casesData.length,
        realActive: casesData.filter(c => c.isActive).length,
        dummyActive: !hasRealActiveCase ? 1 : 0,
        dummyClosed: dummyClosedCases.length,
        activeCasesPreview: allCases.filter(c => c.isActive).slice(0, 3).map(c => ({ 
          id: c.id, 
          isDummy: c.isDummy, 
          desc: c.description?.substring(0, 50) 
        }))
      });
      
      setCases(allCases);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (caseId, vote) => {
    if (!contract) {
      console.error('❌ Cannot vote: contract missing');
      return;
    }

    try {
      // Get the ACTUAL MetaMask account - try multiple methods for ethers v6 compatibility
      let provider, signer, actualAddress;
      
      // Method 1: Try contract.runner (ethers v6)
      if (contract.runner && typeof contract.runner.getAddress === 'function') {
        signer = contract.runner;
        actualAddress = await signer.getAddress();
        provider = signer.provider;
      }
      // Method 2: Try contract.provider.getSigner()
      else if (contract.provider) {
        provider = contract.provider;
        signer = await provider.getSigner();
        actualAddress = await signer.getAddress();
      }
      // Method 3: Use window.ethereum directly
      else if (window.ethereum) {
        const { ethers } = await import('ethers');
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        actualAddress = await signer.getAddress();
      }
      else {
        alert('⚠️ No provider available. Please connect MetaMask.');
        return;
      }
      
      // Double-check the ACTUAL account is verified before voting
      const isVerified = await contract.isVoterVerified(actualAddress);
      console.log('🔍 Vote - Account verification check:', { 
        actualAddress, 
        isVerified 
      });
      
      if (!isVerified) {
        console.error('❌ Cannot vote: actual MetaMask account is not verified');
        alert('⚠️ Your MetaMask account is not verified as a voter. Please switch to a verified voter account in MetaMask.');
        return;
      }

      setVotingStatus(prev => ({ ...prev, [caseId]: 'voting' }));

      const nullifierHash = generateNullifier(actualAddress, caseId);
      
      console.log(`🔐 ZK Proof Simulation:`);
      console.log(`   Voter: ${actualAddress}`);
      console.log(`   Case: ${caseId}`);
      console.log(`   Vote: ${vote ? 'YES' : 'NO'}`);
      console.log(`   Nullifier Hash: ${nullifierHash}`);

      // Connect the contract with the signer to ensure transactions work
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.submitVote(caseId, vote, nullifierHash);
      await tx.wait();

      emitTransaction('vote_submitted', {
        caseId,
        vote,
        voter: actualAddress,
        nullifierHash
      });

      // Get receipt after vote
      const receiptHash = await getVoterReceipt(contract, account, caseId);
      
      if (receiptHash && receiptHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        setCurrentReceipt({ hash: receiptHash, caseId });
        setShowReceipt(true);
        
        // Auto-save receipt
        saveReceipt(receiptHash, caseId, account);
      }

      await loadData();
      
      setVotingStatus(prev => ({ ...prev, [caseId]: 'success' }));
      
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [caseId]: null }));
      }, 3000);

    } catch (error) {
      console.error('Error voting:', error);
      
      // Check if it's an account mismatch error
      if (error.message && error.message.includes('Not a verified voter')) {
        alert('⚠️ Account Mismatch: Please switch to the correct account in MetaMask. The account you selected in Demo Mode must match your active MetaMask account.');
      } else if (error.message) {
        alert(`Error: ${error.message}`);
      }
      
      setVotingStatus(prev => ({ ...prev, [caseId]: 'error' }));
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [caseId]: null }));
      }, 3000);
      setVotingStatus(prev => ({ ...prev, [caseId]: 'error' }));
      
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [caseId]: null }));
      }, 3000);
    }
  };

  const handleSaveReceipt = (receiptHash, caseId) => {
    saveReceipt(receiptHash, caseId, actualAddress || account);
    alert('Receipt saved successfully!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Don't block access, just show warnings - let users see the interface

  return (
    <div className="space-y-6">
      {/* Receipt Display - Animated Entry */}
      {showReceipt && currentReceipt.hash && (
        <div className="animate-fade-in">
          <ReceiptDisplay 
            receiptHash={currentReceipt.hash}
            caseId={currentReceipt.caseId}
            onSave={handleSaveReceipt}
          />
          <button
            onClick={() => setShowReceipt(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* User Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {userStatus.isVerified ? 'Welcome, Verified Voter' : 'Voting Interface'}
            </h2>
            <p className="text-sm text-gray-600">
              {actualAddress ? `${actualAddress.slice(0, 6)}...${actualAddress.slice(-4)}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              MetaMask account
            </p>
          </div>
          {userStatus.isVerified ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              ✅ Verified Voter
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⚠️ Not Verified
            </span>
          )}
        </div>
        {!userStatus.isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Access Restricted:</strong> Your MetaMask account is not verified as a voter. 
              Please switch to a verified voter account in MetaMask to vote.
            </p>
          </div>
        )}
      </div>

      {/* Live Notifications */}
      {notifications.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">🔔 Live Activity</h3>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200 animate-slide-in"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-800">{notification.message}</span>
                <span className="text-xs text-blue-600 ml-auto">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separate Active and Closed Cases */}
      {(() => {
        // Active cases: real active cases first, then dummy active case only if no real ones
        const realActiveCases = cases.filter(c => c.isActive && !c.isDummy);
        const dummyActiveCase = cases.find(c => c.isActive && c.isDummy);
        const activeCases = realActiveCases.length > 0 
          ? realActiveCases  // Show only real active cases if they exist
          : (dummyActiveCase ? [dummyActiveCase] : []); // Show dummy only if no real ones
        
        // Closed cases: cases that are not active (including dummy closed cases)
        const closedCases = cases.filter(c => !c.isActive);
        
        console.log('📊 Cases breakdown:', {
          total: cases.length,
          realActive: realActiveCases.length,
          dummyActive: dummyActiveCase ? 1 : 0,
          active: activeCases.length,
          closed: closedCases.length,
          activeCases: activeCases.map(c => ({ id: c.id, description: c.description?.substring(0, 40), isDummy: c.isDummy })),
          closedCases: closedCases.map(c => ({ id: c.id, description: c.description?.substring(0, 40), isDummy: c.isDummy }))
        });
        
        return (
          <>
            {/* Active Cases */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🟢</span>
                Active Cases - Cast Your Vote
              </h2>
              
              {activeCases.length === 0 ? (
                <div className="card text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Cases
                  </h3>
                  <p className="text-gray-600">
                    There are currently no ethics cases open for voting.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activeCases.map((caseItem) => (
                    <div key={caseItem.id} className="card hover:shadow-lg transition-shadow border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Case #{caseItem.id + 1}: {caseItem.description}
                            </h3>
                            {!caseItem.hasVoted && caseItem.isActive && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium animate-pulse">
                                ⚡ Not Cast Yet
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Created: {caseItem.createdAt && caseItem.createdAt > 0 
                              ? new Date(caseItem.createdAt * 1000).toLocaleDateString() 
                              : 'N/A'}</span>
                            <span>Deadline: {caseItem.deadline && caseItem.deadline > 0 
                              ? new Date(caseItem.deadline * 1000).toLocaleDateString() 
                              : 'N/A'}</span>
                          </div>
                        </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      caseItem.isActive 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.isActive ? '🟢 Active' : '🔴 Ended'}
                    </div>
                    {caseItem.isActive && (
                      <p className="text-sm text-gray-600 mt-1">
                        {caseItem.timeRemaining} left
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Counts */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {Number(caseItem.yesVotes)}
                    </div>
                    <div className="text-sm text-gray-600">Yes Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-danger-600">
                      {Number(caseItem.noVotes)}
                    </div>
                    <div className="text-sm text-gray-600">No Votes</div>
                  </div>
                </div>

                {/* Voting Actions */}
                {caseItem.isActive && userStatus.isVerified && (
                  <div className="border-t pt-4">
                    {caseItem.isDummy ? (
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-100 text-blue-800 mb-2">
                          <span className="mr-2">ℹ️</span>
                          This is a demo case. Create a real case from Board Interface to vote.
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Switch to Board Member account to create real cases for voting
                        </p>
                      </div>
                    ) : caseItem.hasVoted ? (
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 py-2 rounded-lg bg-success-100 text-success-800">
                          <span className="mr-2">✅</span>
                          You have already voted on this case
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => handleVote(caseItem.id, true)}
                          disabled={!userStatus.isVerified || votingStatus[caseItem.id] === 'voting' || caseItem.hasVoted || !caseItem.isActive || caseItem.isDummy}
                          className={`btn-success transition-all ${
                            !userStatus.isVerified || votingStatus[caseItem.id] === 'voting' || caseItem.hasVoted || !caseItem.isActive || caseItem.isDummy
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:scale-105'
                          }`}
                          title={caseItem.isDummy ? 'This is a demo case' : !userStatus.isVerified ? 'You must be a verified voter to vote' : caseItem.hasVoted ? 'You have already voted' : ''}
                        >
                          {votingStatus[caseItem.id] === 'voting' ? 'Voting...' : 'Vote YES'}
                        </button>
                        <button
                          onClick={() => handleVote(caseItem.id, false)}
                          disabled={!userStatus.isVerified || votingStatus[caseItem.id] === 'voting' || caseItem.hasVoted || !caseItem.isActive || caseItem.isDummy}
                          className={`btn-danger transition-all ${
                            !userStatus.isVerified || votingStatus[caseItem.id] === 'voting' || caseItem.hasVoted || !caseItem.isActive || caseItem.isDummy
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:scale-105'
                          }`}
                          title={caseItem.isDummy ? 'This is a demo case' : !userStatus.isVerified ? 'You must be a verified voter to vote' : caseItem.hasVoted ? 'You have already voted' : ''}
                        >
                          {votingStatus[caseItem.id] === 'voting' ? 'Voting...' : 'Vote NO'}
                        </button>
                      </div>
                    )}
                    
                    {votingStatus[caseItem.id] === 'success' && (
                      <div className="text-center mt-2 animate-fade-in">
                        <span className="text-success-600 text-sm">✅ Vote submitted successfully!</span>
                      </div>
                    )}
                    
                    {votingStatus[caseItem.id] === 'error' && (
                      <div className="text-center mt-2">
                        <span className="text-danger-600 text-sm">❌ Error submitting vote</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
                  ))}
                </div>
              )}
            </div>

            {/* Closed/Inactive Cases */}
            {closedCases.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Closed Cases - View Results
                </h2>
                
                <div className="grid gap-6">
                  {closedCases.map((caseItem) => {
                    const yesPercent = caseItem.totalVotes > 0 
                      ? Math.round((caseItem.yesVotes / caseItem.totalVotes) * 100) 
                      : 0;
                    const noPercent = caseItem.totalVotes > 0 
                      ? Math.round((caseItem.noVotes / caseItem.totalVotes) * 100) 
                      : 0;
                    const isApproved = caseItem.yesVotes > caseItem.noVotes;
                    
                    return (
                      <div key={caseItem.id} className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {caseItem.isDummy ? `Case #${Math.abs(caseItem.id)}` : `Case #${caseItem.id + 1}`}: {caseItem.description}
                              </h3>
                              {caseItem.isDummy && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Demo</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Created: {caseItem.createdAt && caseItem.createdAt > 0 
                                ? new Date(caseItem.createdAt * 1000).toLocaleDateString() 
                                : 'N/A'}</span>
                              <span>Closed: {caseItem.deadline && caseItem.deadline > 0 
                                ? new Date(caseItem.deadline * 1000).toLocaleDateString() 
                                : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              isApproved
                                ? 'bg-success-100 text-success-800'
                                : 'bg-danger-100 text-danger-800'
                            }`}>
                              {isApproved ? '✅ Approved' : '❌ Rejected'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Voting Closed</p>
                          </div>
                        </div>

                        {/* Results with Pie Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                          {/* Pie Chart */}
                          <div className="flex items-center justify-center">
                            <PieChart 
                              yesVotes={caseItem.yesVotes} 
                              noVotes={caseItem.noVotes} 
                              size={140}
                            />
                          </div>
                          
                          {/* Vote Stats */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Yes Votes</span>
                                <span className="text-lg font-bold text-success-600">
                                  {caseItem.yesVotes} ({yesPercent}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-success-500 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${yesPercent}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">No Votes</span>
                                <span className="text-lg font-bold text-danger-600">
                                  {caseItem.noVotes} ({noPercent}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-danger-500 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${noPercent}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                              <div className="text-center">
                                <span className="text-sm text-gray-600">Total: </span>
                                <span className="text-lg font-bold text-gray-900">{caseItem.totalVotes} votes</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Outcome */}
                          <div className="flex flex-col justify-center items-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                              isApproved 
                                ? 'bg-success-100' 
                                : 'bg-danger-100'
                            }`}>
                              <span className="text-4xl">
                                {isApproved ? '✅' : '❌'}
                              </span>
                            </div>
                            <p className={`text-sm font-semibold ${
                              isApproved 
                                ? 'text-success-700' 
                                : 'text-danger-700'
                            }`}>
                              {isApproved ? 'Approved' : 'Rejected'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {isApproved 
                                ? `${yesPercent}% in favor` 
                                : `${noPercent}% against`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

export default VotingInterface;

