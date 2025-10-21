# Hospital Ethics Voting System - Demo Script

## Overview
This demo showcases a complete hospital ethics voting system using blockchain technology with privacy-preserving features (ZK proofs simulation).

## Demo Flow

### 1. **Setup Phase**
- Open the application
- Click "📖 Demo Guide" to understand the workflow
- Use "🎭 Demo Mode" to switch between different roles

### 2. **Board Member Phase** 
**Role:** Board Member 1 (0x1234...7890)

1. **Navigate to Board Interface**
   - Click "Board Interface" tab
   - Verify you see "Board Member Dashboard"

2. **Create Ethics Case**
   - Fill in case description: "Should we allow experimental treatment for terminal patients?"
   - Set voting duration: 7 days
   - Click "Create Ethics Case"
   - **Watch:** Transaction appears in bottom-right recorder
   - **Console:** Shows case creation details

3. **Verify Case Creation**
   - Case appears in "Ethics Cases Management" section
   - Status shows "🟢 Active"
   - Vote counts show 0 Yes, 0 No

### 3. **Voter Phase**
**Role:** Doctor Smith (0x3456...9012)

1. **Switch to Voting Interface**
   - Use Demo Mode to switch to "Doctor Smith"
   - Click "Voting Interface" tab
   - Verify you see "Verified Voter" status

2. **Cast Vote**
   - Find the case you just created
   - Click "Vote YES" or "Vote NO"
   - **Watch:** Transaction recorder shows vote submission
   - **Console:** Shows ZK proof generation details
   - Vote count updates immediately

3. **Try Multiple Voters**
   - Switch to "Nurse Johnson" (0x4567...0123)
   - Cast another vote
   - Switch to "Staff Member" (0x5678...1234)
   - Cast a third vote
   - **Watch:** All transactions recorded in real-time

### 4. **Resolution Phase**
**Role:** Board Member 2 (0x2345...8901)

1. **Switch Back to Board Member**
   - Use Demo Mode to switch to "Board Member 2"
   - Go to Board Interface

2. **Resolve Case**
   - Find the case with votes
   - Click "Resolve Case" (only available after deadline or manually)
   - **Watch:** Transaction recorder shows resolution
   - **Console:** Shows final vote counts and decision

### 5. **Results Phase**
1. **View Results**
   - Click "Results" tab
   - See all cases with their final outcomes
   - View vote breakdown and timestamps

## Key Features Demonstrated

### 🔐 **Privacy & Security**
- **ZK Proof Simulation:** Each vote generates a nullifier hash
- **Private Voting:** Voter identity is not revealed in votes
- **Verifiable:** All votes can be verified without revealing who voted

### 📊 **Transparency**
- **Real-time Updates:** All blockchain transactions shown live
- **Vote Tracking:** See exact vote counts and timing
- **Audit Trail:** Complete history of all actions

### 👥 **Role-Based Access**
- **Board Members:** Can create cases and resolve them
- **Verified Voters:** Can vote on active cases
- **Access Control:** Smart contract enforces permissions

### 🎭 **Demo Features**
- **Role Switching:** Easy switching between different user types
- **Transaction Recording:** Visual feedback for all blockchain interactions
- **Workflow Guide:** Step-by-step instructions for demo

## Technical Highlights

### Smart Contract Features
- **Consensus Mechanism:** Board decisions require consensus
- **Voting Deadlines:** Time-limited voting periods
- **Nullifier System:** Prevents double voting
- **Event Logging:** All actions emit blockchain events

### Frontend Features
- **Real-time Updates:** Live transaction monitoring
- **Role Detection:** Automatic role identification
- **Responsive Design:** Works on all devices
- **Error Handling:** Graceful error management

## Demo Tips

1. **Start with Demo Guide:** Always show the workflow guide first
2. **Explain ZK Proofs:** Highlight the privacy-preserving nature
3. **Show Transactions:** Point out the real-time transaction recorder
4. **Multiple Roles:** Demonstrate switching between different user types
5. **Real Blockchain:** Emphasize that these are real smart contract calls

## Expected Outcomes

After completing the demo, participants should understand:
- How blockchain can ensure transparent yet private voting
- The role of smart contracts in governance
- The importance of verifiable but anonymous participation
- How ZK proofs can protect voter privacy
- The complete workflow from case creation to resolution

## Troubleshooting

- **If transactions fail:** Check MetaMask connection
- **If roles don't work:** Ensure you're using demo mode addresses
- **If UI doesn't update:** Refresh the page and reconnect
- **If contract errors:** Verify the contract is deployed correctly

---

**Ready to demo?** Start with the Demo Guide and follow the workflow step by step!
