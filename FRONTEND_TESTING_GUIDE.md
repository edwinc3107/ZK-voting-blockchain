# Frontend Testing Guide - Blind Receipt System

## ✅ Contract Deployed Successfully!

**Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`  
**Frontend URL:** `http://localhost:5173`  
**Network:** Localhost (Hardhat)

---

## 🧪 Step-by-Step Testing Guide

### Step 1: Verify Contract Address in Frontend

Check that `hospital-zk/src/utils/useContract.js` has the correct address:
```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

### Step 2: Connect MetaMask

1. Open `http://localhost:5173` in your browser
2. Click "Connect Wallet"
3. Select an account from MetaMask
4. Make sure you're on the **localhost network** (chain ID: 1337)

### Step 3: Test as Board Member

**Use this account:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (First board member)

1. **Verify you're a board member:**
   - Should see "Board Interface" tab
   - Should see "👥 Board Member" badge

2. **View existing cases:**
   - Go to "Board Interface"
   - You should see 2 sample cases already created

3. **Create a new case (optional):**
   - Fill in case description
   - Set voting duration
   - Click "Create Ethics Case"
   - Watch transaction in Live Transactions panel

### Step 4: Test Voting & Receipt Generation ⭐

**Use one of these verified voter accounts:**
- `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955`

1. **Switch to verified voter account in MetaMask**

2. **Go to Voting Interface:**
   - Should see "Voting Interface" tab
   - Should see "✅ Verified Voter" badge
   - Should see active cases

3. **Submit a vote:**
   - Find an active case
   - Click "Vote YES" or "Vote NO"
   - **Watch for receipt!** 🎯
   - Receipt should appear automatically after vote

4. **Verify receipt display:**
   - ✅ Receipt card appears with hash
   - ✅ "Copy" button works
   - ✅ "Save Receipt" button works
   - ✅ Receipt is saved to localStorage

### Step 5: Test Receipt History

1. **Go to "My Receipts" tab:**
   - Should see your saved receipt
   - Receipt shows case number and timestamp

2. **Verify receipt:**
   - Click "Verify" button
   - Should show "✓ Verified" status
   - Status should be green

3. **View receipt details:**
   - Click "Details" button
   - Should open verification panel

### Step 6: Test Results Page

1. **Go to "Results" tab:**
   - Should see all cases with results
   - Should see progress bars for votes

2. **Check receipts section:**
   - Each case should show "Included Receipts (X)"
   - Should see all receipt hashes
   - Receipts should be clickable/copyable

3. **Test receipt verification:**
   - Click "Verify Receipt →" on any case
   - Enter a receipt hash
   - Click "Verify Receipt"
   - Should show validation status

### Step 7: Test Multiple Votes

1. **Switch to another verified voter**
2. **Vote on the same case**
3. **Check Results page:**
   - Should see 2 receipts now
   - Vote counts should update
   - Progress bars should reflect new votes

---

## ✅ Expected Results

### After Voting:
- ✅ Receipt appears automatically
- ✅ Receipt hash is unique
- ✅ Receipt saves to localStorage
- ✅ Vote count updates immediately

### In Receipt History:
- ✅ All saved receipts visible
- ✅ Receipt verification works
- ✅ Receipt details accessible

### In Results:
- ✅ All receipts displayed
- ✅ Receipt verification works
- ✅ Progress bars accurate

---

## 🐛 Troubleshooting

**Receipt not appearing?**
- Check browser console for errors
- Verify vote transaction succeeded
- Check contract address is correct
- Ensure you're on localhost network

**Verification fails?**
- Check receipt hash is correct
- Verify case ID matches
- Ensure contract is connected

**Can't see cases?**
- Check you're using correct account
- Verify account is board member or verified voter
- Check contract deployment was successful

---

## 📊 Test Checklist

- [ ] Contract deployed successfully
- [ ] Frontend connects to contract
- [ ] Board member can create cases
- [ ] Verified voter can vote
- [ ] Receipt appears after voting
- [ ] Receipt saves to localStorage
- [ ] Receipt appears in "My Receipts"
- [ ] Receipt verification works
- [ ] All receipts visible in Results
- [ ] Multiple votes generate multiple receipts
- [ ] Receipts are unique per vote

---

## 🎉 Success Criteria

✅ **Receipt Generation:** Every vote generates a unique receipt  
✅ **Receipt Display:** Receipt appears immediately after voting  
✅ **Receipt Storage:** Receipts saved to localStorage  
✅ **Receipt History:** All receipts accessible in "My Receipts"  
✅ **Receipt Verification:** On-chain verification works  
✅ **Transparency:** All receipts visible in Results page  

**If all checkboxes pass → Blind Receipt System is working perfectly!** 🎯



