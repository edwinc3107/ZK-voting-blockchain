import React, { useState } from 'react';
import {
  generateUserStudyData,
  calculateAggregateStats,
  exportToCSV,
  exportToJSON,
  downloadFile
} from '../utils/userStudySimulator';

const UserStudySimulator = ({ contract }) => {
  const [participants, setParticipants] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [numParticipants, setNumParticipants] = useState(12);
  const [numCases, setNumCases] = useState(5);

  const handleGenerate = () => {
    setLoading(true);
    
    // Generate data
    const generatedParticipants = generateUserStudyData(numParticipants, numCases);
    const calculatedStats = calculateAggregateStats(generatedParticipants);
    
    setParticipants(generatedParticipants);
    setStats(calculatedStats);
    setLoading(false);
    
    console.log('✅ Generated user study data:', {
      participants: generatedParticipants.length,
      stats: calculatedStats
    });
  };

  const handleExportCSV = () => {
    if (!participants || !stats) return;
    
    const csvData = exportToCSV(participants, stats);
    
    // Download metrics CSV
    downloadFile(csvData.metrics, 'user-study-metrics.csv', 'text/csv');
    
    // Small delay for multiple downloads
    setTimeout(() => {
      downloadFile(csvData.actions, 'user-study-actions.csv', 'text/csv');
    }, 300);
    
    setTimeout(() => {
      downloadFile(csvData.surveys, 'user-study-surveys.csv', 'text/csv');
    }, 600);
  };

  const handleExportJSON = () => {
    if (!participants || !stats) return;
    
    const jsonData = exportToJSON(participants, stats);
    downloadFile(jsonData, 'user-study-data.json', 'application/json');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎲 User Study Simulation
        </h2>
        <p className="text-gray-600">
          Generate realistic user study data for research paper evaluation
        </p>
      </div>

      {/* Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Simulation Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Participants
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={numParticipants}
              onChange={(e) => setNumParticipants(parseInt(e.target.value) || 12)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 10-15 for research paper
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Cases
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numCases}
              onChange={(e) => setNumCases(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cases available for voting
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary w-full md:w-auto"
        >
          {loading ? 'Generating...' : '🎲 Generate Study Data'}
        </button>
      </div>

      {/* Results */}
      {stats && participants && (
        <>
          {/* Aggregate Statistics */}
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📊 Aggregate Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Participants</p>
                <p className="text-3xl font-bold text-green-900">{stats.totalParticipants}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Avg SUS Score</p>
                <p className="text-3xl font-bold text-green-900">{stats.avgSUSScore}/100</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.avgSUSScore >= 70 ? '✅ Good' : stats.avgSUSScore >= 50 ? '⚠️ Acceptable' : '❌ Poor'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Trust Improvement</p>
                <p className="text-3xl font-bold text-green-900">+{stats.avgTrustImprovement.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.avgTrustPre.toFixed(1)} → {stats.avgTrustPost.toFixed(1)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-green-900">{stats.successRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  Task completion
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Receipt Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReceiptVerifications}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Avg Time to Vote</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgTimeToVote}s</p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📥 Export Data
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                📊 Export CSV (3 files)
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                📄 Export JSON
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              CSV files: metrics.csv, actions.csv, surveys.csv<br />
              JSON file: Complete dataset with metadata
            </p>
          </div>

          {/* Participant Details Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👥 Participant Details
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SUS Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Pre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Post</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Improvement</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((p) => (
                    <tr key={p.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.userId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.demographics.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.metrics.totalVotes}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.metrics.susScore}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.surveys.preStudy.trust}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.surveys.postStudy.trust}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${
                          p.metrics.trustImprovement >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {p.metrics.trustImprovement >= 0 ? '+' : ''}{p.metrics.trustImprovement.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Info Section */}
      {!stats && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ℹ️ How It Works
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
            <li>Generates realistic user interaction data (votes, receipt verifications)</li>
            <li>Creates survey responses (pre/post trust, SUS questionnaire)</li>
            <li>Calculates metrics (SUS scores, trust improvement, task completion times)</li>
            <li>Exports data in CSV/JSON format for research paper analysis</li>
            <li>Models realistic behavior patterns (normal distributions, success rates)</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserStudySimulator;



