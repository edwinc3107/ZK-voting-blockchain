const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Hospital Ethics Voting Contract...");
  
  // Get signers
  const signers = await ethers.getSigners();
  
  // We need exactly 5 board members
  if (signers.length < 5) {
    console.error("❌ Error: Need at least 5 signers for board members");
    console.log(`   Available signers: ${signers.length}`);
    process.exit(1);
  }
  
  // Get the contract factory
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  
  // Define 5 board members (using first 5 signers)
  const boardMembers = [
    signers[0].address,
    signers[1].address,
    signers[2].address,
    signers[3].address,
    signers[4].address
  ];
  
  console.log("\n📋 Board Members:");
  boardMembers.forEach((member, index) => {
    console.log(`   ${index + 1}. ${member}`);
  });
  
  // Deploy the contract
  console.log("\n🚀 Deploying contract...");
  const ethicsVoting = await HospitalEthicsVoting.deploy(boardMembers);
  await ethicsVoting.waitForDeployment();
  
  const contractAddress = await ethicsVoting.getAddress();
  console.log(`\n✅ Hospital Ethics Voting contract deployed to: ${contractAddress}`);
  
  // Verify 1 voter - use signer 5 (Verified Voter)
  const verifiedVoters = [];
  if (signers.length >= 6) {
    verifiedVoters.push(signers[5].address); // 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
  } else {
    console.log('⚠️ Not enough signers. Need at least 6 signers.');
  }
  
  console.log("\n👥 Verifying voters...");
  const boardMemberSigner = signers[0]; // Use first board member to verify
  
  for (const voter of verifiedVoters) {
    try {
      const tx = await ethicsVoting.connect(boardMemberSigner).verifyVoter(voter);
      await tx.wait();
      console.log(`   ✅ Verified voter: ${voter}`);
    } catch (error) {
      console.log(`   ⚠️  Could not verify ${voter}: ${error.message}`);
    }
  }
  
  // Create sample ethics cases
  console.log("\n📝 Creating sample ethics cases...");
  
  try {
    const sampleCase1Tx = await ethicsVoting.connect(boardMemberSigner).createEthicsCase(
      "Should we approve experimental treatment for Patient X (45-year-old male with terminal cancer)?",
      7 * 24 * 3600 // 7 days voting period
    );
    await sampleCase1Tx.wait();
    console.log("   ✅ Created sample ethics case #1");
  } catch (error) {
    console.log(`   ⚠️  Could not create case 1: ${error.message}`);
  }
  
  try {
    const sampleCase2Tx = await ethicsVoting.connect(boardMemberSigner).createEthicsCase(
      "Should we allow family to make end-of-life decisions for Patient Y?",
      5 * 24 * 3600 // 5 days voting period
    );
    await sampleCase2Tx.wait();
    console.log("   ✅ Created sample ethics case #2");
  } catch (error) {
    console.log(`   ⚠️  Could not create case 2: ${error.message}`);
  }
  
  // Save contract info
  const contractInfo = {
    contractAddress: contractAddress,
    boardMembers: boardMembers,
    verifiedVoters: verifiedVoters,
    sampleCases: [
      "Should we approve experimental treatment for Patient X (45-year-old male with terminal cancer)?",
      "Should we allow family to make end-of-life decisions for Patient Y?"
    ],
    network: "localhost",
    deployedAt: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync('hospital-ethics-address.json', JSON.stringify(contractInfo, null, 2));
  
  console.log("\n🎉 Hospital Ethics Voting System Setup Complete!");
  console.log("\n📊 Contract Information:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Board Members: ${boardMembers.length}`);
  console.log(`   Verified Voters: ${verifiedVoters.length}`);
  console.log(`   Sample Cases: 2`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Update the contract address in hospital-zk/src/utils/useContract.js");
  console.log("2. Start the frontend with: cd hospital-zk && npm run dev");
  console.log("3. Connect MetaMask and test the voting system");
  console.log("4. Test the blind receipt system by voting on a case");
  
  console.log("\n🔗 Frontend URL: http://localhost:5173 (or check Vite output)");
  console.log("📊 Contract deployed and ready for testing with Blind Receipt System!");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

