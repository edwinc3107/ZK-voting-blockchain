import React, { useState } from 'react';
import { ethers } from 'ethers';

const ReceiptDisplay = ({ receiptHash, caseId, onSave }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(receiptHash, caseId);
    }
  };

  return (
    <div className="card border-2 border-success-200 bg-success-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Your Vote Receipt
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Receipt Hash:</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {receiptHash}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Save this receipt</strong> to verify your vote was included in the final tally.
          This receipt does not reveal your identity or vote choice.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          className="flex-1 btn-primary"
        >
         Save Receipt
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default ReceiptDisplay;

