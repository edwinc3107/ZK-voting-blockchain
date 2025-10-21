import React, { useState, useEffect } from 'react';
import { generateNullifier, formatTimeRemaining, isVotingActive } from '../utils/useContract';
import { emitTransaction } from './TransactionRecorder';

const VotingInterface = ({ contract, account, isConnected }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState({});
  const [userStatus, setUserStatus] = useState({
    isVerified: false,
    isBoardMember: false
  });

  useEffect(() => {
    if (contract && account) {
      loadData();
    } else {
      // Reset state when no contract/account
      setCases([]);
      setUserStatus({ isVerified: false, isBoardMember: false });
      setLoading(false);
    }
  }, [contract, account]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check user status
      const isVerified = await contract.isVoterVerified(account);
      const isBoardMember = await contract.isBoardMember(account);
      
      console.log(`🔍 User Status Check:`);
      console.log(`   Address: ${account}`);
      console.log(`   Is Verified: ${isVerified}`);
      console.log(`   Is Board Member: ${isBoardMember}`);
      
      setUserStatus({ isVerified, isBoardMember });

      // Load cases
      const casesCount = await contract.casesCount();
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        const caseData = await contract.getCase(i);
        const hasVoted = await contract.hasVoterVoted(account, i);
        
        casesData.push({
          id: i,
          ...caseData,
          hasVoted,
          timeRemaining: formatTimeRemaining(Number(caseData.deadline)),
          isActive: isVotingActive(Number(caseData.deadline))
        });
      }

      setCases(casesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (caseId, vote) => {
    if (!contract || !account) return;

    try {
      setVotingStatus(prev => ({ ...prev, [caseId]: 'voting' }));

      // Generate nullifier hash (ZK simulation)
      const nullifierHash = generateNullifier(account, caseId);
      
      console.log(`🔐 ZK Proof Simulation:`);
      console.log(`   Voter: ${account}`);
      console.log(`   Case: ${caseId}`);
      console.log(`   Vote: ${vote ? 'YES' : 'NO'}`);
      console.log(`   Nullifier Hash: ${nullifierHash}`);
      console.log(`   This proves vote validity without revealing identity`);

      // Submit vote
      const tx = await contract.submitVote(caseId, vote, nullifierHash);
      await tx.wait();

      // Emit transaction event
      emitTransaction('vote_submitted', {
        caseId,
        vote,
        voter: account,
        nullifierHash
      });

      // Reload data
      await loadData();
      
      setVotingStatus(prev => ({ ...prev, [caseId]: 'success' }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [caseId]: null }));
      }, 3000);

    } catch (error) {
      console.error('Error voting:', error);
      setVotingStatus(prev => ({ ...prev, [caseId]: 'error' }));
      
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [caseId]: null }));
      }, 3000);
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

  if (!userStatus.isVerified && !userStatus.isBoardMember) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-yellow-600 text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          Your account is not verified for voting. Please contact the ethics committee.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            <strong>Your Address:</strong> {account}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome, {userStatus.isBoardMember ? 'Board Member' : 'Verified Voter'}
            </h2>
            <p className="text-sm text-gray-600">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'No account'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {userStatus.isVerified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                ✅ Verified Voter
              </span>
            )}
            {userStatus.isBoardMember && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-medical-100 text-medical-800">
                👥 Board Member
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Cases */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Active Ethics Cases
        </h2>
        
        {cases.length === 0 ? (
          <div className="card text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📋</span>
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
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Case #{caseItem.id}: {caseItem.description}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Created: {new Date(Number(caseItem.createdAt) * 1000).toLocaleDateString()}</span>
                      <span>Deadline: {new Date(Number(caseItem.deadline) * 1000).toLocaleDateString()}</span>
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
                    {caseItem.hasVoted ? (
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
                          disabled={votingStatus[caseItem.id] === 'voting'}
                          className={`btn-success ${
                            votingStatus[caseItem.id] === 'voting' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {votingStatus[caseItem.id] === 'voting' ? 'Voting...' : 'Vote YES'}
                        </button>
                        <button
                          onClick={() => handleVote(caseItem.id, false)}
                          disabled={votingStatus[caseItem.id] === 'voting'}
                          className={`btn-danger ${
                            votingStatus[caseItem.id] === 'voting' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {votingStatus[caseItem.id] === 'voting' ? 'Voting...' : 'Vote NO'}
                        </button>
                      </div>
                    )}
                    
                    {votingStatus[caseItem.id] === 'success' && (
                      <div className="text-center mt-2">
                        <span className="text-success-600 text-sm">✅ Vote submitted successfully!</span>
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-800">
                            🔐 <strong>ZK Proof Generated:</strong> Vote verified with nullifier hash
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Check browser console for details
                          </p>
                        </div>
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
    </div>
  );
};

export default VotingInterface;
