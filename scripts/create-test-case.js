const { ethers } = require("hardhat");

// Contract address - update this if your contract is deployed to a different address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("Creating a temporary test case for voting demonstration...\n");
  
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
    console.log("   Please use a board member account to create cases.");
    process.exit(1);
  }
  
  console.log(`✅ Using board member: ${boardMember.address}`);
  
  // Create a test case with 7 days voting period
  const testCaseDescription = "Temporary test case: Should we approve telemedicine consultation for remote patient monitoring?";
  const votingPeriod = 7 * 24 * 3600; // 7 days in seconds
  
  console.log("\n📝 Creating test case...");
  console.log(`   Description: ${testCaseDescription}`);
  console.log(`   Voting Period: 7 days`);
  
  try {
    const tx = await contract.connect(boardMember).createEthicsCase(
      testCaseDescription,
      votingPeriod
    );
    
    console.log("\n⏳ Transaction sent, waiting for confirmation...");
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
      console.log(`\n✅ Test case created successfully!`);
      console.log(`   Case ID: ${caseId.toString()}`);
      console.log(`   Transaction Hash: ${receipt.hash}`);
      console.log(`\n🎯 You can now vote on this case from the Voting Interface!`);
      console.log(`   The case will be active for 7 days.`);
    } else {
      console.log(`\n✅ Test case created successfully!`);
      console.log(`   Transaction Hash: ${receipt.hash}`);
      console.log(`\n🎯 You can now vote on this case from the Voting Interface!`);
    }
    
  } catch (error) {
    console.error("\n❌ Error creating test case:", error.message);
    if (error.reason) {
      console.error(`   Reason: ${error.reason}`);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });



