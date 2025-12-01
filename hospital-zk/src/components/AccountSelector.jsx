import React, { useState, useEffect } from 'react';

const AccountSelector = ({ onAccountSelected, onClose, contract }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountPermissions, setAccountPermissions] = useState({});

  useEffect(() => {
    const loadAccounts = async () => {
      if (window.ethereum) {
        try {
          const accs = await window.ethereum.request({ method: 'eth_accounts' });
          setAccounts(accs);
          
          // If we have a contract, check permissions for each account
          if (contract && accs.length > 0) {
            const permissions = {};
            for (const acc of accs) {
              try {
                const isVerified = await contract.isVoterVerified(acc);
                const isBoardMember = await contract.isBoardMember(acc);
                permissions[acc.toLowerCase()] = { isVerified, isBoardMember };
              } catch (error) {
                console.error(`Error checking permissions for ${acc}:`, error);
                permissions[acc.toLowerCase()] = { isVerified: false, isBoardMember: false };
              }
            }
            setAccountPermissions(permissions);
          }
        } catch (error) {
          console.error('Error loading accounts:', error);
        }
      }
      setLoading(false);
    };

    loadAccounts();
  }, [contract]);

  const getAccountRole = (account) => {
    const perms = accountPermissions[account.toLowerCase()];
    if (!perms) return 'Unknown';
    if (perms.isBoardMember) return 'Board Member';
    if (perms.isVerified) return 'Verified Voter';
    return 'Non-Voter';
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'Board Member':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-medical-100 text-medical-800">👥 Board Member</span>;
      case 'Verified Voter':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">✅ Verified Voter</span>;
      case 'Non-Voter':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">👤 Non-Voter</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">❓ Unknown</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-medical-500 to-medical-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Connect Wallet</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🔗</span>
              </div>
              <p className="text-gray-700 font-medium mb-2">No accounts found in MetaMask</p>
              <p className="text-sm text-gray-500 mb-4">Please create or import an account in MetaMask first.</p>
              <button onClick={onClose} className="btn-primary">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select a MetaMask account to connect:
              </p>
              {accounts.map((account) => {
                const role = getAccountRole(account);
                return (
                  <button
                    key={account}
                    onClick={() => {
                      onAccountSelected(account);
                      onClose();
                    }}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-medical-500 hover:bg-medical-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {account.slice(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-medical-700">
                              {account.slice(0, 6)}...{account.slice(-4)}
                            </div>
                            <div className="font-mono text-xs text-gray-500 mt-0.5">
                              {account}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          {getRoleBadge(role)}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-medical-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> To use demo accounts with specific permissions, use the "Demo Mode" button instead.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSelector;

