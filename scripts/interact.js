const hre = require("hardhat");

async function main() {
  console.log("Testing Voting Contract Interaction!");
  

  // Get the contract
  const contractAddress = require('../contract-address.json').address;
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = Voting.attach(contractAddress);

  
  // Get signers
  const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
  
  console.log("Current voting status:");
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
  console.log("\n Testing voting...");
  
  // Check voter status
  console.log("Voter 1 registered:", await voting.isRegisteredVoter(voter1.address));
  console.log("Voter 1 has voted:", await voting.hasVoted(voter1.address));
  
  if (!(await voting.hasVoted(voter1.address))) {
    console.log("Voter 1 voting for Alice (candidate 0)...");
    await voting.connect(voter1).vote(0);
    console.log("Vote cast!");
  }
  
  if (!(await voting.hasVoted(voter2.address))) {
    console.log("Voter 2 voting for Bob (candidate 1)...");
    await voting.connect(voter2).vote(1);
    console.log("Vote cast!");
  }
  
  // Get updated results
  const [updatedNames, updatedCounts] = await voting.getAllResults();
  console.log("\n Updated Results:");
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
