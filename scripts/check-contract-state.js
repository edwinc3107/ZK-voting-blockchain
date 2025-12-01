const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Contract State...\n");
  
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get signers
  const signers = await ethers.getSigners();
  console.log("📋 Hardhat Signers:");
  signers.forEach((signer, index) => {
    console.log(`   ${index}. ${signer.address}`);
  });
  
  // Connect to contract
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  let contract;
  
  try {
    contract = HospitalEthicsVoting.attach(CONTRACT_ADDRESS);
    console.log(`\n✅ Connected to contract at: ${CONTRACT_ADDRESS}`);
  } catch (error) {
    console.error("❌ Could not connect to contract:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   1. Hardhat node is running: npx hardhat node");
    console.log("   2. Contract is deployed: npx hardhat run scripts/deploy-hospital-ethics.js --network localhost");
    return;
  }
  
  // Check contract state
  try {
    const casesCount = await contract.casesCount();
    console.log(`\n📊 Contract State:`);
    console.log(`   Cases Count: ${casesCount.toString()}`);
    
    // Check board members
    console.log(`\n👥 Board Members:`);
    const boardMemberAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const isBoardMember = await contract.isBoardMember(boardMemberAddress);
    console.log(`   ${boardMemberAddress}: ${isBoardMember ? '✅ YES' : '❌ NO'}`);
    
    // Check all signers
    console.log(`\n🔍 Checking all signers:`);
    for (let i = 0; i < Math.min(10, signers.length); i++) {
      const addr = signers[i].address;
      const isBM = await contract.isBoardMember(addr);
      const isVoter = await contract.isVoterVerified(addr);
      let role = 'None';
      if (isBM) role = 'Board Member';
      else if (isVoter) role = 'Verified Voter';
      console.log(`   ${i}. ${addr}: ${role}`);
    }
    
    // Check verified voters
    console.log(`\n✅ Verified Voters:`);
    const voterAddress = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
    const isVoter = await contract.isVoterVerified(voterAddress);
    console.log(`   ${voterAddress}: ${isVoter ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error("❌ Error checking contract state:", error.message);
    if (error.code === 'CALL_EXCEPTION' || error.message.includes('missing revert data')) {
      console.log("\n💡 The contract might not be deployed or Hardhat node is not running.");
      console.log("   Run: npx hardhat node (in one terminal)");
      console.log("   Then: npx hardhat run scripts/deploy-hospital-ethics.js --network localhost");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

