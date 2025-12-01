import React, { useState } from 'react';

const ReceiptVerification = ({ contract, caseId }) => {
  const [receiptHash, setReceiptHash] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [caseReceipts, setCaseReceipts] = useState([]);
  const [showAllReceipts, setShowAllReceipts] = useState(false);

  const handleVerify = async () => {
    if (!contract || !receiptHash.trim()) return;

    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      const isValid = await contract.verifyReceipt(receiptHash, caseId);
      
      if (isValid) {
        setVerificationStatus({
          valid: true,
          message: '✓ Receipt verified! This receipt is included in the case results.'
        });
      } else {
        setVerificationStatus({
          valid: false,
          message: '✗ Receipt not found. This receipt is not included in the case results.'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus({
        valid: false,
        message: 'Error verifying receipt. Please check the receipt hash and try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const loadCaseReceipts = async () => {
    if (!contract || caseId === null) return;

    try {
      const receipts = await contract.getCaseReceipts(caseId);
      setCaseReceipts(receipts);
      setShowAllReceipts(true);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Verify Vote Receipt
      </h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="receiptHash" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Receipt Hash:
          </label>
          <input
            id="receiptHash"
            type="text"
            value={receiptHash}
            onChange={(e) => setReceiptHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 font-mono text-sm"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying || !receiptHash.trim()}
          className={`btn-primary w-full ${
            isVerifying || !receiptHash.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Verify Receipt'}
        </button>

        {verificationStatus && (
          <div className={`p-4 rounded-lg border-2 ${
            verificationStatus.valid
              ? 'bg-success-50 border-success-200'
              : 'bg-danger-50 border-danger-200'
          }`}>
            <p className={`text-sm font-medium ${
              verificationStatus.valid ? 'text-success-800' : 'text-danger-800'
            }`}>
              {verificationStatus.message}
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <button
            onClick={loadCaseReceipts}
            className="text-sm text-medical-600 hover:text-medical-700 font-medium"
          >
            {showAllReceipts ? 'Hide' : 'Show'} All Receipts for This Case
          </button>

          {showAllReceipts && caseReceipts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                Included Receipts ({caseReceipts.length}):
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {caseReceipts.map((receipt, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-success-600 text-sm">✓</span>
                    <span className="font-mono text-xs text-gray-700 flex-1 break-all">
                      {receipt}
                    </span>
                    {receipt === receiptHash && (
                      <span className="text-xs text-medical-600 font-medium">(Your receipt)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAllReceipts && caseReceipts.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No receipts found for this case.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptVerification;

