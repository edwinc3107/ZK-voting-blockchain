import React, { useState, useEffect } from 'react';
import { emitTransaction } from './TransactionRecorder';

const BoardInterface = ({ contract, account, isConnected }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState({
    isBoardMember: false
  });
  const [newCase, setNewCase] = useState({
    description: '',
    duration: 7 // days
  });
  const [submittingCase, setSubmittingCase] = useState(false);

  useEffect(() => {
    if (contract && account) {
      loadData();
    } else {
      setCases([]);
      setUserStatus({ isBoardMember: false });
      setLoading(false);
    }
  }, [contract, account]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is board member
      const isBoardMember = await contract.isBoardMember(account);
      setUserStatus({ isBoardMember });

      // Load cases
      const casesCount = await contract.casesCount();
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        const caseData = await contract.getCase(i);
        casesData.push({
          id: i,
          ...caseData,
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

  const formatTimeRemaining = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isVotingActive = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    return deadline > now;
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!contract || !account || !newCase.description.trim()) return;

    try {
      setSubmittingCase(true);
      
      // Convert days to seconds
      const durationInSeconds = newCase.duration * 24 * 60 * 60;
      
      console.log(`📋 Creating Ethics Case:`);
      console.log(`   Description: ${newCase.description}`);
      console.log(`   Duration: ${newCase.duration} days`);
      console.log(`   Board Member: ${account}`);

      const tx = await contract.createEthicsCase(newCase.description, durationInSeconds);
      await tx.wait();

      // Get current cases count for the transaction event
      const currentCasesCount = await contract.casesCount();

      // Emit transaction event
      emitTransaction('case_created', {
        caseId: currentCasesCount,
        description: newCase.description,
        duration: newCase.duration,
        creator: account
      });

      // Reset form
      setNewCase({ description: '', duration: 7 });
      
      // Reload data
      await loadData();
      
      console.log('✅ Case created successfully!');
      
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setSubmittingCase(false);
    }
  };

  const handleResolveCase = async (caseId) => {
    if (!contract || !account) return;

    try {
      console.log(`🔍 Resolving Case #${caseId}`);
      
      const tx = await contract.resolveCase(caseId);
      await tx.wait();

      // Get case data to determine approval
      const caseData = await contract.getCase(caseId);
      const approved = Number(caseData.yesVotes) > Number(caseData.noVotes);

      // Emit transaction event
      emitTransaction('case_resolved', {
        caseId,
        approved,
        yesVotes: Number(caseData.yesVotes),
        noVotes: Number(caseData.noVotes),
        resolver: account
      });

      // Reload data
      await loadData();
      
      console.log('✅ Case resolved successfully!');
      
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

  if (!userStatus.isBoardMember) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Board Access Required
        </h2>
        <p className="text-gray-600 mb-6">
          Only board members can access this interface.
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
      {/* Board Member Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Board Member Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'No account'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-medical-100 text-medical-800">
              👥 Board Member
            </span>
          </div>
        </div>
      </div>

      {/* Create New Case */}
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

      {/* Cases Management */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Ethics Cases Management
        </h3>
        
        {cases.length === 0 ? (
          <div className="card text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📋</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Cases Created
            </h4>
            <p className="text-gray-600">
              Create your first ethics case to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Case #{caseItem.id}: {caseItem.description}
                    </h4>
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

                {/* Board Actions */}
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
