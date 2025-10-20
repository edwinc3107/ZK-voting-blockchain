const hre = require("hardhat");

async function main() {
  console.log("Testing Voting Contract Interaction...");
  
  // Get the contract - try to use saved address, fallback to fresh deployment
  let voting;
  let contractAddress;
  
  try {
    // Try to use the saved contract address
    contractAddress = require('../contract-address.json').address;
    const Voting = await hre.ethers.getContractFactory("Voting");
    voting = Voting.attach(contractAddress);
    
    // Test if contract exists by calling a simple function
    await voting.votingActive();
    console.log("Connected to existing contract:", contractAddress);
  } catch (error) {
    console.log("Could not connect to saved contract, deploying fresh instance...");
    
    // Deploy fresh contract
    const Voting = await hre.ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    contractAddress = await voting.getAddress();
    console.log("Fresh contract deployed to:", contractAddress);
    
    // Set up the voting system
    console.log("Setting up voting system...");
    
    // Add candidates
    await voting.addCandidate("Edwin");
    await voting.addCandidate("Adrian");
    console.log("Added candidates: Edwin and Adrian");
    
    // Register some test voters
    const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
    
    await voting.registerVoter(voter1.address);
    await voting.registerVoter(voter2.address);
    await voting.registerVoter(voter3.address);
    console.log("Registered test voters");
    
    // Start voting
    await voting.startVoting();
    console.log("Voting started!");
  }

  
  // Get signers
  const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
  
  console.log("\nCurrent voting status:");
  console.log("Voting Active:", await voting.votingActive());
  console.log("Total Votes:", await voting.totalVotes());
  console.log("Candidates Count:", await voting.candidatesCount());
  
  // Get all results
  const [names, counts] = await voting.getAllResults();
  console.log("\n Current Results:");
  for (let i = 0; i < names.length; i++) {
    console.log(`${names[i]}: ${counts[i]} votes`);
  }
  
  // Test voting
  console.log("\nTesting voting..");
  
  // Check voter status
  console.log("Voter 1 registered:", await voting.isRegisteredVoter(voter1.address));
  console.log("Voter 1 has voted:", await voting.hasVoted(voter1.address));
  
  if (!(await voting.hasVoted(voter1.address))) {
    console.log("Voter 1 voting for Edwin(candidate 0)...");
    await voting.connect(voter1).vote(0);
    console.log("Vote cast!");
  } else {
    console.log("Voter 1 has already voted");
  }
  
  if (!(await voting.hasVoted(voter2.address))) {
    console.log("Voter 2 voting for Adrian(candidate 1)...");
    await voting.connect(voter2).vote(1);
    console.log("Vote cast!");
  } else {
    console.log("Voter 2 has already voted");
  }
  
  // Get updated results
  const [updatedNames, updatedCounts] = await voting.getAllResults();
  console.log("\nUpdated Results:");
  for (let i = 0; i < updatedNames.length; i++) {
    console.log(`${updatedNames[i]}: ${updatedCounts[i]} votes`);
  }
  
  console.log("\n Interaction test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Interaction failed:", error);
    process.exit(1);
  });
