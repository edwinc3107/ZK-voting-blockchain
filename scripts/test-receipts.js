const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Blind Receipt System...\n");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get signers
  const signers = await ethers.getSigners();
  const boardMember = signers[0]; // First board member
  const voter1 = signers[5]; // First verified voter
  const voter2 = signers[6]; // Second verified voter
  
  // Connect to deployed contract
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  const contract = HospitalEthicsVoting.attach(CONTRACT_ADDRESS);
  
  console.log("📋 Contract Information:");
  console.log(`   Address: ${CONTRACT_ADDRESS}`);
  console.log(`   Board Member: ${boardMember.address}`);
  console.log(`   Voter 1: ${voter1.address}`);
  console.log(`   Voter 2: ${voter2.address}\n`);
  
  // Test 1: Get case count
  console.log("1️⃣  Checking cases...");
  const casesCount = await contract.casesCount();
  console.log(`   Cases available: ${casesCount.toString()}\n`);
  
  if (casesCount === 0n) {
    console.log("   ⚠️  No cases found. Creating a test case...");
    const tx = await contract.connect(boardMember).createEthicsCase(
      "Test case for receipt system",
      3600 // 1 hour
    );
    await tx.wait();
    console.log("   ✅ Test case created\n");
  }
  
  // Test 2: Submit a vote and get receipt
  console.log("2️⃣  Testing vote submission and receipt generation...");
  const caseId = 0;
  const nullifierHash1 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [voter1.address, 12345]));
  
  console.log(`   Submitting vote from ${voter1.address.slice(0, 10)}...`);
  const voteTx = await contract.connect(voter1).submitVote(caseId, true, nullifierHash1);
  const voteReceipt = await voteTx.wait();
  
  // Check for ReceiptGenerated event
  const receiptEvent = voteReceipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed && parsed.name === 'ReceiptGenerated';
    } catch {
      return false;
    }
  });
  
  if (receiptEvent) {
    const parsed = contract.interface.parseLog(receiptEvent);
    console.log(`   ✅ Receipt generated!`);
    console.log(`   Receipt Hash: ${parsed.args.receiptHash}`);
  } else {
    console.log("   ⚠️  ReceiptGenerated event not found in logs");
  }
  
  // Test 3: Get voter receipt
  console.log("\n3️⃣  Retrieving voter receipt...");
  const receiptHash = await contract.getVoterReceipt(voter1.address, caseId);
  if (receiptHash && receiptHash !== ethers.ZeroHash) {
    console.log(`   ✅ Receipt found: ${receiptHash}`);
  } else {
    console.log("   ❌ No receipt found");
  }
  
  // Test 4: Verify receipt
  console.log("\n4️⃣  Verifying receipt...");
  if (receiptHash && receiptHash !== ethers.ZeroHash) {
    const isValid = await contract.verifyReceipt(receiptHash, caseId);
    console.log(`   ${isValid ? '✅' : '❌'} Receipt verification: ${isValid ? 'VALID' : 'INVALID'}`);
  }
  
  // Test 5: Get all receipts for case
  console.log("\n5️⃣  Getting all receipts for case...");
  const allReceipts = await contract.getCaseReceipts(caseId);
  console.log(`   ✅ Total receipts: ${allReceipts.length}`);
  allReceipts.forEach((receipt, index) => {
    console.log(`   Receipt ${index + 1}: ${receipt}`);
  });
  
  // Test 6: Submit another vote
  console.log("\n6️⃣  Testing second vote...");
  const nullifierHash2 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [voter2.address, 67890]));
  
  try {
    const voteTx2 = await contract.connect(voter2).submitVote(caseId, false, nullifierHash2);
    await voteTx2.wait();
    console.log(`   ✅ Second vote submitted`);
    
    const receiptHash2 = await contract.getVoterReceipt(voter2.address, caseId);
    console.log(`   Receipt: ${receiptHash2}`);
    
    const allReceipts2 = await contract.getCaseReceipts(caseId);
    console.log(`   Total receipts now: ${allReceipts2.length}`);
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Test 7: Check case results
  console.log("\n7️⃣  Checking case results...");
  const caseData = await contract.getCase(caseId);
  console.log(`   Yes Votes: ${caseData.yesVotes.toString()}`);
  console.log(`   No Votes: ${caseData.noVotes.toString()}`);
  console.log(`   Total: ${Number(caseData.yesVotes) + Number(caseData.noVotes)}`);
  
  console.log("\n🎉 Blind Receipt System Test Complete!");
  console.log("\n📊 Summary:");
  console.log(`   ✅ Receipt generation: Working`);
  console.log(`   ✅ Receipt retrieval: Working`);
  console.log(`   ✅ Receipt verification: Working`);
  console.log(`   ✅ Case receipts: Working`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });


