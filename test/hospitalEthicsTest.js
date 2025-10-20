const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Hospital Ethics Voting System", function () {
  let ethicsVoting;
  let boardMember1, boardMember2, boardMember3, boardMember4, boardMember5;
  let doctor1, doctor2, nurse1, staff1;

  beforeEach(async function () {
    [boardMember1, boardMember2, boardMember3, boardMember4, boardMember5, doctor1, doctor2, nurse1, staff1] = await ethers.getSigners();
    
    // Deploy contract with 5 board members
    const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
    ethicsVoting = await HospitalEthicsVoting.deploy([
      boardMember1.address,
      boardMember2.address,
      boardMember3.address,
      boardMember4.address,
      boardMember5.address
    ]);
    await ethicsVoting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct board members", async function () {
      const boardMembers = await ethicsVoting.getBoardMembers();
      expect(boardMembers).to.include(boardMember1.address);
      expect(boardMembers).to.include(boardMember2.address);
      expect(boardMembers).to.include(boardMember3.address);
      expect(boardMembers).to.include(boardMember4.address);
      expect(boardMembers).to.include(boardMember5.address);
      expect(boardMembers.length).to.equal(5);
    });

    it("Should initialize with correct values", async function () {
      expect(await ethicsVoting.casesCount()).to.equal(0);
      expect(await ethicsVoting.REQUIRED_CONSENSUS()).to.equal(3);
    });
  });

  describe("Board Member Functions", function () {
    it("Should allow board members to verify voters", async function () {
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor1.address);
      expect(await ethicsVoting.isVoterVerified(doctor1.address)).to.be.true;
    });

    it("Should not allow non-board members to verify voters", async function () {
      await expect(
        ethicsVoting.connect(doctor1).verifyVoter(doctor2.address)
      ).to.be.revertedWith("Not a board member");
    });

    it("Should allow board members to create ethics cases", async function () {
      const tx = await ethicsVoting.connect(boardMember1).createEthicsCase(
        "Should we approve experimental treatment for Patient X?",
        3600 // 1 hour voting period
      );
      
      await expect(tx).to.emit(ethicsVoting, "EthicsCaseCreated");
      
      const caseData = await ethicsVoting.getCase(0);
      expect(caseData.description).to.equal("Should we approve experimental treatment for Patient X?");
      expect(caseData.isActive).to.be.true;
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Verify voters
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor1.address);
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor2.address);
      await ethicsVoting.connect(boardMember1).verifyVoter(nurse1.address);
      
      // Create ethics case
      await ethicsVoting.connect(boardMember1).createEthicsCase(
        "Should we approve experimental treatment?",
        3600
      );
    });

    it("Should allow verified voters to vote", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      const tx = await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      await expect(tx).to.emit(ethicsVoting, "VoteSubmitted");
      
      const caseData = await ethicsVoting.getCase(0);
      expect(caseData.yesVotes).to.equal(1);
      expect(caseData.noVotes).to.equal(0);
    });

    it("Should not allow non-verified voters to vote", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [staff1.address, 12345]));
      
      await expect(
        ethicsVoting.connect(staff1).submitVote(0, true, nullifierHash)
      ).to.be.revertedWith("Not a verified voter");
    });

    it("Should prevent double voting with same nullifier", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      // First vote
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      
      // Try to vote again with same nullifier
      await expect(
        ethicsVoting.connect(doctor2).submitVote(0, false, nullifierHash)
      ).to.be.revertedWith("Nullifier already used");
    });

    it("Should prevent same voter from voting twice on same case", async function () {
      const nullifierHash1 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      const nullifierHash2 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 67890]));
      
      // First vote
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash1);
      
      // Try to vote again
      await expect(
        ethicsVoting.connect(doctor1).submitVote(0, false, nullifierHash2)
      ).to.be.revertedWith("Already voted on this case");
    });
  });

  describe("Case Resolution", function () {
    beforeEach(async function () {
      // Verify voters
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor1.address);
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor2.address);
      await ethicsVoting.connect(boardMember1).verifyVoter(nurse1.address);
      
      // Create ethics case
      await ethicsVoting.connect(boardMember1).createEthicsCase(
        "Should we approve experimental treatment?",
        1 // 1 second voting period for testing
      );
    });

    it("Should allow board members to resolve cases after deadline", async function () {
      // Wait for deadline to pass
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tx = await ethicsVoting.connect(boardMember1).resolveCase(0);
      await expect(tx).to.emit(ethicsVoting, "CaseResolved");
      
      const caseData = await ethicsVoting.getCase(0);
      expect(caseData.isActive).to.be.false;
    });

    it("Should not allow resolution before deadline", async function () {
      await expect(
        ethicsVoting.connect(boardMember1).resolveCase(0)
      ).to.be.revertedWith("Voting still active");
    });
  });

  describe("Vote Records and Transparency", function () {
    beforeEach(async function () {
      // Verify voters
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor1.address);
      await ethicsVoting.connect(boardMember1).verifyVoter(doctor2.address);
      
      // Create ethics case
      await ethicsVoting.connect(boardMember1).createEthicsCase(
        "Should we approve experimental treatment?",
        3600
      );
    });

    it("Should record all votes for transparency", async function () {
      const nullifierHash1 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      const nullifierHash2 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor2.address, 67890]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash1);
      await ethicsVoting.connect(doctor2).submitVote(0, false, nullifierHash2);
      
      const voteRecords = await ethicsVoting.getVoteRecords(0);
      expect(voteRecords.length).to.equal(2);
      expect(voteRecords[0].voter).to.equal(doctor1.address);
      expect(voteRecords[0].vote).to.be.true;
      expect(voteRecords[1].voter).to.equal(doctor2.address);
      expect(voteRecords[1].vote).to.be.false;
    });
  });
});
