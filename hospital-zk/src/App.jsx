import React, { useState, useEffect } from 'react';
import './index.css';
import VotingInterface from './components/VotingInterface';
import ResultsPage from './components/ResultsPage';
import BoardInterface from './components/BoardInterface';
import ReceiptHistory from './components/ReceiptHistory';
import DemoMode from './components/DemoMode';
import TransactionRecorder, { emitTransaction } from './components/TransactionRecorder';
import DemoWorkflowGuide from './components/DemoWorkflowGuide';
import AccountSelector from './components/AccountSelector';
import { useContract } from './utils/useContract';

function App() {
  const [currentView, setCurrentView] = useState('voting');
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState(null);
  const [userStatus, setUserStatus] = useState({
    isVerified: false,
    isBoardMember: false
  });
  const [permissionsJustSet, setPermissionsJustSet] = useState(false);
  const { contract, connectWallet, disconnectWallet, setDemoMode } = useContract();

  useEffect(() => {
    const checkMetaMaskAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setMetaMaskAccount(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking MetaMask account:', error);
        }
      }
    };

    checkMetaMaskAccount();
    
    // Also check when account changes
    const interval = setInterval(() => {
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' })
          .then(accounts => {
            if (accounts.length > 0) {
              setMetaMaskAccount(accounts[0]);
            }
          })
          .catch(() => {});
      }
    }, 2000);
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setMetaMaskAccount(accounts[0]);
        } else {
          setMetaMaskAccount(null);
        }
      });
    }
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('App loaded - ready for manual wallet connection');
  }, []);

  useEffect(() => {
    // Don't check if permissions were just set by handleDemoSwitch
    if (permissionsJustSet) {
      console.log('⏸️ [App.jsx] Permissions just set, skipping check to avoid override');
      return;
    }
    
    const checkUserStatus = async () => {
      if (contract) {
        try {
          // Get the signer - contract might already have one, or we need to get it from provider
          let signer;
          let actualAddress;
          
          // Check if contract has a runner (signer) attached (ethers v6)
          if (contract.runner && typeof contract.runner.getAddress === 'function') {
            signer = contract.runner;
            actualAddress = await signer.getAddress();
          } else if (contract.provider) {
            // Fallback: get signer from provider
            signer = await contract.provider.getSigner();
            actualAddress = await signer.getAddress();
          } else if (window.ethereum) {
            // Last resort: create new provider and signer
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            actualAddress = await signer.getAddress();
          } else {
            // Silently skip - contract might still be initializing, permissions might have been set by handleDemoSwitch
            return;
          }
          
          console.log('🔍 [App.jsx] Checking permissions for actual MetaMask account:', actualAddress);
          console.log('📋 [App.jsx] Contract address:', contract.target || contract.address);
          
          const isVerified = await contract.isVoterVerified(actualAddress);
          const isBoardMember = await contract.isBoardMember(actualAddress);
          
          console.log('✅ [App.jsx] Actual account permissions:', { actualAddress, isVerified, isBoardMember });
          console.log('🔄 [App.jsx] Updating userStatus state with:', { isVerified, isBoardMember });
          
          setUserStatus({ isVerified, isBoardMember });
          setAccount(actualAddress); // Update account to match actual MetaMask account
          
          // Redirect if current view is not accessible with new permissions
          if (currentView === 'board' && !isBoardMember) {
            console.log('🔄 Redirecting from board interface (not a board member)');
            setCurrentView('results');
          } else if (currentView === 'voting' && !isVerified && !isBoardMember) {
            console.log('🔄 Redirecting from voting interface (not verified)');
            setCurrentView('results');
          } else if (currentView === 'receipts' && !isVerified && !isBoardMember) {
            console.log('🔄 Redirecting from receipts (not verified)');
            setCurrentView('results');
          }
          
          console.log('✅ [App.jsx] userStatus state updated');
        } catch (error) {
          console.error('❌ [App.jsx] Error checking user status:', error);
          console.error('   Error details:', {
            message: error.message,
            code: error.code,
            data: error.data
          });
          // Only reset if it's a real error, not a timing/RPC issue
          if (error.code !== 'CALL_EXCEPTION' && !error.message.includes('missing revert data') && !error.message.includes('provider')) {
            setUserStatus({ isVerified: false, isBoardMember: false });
          }
        }
      } else {
        // Only reset if we're truly disconnected (not in demo mode)
        if (!isConnected && !isDemoMode) {
          console.log('⚠️ [App.jsx] No contract and not connected, resetting user status');
          setUserStatus({ isVerified: false, isBoardMember: false });
        } else {
          console.log('⚠️ [App.jsx] No contract yet, but connected/demo mode - waiting for contract to initialize');
        }
      }
    };

    // Add a small delay to let handleDemoSwitch set permissions first
    const timeoutId = setTimeout(() => {
      console.log('🔄 [App.jsx] Contract changed, checking user status (delayed)...');
      checkUserStatus();
    }, 100);
    
    // Also check when MetaMask account changes
    if (window.ethereum) {
      const checkOnAccountChange = () => {
        console.log('🔄 [App.jsx] MetaMask account changed, rechecking permissions...');
        if (contract) checkUserStatus();
      };
      window.ethereum.on('accountsChanged', checkOnAccountChange);
      return () => {
        clearTimeout(timeoutId);
        window.ethereum.removeListener('accountsChanged', checkOnAccountChange);
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [contract, isConnected, isDemoMode, permissionsJustSet]); // Include permissionsJustSet to skip when permissions were just set

  useEffect(() => {
    // Update view based on actual permissions
    if (userStatus.isBoardMember) {
      setCurrentView('board');
    } else if (userStatus.isVerified) {
      setCurrentView('voting');
    } else {
      setCurrentView('results');
    }
  }, [userStatus]);

  const handleConnect = async () => {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        alert('Please install MetaMask to connect your wallet.');
        return;
      }
      
      // Check if already connected
      if (isConnected && account) {
        return;
      }
      
      // Show account selector
      setShowAccountSelector(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleAccountSelected = async (selectedAccount) => {
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      const account = await connectWallet();
      setAccount(account);
      setIsConnected(true);
      setIsDemoMode(false);
    } catch (error) {
      console.error('Failed to connect with selected account:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setAccount(null);
    setIsConnected(false);
    setIsDemoMode(false);
  };

  const handleDemoSwitch = async (demoAddress) => {
    console.log(`🎭 Demo Mode Switch: ${demoAddress}`);
    
    try {
      // This will throw an error if account doesn't match
      const result = await setDemoMode(demoAddress);
      
      // Handle both old format (string) and new format (object)
      let accountToUse, isVerified, isBoardMember;
      if (typeof result === 'string') {
        // Old format - just account string (backward compatibility)
        accountToUse = result;
        isVerified = false;
        isBoardMember = false;
        console.log('⚠️ [handleDemoSwitch] Received old format, will check permissions via useEffect');
      } else {
        // New format - object with account and permissions
        accountToUse = result.account || demoAddress;
        isVerified = result.isVerified || false;
        isBoardMember = result.isBoardMember || false;
        
        // Immediately update userStatus with the permissions from setDemoMode
        console.log('🔄 [handleDemoSwitch] Updating userStatus immediately with permissions from setDemoMode:', { 
          isVerified, 
          isBoardMember,
          account: accountToUse
        });
        
        // Update state immediately - this should prevent the useEffect from resetting it
        setUserStatus({ isVerified, isBoardMember });
        setPermissionsJustSet(true); // Flag to prevent useEffect from overriding
        
        // Clear the flag after a short delay
        setTimeout(() => {
          setPermissionsJustSet(false);
        }, 500);
      }
      
      setAccount(accountToUse);
      setIsConnected(true);
      setIsDemoMode(true);
      
      // Log current state for debugging
      console.log('📊 [handleDemoSwitch] State after update:', {
        account: accountToUse,
        isConnected: true,
        isDemoMode: true,
        userStatus: { isVerified, isBoardMember }
      });
      
      // Only log demo switch if accounts don't match
      if (accountToUse.toLowerCase() !== demoAddress.toLowerCase()) {
        emitTransaction('demo_switch', { 
          requested: demoAddress,
          actual: accountToUse
        });
      }
      
      console.log('✅ Demo mode switched:', {
        requested: demoAddress,
        actual: accountToUse,
        matches: accountToUse.toLowerCase() === demoAddress.toLowerCase(),
        permissions: { isVerified, isBoardMember }
      });
    } catch (error) {
      console.error('❌ Demo mode switch error:', error);
      // Just log the error, don't block with alert
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Account Mismatch Warning - Only show if there's a mismatch AND account is NOT verified */}
      {isDemoMode && account && metaMaskAccount && 
       account.toLowerCase() !== metaMaskAccount.toLowerCase() &&
       !userStatus.isVerified && !userStatus.isBoardMember && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="text-sm text-yellow-800">
                <strong>Account Mismatch:</strong> Your MetaMask account ({metaMaskAccount.slice(0, 6)}...{metaMaskAccount.slice(-4)}) doesn't match the selected role ({account.slice(0, 6)}...{account.slice(-4)}). 
                {userStatus.isVerified || userStatus.isBoardMember 
                  ? ' You can still use the system, but transactions will use your MetaMask account.'
                  : ' Please switch accounts in MetaMask.'}
              </p>
            </div>
            <button
              onClick={() => window.ethereum?.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })}
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
            >
              Switch Account
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏥</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Hospital Ethics Voting System
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    isDemoMode 
                      ? 'bg-purple-100 border border-purple-200' 
                      : 'bg-success-100 border border-success-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isDemoMode ? 'bg-purple-500' : 'bg-success-500'
                    }`}></div>
                    <span className={`font-medium text-sm ${
                      isDemoMode ? 'text-purple-700' : 'text-success-700'
                    }`}>
                      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
                      {isDemoMode && ' (Demo)'}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleConnect}
                    className="btn-primary"
                  >
                    Connect Wallet
                  </button>
                  <DemoMode onSwitchWallet={handleDemoSwitch} currentAccount={account} />
                  <button
                    onClick={() => setShowWorkflowGuide(true)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    📖 Demo Guide
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Role-based visibility */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {/* Board Interface - Only visible to Board Members */}
            {userStatus.isBoardMember && (
              <button
                onClick={() => setCurrentView('board')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'board'
                    ? 'border-medical-500 text-medical-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Board Interface
              </button>
            )}
            
            {/* Voting Interface - Visible to Board Members and Verified Voters */}
            {(userStatus.isBoardMember || userStatus.isVerified) && (
              <button
                onClick={() => setCurrentView('voting')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'voting'
                    ? 'border-medical-500 text-medical-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Voting Interface
              </button>
            )}
            
            {/* Results - Always visible to everyone */}
            <button
              onClick={() => setCurrentView('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === 'results'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results
            </button>

            {/* My Receipts - Visible to Board Members and Verified Voters */}
            {isConnected && (userStatus.isBoardMember || userStatus.isVerified) && (
              <button
                onClick={() => setCurrentView('receipts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'receipts'
                    ? 'border-medical-500 text-medical-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Receipts
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        <div className="flex-1">
          {!isConnected ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-medical-600 text-2xl">🔗</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Please connect your MetaMask wallet to access the voting system.
              </p>
              <button
                onClick={handleConnect}
                className="btn-primary text-lg px-8 py-3"
              >
                Connect MetaMask
              </button>
            </div>
          ) : (
            <>
              {/* Board Interface - Only show if user is a board member */}
              {currentView === 'board' && userStatus.isBoardMember && (
                <BoardInterface 
                  contract={contract} 
                  account={account}
                  isConnected={isConnected}
                  userStatus={userStatus}
                />
              )}
              
              {/* Voting Interface - Show if user is verified or board member */}
              {currentView === 'voting' && (userStatus.isVerified || userStatus.isBoardMember) && (
                <VotingInterface 
                  contract={contract} 
                  account={account}
                  isConnected={isConnected}
                  userStatus={userStatus}
                />
              )}
              
              {/* Results - Always accessible */}
              {currentView === 'results' && (
                <ResultsPage 
                  contract={contract} 
                  account={account}
                />
              )}
              
              {/* Receipts - Show if user is verified or board member */}
              {currentView === 'receipts' && (userStatus.isVerified || userStatus.isBoardMember) && (
                <ReceiptHistory 
                  contract={contract} 
                  account={account}
                />
              )}
              
              {/* Fallback message if trying to access restricted view */}
              {((currentView === 'board' && !userStatus.isBoardMember) ||
                (currentView === 'voting' && !userStatus.isVerified && !userStatus.isBoardMember) ||
                (currentView === 'receipts' && !userStatus.isVerified && !userStatus.isBoardMember)) && (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-yellow-600 text-2xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Access Restricted
                  </h2>
                  <p className="text-gray-600 mb-4">
                    You don't have permission to access this section.
                  </p>
                  <button
                    onClick={() => setCurrentView('results')}
                    className="btn-primary"
                  >
                    Go to Results
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Transaction Pane */}
        {isConnected && (
          <div className="w-80 bg-white rounded-lg border border-gray-200 p-4 h-fit sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Live Transactions
            </h3>
            <TransactionRecorder />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Hospital Ethics Voting System - Powered by Blockchain Technology</p>
            <p className="mt-1">Secure • Transparent • Private</p>
            {isDemoMode && (
              <p className="mt-2 text-purple-600 font-medium">
                🎭 Demo Mode Active - Switch roles using the Demo Mode button
              </p>
            )}
          </div>
        </div>
      </footer>

      {/* Demo Workflow Guide */}
      <DemoWorkflowGuide 
        isVisible={showWorkflowGuide} 
        onClose={() => setShowWorkflowGuide(false)} 
      />

      {/* Account Selector */}
      {showAccountSelector && (
        <AccountSelector
          onAccountSelected={handleAccountSelected}
          onClose={() => setShowAccountSelector(false)}
          contract={contract}
        />
      )}
    </div>
  );
}

export default App;

