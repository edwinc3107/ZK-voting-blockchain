const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Hospital Ethics Voting Contract...");
  
  // Get the contract factory
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  
  // Define 1 board member (simplified configuration)
  const boardMembers = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  // Dr. Sarah Chen
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
  
  // Verify voters (simplified configuration)
  const verifiedVoters = [
    "0xbda5747bfd65f08deb54cb465eb87d40e51b197e", // My Account
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Dr. Sarah Chen (also board member)
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  // Dr. Michael Rodriguez
  ];
  
  console.log("\nVerifying voters...");
  // Get a board member signer to verify voters
  const boardMemberSigner = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  
  for (const voter of verifiedVoters) {
    const tx = await ethicsVoting.connect(boardMemberSigner).verifyVoter(voter);
    await tx.wait();
    console.log(`✅ Verified voter: ${voter}`);
  }
  
  // Create a sample ethics case
  console.log("\nCreating sample ethics case...");
  const sampleCaseTx = await ethicsVoting.connect(boardMemberSigner).createEthicsCase(
    "Should we approve experimental treatment for Patient X (45-year-old male with terminal cancer)?",
    7 * 24 * 3600 // 7 days voting period
  );
  await sampleCaseTx.wait();
  console.log("✅ Created sample ethics case");
  
  // Create another sample case using the same board member
  const sampleCase2Tx = await ethicsVoting.connect(boardMemberSigner).createEthicsCase(
    "Should we allow family to make end-of-life decisions for Patient Y?",
    5 * 24 * 3600 // 5 days voting period
  );
  await sampleCase2Tx.wait();
  console.log("✅ Created second sample ethics case");
  
  // Save contract info
  const contractInfo = {
    contractAddress: contractAddress,
    boardMembers: boardMembers,
    verifiedVoters: verifiedVoters,
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
  console.log(`  Verified Voters: ${verifiedVoters.length}`);
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

