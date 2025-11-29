import React, { useState } from 'react';

const DemoMode = ({ onSwitchWallet, currentAccount }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simplified demo accounts with clear roles
  const demoWallets = [
    {
      name: "My Account",
      address: "0xbda5747bfd65f08deb54cb465eb87d40e51b197e",
      role: "Verified Voter",
      description: "Requires MetaMask - Can vote on ethics cases",
      color: "bg-green-500",
      roleType: "verified_voter"
    },
    {
      name: "Dr. Sarah Chen",
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      role: "Board Member",
      description: "No MetaMask needed - Can create cases & verify voters",
      color: "bg-blue-500",
      roleType: "board_member"
    },
    {
      name: "Dr. Michael Rodriguez", 
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      role: "Verified Voter",
      description: "No MetaMask needed - Can vote on ethics cases",
      color: "bg-green-600",
      roleType: "verified_voter"
    },
    {
      name: "Nurse James Wilson",
      address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      role: "Unverified",
      description: "No MetaMask needed - Can only view results",
      color: "bg-gray-500",
      roleType: "unverified"
    }
  ];

  const handleSwitchWallet = async (wallet) => {
    console.log(`🎭 Switching to demo wallet: ${wallet.name}`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Role: ${wallet.role}`);
    
    // Check if this is the funded account that needs MetaMask
    const isFundedAccount = wallet.address === "0xbda5747bfd65f08deb54cb465eb87d40e51b197e";
    
    if (isFundedAccount) {
      // For funded account, try MetaMask interaction
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts.includes(wallet.address)) {
          console.log('✅ Funded account is available in MetaMask');
          onSwitchWallet(wallet.address);
          setIsOpen(false);
        } else {
          alert(`🎭 Demo Mode: ${wallet.name}\n\nThis account is not available in MetaMask.\nPlease add this account to MetaMask manually:\n${wallet.address}\n\nThis account has ${wallet.role.toLowerCase()} privileges.`);
          onSwitchWallet(wallet.address);
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Error switching funded account:', error);
        alert(`🎭 Demo Mode: ${wallet.name}\n\nPlease manually switch to this account in MetaMask:\n${wallet.address}\n\nThis account has ${wallet.role.toLowerCase()} privileges.`);
        onSwitchWallet(wallet.address);
        setIsOpen(false);
      }
    } else {
      // For all other demo accounts, bypass MetaMask entirely
      console.log('🎭 Using pure demo mode (no MetaMask required)');
      onSwitchWallet(wallet.address);
      setIsOpen(false);
    }
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
                <p><strong>Note:</strong> Demo accounts (except "Your Funded Account") work without MetaMask. Only the funded account requires MetaMask for real blockchain interaction.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMode;
