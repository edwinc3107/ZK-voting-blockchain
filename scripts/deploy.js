const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract..");
  
  // Get the contract factory
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // Deploy the contract
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  
  const contractAddress = await voting.getAddress();
  console.log("Voting contract deployed to:", contractAddress);
  
  // Set up the voting system
  console.log("Setting up voting system...");
  
  // Add candidates
  await voting.addCandidate("Candidate 1");
  await voting.addCandidate("Candidate 2");
  console.log("Added candidates: Candidate 1 and Candidate 2");
  
  // Register some test voters
  const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
  
  await voting.registerVoter(voter1.address);
  await voting.registerVoter(voter2.address);
  await voting.registerVoter(voter3.address);
  console.log("Registered test voters");
  
  // Start voting
  await voting.startVoting();
  console.log("Voting started!");
  
  console.log("\n Contract is ready for testing!");
  console.log("Contract Address:", contractAddress);
  console.log("Owner:", owner.address);
  console.log("Test Voters:");
  console.log("  - Voter 1:", voter1.address);
  console.log("  - Voter 2:", voter2.address);
  console.log("  - Voter 3:", voter3.address);
  
  // Save contract address for frontend
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    network: "hardhat",
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('./contract-address.json', JSON.stringify(contractInfo, null, 2));
  console.log("Contract info saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
