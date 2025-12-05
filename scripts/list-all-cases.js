const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("📋 Listing All Cases...\n");
  
  const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
  const contract = HospitalEthicsVoting.attach(CONTRACT_ADDRESS);
  
  const casesCount = await contract.casesCount();
  console.log(`Total Cases: ${casesCount.toString()}\n`);
  
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = 0; i < casesCount; i++) {
    try {
      const caseData = await contract.getCase(i);
      const deadline = Number(caseData.deadline);
      const isActive = deadline > now && caseData.isActive;
      const createdAt = Number(caseData.createdAt);
      
      const daysUntilDeadline = Math.floor((deadline - now) / 86400);
      const hoursUntilDeadline = Math.floor(((deadline - now) % 86400) / 3600);
      
      console.log(`Case #${i}:`);
      console.log(`  Description: ${caseData.description}`);
      console.log(`  Status: ${isActive ? '🟢 ACTIVE' : '🔴 CLOSED'}`);
      console.log(`  Yes Votes: ${caseData.yesVotes.toString()}`);
      console.log(`  No Votes: ${caseData.noVotes.toString()}`);
      console.log(`  Created: ${new Date(createdAt * 1000).toLocaleString()}`);
      console.log(`  Deadline: ${new Date(deadline * 1000).toLocaleString()}`);
      if (isActive) {
        console.log(`  Time Remaining: ${daysUntilDeadline}d ${hoursUntilDeadline}h`);
      }
      console.log('');
    } catch (error) {
      console.error(`Error loading case ${i}:`, error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });



