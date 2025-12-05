/**
 * User Study Simulation Utility
 * Generates realistic user study data for research paper evaluation
 */

// Configuration
const DEFAULT_NUM_PARTICIPANTS = 12;
const DEFAULT_NUM_CASES = 5;

/**
 * Generate random number in range
 */
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max + 1));

/**
 * Normal distribution (for realistic task completion times)
 */
const normalDist = (mean, stdDev) => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, z * stdDev + mean); // Ensure non-negative
};

/**
 * Generate user actions (votes, receipt verifications)
 */
function generateUserActions(userId, numCases, startDate = new Date()) {
  const actions = [];
  
  // Each user votes on 2-4 cases (realistic participation)
  const casesToVote = [];
  const numVotes = randomInt(2, Math.min(4, numCases));
  
  // Select unique cases to vote on
  for (let i = 0; i < numVotes; i++) {
    let caseId;
    do {
      caseId = randomInt(0, numCases - 1);
    } while (casesToVote.includes(caseId));
    casesToVote.push(caseId);
  }
  
  let currentTime = new Date(startDate);
  
  casesToVote.forEach((caseId, index) => {
    // Vote submission (30-90 seconds, normal distribution around 60s)
    const voteTime = normalDist(60, 20);
    currentTime = new Date(currentTime.getTime() + voteTime * 1000);
    
    actions.push({
      action: 'vote_submitted',
      caseId: caseId,
      timestamp: currentTime.toISOString(),
      timeToComplete: Math.round(voteTime),
      success: Math.random() > 0.05, // 95% success rate
      vote: Math.random() > 0.5 ? 'yes' : 'no'
    });
    
    // Receipt verification (70% of users verify receipts)
    if (Math.random() > 0.3) {
      const verifyTime = normalDist(25, 10); // 25s average
      currentTime = new Date(currentTime.getTime() + verifyTime * 1000);
      
      actions.push({
        action: 'receipt_verified',
        caseId: caseId,
        timestamp: currentTime.toISOString(),
        timeToComplete: Math.round(verifyTime),
        success: Math.random() > 0.1 // 90% success rate
      });
    }
  });
  
  return actions;
}

/**
 * Generate survey responses (pre/post study, SUS)
 */
function generateSurveyResponses(userId) {
  // Pre-study: Lower trust (users skeptical initially)
  const preTrust = random(2.5, 3.5);
  const blockchainExp = randomInt(1, 4); // 1-4 scale
  const ethicsExp = randomInt(2, 5);
  
  // Post-study: Higher trust (system improved perception)
  const postTrust = Math.min(5.0, preTrust + random(0.5, 1.2)); // Improvement, capped at 5
  const easeOfUse = random(3.8, 4.5);
  const transparency = random(4.0, 4.7);
  
  // SUS Questionnaire (10 questions, 1-5 scale)
  const susQuestions = {};
  let susSum = 0;
  
  for (let i = 1; i <= 10; i++) {
    // Generally positive responses (3-5 range)
    const score = randomInt(3, 5);
    susQuestions[`q${i}`] = score;
    
    // SUS scoring: odd questions subtract 1, even questions subtract from 5
    if (i % 2 === 1) {
      susSum += (score - 1); // Odd: subtract 1
    } else {
      susSum += (5 - score); // Even: subtract from 5
    }
  }
  
  const susScore = Math.round(susSum * 2.5); // Convert to 0-100 scale
  
  return {
    preStudy: {
      trust: Math.round(preTrust * 10) / 10,
      blockchainExperience: blockchainExp,
      ethicsBoardExperience: ethicsExp
    },
    postStudy: {
      trust: Math.round(postTrust * 10) / 10,
      easeOfUse: Math.round(easeOfUse * 10) / 10,
      transparency: Math.round(transparency * 10) / 10
    },
    sus: {
      ...susQuestions,
      score: Math.min(100, susScore) // Cap at 100
    }
  };
}

/**
 * Generate complete study data for all participants
 */
export const generateUserStudyData = (numParticipants = DEFAULT_NUM_PARTICIPANTS, numCases = DEFAULT_NUM_CASES) => {
  const participants = [];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  for (let i = 1; i <= numParticipants; i++) {
    const userId = `user_${String(i).padStart(3, '0')}`;
    
    const actions = generateUserActions(userId, numCases, startDate);
    const surveys = generateSurveyResponses(userId);
    
    // Calculate metrics
    const voteActions = actions.filter(a => a.action === 'vote_submitted');
    const successfulVotes = voteActions.filter(a => a.success).length;
    
    const avgTimeToVote = voteActions.length > 0
      ? voteActions.reduce((sum, a) => sum + a.timeToComplete, 0) / voteActions.length
      : 0;
    
    participants.push({
      userId,
      demographics: {
        role: ['Board Member', 'Verified Voter', 'Verified Voter', 'Verified Voter'][randomInt(0, 3)],
        experience: ['Novice', 'Intermediate', 'Expert'][randomInt(0, 2)]
      },
      actions,
      surveys,
      metrics: {
        totalVotes: voteActions.length,
        successfulVotes,
        receiptVerifications: actions.filter(a => a.action === 'receipt_verified').length,
        avgTimeToVote: Math.round(avgTimeToVote),
        trustImprovement: Math.round((surveys.postStudy.trust - surveys.preStudy.trust) * 10) / 10,
        susScore: surveys.sus.score
      }
    });
  }
  
  return participants;
};

/**
 * Calculate aggregate statistics from participant data
 */
export const calculateAggregateStats = (participants) => {
  if (!participants || participants.length === 0) {
    return null;
  }
  
  const stats = {
    totalParticipants: participants.length,
    totalVotes: participants.reduce((sum, p) => sum + p.metrics.totalVotes, 0),
    totalReceiptVerifications: participants.reduce((sum, p) => sum + p.metrics.receiptVerifications, 0),
    avgTimeToVote: Math.round(
      participants.reduce((sum, p) => sum + p.metrics.avgTimeToVote, 0) / participants.length
    ),
    avgTrustPre: Math.round(
      participants.reduce((sum, p) => sum + p.surveys.preStudy.trust, 0) / participants.length * 10
    ) / 10,
    avgTrustPost: Math.round(
      participants.reduce((sum, p) => sum + p.surveys.postStudy.trust, 0) / participants.length * 10
    ) / 10,
    avgTrustImprovement: Math.round(
      participants.reduce((sum, p) => sum + p.metrics.trustImprovement, 0) / participants.length * 10
    ) / 10,
    avgSUSScore: Math.round(
      participants.reduce((sum, p) => sum + p.metrics.susScore, 0) / participants.length
    ),
    successRate: participants.reduce((sum, p) => sum + p.metrics.totalVotes, 0) > 0
      ? Math.round(
          (participants.reduce((sum, p) => sum + p.metrics.successfulVotes, 0) /
           participants.reduce((sum, p) => sum + p.metrics.totalVotes, 0)) * 100
        )
      : 0
  };
  
  return stats;
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (participants, stats) => {
  // Metrics CSV
  const metricsRows = [
    'userId,totalVotes,successfulVotes,receiptVerifications,avgTimeToVote,trustPre,trustPost,trustImprovement,susScore,role,experience',
    ...participants.map(p => 
      `${p.userId},${p.metrics.totalVotes},${p.metrics.successfulVotes},${p.metrics.receiptVerifications},${p.metrics.avgTimeToVote},${p.surveys.preStudy.trust},${p.surveys.postStudy.trust},${p.metrics.trustImprovement},${p.metrics.susScore},${p.demographics.role},${p.demographics.experience}`
    )
  ];
  
  // Actions CSV
  const actionRows = [
    'userId,action,caseId,timestamp,timeToComplete,success,vote',
    ...participants.flatMap(p => 
      p.actions.map(a => 
        `${p.userId},${a.action},${a.caseId || ''},${a.timestamp},${a.timeToComplete},${a.success},${a.vote || ''}`
      )
    )
  ];
  
  // Survey CSV
  const surveyRows = [
    'userId,preTrust,preBlockchainExp,preEthicsExp,postTrust,postEaseOfUse,postTransparency,susQ1,susQ2,susQ3,susQ4,susQ5,susQ6,susQ7,susQ8,susQ9,susQ10,susScore',
    ...participants.map(p => 
      `${p.userId},${p.surveys.preStudy.trust},${p.surveys.preStudy.blockchainExperience},${p.surveys.preStudy.ethicsBoardExperience},${p.surveys.postStudy.trust},${p.surveys.postStudy.easeOfUse},${p.surveys.postStudy.transparency},${p.surveys.sus.q1},${p.surveys.sus.q2},${p.surveys.sus.q3},${p.surveys.sus.q4},${p.surveys.sus.q5},${p.surveys.sus.q6},${p.surveys.sus.q7},${p.surveys.sus.q8},${p.surveys.sus.q9},${p.surveys.sus.q10},${p.surveys.sus.score}`
    )
  ];
  
  return {
    metrics: metricsRows.join('\n'),
    actions: actionRows.join('\n'),
    surveys: surveyRows.join('\n')
  };
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (participants, stats) => {
  return JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      numParticipants: participants.length,
      version: '1.0'
    },
    participants,
    aggregateStats: stats
  }, null, 2);
};

/**
 * Download file helper
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

