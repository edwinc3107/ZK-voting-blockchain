const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blind Receipt System", function () {
  let ethicsVoting;
  let boardMember1, boardMember2, boardMember3, boardMember4, boardMember5, doctor1, doctor2;

  beforeEach(async function () {
    [boardMember1, boardMember2, boardMember3, boardMember4, boardMember5, doctor1, doctor2] = await ethers.getSigners();
    
    const HospitalEthicsVoting = await ethers.getContractFactory("HospitalEthicsVoting");
    ethicsVoting = await HospitalEthicsVoting.deploy([
      boardMember1.address,
      boardMember2.address,
      boardMember3.address,
      boardMember4.address,
      boardMember5.address
    ]);
    await ethicsVoting.waitForDeployment();
    
    // Verify voters
    await ethicsVoting.connect(boardMember1).verifyVoter(doctor1.address);
    await ethicsVoting.connect(boardMember1).verifyVoter(doctor2.address);
    
    // Create a test case
    await ethicsVoting.connect(boardMember1).createEthicsCase(
      "Test ethics case for receipt system",
      3600 // 1 hour
    );
  });

  describe("Receipt Generation", function () {
    it("Should generate a receipt when a vote is submitted", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      const tx = await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      const receipt = await tx.wait();
      
      // Check for ReceiptGenerated event
      const receiptEvent = receipt.logs.find(log => {
        try {
          const parsed = ethicsVoting.interface.parseLog(log);
          return parsed.name === 'ReceiptGenerated';
        } catch {
          return false;
        }
      });
      
      expect(receiptEvent).to.not.be.undefined;
    });

    it("Should store receipt for voter", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      
      const receiptHash = await ethicsVoting.getVoterReceipt(doctor1.address, 0);
      expect(receiptHash).to.not.equal(ethers.ZeroHash);
    });

    it("Should generate unique receipts for different votes", async function () {
      const nullifierHash1 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      const nullifierHash2 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor2.address, 67890]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash1);
      await ethicsVoting.connect(doctor2).submitVote(0, false, nullifierHash2);
      
      const receipt1 = await ethicsVoting.getVoterReceipt(doctor1.address, 0);
      const receipt2 = await ethicsVoting.getVoterReceipt(doctor2.address, 0);
      
      expect(receipt1).to.not.equal(receipt2);
      expect(receipt1).to.not.equal(ethers.ZeroHash);
      expect(receipt2).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Receipt Verification", function () {
    it("Should verify valid receipt", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      
      const receiptHash = await ethicsVoting.getVoterReceipt(doctor1.address, 0);
      const isValid = await ethicsVoting.verifyReceipt(receiptHash, 0);
      
      expect(isValid).to.be.true;
    });

    it("Should reject invalid receipt", async function () {
      const fakeReceipt = ethers.keccak256(ethers.solidityPacked(["string"], ["fake"]));
      const isValid = await ethicsVoting.verifyReceipt(fakeReceipt, 0);
      
      expect(isValid).to.be.false;
    });

    it("Should reject receipt for wrong case", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      
      const receiptHash = await ethicsVoting.getVoterReceipt(doctor1.address, 0);
      
      // Create another case
      await ethicsVoting.connect(boardMember1).createEthicsCase("Another case", 3600);
      
      // Receipt from case 0 should not be valid for case 1
      const isValid = await ethicsVoting.verifyReceipt(receiptHash, 1);
      expect(isValid).to.be.false;
    });
  });

  describe("Case Receipts", function () {
    it("Should return all receipts for a case", async function () {
      const nullifierHash1 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      const nullifierHash2 = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor2.address, 67890]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash1);
      await ethicsVoting.connect(doctor2).submitVote(0, false, nullifierHash2);
      
      const receipts = await ethicsVoting.getCaseReceipts(0);
      
      expect(receipts.length).to.equal(2);
      expect(receipts[0]).to.not.equal(ethers.ZeroHash);
      expect(receipts[1]).to.not.equal(ethers.ZeroHash);
    });

    it("Should return empty array for case with no votes", async function () {
      const receipts = await ethicsVoting.getCaseReceipts(0);
      expect(receipts.length).to.equal(0);
    });
  });

  describe("Receipt Existence Check", function () {
    it("Should return true for existing receipt", async function () {
      const nullifierHash = ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [doctor1.address, 12345]));
      
      await ethicsVoting.connect(doctor1).submitVote(0, true, nullifierHash);
      
      const receiptHash = await ethicsVoting.getVoterReceipt(doctor1.address, 0);
      const exists = await ethicsVoting.isReceiptValid(receiptHash);
      
      expect(exists).to.be.true;
    });

    it("Should return false for non-existent receipt", async function () {
      const fakeReceipt = ethers.keccak256(ethers.solidityPacked(["string"], ["fake"]));
      const exists = await ethicsVoting.isReceiptValid(fakeReceipt);
      
      expect(exists).to.be.false;
    });
  });
});

