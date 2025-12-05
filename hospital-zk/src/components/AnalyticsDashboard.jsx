import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  calculateMetrics, 
  prepareVotesOverTimeData, 
  getCaseParticipation,
  formatNumber 
} from '../utils/analyticsUtils';
import { getCaseReceiptsFromChain } from '../utils/receiptUtils';
import { 
  calculateGasMetrics, 
  formatGasNumber, 
  setBaselineMetrics, 
  getBaselineMetrics, 
  compareWithBaseline,
  clearBaselineMetrics 
} from '../utils/gasUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = ({ contract, account }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [votesOverTimeData, setVotesOverTimeData] = useState([]);
  const [caseParticipation, setCaseParticipation] = useState([]);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [gasMetrics, setGasMetrics] = useState(null);
  const [baselineComparison, setBaselineComparison] = useState(null);
  const [baselineInfo, setBaselineInfo] = useState(null);

  useEffect(() => {
    if (contract) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [contract]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const casesCount = await contract.casesCount();
      const casesData = [];
      let receiptsCount = 0;

      for (let i = 0; i < casesCount; i++) {
        try {
          const caseData = await contract.getCase(i);
          const now = Math.floor(Date.now() / 1000);
          const deadline = Number(caseData.deadline);
          const isActive = deadline > now && caseData.isActive;
          
          casesData.push({
            id: i,
            description: caseData.description,
            createdAt: Number(caseData.createdAt) || 0,
            deadline: deadline,
            yesVotes: Number(caseData.yesVotes) || 0,
            noVotes: Number(caseData.noVotes) || 0,
            isActive: isActive,
            totalVotes: Number(caseData.yesVotes) + Number(caseData.noVotes)
          });

          // Count receipts for this case
          try {
            const receipts = await getCaseReceiptsFromChain(contract, i);
            receiptsCount += receipts.length;
          } catch (error) {
            console.error(`Error loading receipts for case ${i}:`, error);
          }
        } catch (error) {
          console.error(`Error loading case ${i}:`, error);
        }
      }

      setCases(casesData);
      setTotalReceipts(receiptsCount);

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(casesData);
      calculatedMetrics.totalReceipts = receiptsCount;
      setMetrics(calculatedMetrics);

      // Prepare chart data
      const chartData = prepareVotesOverTimeData(casesData);
      setVotesOverTimeData(chartData);

      // Get case participation breakdown
      const participation = getCaseParticipation(casesData);
      setCaseParticipation(participation);

      // Calculate gas metrics
      const gas = calculateGasMetrics();
      setGasMetrics(gas);

      // Check for baseline and calculate comparison
      const baseline = getBaselineMetrics();
      setBaselineInfo(baseline);
      
      if (baseline) {
        const comparison = compareWithBaseline();
        setBaselineComparison(comparison);
      } else {
        setBaselineComparison(null);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = () => {
    const label = prompt('Enter a label for this baseline (e.g., "Before Optimization", "v1.0"):', 'Before Optimization');
    if (label) {
      setBaselineMetrics(label);
      // Reload to show comparison
      loadData();
    }
  };

  const handleClearBaseline = () => {
    if (confirm('Are you sure you want to clear the baseline metrics?')) {
      clearBaselineMetrics();
      setBaselineInfo(null);
      setBaselineComparison(null);
    }
  };

  // Chart configuration
  const chartData = {
    labels: votesOverTimeData.map(d => d.date),
    datasets: [
      {
        label: 'Votes Cast',
        data: votesOverTimeData.map(d => d.votes),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            return `Votes: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📊</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600">
          Connect to the contract to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-medical-50 to-blue-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Analytics Dashboard
        </h2>
        <p className="text-gray-600">
          System-wide voting metrics and participation analytics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Cases</p>
              <p className="text-3xl font-bold text-blue-900">{formatNumber(metrics.totalCases)}</p>
              <p className="text-xs text-blue-600 mt-1">
                {metrics.activeCases} active, {metrics.closedCases} closed
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        {/* Total Votes */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Votes</p>
              <p className="text-3xl font-bold text-green-900">{formatNumber(metrics.totalVotes)}</p>
              <p className="text-xs text-green-600 mt-1">
                {formatNumber(metrics.totalYesVotes)} yes, {formatNumber(metrics.totalNoVotes)} no
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
        </div>

        {/* Receipts Generated */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Receipts Generated</p>
              <p className="text-3xl font-bold text-purple-900">{formatNumber(metrics.totalReceipts)}</p>
              <p className="text-xs text-purple-600 mt-1">
                Verifiable proof of votes
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎫</span>
            </div>
          </div>
        </div>

        {/* Avg Votes per Case */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Avg Votes/Case</p>
              <p className="text-3xl font-bold text-orange-900">{metrics.avgVotesPerCase}</p>
              <p className="text-xs text-orange-600 mt-1">
                Average participation
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Votes Over Time Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Votes Over Time
        </h3>
        {votesOverTimeData.length > 0 ? (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>No voting data available yet</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Shows cumulative votes cast per day based on case creation dates
        </p>
      </div>

      {/* Case-by-Case Participation */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Case Participation Breakdown
        </h3>
        {caseParticipation.length > 0 ? (
          <div className="space-y-3">
            {caseParticipation.slice(0, 5).map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      Case #{caseItem.id + 1}
                    </span>
                    {caseItem.isActive && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {caseItem.description}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(caseItem.totalVotes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(caseItem.yesVotes)} yes / {formatNumber(caseItem.noVotes)} no
                  </p>
                </div>
              </div>
            ))}
            {caseParticipation.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                Showing top 5 cases. {caseParticipation.length - 5} more cases available.
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No case data available</p>
        )}
      </div>

      {/* Gas Metrics Section */}
      {gasMetrics && gasMetrics.totalTransactions > 0 && (
        <>
          <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ⛽ Gas Metrics
                </h2>
                <p className="text-gray-600">
                  Transaction gas usage and cost analytics
                </p>
              </div>
              <div className="flex space-x-2">
                {!baselineInfo ? (
                  <button
                    onClick={handleSetBaseline}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    📌 Set Baseline
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSetBaseline}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                      🔄 Update Baseline
                    </button>
                    <button
                      onClick={handleClearBaseline}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                    >
                      🗑️ Clear Baseline
                    </button>
                  </>
                )}
              </div>
            </div>
            {baselineInfo && (
              <div className="mt-3 p-3 bg-indigo-100 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <strong>Baseline:</strong> {baselineInfo.label} (set on {new Date(baselineInfo.timestamp).toLocaleString()})
                </p>
              </div>
            )}
          </div>

          {/* Gas Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Transactions */}
            <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-indigo-900">{formatNumber(gasMetrics.totalTransactions)}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    All recorded actions
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            {/* Total Gas Used */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Gas Used</p>
                  <p className="text-3xl font-bold text-blue-900">{formatGasNumber(gasMetrics.totalGasUsed)}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {formatGasNumber(gasMetrics.avgGasPerTransaction)} avg per tx
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⛽</span>
                </div>
              </div>
            </div>

            {/* Total Cost ETH */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Total Cost (ETH)</p>
                  <p className="text-3xl font-bold text-purple-900">{parseFloat(gasMetrics.totalGasCostEth).toFixed(6)}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {gasMetrics.avgGasCostEth} avg per tx
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">Ξ</span>
                </div>
              </div>
            </div>

            {/* Total Cost USD */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Total Cost (USD)</p>
                  <p className="text-3xl font-bold text-green-900">${formatNumber(parseFloat(gasMetrics.totalGasCostUsd).toFixed(2))}</p>
                  <p className="text-xs text-green-600 mt-1">
                    ${gasMetrics.avgGasCostUsd} avg per tx
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
              </div>
            </div>
          </div>

          {/* Before/After Comparison */}
          {baselineComparison && baselineComparison.hasBaseline && (
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Before/After Optimization Comparison
              </h3>
              
              {/* Overall Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Total Gas Improvement</p>
                  <p className={`text-2xl font-bold ${
                    baselineComparison.comparison.totalGasImprovement >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {baselineComparison.comparison.totalGasImprovement >= 0 ? '↓' : '↑'} {Math.abs(baselineComparison.comparison.totalGasImprovement).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Saved: {formatGasNumber(baselineComparison.comparison.totalGasSaved)} gas
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Total Cost Improvement</p>
                  <p className={`text-2xl font-bold ${
                    baselineComparison.comparison.totalCostImprovement >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {baselineComparison.comparison.totalCostImprovement >= 0 ? '↓' : '↑'} {Math.abs(baselineComparison.comparison.totalCostImprovement).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Saved: ${baselineComparison.comparison.totalCostSaved}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Avg Gas per Transaction</p>
                  <p className={`text-2xl font-bold ${
                    baselineComparison.comparison.avgGasImprovement >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {baselineComparison.comparison.avgGasImprovement >= 0 ? '↓' : '↑'} {Math.abs(baselineComparison.comparison.avgGasImprovement).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Per transaction improvement
                  </p>
                </div>
              </div>

              {/* Action-by-Action Comparison */}
              {Object.keys(baselineComparison.byActionType).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Action-by-Action Comparison
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(baselineComparison.byActionType).map(([actionType, comparison]) => (
                      <div 
                        key={actionType}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-900">
                            {actionType.replace(/_/g, ' ')}
                          </h5>
                          <div className="flex items-center space-x-4">
                            {comparison.gasImprovement !== 0 && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                comparison.gasImprovement >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {comparison.gasImprovement >= 0 ? '↓' : '↑'} {Math.abs(comparison.gasImprovement).toFixed(1)}% gas
                              </span>
                            )}
                            {comparison.costImprovement !== 0 && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                comparison.costImprovement >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {comparison.costImprovement >= 0 ? '↓' : '↑'} {Math.abs(comparison.costImprovement).toFixed(1)}% cost
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Before (Baseline)</p>
                            {comparison.baseline ? (
                              <div className="space-y-1">
                                <p className="font-medium">Avg Gas: {formatGasNumber(comparison.baseline.avgGasUsed)}</p>
                                <p className="font-medium">Cost: ${comparison.baseline.avgGasCostUsd}</p>
                                <p className="text-xs text-gray-500">{comparison.baseline.count} transactions</p>
                              </div>
                            ) : (
                              <p className="text-gray-400">N/A</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">After (Current)</p>
                            {comparison.current ? (
                              <div className="space-y-1">
                                <p className="font-medium">Avg Gas: {formatGasNumber(comparison.current.avgGasUsed)}</p>
                                <p className="font-medium">Cost: ${comparison.current.avgGasCostUsd}</p>
                                <p className="text-xs text-gray-500">{comparison.current.count} transactions</p>
                              </div>
                            ) : (
                              <p className="text-gray-400">N/A</p>
                            )}
                          </div>
                        </div>
                        {comparison.gasSaved !== '0' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              <strong>Savings:</strong> {formatGasNumber(comparison.gasSaved)} gas ({comparison.gasSaved !== '0' && comparison.costSaved !== '0' ? `$${comparison.costSaved}` : 'N/A'} per transaction)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gas Metrics by Action Type */}
          {Object.keys(gasMetrics.byActionType).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gas Usage by Action Type
              </h3>
              <div className="space-y-3">
                {Object.entries(gasMetrics.byActionType).map(([actionType, stats]) => (
                  <div 
                    key={actionType}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {stats.count} {stats.count === 1 ? 'tx' : 'txs'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Avg Gas:</span> {formatGasNumber(stats.avgGasUsed)}
                        </div>
                        <div>
                          <span className="font-medium">Min:</span> {formatGasNumber(stats.minGasUsed)} | <span className="font-medium">Max:</span> {formatGasNumber(stats.maxGasUsed)}
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span> {parseFloat(stats.avgGasCostEth).toFixed(6)} ETH (${stats.avgGasCostUsd})
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatGasNumber(stats.totalGasUsed)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total gas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;


