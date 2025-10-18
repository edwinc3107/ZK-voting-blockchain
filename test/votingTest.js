const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let voter1, voter2, voter3;
  let nonVoter;

  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    
    // Deploy contract
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    // Set up voting system
    await voting.addCandidate("Alice");
    await voting.addCandidate("Bob");
    
    await voting.registerVoter(voter1.address);
    await voting.registerVoter(voter2.address);
    await voting.registerVoter(voter3.address);
    
    await voting.startVoting();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct values", async function () {
      expect(await voting.candidatesCount()).to.equal(2);
      expect(await voting.totalVotes()).to.equal(0);
      expect(await voting.votingActive()).to.be.true;
      expect(await voting.revealPhase()).to.be.false;
    });
  });

  describe("Voter Registration", function () {
    it("Should allow owner to register voters", async function () {
      await voting.registerVoter(nonVoter.address);
      expect(await voting.isRegisteredVoter(nonVoter.address)).to.be.true;
    });

    it("Should not allow non-owner to register voters", async function () {
      await expect(
        voting.connect(voter1).registerVoter(nonVoter.address)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Should not allow duplicate voter registration", async function () {
      await expect(
        voting.registerVoter(voter1.address)
      ).to.be.revertedWith("Voter already registered");
    });
  });

  describe("Candidate Management", function () {
    it("Should allow owner to add candidates", async function () {
      // Create a new contract instance for this test
      const Voting = await ethers.getContractFactory("Voting");
      const newVoting = await Voting.deploy();
      await newVoting.waitForDeployment();
      
      await newVoting.addCandidate("Alice");
      await newVoting.addCandidate("Bob");
      await newVoting.addCandidate("Charlie");
      expect(await newVoting.candidatesCount()).to.equal(3);
    });

    it("Should not allow non-owner to add candidates", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Charlie")
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Should not allow adding candidates during voting", async function () {
      await expect(
        voting.addCandidate("Charlie")
      ).to.be.revertedWith("Cannot add candidates during voting");
    });
  });

  describe("Basic Voting", function () {
    it("Should allow registered voters to vote", async function () {
      await voting.connect(voter1).vote(0); // Vote for Alice
      expect(await voting.getVoteCount(0)).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("Should not allow non-registered voters to vote", async function () {
      await expect(
        voting.connect(nonVoter).vote(0)
      ).to.be.revertedWith("Voter not registered");
    });

    it("Should not allow double voting", async function () {
      await voting.connect(voter1).vote(0);
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("Voter has already voted");
    });

    it("Should not allow voting for invalid candidate", async function () {
      await expect(
        voting.connect(voter1).vote(5)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Should not allow voting when voting is inactive", async function () {
      await voting.endVoting();
      await expect(
        voting.connect(voter1).vote(0)
      ).to.be.revertedWith("Voting is not active");
    });
  });

  describe("Commit-Reveal Voting", function () {
    it("Should allow voters to commit votes", async function () {
      const salt = "randomSalt123";
      const candidateId = 0;
      const commitment = ethers.keccak256(ethers.solidityPacked(["uint256", "string"], [candidateId, salt]));
      
      await voting.connect(voter1).commitVote(commitment);
      expect(await voting.commitments(voter1.address)).to.equal(commitment);
    });

    it("Should allow voters to reveal votes after voting ends", async function () {
      const salt = "randomSalt123";
      const candidateId = 0;
      const commitment = ethers.keccak256(ethers.solidityPacked(["uint256", "string"], [candidateId, salt]));
      
      // Commit vote
      await voting.connect(voter1).commitVote(commitment);
      
      // End voting to start reveal phase
      await voting.endVoting();
      
      // Reveal vote
      await voting.connect(voter1).revealVote(candidateId, salt);
      expect(await voting.getVoteCount(candidateId)).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("Should not allow revealing votes before reveal phase", async function () {
      const salt = "randomSalt123";
      const candidateId = 0;
      
      await expect(
        voting.connect(voter1).revealVote(candidateId, salt)
      ).to.be.revertedWith("Reveal phase not active");
    });

    it("Should not allow revealing votes without commitment", async function () {
      await voting.endVoting();
      
      await expect(
        voting.connect(voter1).revealVote(0, "salt")
      ).to.be.revertedWith("No commitment found");
    });

    it("Should not allow revealing invalid commitment", async function () {
      const salt = "randomSalt123";
      const candidateId = 0;
      const commitment = ethers.keccak256(ethers.solidityPacked(["uint256", "string"], [candidateId, salt]));
      
      await voting.connect(voter1).commitVote(commitment);
      await voting.endVoting();
      
      await expect(
        voting.connect(voter1).revealVote(1, salt) // Wrong candidate ID
      ).to.be.revertedWith("Invalid commitment");
    });
  });

  describe("Vote Counting", function () {
    it("Should correctly count votes", async function () {
      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(0); // Alice
      await voting.connect(voter3).vote(1); // Bob
      
      expect(await voting.getVoteCount(0)).to.equal(2); // Alice
      expect(await voting.getVoteCount(1)).to.equal(1); // Bob
      expect(await voting.totalVotes()).to.equal(3);
    });

    it("Should return all results correctly", async function () {
      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(1); // Bob
      
      const [names, counts] = await voting.getAllResults();
      expect(names[0]).to.equal("Alice");
      expect(names[1]).to.equal("Bob");
      expect(counts[0]).to.equal(1);
      expect(counts[1]).to.equal(1);
    });
  });

  describe("Voting Phases", function () {
    it("Should start voting correctly", async function () {
      expect(await voting.votingActive()).to.be.true;
    });

    it("Should end voting and start reveal phase", async function () {
      await voting.endVoting();
      expect(await voting.votingActive()).to.be.false;
      expect(await voting.revealPhase()).to.be.true;
    });

    it("Should not allow starting voting with less than 2 candidates", async function () {
      const Voting = await ethers.getContractFactory("Voting");
      const newVoting = await Voting.deploy();
      await newVoting.waitForDeployment();
      
      await expect(
        newVoting.startVoting()
      ).to.be.revertedWith("Need at least 2 candidates");
    });
  });
});
