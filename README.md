# 🗳️ Zero-Knowledge Blockchain Voting Prototype

A blockchain-based voting system that ensures immutability, prevents double-voting, and preserves voter anonymity through zero-knowledge proofs.

## 🎯 Project Overview

This project implements a progressive voting system that starts with basic blockchain voting and evolves into a privacy-preserving zero-knowledge system. It's designed to demonstrate the power of combining blockchain technology with cryptographic privacy.

## 🏗️ Architecture

```
Frontend (React + Ethers.js)
       |
       v
Smart Contract (Solidity, Hardhat)
       |
       v
Blockchain Network (Local Hardhat / Sepolia)
       |
       v
[Phase 2] Zero-Knowledge Layer (Circom + SnarkJS)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run compile
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Deploy locally:**
   ```bash
   npm run deploy
   ```

5. **Start local blockchain:**
   ```bash
   npm run node
   ```

6. **Test interaction:**
   ```bash
   npx hardhat run scripts/interact.js --network localhost
   ```

## 📋 Implementation Phases

### Phase 1: Core Voting Logic ✅
- Smart contract with basic voting functionality
- Voter registration and candidate management
- Double-voting prevention
- Local deployment with Hardhat

### Phase 2: Frontend Integration (Next)
- React app with ethers.js integration
- Real-time vote display
- Wallet connection (MetaMask)

### Phase 3: Privacy Layer (Commit-Reveal)
- Commit-reveal scheme for privacy simulation
- Two-phase voting process
- Enhanced UI for privacy features

### Phase 4: Zero-Knowledge Proofs
- Circom circuit for ZK proofs
- SnarkJS integration
- True privacy-preserving voting

### Phase 5: Testnet Deployment
- Sepolia testnet deployment
- Production-ready demo
- Performance analysis

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Smart Contract | Solidity + Hardhat | Core voting logic & deployment |
| Blockchain | Hardhat local / Sepolia | Execution environment |
| Frontend | React.js + Ethers.js | User interface |
| ZK Proofs | Circom + SnarkJS | Privacy layer |
| Testing | Hardhat + Chai | Contract testing |

## 📁 Project Structure

```
zk-voting-prototype/
├── contracts/
│   └── Voting.sol              # Main voting contract
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── interact.js             # Interaction testing
├── test/
│   └── votingTest.js           # Comprehensive tests
├── frontend/                   # (Phase 2)
├── circom/                     # (Phase 4)
├── hardhat.config.js           # Hardhat configuration
└── package.json                # Dependencies
```

## 🔧 Smart Contract Features

### Core Functions
- `registerVoter(address)` - Register eligible voters
- `addCandidate(string)` - Add voting candidates
- `vote(uint256)` - Cast a direct vote
- `getVoteCount(uint256)` - Get candidate vote count
- `getAllResults()` - Get all voting results

### Privacy Features (Phase 3)
- `commitVote(bytes32)` - Commit vote hash
- `revealVote(uint256, string)` - Reveal committed vote

### Security Features
- Reentrancy protection
- Access control (only owner can manage)
- Input validation
- Double-voting prevention

## 🧪 Testing

The project includes comprehensive tests covering:
- Contract deployment
- Voter registration
- Candidate management
- Basic voting functionality
- Commit-reveal voting
- Vote counting
- Security edge cases

Run tests with:
```bash
npm test
```

## 🚀 Deployment

### Local Development
```bash
npm run deploy
```

### Testnet Deployment
1. Set up environment variables:
   ```bash
   export SEPOLIA_URL="your_alchemy_url"
   export PRIVATE_KEY="your_private_key"
   ```

2. Deploy to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## 🔒 Security Considerations

- **Access Control**: Only contract owner can manage voters and candidates
- **Reentrancy Protection**: All external calls protected
- **Input Validation**: All inputs validated before processing
- **Double Voting Prevention**: Voters can only vote once
- **Privacy**: Commit-reveal scheme prevents vote visibility until reveal

## 🎯 Next Steps

1. **Frontend Development**: Build React interface
2. **Wallet Integration**: Connect MetaMask
3. **Privacy Layer**: Implement commit-reveal
4. **ZK Proofs**: Add Circom circuits
5. **Testnet Deployment**: Deploy to Sepolia

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)

## 🤝 Contributing

This is a prototype project for educational purposes. Feel free to fork and experiment!

## 📄 License

MIT License - see LICENSE file for details.
