# Quick Start - Blind Receipt System Testing

## Step 1: Compile and Deploy

```bash
# Compile contracts
npm run compile

# Start local blockchain
npx hardhat node

# In another terminal, deploy contract
npx hardhat run scripts/deploy-hospital-ethics.js --network localhost
```

## Step 2: Update Frontend Contract Address

Update `hospital-zk/src/utils/useContract.js`:
```javascript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

## Step 3: Start Frontend

```bash
cd hospital-zk
npm run dev
```

## Step 4: Test Receipt Flow

1. **Connect Wallet** - Use MetaMask with localhost network
2. **As Board Member:**
   - Create an ethics case
3. **As Verified Voter:**
   - Vote on the case
   - **Receipt should appear automatically**
   - Click "Save Receipt"
4. **Check Receipts:**
   - Go to "My Receipts" tab
   - See your saved receipt
   - Click "Verify" to check on-chain
5. **View Results:**
   - Go to "Results" tab
   - See all receipts for the case
   - Click "Verify Receipt" to verify any receipt

## Step 5: Run Automated Tests

```bash
npm test test/blindReceiptTest.js
```

## Expected Results

✅ Receipt appears after voting
✅ Receipt is saved to localStorage
✅ Receipt appears in "My Receipts"
✅ Receipt verification works
✅ All receipts visible in Results page

---

## Troubleshooting

**Receipt not appearing?**
- Check browser console for errors
- Verify contract is deployed
- Check contract address is correct
- Ensure vote transaction succeeded

**Verification fails?**
- Check receipt hash is correct
- Verify case ID matches
- Ensure contract is connected

**Receipts not saving?**
- Check browser localStorage
- Check console for errors
- Verify account is connected

