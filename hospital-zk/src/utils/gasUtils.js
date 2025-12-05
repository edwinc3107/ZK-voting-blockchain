/**
 * Gas Metrics Utilities
 * Functions to capture, store, and compute gas usage metrics
 */

// Fixed ETH/USD rate for cost calculation (can be updated or fetched from API)
const ETH_USD_RATE = 2500; // Example rate, can be made dynamic

/**
 * Record gas metrics from a transaction
 * @param {string} actionType - Type of action (e.g., 'BOARD_CREATE_CASE', 'VOTER_CAST_VOTE', 'BOARD_RESOLVE_CASE')
 * @param {Object} receipt - Transaction receipt from ethers
 * @param {string} account - Account that performed the transaction
 * @param {Object} metadata - Optional metadata (caseId, version, etc.)
 */
export const recordGasMetrics = (actionType, receipt, account, metadata = {}) => {
  try {
    if (!receipt || !receipt.gasUsed) {
      console.warn('⚠️ Invalid receipt for gas metrics:', receipt);
      return null;
    }

    const gasUsed = BigInt(receipt.gasUsed.toString());
    
    // Get gas price - try multiple methods for ethers v6 compatibility
    let gasPrice = BigInt(0);
    let effectiveGasPrice = null;
    
    if (receipt.gasPrice) {
      gasPrice = BigInt(receipt.gasPrice.toString());
      effectiveGasPrice = receipt.gasPrice.toString();
    } else if (receipt.effectiveGasPrice) {
      gasPrice = BigInt(receipt.effectiveGasPrice.toString());
      effectiveGasPrice = receipt.effectiveGasPrice.toString();
    }

    // Calculate gas cost in ETH
    const gasCostWei = gasUsed * gasPrice;
    const gasCostEth = Number(gasCostWei) / 1e18;
    
    // Calculate cost in USD
    const gasCostUsd = gasCostEth * ETH_USD_RATE;

    const gasEvent = {
      actionType,
      txHash: receipt.hash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      effectiveGasPrice,
      gasCostEth: gasCostEth.toFixed(8),
      gasCostUsd: gasCostUsd.toFixed(2),
      account: account || 'unknown',
      timestamp: Date.now(),
      blockNumber: receipt.blockNumber?.toString() || 'unknown',
      version: metadata.version || 'current', // Track optimization version
      ...metadata
    };

    // Store in localStorage
    const stored = localStorage.getItem('gasMetrics');
    const gasEvents = stored ? JSON.parse(stored) : [];
    gasEvents.push(gasEvent);
    
    // Keep only last 1000 events to avoid localStorage bloat
    const trimmedEvents = gasEvents.slice(-1000);
    localStorage.setItem('gasMetrics', JSON.stringify(trimmedEvents));

    console.log('📊 Gas metrics recorded:', {
      actionType,
      gasUsed: gasEvent.gasUsed,
      gasCostEth: gasEvent.gasCostEth,
      gasCostUsd: gasEvent.gasCostUsd
    });

    return gasEvent;
  } catch (error) {
    console.error('❌ Error recording gas metrics:', error);
    return null;
  }
};

/**
 * Get all stored gas events
 */
export const getAllGasEvents = () => {
  try {
    const stored = localStorage.getItem('gasMetrics');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading gas events:', error);
    return [];
  }
};

/**
 * Calculate aggregate gas metrics
 */
export const calculateGasMetrics = () => {
  const events = getAllGasEvents();
  
  if (events.length === 0) {
    return {
      totalTransactions: 0,
      totalGasUsed: '0',
      totalGasCostEth: '0',
      totalGasCostUsd: '0',
      avgGasPerTransaction: '0',
      avgGasCostEth: '0',
      avgGasCostUsd: '0',
      byActionType: {}
    };
  }

  // Calculate totals
  let totalGasUsed = BigInt(0);
  let totalGasCostEth = 0;
  let totalGasCostUsd = 0;

  // Group by action type
  const byActionType = {};

  events.forEach(event => {
    // Total gas used
    totalGasUsed += BigInt(event.gasUsed);
    
    // Total costs
    totalGasCostEth += parseFloat(event.gasCostEth);
    totalGasCostUsd += parseFloat(event.gasCostUsd);

    // Group by action type
    if (!byActionType[event.actionType]) {
      byActionType[event.actionType] = {
        count: 0,
        totalGasUsed: BigInt(0),
        totalGasCostEth: 0,
        totalGasCostUsd: 0,
        minGasUsed: BigInt(event.gasUsed),
        maxGasUsed: BigInt(event.gasUsed)
      };
    }

    const actionStats = byActionType[event.actionType];
    actionStats.count += 1;
    actionStats.totalGasUsed += BigInt(event.gasUsed);
    actionStats.totalGasCostEth += parseFloat(event.gasCostEth);
    actionStats.totalGasCostUsd += parseFloat(event.gasCostUsd);
    
    const gasUsed = BigInt(event.gasUsed);
    if (gasUsed < actionStats.minGasUsed) {
      actionStats.minGasUsed = gasUsed;
    }
    if (gasUsed > actionStats.maxGasUsed) {
      actionStats.maxGasUsed = gasUsed;
    }
  });

  // Calculate averages
  const avgGasPerTransaction = events.length > 0 
    ? (totalGasUsed / BigInt(events.length)).toString()
    : '0';
  const avgGasCostEth = events.length > 0 
    ? (totalGasCostEth / events.length).toFixed(8)
    : '0';
  const avgGasCostUsd = events.length > 0 
    ? (totalGasCostUsd / events.length).toFixed(2)
    : '0';

  // Format action type stats
  const formattedByActionType = {};
  Object.keys(byActionType).forEach(actionType => {
    const stats = byActionType[actionType];
    formattedByActionType[actionType] = {
      count: stats.count,
      totalGasUsed: stats.totalGasUsed.toString(),
      avgGasUsed: (stats.totalGasUsed / BigInt(stats.count)).toString(),
      minGasUsed: stats.minGasUsed.toString(),
      maxGasUsed: stats.maxGasUsed.toString(),
      avgGasCostEth: (stats.totalGasCostEth / stats.count).toFixed(8),
      avgGasCostUsd: (stats.totalGasCostUsd / stats.count).toFixed(2),
      totalGasCostEth: stats.totalGasCostEth.toFixed(8),
      totalGasCostUsd: stats.totalGasCostUsd.toFixed(2)
    };
  });

  return {
    totalTransactions: events.length,
    totalGasUsed: totalGasUsed.toString(),
    totalGasCostEth: totalGasCostEth.toFixed(8),
    totalGasCostUsd: totalGasCostUsd.toFixed(2),
    avgGasPerTransaction: avgGasPerTransaction,
    avgGasCostEth,
    avgGasCostUsd,
    byActionType: formattedByActionType
  };
};

/**
 * Get gas metrics for a specific action type
 */
export const getGasMetricsByActionType = (actionType) => {
  const metrics = calculateGasMetrics();
  return metrics.byActionType[actionType] || null;
};

/**
 * Format large numbers with commas
 */
export const formatGasNumber = (num) => {
  if (!num || num === '0') return '0';
  return BigInt(num).toLocaleString();
};

/**
 * Clear all gas metrics (for testing/reset)
 */
export const clearGasMetrics = () => {
  localStorage.removeItem('gasMetrics');
  console.log('🗑️ Gas metrics cleared');
};

/**
 * Set baseline metrics for before/after comparison
 * @param {string} label - Label for this baseline (e.g., 'before_optimization', 'v1.0')
 */
export const setBaselineMetrics = (label = 'before_optimization') => {
  const currentMetrics = calculateGasMetrics();
  const baseline = {
    label,
    timestamp: Date.now(),
    metrics: currentMetrics
  };
  
  localStorage.setItem('gasMetricsBaseline', JSON.stringify(baseline));
  console.log(`📌 Baseline metrics saved: ${label}`, {
    totalTransactions: baseline.metrics.totalTransactions,
    totalGasUsed: baseline.metrics.totalGasUsed,
    totalCostUsd: `$${baseline.metrics.totalGasCostUsd}`
  });
  
  return baseline;
};

/**
 * Get baseline metrics
 */
export const getBaselineMetrics = () => {
  try {
    const stored = localStorage.getItem('gasMetricsBaseline');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading baseline metrics:', error);
    return null;
  }
};

/**
 * Compare current metrics with baseline
 * Returns comparison data showing improvements/degradations
 */
export const compareWithBaseline = () => {
  const baseline = getBaselineMetrics();
  const current = calculateGasMetrics();
  
  if (!baseline) {
    return {
      hasBaseline: false,
      message: 'No baseline metrics set. Set a baseline first to enable comparison.'
    };
  }
  
  const baselineMetrics = baseline.metrics;
  
  // Calculate overall improvements
  const totalGasImprovement = baselineMetrics.totalGasUsed !== '0' 
    ? ((BigInt(baselineMetrics.totalGasUsed) - BigInt(current.totalGasUsed)) * BigInt(100) / BigInt(baselineMetrics.totalGasUsed))
    : BigInt(0);
  
  const totalCostImprovement = parseFloat(baselineMetrics.totalGasCostUsd) > 0
    ? ((parseFloat(baselineMetrics.totalGasCostUsd) - parseFloat(current.totalGasCostUsd)) / parseFloat(baselineMetrics.totalGasCostUsd)) * 100
    : 0;
  
  const avgGasImprovement = baselineMetrics.avgGasPerTransaction !== '0'
    ? ((BigInt(baselineMetrics.avgGasPerTransaction) - BigInt(current.avgGasPerTransaction)) * BigInt(100) / BigInt(baselineMetrics.avgGasPerTransaction))
    : BigInt(0);
  
  // Compare by action type
  const actionTypeComparison = {};
  
  // Get all unique action types from both baseline and current
  const allActionTypes = new Set([
    ...Object.keys(baselineMetrics.byActionType || {}),
    ...Object.keys(current.byActionType || {})
  ]);
  
  allActionTypes.forEach(actionType => {
    const baselineStats = baselineMetrics.byActionType[actionType];
    const currentStats = current.byActionType[actionType];
    
    if (baselineStats && currentStats) {
      const gasImprovement = baselineStats.avgGasUsed !== '0'
        ? ((BigInt(baselineStats.avgGasUsed) - BigInt(currentStats.avgGasUsed)) * BigInt(100) / BigInt(baselineStats.avgGasUsed))
        : BigInt(0);
      
      const costImprovement = parseFloat(baselineStats.avgGasCostUsd) > 0
        ? ((parseFloat(baselineStats.avgGasCostUsd) - parseFloat(currentStats.avgGasCostUsd)) / parseFloat(baselineStats.avgGasCostUsd)) * 100
        : 0;
      
      actionTypeComparison[actionType] = {
        baseline: {
          avgGasUsed: baselineStats.avgGasUsed,
          avgGasCostUsd: baselineStats.avgGasCostUsd,
          count: baselineStats.count
        },
        current: {
          avgGasUsed: currentStats.avgGasUsed,
          avgGasCostUsd: currentStats.avgGasCostUsd,
          count: currentStats.count
        },
        gasImprovement: Number(gasImprovement),
        costImprovement: costImprovement,
        gasSaved: (BigInt(baselineStats.avgGasUsed) - BigInt(currentStats.avgGasUsed)).toString(),
        costSaved: (parseFloat(baselineStats.avgGasCostUsd) - parseFloat(currentStats.avgGasCostUsd)).toFixed(2)
      };
    } else if (baselineStats) {
      // Action exists in baseline but not in current
      actionTypeComparison[actionType] = {
        baseline: {
          avgGasUsed: baselineStats.avgGasUsed,
          avgGasCostUsd: baselineStats.avgGasCostUsd,
          count: baselineStats.count
        },
        current: null,
        gasImprovement: 0,
        costImprovement: 0,
        gasSaved: '0',
        costSaved: '0'
      };
    } else if (currentStats) {
      // Action exists in current but not in baseline
      actionTypeComparison[actionType] = {
        baseline: null,
        current: {
          avgGasUsed: currentStats.avgGasUsed,
          avgGasCostUsd: currentStats.avgGasCostUsd,
          count: currentStats.count
        },
        gasImprovement: 0,
        costImprovement: 0,
        gasSaved: '0',
        costSaved: '0'
      };
    }
  });
  
  return {
    hasBaseline: true,
    baseline: {
      label: baseline.label,
      timestamp: baseline.timestamp,
      date: new Date(baseline.timestamp).toLocaleString()
    },
    comparison: {
      totalGasImprovement: Number(totalGasImprovement),
      totalCostImprovement: totalCostImprovement,
      avgGasImprovement: Number(avgGasImprovement),
      totalGasSaved: (BigInt(baselineMetrics.totalGasUsed) - BigInt(current.totalGasUsed)).toString(),
      totalCostSaved: (parseFloat(baselineMetrics.totalGasCostUsd) - parseFloat(current.totalGasCostUsd)).toFixed(2)
    },
    baselineMetrics,
    currentMetrics: current,
    byActionType: actionTypeComparison
  };
};

/**
 * Clear baseline metrics
 */
export const clearBaselineMetrics = () => {
  localStorage.removeItem('gasMetricsBaseline');
  console.log('🗑️ Baseline metrics cleared');
};

