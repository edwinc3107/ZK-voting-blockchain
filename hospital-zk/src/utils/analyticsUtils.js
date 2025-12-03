/**
 * Analytics Utilities
 * Functions to process and aggregate voting data for analytics dashboard
 */

/**
 * Calculate aggregate metrics from cases data
 */
export const calculateMetrics = (cases) => {
  if (!cases || cases.length === 0) {
    return {
      totalCases: 0,
      activeCases: 0,
      closedCases: 0,
      totalVotes: 0,
      totalYesVotes: 0,
      totalNoVotes: 0,
      totalReceipts: 0,
      participationRate: 0,
      avgVotesPerCase: 0
    };
  }

  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.isActive).length;
  const closedCases = totalCases - activeCases;
  
  const totalVotes = cases.reduce((sum, c) => {
    const yes = Number(c.yesVotes) || 0;
    const no = Number(c.noVotes) || 0;
    return sum + yes + no;
  }, 0);
  
  const totalYesVotes = cases.reduce((sum, c) => sum + (Number(c.yesVotes) || 0), 0);
  const totalNoVotes = cases.reduce((sum, c) => sum + (Number(c.noVotes) || 0), 0);
  
  const avgVotesPerCase = totalCases > 0 ? (totalVotes / totalCases).toFixed(1) : 0;

  return {
    totalCases,
    activeCases,
    closedCases,
    totalVotes,
    totalYesVotes,
    totalNoVotes,
    avgVotesPerCase,
    participationRate: 0 // Will be calculated separately with verified voters count
  };
};

/**
 * Calculate participation rate
 * @param {number} totalVotes - Total votes cast
 * @param {number} verifiedVotersCount - Number of verified voters
 */
export const calculateParticipationRate = (totalVotes, verifiedVotersCount) => {
  if (!verifiedVotersCount || verifiedVotersCount === 0) return 0;
  // Assuming each voter can vote on multiple cases, participation is votes / (voters * cases)
  // For simplicity, we'll use: (unique voters who voted) / total verified voters
  // Since we don't track unique voters easily, we'll use a simplified metric
  return Math.min(100, Math.round((totalVotes / (verifiedVotersCount * 2)) * 100)); // Rough estimate
};

/**
 * Prepare data for votes-over-time chart
 * Groups votes by date from case creation timestamps
 */
export const prepareVotesOverTimeData = (cases) => {
  if (!cases || cases.length === 0) {
    return [];
  }

  // Group cases by creation date (day)
  const votesByDate = {};
  
  cases.forEach(caseItem => {
    const createdAt = Number(caseItem.createdAt) || 0;
    if (createdAt === 0) return;
    
    const date = new Date(createdAt * 1000);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!votesByDate[dateKey]) {
      votesByDate[dateKey] = {
        date: dateKey,
        votes: 0,
        cases: 0
      };
    }
    
    const yesVotes = Number(caseItem.yesVotes) || 0;
    const noVotes = Number(caseItem.noVotes) || 0;
    votesByDate[dateKey].votes += (yesVotes + noVotes);
    votesByDate[dateKey].cases += 1;
  });

  // Convert to array and sort by date
  const chartData = Object.values(votesByDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      votes: item.votes,
      cases: item.cases
    }));

  return chartData;
};

/**
 * Get case-by-case participation breakdown
 */
export const getCaseParticipation = (cases) => {
  return cases.map(caseItem => ({
    id: caseItem.id,
    description: caseItem.description?.substring(0, 50) + (caseItem.description?.length > 50 ? '...' : ''),
    totalVotes: (Number(caseItem.yesVotes) || 0) + (Number(caseItem.noVotes) || 0),
    yesVotes: Number(caseItem.yesVotes) || 0,
    noVotes: Number(caseItem.noVotes) || 0,
    isActive: caseItem.isActive
  })).sort((a, b) => b.totalVotes - a.totalVotes); // Sort by votes descending
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString();
};

