import React, { useState, useEffect } from 'react';

const transactionStore = {
  transactions: [],
  listeners: new Set(),
  
  add(transaction) {
    this.transactions.unshift({
      ...transaction,
      id: Date.now(),
      timestamp: new Date()
    });
    if (this.transactions.length > 20) {
      this.transactions = this.transactions.slice(0, 20);
    }
    this.listeners.forEach(listener => listener([...this.transactions]));
  },
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  getTransactions() {
    return [...this.transactions];
  }
};

export const emitTransaction = (type, data) => {
  transactionStore.add({ type, data });
};

const TransactionRecorder = () => {
  const [transactions, setTransactions] = useState(transactionStore.getTransactions());

  useEffect(() => {
    const unsubscribe = transactionStore.subscribe(setTransactions);
    return unsubscribe;
  }, []);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'vote_submitted': return '🗳️';
      case 'case_created': return '📋';
      case 'case_resolved': return '✅';
      case 'demo_switch': return '🎭';
      default: return '📝';
    }
  };

  const formatTransactionData = (type, data) => {
    if (!data) return null;
    
    switch (type) {
      case 'vote_submitted':
        return (
          <div className="text-gray-600 mt-1 pl-4 space-y-1">
            <div>Case ID: {data.caseId}</div>
            <div>Vote: {data.vote ? '✅ YES' : '❌ NO'}</div>
            {data.voter && (
              <div className="text-gray-500 text-[10px]">
                Voter: {data.voter.slice(0, 8)}...{data.voter.slice(-6)}
              </div>
            )}
          </div>
        );
      case 'case_created':
        return (
          <div className="text-gray-600 mt-1 pl-4 space-y-1">
            <div className="line-clamp-2">{data.description}</div>
            {data.creator && (
              <div className="text-gray-500 text-[10px]">
                Creator: {data.creator.slice(0, 8)}...{data.creator.slice(-6)}
              </div>
            )}
          </div>
        );
      case 'case_resolved':
        return (
          <div className="text-gray-600 mt-1 pl-4">
            Case ID: {data.caseId} - Result: {data.approved ? '✅ Approved' : '❌ Rejected'}
          </div>
        );
      case 'demo_switch':
        return (
          <div className="text-gray-600 mt-1 pl-4">
            <div>Account: {data.actual ? `${data.actual.slice(0, 8)}...${data.actual.slice(-6)}` : 'Unknown'}</div>
            {data.requested && data.actual && data.requested.toLowerCase() !== data.actual.toLowerCase() && (
              <div className="text-yellow-600 text-[10px] mt-1">
                ⚠️ Switch to {data.requested.slice(0, 8)}... in MetaMask
              </div>
            )}
          </div>
        );
      default:
        // For other types, show a clean summary
        const keys = Object.keys(data).filter(k => !['requested', 'actual'].includes(k));
        if (keys.length > 0) {
          return (
            <div className="text-gray-600 mt-1 pl-4">
              {keys.slice(0, 3).map(key => (
                <div key={key} className="text-[10px]">
                  {key}: {typeof data[key] === 'string' && data[key].length > 30 
                    ? `${data[key].slice(0, 20)}...` 
                    : String(data[key])}
                </div>
              ))}
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
      ) : (
        transactions.map((tx) => (
          <div
            key={tx.id}
            className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs animate-fade-in"
          >
            <div className="flex items-center space-x-2 mb-1">
              <span>{getTransactionIcon(tx.type)}</span>
              <span className="font-medium text-gray-900 capitalize">
                {tx.type.replace(/_/g, ' ')}
              </span>
              <span className="text-gray-400 ml-auto text-[10px]">
                {tx.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {formatTransactionData(tx.type, tx.data)}
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionRecorder;

