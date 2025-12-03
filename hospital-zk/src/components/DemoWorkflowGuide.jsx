import React from 'react';

const DemoWorkflowGuide = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Demo Workflow Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Connect Wallet</h3>
            <p>Click "Connect Wallet" and select an account from MetaMask.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. As Board Member</h3>
            <p>Create ethics cases and manage the voting system.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. As Verified Voter</h3>
            <p>Vote on active cases and receive your blind receipt.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. View Receipts</h3>
            <p>Check "My Receipts" to see all your saved receipts and verify them.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. View Results</h3>
            <p>See all case results and verify any receipt on the Results page.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 btn-primary w-full"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default DemoWorkflowGuide;


