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

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default AnalyticsDashboard;

