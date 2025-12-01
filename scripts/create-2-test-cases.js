const { ethers } = require("hardhat");

// Contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("Creating 2 test cases for voting demonstration...\n");
  
  // Get signers
  const signers = await ethers.getSigners();
  const boardMember = signers[0]; // First signer is a board member
  
  // Get the contract
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  const contract = HospitalEthicsVoting.attach(CONTRACT_ADDRESS);
  
  // Check if the signer is a board member
  const isBoardMember = await contract.isBoardMember(boardMember.address);
  if (!isBoardMember) {
    console.error("❌ Error: Signer is not a board member!");
    console.log(`   Signer address: ${boardMember.address}`);
    process.exit(1);
  }
  
  console.log(`✅ Using board member: ${boardMember.address}\n`);
  
  // Create 2 test cases
  const testCases = [
    {
      description: "Demo Case 1: Should we implement AI-assisted patient monitoring in ICU?",
      votingPeriod: 7 * 24 * 3600 // 7 days
    },
    {
      description: "Demo Case 2: Should we approve experimental gene therapy for rare disease patient?",
      votingPeriod: 5 * 24 * 3600 // 5 days
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 Creating test case ${i + 1}...`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Voting Period: ${testCase.votingPeriod / (24 * 3600)} days`);
    
    try {
      const tx = await contract.connect(boardMember).createEthicsCase(
        testCase.description,
        testCase.votingPeriod
      );
      
      const receipt = await tx.wait();
      
      // Get the case ID from events
      const caseCreatedEvent = receipt.logs.find(
        log => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === "CaseCreated";
          } catch {
            return false;
          }
        }
      );
      
      if (caseCreatedEvent) {
        const parsed = contract.interface.parseLog(caseCreatedEvent);
        const caseId = parsed.args.caseId;
        console.log(`   ✅ Created! Case ID: ${caseId.toString()}`);
      } else {
        console.log(`   ✅ Created! Transaction: ${receipt.hash}`);
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
    }
  }
  
  console.log("🎯 Both test cases are now active and ready for voting!");
  console.log("   Refresh your Voting Interface to see them.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

