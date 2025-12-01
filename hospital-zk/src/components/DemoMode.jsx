import React, { useState, useEffect } from 'react';

const DemoMode = ({ onSwitchWallet, currentAccount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState(null);

  useEffect(() => {
    const checkMetaMaskAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setMetaMaskAccount(accounts[0].toLowerCase());
          }
        } catch (error) {
          console.error('Error checking MetaMask account:', error);
        }
      }
    };

    checkMetaMaskAccount();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setMetaMaskAccount(accounts[0].toLowerCase());
        } else {
          setMetaMaskAccount(null);
        }
      });
    }
  }, []);

  const demoAccounts = [
    // Board Member - 1 account (Hardhat account #0)
    { name: 'Board Member', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', role: 'Board', privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
    // Verified Voter - 1 account (Hardhat account #5)
    { name: 'Verified Voter', address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', role: 'Voter', privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba' },
    // Non-Voter - 1 account (Hardhat account #8)
    { name: 'Non-Voter', address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', role: 'Non-Voter', privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97' },
  ];

  const isAccountMatching = (accountAddress) => {
    if (!metaMaskAccount) return false;
    return accountAddress.toLowerCase() === metaMaskAccount;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors text-sm font-medium"
      >
        🎭 Demo Mode
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-sm font-semibold text-gray-900">Demo Accounts</h3>
            <p className="text-xs text-gray-600 mt-1">
              Select a role to test. Import the account in MetaMask to use its permissions.
            </p>
            {metaMaskAccount && (
              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>Current MetaMask:</strong> {metaMaskAccount.slice(0, 8)}...{metaMaskAccount.slice(-6)}
                </p>
              </div>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {demoAccounts.map((account) => {
              const isMatching = isAccountMatching(account.address);
              const getRoleBadge = (role) => {
                switch(role) {
                  case 'Board': return '👥 Board Member - Can create cases';
                  case 'Voter': return '✅ Verified Voter - Can vote';
                  case 'Non-Voter': return '👤 Non-Voter - View only';
                  default: return role;
                }
              };
              
              return (
                <div
                  key={account.address}
                  className={`w-full border-b border-gray-100 ${
                    currentAccount === account.address ? 'bg-purple-50 border-purple-200' : ''
                  }`}
                >
                  <button
                    onClick={async () => {
                      // Check if account is already imported in MetaMask
                      if (window.ethereum && !isMatching) {
                        try {
                          // First check if account exists in MetaMask
                          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                          const accountExists = accounts.some(acc => acc.toLowerCase() === account.address.toLowerCase());
                          
                          if (accountExists) {
                            // Account exists, try to switch
                            console.log('🔄 Account exists in MetaMask, requesting switch...');
                            await window.ethereum.request({
                              method: 'wallet_requestPermissions',
                              params: [{ eth_accounts: {} }]
                            });
                            
                            // Wait for MetaMask to process
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Check if switched
                            const newAccounts = await window.ethereum.request({ method: 'eth_accounts' });
                            const switched = newAccounts.some(acc => acc.toLowerCase() === account.address.toLowerCase());
                            
                            if (switched) {
                              console.log('✅ Account switched successfully!');
                              // Switch wallet in the app
                              onSwitchWallet(account.address);
                              setIsOpen(false);
                              // Reload to pick up new account
                              setTimeout(() => window.location.reload(), 500);
                              return;
                            } else {
                              alert(`Please select "${account.name}" (${account.address.slice(0, 8)}...) in the MetaMask popup.`);
                            }
                          } else {
                            // Account doesn't exist, show import instructions
                            const importKey = account.privateKey;
                            const confirmed = confirm(
                              `Account "${account.name}" is not imported in MetaMask.\n\n` +
                              `Would you like to:\n` +
                              `1. Copy the private key to clipboard (then import in MetaMask)\n` +
                              `2. Or manually import it later\n\n` +
                              `Click OK to copy the private key.`
                            );
                            
                            if (confirmed) {
                              await navigator.clipboard.writeText(importKey);
                              alert(
                                `✅ Private key copied!\n\n` +
                                `Next steps:\n` +
                                `1. Open MetaMask\n` +
                                `2. Click account icon → Import Account\n` +
                                `3. Paste the private key\n` +
                                `4. Come back and click this account again to switch`
                              );
                            }
                          }
                        } catch (error) {
                          console.log('ℹ️ Account switch cancelled:', error.message);
                        }
                      }
                      
                      // If account matches or we're continuing anyway, switch wallet in the app
                      if (isMatching) {
                        onSwitchWallet(account.address);
                        setIsOpen(false);
                      }
                    }}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-semibold text-gray-900">{account.name}</div>
                          {isMatching && (
                            <span className="text-xs text-success-600 font-medium bg-success-100 px-1.5 py-0.5 rounded">
                              ✓ Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {account.address.slice(0, 12)}...{account.address.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1.5">
                          {getRoleBadge(account.role)}
                        </div>
                      </div>
                      {!isMatching && (
                        <span className="text-xs text-yellow-600 font-medium ml-2">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </button>
                  {!isMatching && (
                    <div className="px-3 pb-2 pt-1 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Try to switch account in MetaMask
                            if (window.ethereum) {
                              try {
                                console.log('🔄 Requesting account switch...');
                                await window.ethereum.request({
                                  method: 'wallet_requestPermissions',
                                  params: [{ eth_accounts: {} }]
                                });
                                // Wait and check
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                                const switched = accounts.some(acc => acc.toLowerCase() === account.address.toLowerCase());
                                if (switched) {
                                  alert('✅ Account switched! Refreshing page...');
                                  window.location.reload();
                                } else {
                                  alert(`Please select "${account.name}" (${account.address.slice(0, 8)}...) in the MetaMask popup.`);
                                }
                              } catch (error) {
                                console.log('Switch cancelled:', error);
                              }
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          🔄 Switch in MetaMask
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await navigator.clipboard.writeText(account.address);
                            alert(`Address copied!\n\n${account.address}\n\nImport this account in MetaMask using the private key shown below.`);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800 underline"
                        >
                          📋 Copy Address
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-200 bg-blue-50">
            <p className="text-xs text-blue-800 mb-2">
              <strong>📥 How to Import Accounts:</strong>
            </p>
            <ol className="text-xs text-blue-700 space-y-1 mb-2 list-decimal list-inside">
              <li>Click MetaMask icon → Account menu</li>
              <li>Select "Import Account"</li>
              <li>Paste the private key below</li>
              <li>Switch to that account in MetaMask</li>
            </ol>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-medium mb-1">
                🔑 Show Private Keys
              </summary>
              <div className="mt-2 space-y-2 text-xs max-h-48 overflow-y-auto">
                {demoAccounts.map((acc) => (
                  <div key={acc.address} className="border border-blue-200 rounded p-2 bg-white">
                    <div className="font-semibold text-blue-900 mb-1">{acc.name}</div>
                    <code className="block bg-blue-50 p-1.5 rounded mt-1 break-all text-[10px] font-mono text-blue-800">
                      {acc.privateKey}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(acc.privateKey);
                        alert('Private key copied to clipboard!');
                      }}
                      className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 underline"
                    >
                      📋 Copy
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMode;

