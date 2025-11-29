import React, { useState, useEffect } from 'react';

const AccountSelector = ({ onAccountSelected, onClose }) => {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      // Get all accounts from MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      // Get balances for each account
      const balancePromises = accounts.map(async (account) => {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        return {
          address: account,
          balance: parseInt(balance, 16) / Math.pow(10, 18) // Convert wei to ETH
        };
      });

      const accountBalances = await Promise.all(balancePromises);
      
      setAccounts(accountBalances);
      setBalances(accountBalances.reduce((acc, { address, balance }) => {
        acc[address] = balance;
        return acc;
      }, {}));
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    onAccountSelected(account);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Select Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Choose the account you want to use for the hospital ethics voting system:
          </p>
          
          <div className="space-y-3">
            {accounts.map((account) => (
              <button
                key={account.address}
                onClick={() => handleAccountSelect(account.address)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  account.balance > 0 
                    ? 'border-green-200 bg-green-50 hover:border-green-300' 
                    : 'border-red-200 bg-red-50 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {account.balance.toFixed(4)} ETH
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.balance > 0 ? (
                      <span className="text-green-600 text-sm font-medium">✅ Funded</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">❌ No Funds</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {accounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No accounts found in MetaMask</p>
              <p className="text-sm text-gray-500 mt-2">
                Make sure MetaMask is installed and unlocked
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSelector;
