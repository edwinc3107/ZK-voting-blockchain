import React, { useState, useEffect } from 'react';
import { getSavedReceipts, formatReceiptHash, verifyReceiptOnChain } from '../utils/receiptUtils';
import ReceiptVerification from './ReceiptVerification';

const ReceiptHistory = ({ contract, account }) => {
  const [savedReceipts, setSavedReceipts] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = () => {
    const receipts = getSavedReceipts();
    // Filter receipts for current account if account is available
    const filteredReceipts = account 
      ? receipts.filter(r => r.voterAddress?.toLowerCase() === account?.toLowerCase())
      : receipts;
    
    // Sort by date (newest first)
    filteredReceipts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    setSavedReceipts(filteredReceipts);
  };

  const handleVerify = async (receiptHash, caseId) => {
    if (!contract) {
      alert('Contract not connected');
      return;
    }

    setVerificationStatus(prev => ({ ...prev, [receiptHash]: 'verifying' }));

    try {
      const isValid = await verifyReceiptOnChain(contract, receiptHash, caseId);
      setVerificationStatus(prev => ({ 
        ...prev, 
        [receiptHash]: isValid ? 'valid' : 'invalid' 
      }));
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus(prev => ({ 
        ...prev, 
        [receiptHash]: 'error' 
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <span className="text-success-600">✓</span>;
      case 'invalid':
        return <span className="text-danger-600">✗</span>;
      case 'verifying':
        return <span className="animate-spin">⟳</span>;
      case 'error':
        return <span className="text-yellow-600">⚠</span>;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid':
        return 'Verified';
      case 'invalid':
        return 'Not Found';
      case 'verifying':
        return 'Verifying...';
      case 'error':
        return 'Error';
      default:
        return 'Not Verified';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Vote Receipts
            </h2>
            <p className="text-gray-600">
              View and verify all your saved vote receipts
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-medical-600">
              {savedReceipts.length}
            </div>
            <div className="text-sm text-gray-600">Saved Receipts</div>
          </div>
        </div>
      </div>

      {/* Receipt Verification Modal */}
      {showVerification && selectedReceipt && (
        <div className="card animate-fade-in border-2 border-medical-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Verify Receipt
            </h3>
            <button
              onClick={() => {
                setShowVerification(false);
                setSelectedReceipt(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          <ReceiptVerification 
            contract={contract} 
            caseId={selectedReceipt.caseId}
          />
        </div>
      )}

      {/* Receipts List */}
      {savedReceipts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📄</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Receipts Saved
          </h3>
          <p className="text-gray-600 mb-4">
            Your vote receipts will appear here after you vote and save them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedReceipts.map((receipt, index) => {
            const status = verificationStatus[receipt.receiptHash];
            
            return (
              <div 
                key={index} 
                className="card hover:shadow-lg transition-all hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center">
                        <span className="text-medical-600 text-lg">📋</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Case #{receipt.caseId != null ? receipt.caseId + 1 : 'N/A'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Saved: {new Date(receipt.savedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Receipt Hash:</p>
                      <p className="font-mono text-sm text-gray-900 break-all">
                        {receipt.receiptHash}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Status:</span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(status)}
                        <span className={`text-xs font-medium ${
                          status === 'valid' ? 'text-success-600' :
                          status === 'invalid' ? 'text-danger-600' :
                          status === 'error' ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleVerify(receipt.receiptHash, receipt.caseId)}
                      disabled={status === 'verifying'}
                      className="px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {status === 'verifying' ? 'Verifying...' : 'Verify'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowVerification(true);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(receipt.receiptHash)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
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

export default ReceiptHistory;

