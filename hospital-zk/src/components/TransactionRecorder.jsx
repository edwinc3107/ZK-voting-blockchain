import React, { useState, useEffect } from 'react';

const TransactionRecorder = () => {
  const [transactions, setTransactions] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Listen for transaction events
  useEffect(() => {
    const handleTransaction = (event) => {
      const { type, data } = event.detail;
      addTransaction(type, data);
    };

    window.addEventListener('blockchain-transaction', handleTransaction);
    return () => window.removeEventListener('blockchain-transaction', handleTransaction);
  }, []);

  const addTransaction = (type, data) => {
    const transaction = {
      id: Date.now(),
      type,
      data,
      timestamp: new Date(),
      status: 'pending'
    };

    setTransactions(prev => [transaction, ...prev.slice(0, 9)]); // Keep last 10
    setIsVisible(true);

    // Simulate transaction confirmation
    setTimeout(() => {
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transaction.id 
            ? { ...tx, status: 'confirmed' }
            : tx
        )
      );
    }, 2000);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'case_created': return '📋';
      case 'vote_submitted': return '🗳️';
      case 'case_resolved': return '✅';
      case 'voter_verified': return '👤';
      default: return '🔗';
    }
  };

  const getTransactionColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTransactionData = (type, data) => {
    switch (type) {
      case 'case_created':
        return `Case #${data.caseId}: "${data.description}"`;
      case 'vote_submitted':
        return `Vote ${data.vote ? 'YES' : 'NO'} on Case #${data.caseId}`;
      case 'case_resolved':
        return `Case #${data.caseId} ${data.approved ? 'approved' : 'rejected'}`;
      case 'voter_verified':
        return `Voter ${data.voter.slice(0, 6)}...${data.voter.slice(-4)} verified`;
      default:
        return JSON.stringify(data);
    }
  };

  if (!isVisible && transactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          🔗 Blockchain Transactions
        </h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isVisible && (
        <div className="max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="p-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                  <div className="text-lg">{getTransactionIcon(tx.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTransactionData(tx.type, tx.data)}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs font-medium ${getTransactionColor(tx.status)}`}>
                        {tx.status === 'pending' && '⏳ Pending'}
                        {tx.status === 'confirmed' && '✅ Confirmed'}
                        {tx.status === 'failed' && '❌ Failed'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tx.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to emit transaction events
export const emitTransaction = (type, data) => {
  const event = new CustomEvent('blockchain-transaction', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
};

export default TransactionRecorder;
