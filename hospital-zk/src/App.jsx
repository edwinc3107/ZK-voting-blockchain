import React, { useState, useEffect } from 'react';
import './index.css';
import VotingInterface from './components/VotingInterface';
import ResultsPage from './components/ResultsPage';
import BoardInterface from './components/BoardInterface';
import DemoMode from './components/DemoMode';
import TransactionRecorder, { emitTransaction } from './components/TransactionRecorder';
import DemoWorkflowGuide from './components/DemoWorkflowGuide';
import { useContract } from './utils/useContract';

function App() {
  const [currentView, setCurrentView] = useState('voting');
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const { contract, connectWallet, disconnectWallet, updateContract } = useContract();

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        });
    }
  }, []);

  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      setAccount(account);
      setIsConnected(true);
      setIsDemoMode(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setAccount(null);
    setIsConnected(false);
    setIsDemoMode(false);
  };

  const handleDemoSwitch = (demoAddress) => {
    console.log(`🎭 Demo Mode Switch:`);
    console.log(`   Switching to: ${demoAddress}`);
    setAccount(demoAddress);
    setIsConnected(true);
    setIsDemoMode(true);
    
    // Update the contract for the new account
    updateContract();
    
    emitTransaction('demo_switch', { address: demoAddress });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('board')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'board'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Board Interface
            </button>
            <button
              onClick={() => setCurrentView('voting')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'voting'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Voting Interface
            </button>
            <button
              onClick={() => setCurrentView('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'results'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {currentView === 'board' && (
              <BoardInterface 
                contract={contract} 
                account={account}
                isConnected={isConnected}
              />
            )}
            {currentView === 'voting' && (
              <VotingInterface 
                contract={contract} 
                account={account}
                isConnected={isConnected}
              />
            )}
            {currentView === 'results' && (
              <ResultsPage 
                contract={contract} 
                account={account}
              />
            )}
          </>
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

      {/* Transaction Recorder */}
      <TransactionRecorder />

      {/* Demo Workflow Guide */}
      <DemoWorkflowGuide 
        isVisible={showWorkflowGuide} 
        onClose={() => setShowWorkflowGuide(false)} 
      />
    </div>
  );
}

export default App;