# Blind Receipt System - Integration Guide

## Overview
The Blind Receipt System has been implemented in both the smart contract and frontend. This guide shows how to integrate it into your existing components.

## Smart Contract Changes

### New Functions Added to `HospitalEthicsVoting.sol`:

1. **`getVoterReceipt(address voter, uint256 caseId)`** - Returns the receipt hash for a voter's vote
2. **`verifyReceipt(bytes32 receiptHash, uint256 caseId)`** - Verifies if a receipt is valid for a case
3. **`getCaseReceipts(uint256 caseId)`** - Returns all receipt hashes for a case
4. **`isReceiptValid(bytes32 receiptHash)`** - Checks if a receipt hash exists

### New Event:
- **`ReceiptGenerated(address indexed voter, uint256 indexed caseId, bytes32 receiptHash)`** - Emitted when a vote is submitted

## Frontend Components Created

### 1. `ReceiptDisplay.jsx`
Displays a receipt after voting with copy and save functionality.

**Usage:**
```jsx
import ReceiptDisplay from './components/ReceiptDisplay';

<ReceiptDisplay 
  receiptHash={receiptHash}
  caseId={caseId}
  onSave={(hash, id) => saveReceipt(hash, id, account)}
/>
```

### 2. `ReceiptVerification.jsx`
Allows users to verify receipts and view all receipts for a case.

**Usage:**
```jsx
import ReceiptVerification from './components/ReceiptVerification';

<ReceiptVerification 
  contract={contract}
  caseId={caseId}
/>
```

## Integration Steps

### Step 1: Update Voting Interface

In your voting component, after a successful vote:

```jsx
import ReceiptDisplay from './components/ReceiptDisplay';
import { getVoterReceipt, saveReceipt } from './utils/receiptUtils';

// After vote submission
const handleVote = async (caseId, vote) => {
  // ... existing vote submission code ...
  
  // Get the receipt from the blockchain
  const receiptHash = await getVoterReceipt(contract, account, caseId);
  
  // Show receipt display
  setShowReceipt(true);
  setReceiptHash(receiptHash);
  
  // Auto-save receipt
  saveReceipt(receiptHash, caseId, account);
};
```

### Step 2: Update Results Page

Add receipt display to results:

```jsx
import { getCaseReceiptsFromChain } from './utils/receiptUtils';

// Load receipts for a case
const loadReceipts = async (caseId) => {
  const receipts = await getCaseReceiptsFromChain(contract, caseId);
  setCaseReceipts(receipts);
};

// Display receipts
<div className="receipts-section">
  <h4>Included Receipts ({caseReceipts.length})</h4>
  {caseReceipts.map((receipt, index) => (
    <div key={index} className="receipt-item">
      ✓ {formatReceiptHash(receipt)}
    </div>
  ))}
</div>
```

### Step 3: Add Receipt Verification Page

Add a new route/page for receipt verification:

```jsx
import ReceiptVerification from './components/ReceiptVerification';

// In your router or main component
<Route path="/verify-receipt" element={
  <ReceiptVerification contract={contract} caseId={selectedCaseId} />
} />
```

## Event Listening

Listen for `ReceiptGenerated` events:

```jsx
useEffect(() => {
  if (!contract) return;
  
  const filter = contract.filters.ReceiptGenerated();
  
  contract.on(filter, (voter, caseId, receiptHash, event) => {
    console.log('Receipt generated:', {
      voter,
      caseId: caseId.toString(),
      receiptHash,
      txHash: event.transactionHash
    });
    
    // Update UI or show notification
  });
  
  return () => {
    contract.removeAllListeners(filter);
  };
}, [contract]);
```

## Testing

### Test Receipt Generation:
1. Submit a vote
2. Check that `ReceiptGenerated` event is emitted
3. Verify receipt hash is returned from `getVoterReceipt`

### Test Receipt Verification:
1. Get a receipt hash
2. Call `verifyReceipt(receiptHash, caseId)`
3. Should return `true` for valid receipts

### Test Receipt Storage:
1. Save a receipt using `saveReceipt()`
2. Load receipts using `getSavedReceipts()`
3. Verify receipt is in localStorage

## Example Complete Flow

```jsx
// 1. User votes
const tx = await contract.submitVote(caseId, vote, nullifierHash);
await tx.wait();

// 2. Get receipt
const receiptHash = await contract.getVoterReceipt(account, caseId);

// 3. Display receipt
<ReceiptDisplay receiptHash={receiptHash} caseId={caseId} />

// 4. Save receipt locally
saveReceipt(receiptHash, caseId, account);

// 5. Later, verify receipt
const isValid = await contract.verifyReceipt(receiptHash, caseId);
```

## Notes

- Receipts are generated automatically when votes are submitted
- Receipts are unique per vote (includes vote, caseId, voter, timestamp, nullifier)
- Receipts don't reveal vote choice or identity
- All receipts for a case can be viewed publicly for transparency
- Users can verify their receipt is included in the final tally

