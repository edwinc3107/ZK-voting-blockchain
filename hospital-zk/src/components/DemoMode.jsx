import React, { useState } from 'react';

const DemoMode = ({ onSwitchWallet, currentAccount }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Pre-configured demo wallets for different roles
  const demoWallets = [
    {
      name: "Board Member 1",
      address: "0x1234567890123456789012345678901234567890",
      role: "Board Member",
      color: "bg-blue-500"
    },
    {
      name: "Board Member 2", 
      address: "0x2345678901234567890123456789012345678901",
      role: "Board Member",
      color: "bg-blue-600"
    },
    {
      name: "Doctor Smith",
      address: "0x3456789012345678901234567890123456789012", 
      role: "Verified Voter",
      color: "bg-green-500"
    },
    {
      name: "Nurse Johnson",
      address: "0x4567890123456789012345678901234567890123",
      role: "Verified Voter", 
      color: "bg-green-600"
    },
    {
      name: "Staff Member",
      address: "0x5678901234567890123456789012345678901234",
      role: "Verified Voter",
      color: "bg-purple-500"
    }
  ];

  const handleSwitchWallet = (wallet) => {
    onSwitchWallet(wallet.address);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium">🎭 Demo Mode</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Switch Demo Role
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose a pre-configured wallet to demonstrate different user roles:
            </p>
            
            <div className="space-y-2">
              {demoWallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => handleSwitchWallet(wallet)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    currentAccount === wallet.address
                      ? 'border-medical-500 bg-medical-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${wallet.color}`}></div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{wallet.name}</div>
                    <div className="text-sm text-gray-600">{wallet.role}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                  </div>
                  {currentAccount === wallet.address && (
                    <div className="text-medical-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p><strong>Note:</strong> This is demo mode. In production, users would connect their own wallets.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMode;
