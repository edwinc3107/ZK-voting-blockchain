import React, { useState, useEffect } from 'react';
import { getCaseReceiptsFromChain, formatReceiptHash } from '../utils/receiptUtils';
import ReceiptVerification from './ReceiptVerification';

const ResultsPage = ({ contract, account }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caseReceipts, setCaseReceipts] = useState({});
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    if (contract) {
      loadData();
    } else {
      setCases([]);
      setLoading(false);
    }
  }, [contract]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const casesCount = await contract.casesCount();
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        const caseData = await contract.getCase(i);
        
        casesData.push({
          id: i,
          ...caseData,
          totalVotes: Number(caseData.yesVotes) + Number(caseData.noVotes)
        });

        // Load receipts for each case
        try {
          const receipts = await getCaseReceiptsFromChain(contract, i);
          setCaseReceipts(prev => ({ ...prev, [i]: receipts }));
        } catch (error) {
          console.error(`Error loading receipts for case ${i}:`, error);
        }
      }

      setCases(casesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (votes, total) => {
    if (!total || total === 0 || isNaN(votes) || isNaN(total)) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        <span className="ml-3 text-gray-600">Loading results...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-medical-50 to-blue-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Voting Results & Transparency
        </h2>
        <p className="text-gray-600">
          View all ethics case results and verify vote receipts
        </p>
      </div>

      {/* Receipt Verification Section */}
      {showVerification && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Verify Receipt
            </h3>
            <button
              onClick={() => setShowVerification(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <ReceiptVerification 
            contract={contract} 
            caseId={selectedCaseId}
          />
        </div>
      )}

      {/* Cases Results */}
      {cases.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Cases Available
          </h3>
          <p className="text-gray-600">
            There are no ethics cases to display results for.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cases.map((caseItem) => {
            const yesVotes = Number(caseItem.yesVotes) || 0;
            const noVotes = Number(caseItem.noVotes) || 0;
            const totalVotes = caseItem.totalVotes || (yesVotes + noVotes);
            const yesPercent = calculatePercentage(yesVotes, totalVotes);
            const noPercent = calculatePercentage(noVotes, totalVotes);
            const receipts = caseReceipts[caseItem.id] || [];
            const isApproved = yesVotes > noVotes;

            return (
              <div key={caseItem.id} className="card hover:shadow-lg transition-shadow">
                {/* Case Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Case #{caseItem.id + 1}: {caseItem.description}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Created: {new Date(Number(caseItem.createdAt) * 1000).toLocaleDateString()}</span>
                      <span>Deadline: {new Date(Number(caseItem.deadline) * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      caseItem.isActive 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : isApproved
                        ? 'bg-success-100 text-success-800'
                        : 'bg-danger-100 text-danger-800'
                    }`}>
                      {caseItem.isActive ? '🟡 Active' : isApproved ? '✅ Approved' : '❌ Rejected'}
                    </div>
                  </div>
                </div>

                {/* Vote Results with Progress Bars */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Yes Votes</span>
                        <span className="text-lg font-bold text-success-600">
                          {yesVotes} ({yesPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-success-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${yesPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">No Votes</span>
                        <span className="text-lg font-bold text-danger-600">
                          {noVotes} ({noPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-danger-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${noPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    Total Votes: <span className="font-semibold">{caseItem.totalVotes}</span>
                  </div>
                </div>

                {/* Receipts Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Included Receipts ({receipts.length})
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedCaseId(caseItem.id);
                        setShowVerification(true);
                      }}
                      className="text-sm text-medical-600 hover:text-medical-700 font-medium"
                    >
                      Verify Receipt →
                    </button>
                  </div>
                  
                  {receipts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {receipts.map((receipt, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-success-600 text-sm">✓</span>
                          <span className="font-mono text-xs text-gray-700 flex-1 break-all">
                            {formatReceiptHash(receipt)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(receipt)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                            title="Copy receipt"
                          >
                            📋
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No receipts available for this case yet.
                    </p>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    💡 Receipts prove votes were included without revealing identity or vote choice
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;

