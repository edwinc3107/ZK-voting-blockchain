import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResultsPage = ({ contract, account }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [voteRecords, setVoteRecords] = useState([]);

  useEffect(() => {
    if (contract) {
      loadCases();
    }
  }, [contract]);

  const loadCases = async () => {
    try {
      setLoading(true);
      
      const casesCount = await contract.casesCount();
      const casesData = [];

      for (let i = 0; i < casesCount; i++) {
        const caseData = await contract.getCase(i);
        casesData.push({
          id: i,
          ...caseData,
          totalVotes: Number(caseData.yesVotes) + Number(caseData.noVotes),
          yesPercentage: Number(caseData.yesVotes) + Number(caseData.noVotes) > 0 
            ? (Number(caseData.yesVotes) / (Number(caseData.yesVotes) + Number(caseData.noVotes))) * 100 
            : 0,
          noPercentage: Number(caseData.yesVotes) + Number(caseData.noVotes) > 0 
            ? (Number(caseData.noVotes) / (Number(caseData.yesVotes) + Number(caseData.noVotes))) * 100 
            : 0
        });
      }

      setCases(casesData);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoteRecords = async (caseId) => {
    try {
      const records = await contract.getVoteRecords(caseId);
      setVoteRecords(records);
    } catch (error) {
      console.error('Error loading vote records:', error);
    }
  };

  const handleCaseSelect = (caseId) => {
    const selected = cases.find(c => c.id === caseId);
    setSelectedCase(selected);
    loadVoteRecords(caseId);
  };

  const getChartData = (caseItem) => {
    return {
      labels: ['Yes', 'No'],
      datasets: [
        {
          data: [Number(caseItem.yesVotes), Number(caseItem.noVotes)],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderColor: ['#16a34a', '#dc2626'],
          borderWidth: 2,
        },
      ],
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} votes (${percentage}%)`;
            }
          }
        }
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        <span className="ml-3 text-gray-600">Loading results...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ethics Committee Results
        </h1>
        <p className="text-gray-600">
          View voting results and detailed breakdowns for all ethics cases.
        </p>
      </div>

      {/* Cases Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          All Cases Overview
        </h2>
        
        {cases.length === 0 ? (
          <div className="card text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Cases Available
            </h3>
            <p className="text-gray-600">
              No ethics cases have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="card cursor-pointer hover:shadow-lg transition-shadow"
                   onClick={() => handleCaseSelect(caseItem.id)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Case #{caseItem.id}: {caseItem.description}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>Created: {new Date(Number(caseItem.createdAt) * 1000).toLocaleDateString()}</span>
                      <span>Deadline: {new Date(Number(caseItem.deadline) * 1000).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Vote Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                          {Number(caseItem.yesVotes)}
                        </div>
                        <div className="text-sm text-gray-600">Yes ({caseItem.yesPercentage.toFixed(1)}%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-danger-600">
                          {Number(caseItem.noVotes)}
                        </div>
                        <div className="text-sm text-gray-600">No ({caseItem.noPercentage.toFixed(1)}%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {caseItem.totalVotes}
                        </div>
                        <div className="text-sm text-gray-600">Total Votes</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      caseItem.isActive 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : caseItem.yesVotes > caseItem.noVotes
                        ? 'bg-success-100 text-success-800'
                        : 'bg-danger-100 text-danger-800'
                    }`}>
                      {caseItem.isActive 
                        ? '🟡 Active' 
                        : caseItem.yesVotes > caseItem.noVotes 
                        ? '✅ Approved' 
                        : '❌ Rejected'
                      }
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Click to view details
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Case View */}
      {selectedCase && (
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Case #{selectedCase.id}: {selectedCase.description}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Created: {new Date(Number(selectedCase.createdAt) * 1000).toLocaleDateString()}</span>
                <span>Deadline: {new Date(Number(selectedCase.deadline) * 1000).toLocaleDateString()}</span>
                <span>Total Votes: {selectedCase.totalVotes}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCase(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vote Distribution
              </h3>
              <div className="h-64">
                <Pie data={getChartData(selectedCase)} options={getChartOptions()} />
              </div>
            </div>

            {/* Vote Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                  <span className="font-medium text-success-800">Yes Votes</span>
                  <span className="text-lg font-bold text-success-600">
                    {Number(selectedCase.yesVotes)} ({selectedCase.yesPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-danger-50 rounded-lg">
                  <span className="font-medium text-danger-800">No Votes</span>
                  <span className="text-lg font-bold text-danger-600">
                    {Number(selectedCase.noVotes)} ({selectedCase.noPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">Total Votes</span>
                  <span className="text-lg font-bold text-gray-600">
                    {selectedCase.totalVotes}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vote Records */}
          {voteRecords.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vote Records (Transparency)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vote
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voteRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.voter.slice(0, 6)}...{record.voter.slice(-4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.vote 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-danger-100 text-danger-800'
                          }`}>
                            {record.vote ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(Number(record.timestamp) * 1000).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;

