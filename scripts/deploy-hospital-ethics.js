const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Hospital Ethics Voting Contract...");
  
  // Get the contract factory
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  
  // Define 5 board members (using Hardhat accounts)
  const [owner, boardMember1, boardMember2, boardMember3, boardMember4, boardMember5] = await ethers.getSigners();
  
  const boardMembers = [
    boardMember1.address,
    boardMember2.address,
    boardMember3.address,
    boardMember4.address,
    boardMember5.address
  ];
  
  console.log("Board Members:");
  boardMembers.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member}`);
  });
  
  // Deploy the contract
  const ethicsVoting = await HospitalEthicsVoting.deploy(boardMembers);
  await ethicsVoting.waitForDeployment();
  
  const contractAddress = await ethicsVoting.getAddress();
  console.log(`\nHospital Ethics Voting contract deployed to: ${contractAddress}`);
  
  // Verify some voters (using additional accounts)
  const [voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();
  const additionalVoters = [voter1.address, voter2.address, voter3.address, voter4.address, voter5.address];
  
  console.log("\nVerifying voters...");
  for (const voter of additionalVoters) {
    const tx = await ethicsVoting.connect(boardMember1).verifyVoter(voter);
    await tx.wait();
    console.log(`✅ Verified voter: ${voter}`);
  }
  
  // Create a sample ethics case
  console.log("\nCreating sample ethics case...");
  const sampleCaseTx = await ethicsVoting.connect(boardMember1).createEthicsCase(
    "Should we approve experimental treatment for Patient X (45-year-old male with terminal cancer)?",
    7 * 24 * 3600 // 7 days voting period
  );
  await sampleCaseTx.wait();
  console.log("✅ Created sample ethics case");
  
  // Create another sample case
  const sampleCase2Tx = await ethicsVoting.connect(boardMember2).createEthicsCase(
    "Should we allow family to make end-of-life decisions for Patient Y?",
    5 * 24 * 3600 // 5 days voting period
  );
  await sampleCase2Tx.wait();
  console.log("✅ Created second sample ethics case");
  
  // Save contract info
  const contractInfo = {
    contractAddress: contractAddress,
    boardMembers: boardMembers,
    verifiedVoters: additionalVoters,
    sampleCases: [
      "Should we approve experimental treatment for Patient X (45-year-old male with terminal cancer)?",
      "Should we allow family to make end-of-life decisions for Patient Y?"
    ]
  };
  
  const fs = require('fs');
  fs.writeFileSync('hospital-ethics-address.json', JSON.stringify(contractInfo, null, 2));
  
  console.log("\n🎉 Hospital Ethics Voting System Setup Complete!");
  console.log("\nContract Information:");
  console.log(`  Address: ${contractAddress}`);
  console.log(`  Board Members: ${boardMembers.length}`);
  console.log(`  Verified Voters: ${additionalVoters.length}`);
  console.log(`  Sample Cases: 2`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Update the contract address in frontend/src/utils/useContract.js");
  console.log("2. Start the frontend with: cd frontend && npm start");
  console.log("3. Connect MetaMask and test the voting system");
  
  console.log("\n🔗 Frontend URL: http://localhost:3000");
  console.log("📊 Contract deployed and ready for testing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

