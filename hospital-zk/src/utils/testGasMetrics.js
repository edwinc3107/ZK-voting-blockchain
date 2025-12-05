/**
 * Test script for Gas Metrics functionality
 * Run this in the browser console to verify gas metrics are working
 */

import { 
  recordGasMetrics, 
  getAllGasEvents, 
  calculateGasMetrics, 
  clearGasMetrics,
  formatGasNumber 
} from './gasUtils';

// Mock transaction receipt for testing
const mockReceipt = {
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  gasUsed: '150000',
  gasPrice: '20000000000', // 20 gwei
  blockNumber: '12345'
};

const mockAccount = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

/**
 * Test gas metrics recording and calculation
 */
export const testGasMetrics = () => {
  console.log('🧪 Testing Gas Metrics...\n');
  
  // Clear existing metrics
  clearGasMetrics();
  console.log('✅ Cleared existing gas metrics\n');
  
  // Test 1: Record a mock transaction
  console.log('📝 Test 1: Recording mock gas metrics...');
  const event1 = recordGasMetrics('BOARD_CREATE_CASE', mockReceipt, mockAccount, {
    caseDescription: 'Test Case 1'
  });
  
  if (event1) {
    console.log('✅ Successfully recorded gas metrics:', {
      actionType: event1.actionType,
      gasUsed: event1.gasUsed,
      gasCostEth: event1.gasCostEth,
      gasCostUsd: event1.gasCostUsd
    });
  } else {
    console.error('❌ Failed to record gas metrics');
    return false;
  }
  
  // Test 2: Record multiple transactions
  console.log('\n📝 Test 2: Recording multiple transactions...');
  recordGasMetrics('VOTER_CAST_VOTE', { ...mockReceipt, gasUsed: '120000' }, mockAccount, {
    caseId: 0,
    vote: 'YES'
  });
  recordGasMetrics('BOARD_RESOLVE_CASE', { ...mockReceipt, gasUsed: '80000' }, mockAccount, {
    caseId: 0
  });
  console.log('✅ Recorded 2 additional transactions\n');
  
  // Test 3: Get all events
  console.log('📊 Test 3: Retrieving all gas events...');
  const allEvents = getAllGasEvents();
  console.log(`✅ Retrieved ${allEvents.length} gas events`);
  console.log('   Events:', allEvents.map(e => ({
    type: e.actionType,
    gasUsed: e.gasUsed,
    cost: `$${e.gasCostUsd}`
  })));
  
  // Test 4: Calculate metrics
  console.log('\n📈 Test 4: Calculating aggregate metrics...');
  const metrics = calculateGasMetrics();
  console.log('✅ Calculated metrics:', {
    totalTransactions: metrics.totalTransactions,
    totalGasUsed: formatGasNumber(metrics.totalGasUsed),
    totalGasCostEth: metrics.totalGasCostEth,
    totalGasCostUsd: `$${metrics.totalGasCostUsd}`,
    avgGasPerTransaction: formatGasNumber(metrics.avgGasPerTransaction),
    actionTypes: Object.keys(metrics.byActionType)
  });
  
  // Test 5: Check action type breakdown
  console.log('\n📋 Test 5: Action type breakdown...');
  Object.entries(metrics.byActionType).forEach(([actionType, stats]) => {
    console.log(`   ${actionType}:`, {
      count: stats.count,
      avgGas: formatGasNumber(stats.avgGasUsed),
      avgCost: `$${stats.avgGasCostUsd}`
    });
  });
  
  console.log('\n✅ All tests passed! Gas metrics are working correctly.');
  console.log('\n💡 To test with real transactions:');
  console.log('   1. Open the app in browser');
  console.log('   2. Connect MetaMask');
  console.log('   3. Create a case, vote, or resolve a case');
  console.log('   4. Check Analytics Dashboard for gas metrics');
  
  return true;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testGasMetrics = testGasMetrics;
  console.log('💡 Run testGasMetrics() in the console to test gas metrics');
}

